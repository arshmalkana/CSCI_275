/**
 * Admin service — all scope-enforced operations for Tehsil/District/HQ/Super admins.
 * Every function that writes data must call assertInstituteInScope or otherwise
 * verify the caller's permission before touching the DB.
 */

import { query, getClient } from '../database/db.js'
import { getVisibleInstituteIds, assertInstituteInScope } from '../utils/scope.js'
import * as notificationsService from './notificationsService.js'
import * as authService from './authService.js'
import refreshTokenService from './refreshTokenService.js'

// ── Approval queue ────────────────────────────────────────────────────────────

/**
 * List monthly reports within the admin's scope that need action.
 * @param {object} adminUser  - request.user (role + instituteId)
 * @param {{ month?: string, status?: string }} filters
 */
export async function getApprovalQueue(adminUser, filters = {}) {
  const visibleIds = await getVisibleInstituteIds(adminUser)
  if (visibleIds.length === 0) return []

  const params = [visibleIds]
  const conditions = ['mr.institute_id = ANY($1)']

  if (filters.month) {
    params.push(filters.month)
    conditions.push(`mr.reporting_month = $${params.length}`)
  }

  if (filters.status) {
    params.push(filters.status)
    conditions.push(`mr.submission_status = $${params.length}`)
  } else {
    conditions.push("mr.submission_status IN ('Submitted', 'Rejected')")
  }

  const result = await query(`
    SELECT
      mr.report_id,
      mr.reporting_month,
      mr.submission_status,
      mr.submitted_at,
      mr.admin_comment,
      i.institute_id,
      i.org_id,
      i.institute_name,
      i.institute_type,
      d.district_name,
      t.tehsil_name,
      s.full_name     AS prepared_by_name,
      s.designation   AS prepared_by_designation,
      COALESCE(
        (SELECT json_agg(json_build_object(
            'section', rss.section_name,
            'status',  rss.status,
            'reason',  rss.rejection_reason
         ))
         FROM report_section_status rss
         WHERE rss.report_id = mr.report_id),
        '[]'::json
      ) AS section_statuses
    FROM monthly_reports mr
    JOIN institutes i ON mr.institute_id = i.institute_id
    LEFT JOIN districts d ON i.district_id = d.district_id
    LEFT JOIN tehsils   t ON i.tehsil_id   = t.tehsil_id
    JOIN staff s ON mr.prepared_by = s.staff_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY mr.submitted_at ASC NULLS LAST
  `, params)

  return result.rows
}

// ── Submission status (who has / hasn't submitted for a given month) ──────────

export async function getSubmissionStatus(adminUser, month) {
  const visibleIds = await getVisibleInstituteIds(adminUser)
  if (visibleIds.length === 0) return []

  const result = await query(`
    SELECT
      i.institute_id,
      i.org_id,
      i.institute_name,
      i.institute_type,
      d.district_name,
      t.tehsil_name,
      mr.submission_status,
      mr.submitted_at,
      mr.report_id
    FROM institutes i
    LEFT JOIN monthly_reports mr ON mr.institute_id = i.institute_id AND mr.reporting_month = $2
    LEFT JOIN districts d ON i.district_id = d.district_id
    LEFT JOIN tehsils   t ON i.tehsil_id   = t.tehsil_id
    WHERE i.institute_id = ANY($1)
      AND i.is_active = TRUE
    ORDER BY d.district_name, t.tehsil_name, i.institute_name
  `, [visibleIds, month])

  return result.rows.map(r => ({
    ...r,
    status: r.submission_status || 'Missing'
  }))
}

// ── Send reminder ─────────────────────────────────────────────────────────────

export async function sendReminder(adminUser, targetInstituteId, month) {
  await assertInstituteInScope(adminUser, targetInstituteId)

  // Find the staff at the target institute who should submit
  const staffResult = await query(`
    SELECT s.staff_id, s.full_name
    FROM staff s
    WHERE s.current_institute_id = $1
      AND s.is_active = TRUE
      AND s.user_role IN ('CVD', 'CVH', 'PAIW', 'SemenBank', 'VaccineBank')
    LIMIT 1
  `, [targetInstituteId])

  if (staffResult.rows.length === 0) return { sent: false, reason: 'No field staff found at target institute' }

  const recipient = staffResult.rows[0]
  const [year, mon] = month.split('-')
  const date = new Date(parseInt(year), parseInt(mon) - 1, 1)
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  await notificationsService.createNotification({
    recipientId: recipient.staff_id,
    senderId: adminUser.staffId,
    notificationType: 'system',
    category: 'deadline_reminder',
    title: 'Report Submission Reminder',
    message: `Please submit your monthly report for ${monthName}. Your supervisor is waiting for your submission.`,
    priority: 'high',
    actions: [{ label: 'Submit Report', type: 'navigate', path: '/reports/create' }]
  })

  // Audit the reminder action
  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    SELECT mr.report_id, $1, 'monthly_reports', 'reminder_sent', NULL, $2, 'Admin sent reminder'
    FROM monthly_reports mr
    WHERE mr.institute_id = $3 AND mr.reporting_month = $4
    LIMIT 1
  `, [adminUser.staffId, month, targetInstituteId, month]).catch(() => {/* no report yet is fine */})

  return { sent: true, recipientName: recipient.full_name }
}

// ── Pending registrations ─────────────────────────────────────────────────────

/**
 * List institutes pending activation (is_active = false on both institute and staff).
 * Only HQ_Admin and Super_Admin can approve registrations.
 */
export async function getPendingRegistrations() {
  const result = await query(`
    SELECT
      i.institute_id,
      i.org_id,
      i.institute_name,
      i.institute_type,
      i.created_at,
      d.district_name,
      t.tehsil_name,
      s.staff_id,
      s.full_name,
      s.designation,
      s.mobile,
      s.email,
      s.user_role
    FROM institutes i
    LEFT JOIN staff s ON s.current_institute_id = i.institute_id AND s.is_active = FALSE
    LEFT JOIN districts d ON i.district_id = d.district_id
    LEFT JOIN tehsils   t ON i.tehsil_id   = t.tehsil_id
    WHERE i.is_active = FALSE
    ORDER BY i.created_at ASC
  `)
  return result.rows
}

export async function approveRegistration(approverUser, registrationId, { userId, password, role, instituteId }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    // Activate the institute
    await client.query(
      'UPDATE institutes SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE institute_id = $1',
      [registrationId]
    )

    // Activate / update the staff member
    await client.query(`
      UPDATE staff
      SET is_active     = TRUE,
          user_id       = $1,
          password_hash = $2,
          user_role     = $3,
          current_institute_id = $4,
          updated_at    = CURRENT_TIMESTAMP
      WHERE current_institute_id = $4 AND is_active = FALSE
    `, [userId, await authService.hashPassword(password), role, registrationId])

    await client.query(`
      INSERT INTO report_edits_audit
        (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
      VALUES (0, $1, 'institutes', 'is_active', 'false', 'true', 'Admin approved registration')
    `, [approverUser.staffId])

    await client.query('COMMIT')
    return { approved: true }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function rejectRegistration(approverUser, registrationId, reason) {
  // Soft-delete the pending institute (don't hard delete in case of appeals)
  await query(
    'UPDATE institutes SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE institute_id = $1 AND is_active = FALSE',
    [registrationId]
  )
  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    VALUES (0, $1, 'institutes', 'registration_rejected', NULL, $2, $3)
  `, [approverUser.staffId, String(registrationId), reason])

  return { rejected: true }
}

// ── User management ───────────────────────────────────────────────────────────

export async function listUsers(adminUser) {
  const visibleIds = await getVisibleInstituteIds(adminUser)

  const result = await query(`
    SELECT
      s.staff_id,
      s.user_id,
      s.full_name,
      s.designation,
      s.user_role,
      s.mobile,
      s.email,
      s.is_active,
      s.is_first_time,
      i.institute_id,
      i.institute_name,
      i.org_id,
      d.district_name,
      t.tehsil_name
    FROM staff s
    LEFT JOIN institutes i ON s.current_institute_id = i.institute_id
    LEFT JOIN districts  d ON i.district_id = d.district_id
    LEFT JOIN tehsils    t ON i.tehsil_id   = t.tehsil_id
    WHERE s.current_institute_id = ANY($1)
    ORDER BY s.full_name
  `, [visibleIds])

  return result.rows
}

export async function updateUser(adminUser, targetStaffId, updates) {
  // Fetch the target user's institute to scope-check
  const targetRes = await query('SELECT current_institute_id FROM staff WHERE staff_id = $1', [targetStaffId])
  if (targetRes.rows.length === 0) { const e = new Error('User not found'); e.statusCode = 404; throw e }
  await assertInstituteInScope(adminUser, targetRes.rows[0].current_institute_id)

  const allowed = ['full_name', 'mobile', 'email', 'user_role', 'designation', 'current_institute_id']
  const setClauses = []
  const params = []
  for (const [k, v] of Object.entries(updates)) {
    if (!allowed.includes(k)) continue
    params.push(v)
    setClauses.push(`${k} = $${params.length}`)
  }
  if (setClauses.length === 0) return { updated: false }

  params.push(targetStaffId)
  await query(
    `UPDATE staff SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE staff_id = $${params.length}`,
    params
  )

  // Audit each changed field
  for (const [k, v] of Object.entries(updates)) {
    if (!allowed.includes(k)) continue
    await query(`
      INSERT INTO report_edits_audit
        (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
      VALUES (0, $1, 'staff', $2, NULL, $3, 'Admin user update')
    `, [adminUser.staffId, k, String(v)])
  }

  // Force re-login when role or institute changes — JWT payload would be stale
  if (updates.user_role !== undefined || updates.current_institute_id !== undefined) {
    await refreshTokenService.revokeAllUserTokens(targetStaffId, 'Role or institute changed by admin')
  }

  return { updated: true }
}

export async function createUser(adminUser, { fullName, userId, password, role, instituteId, designation, mobile, email }) {
  await assertInstituteInScope(adminUser, instituteId)

  const existing = await query('SELECT staff_id FROM staff WHERE LOWER(user_id) = LOWER($1)', [userId])
  if (existing.rows.length > 0) {
    const e = new Error('User ID already taken')
    e.statusCode = 409
    throw e
  }

  const hashedPassword = await authService.hashPassword(password)

  const result = await query(`
    INSERT INTO staff
      (full_name, user_id, password_hash, user_role, current_institute_id, designation, mobile, email, is_active, is_first_time)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, FALSE)
    RETURNING staff_id
  `, [fullName, userId, hashedPassword, role, instituteId, designation || null, mobile || null, email || null])

  const staffId = result.rows[0].staff_id

  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    VALUES (0, $1, 'staff', 'staff_id', NULL, $2, 'Admin created user directly')
  `, [adminUser.staffId, String(staffId)])

  return { staffId }
}

export async function setUserActive(adminUser, targetStaffId, active) {
  const targetRes = await query('SELECT current_institute_id FROM staff WHERE staff_id = $1', [targetStaffId])
  if (targetRes.rows.length === 0) { const e = new Error('User not found'); e.statusCode = 404; throw e }
  await assertInstituteInScope(adminUser, targetRes.rows[0].current_institute_id)

  await query(
    'UPDATE staff SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE staff_id = $2',
    [active, targetStaffId]
  )
  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    VALUES (0, $1, 'staff', 'is_active', $2, $3, $4)
  `, [adminUser.staffId, String(!active), String(active), active ? 'Admin reactivated user' : 'Admin deactivated user'])

  // Revoke all sessions when deactivating so the user can't use existing tokens
  if (!active) {
    await refreshTokenService.revokeAllUserTokens(targetStaffId, 'Account deactivated by admin')
  }

  return { active }
}

// ── Institute CRUD (HQ_Admin / Super_Admin only) ──────────────────────────────

export async function listInstitutes(adminUser) {
  const visibleIds = await getVisibleInstituteIds(adminUser)

  const result = await query(`
    SELECT
      i.institute_id,
      i.org_id,
      i.institute_name,
      i.institute_type,
      i.is_active,
      i.reporting_institute_id,
      parent.institute_name AS parent_name,
      d.district_name,
      t.tehsil_name,
      v.village_name
    FROM institutes i
    LEFT JOIN institutes parent ON i.reporting_institute_id = parent.institute_id
    LEFT JOIN districts d ON i.district_id = d.district_id
    LEFT JOIN tehsils   t ON i.tehsil_id   = t.tehsil_id
    LEFT JOIN villages  v ON i.village_id  = v.village_id
    WHERE i.institute_id = ANY($1)
    ORDER BY i.institute_type, i.institute_name
  `, [visibleIds])

  return result.rows
}

export async function createInstitute(adminUser, {
  instituteName, instituteType, orgId, reportingInstituteId, districtId, tehsilId, villageId
}) {
  // Admin may only assign a reporting institute inside their own scope
  if (reportingInstituteId) {
    await assertInstituteInScope(adminUser, reportingInstituteId)
  }

  const result = await query(`
    INSERT INTO institutes
      (institute_name, institute_type, org_id, reporting_institute_id, district_id, tehsil_id, village_id, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    RETURNING institute_id
  `, [instituteName, instituteType, orgId || null, reportingInstituteId || null, districtId || null, tehsilId || null, villageId || null])

  const newId = result.rows[0].institute_id

  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    VALUES (0, $1, 'institutes', 'institute_id', NULL, $2, 'Admin created institute')
  `, [adminUser.staffId, String(newId)])

  return { instituteId: newId }
}

export async function updateInstitute(adminUser, instituteId, updates) {
  await assertInstituteInScope(adminUser, instituteId)

  if (updates.reportingInstituteId) {
    await assertInstituteInScope(adminUser, updates.reportingInstituteId)
  }

  const allowed = ['institute_name', 'institute_type', 'org_id', 'reporting_institute_id']
  const setClauses = []
  const params = []

  const keyMap = {
    instituteName:       'institute_name',
    instituteType:       'institute_type',
    orgId:               'org_id',
    reportingInstituteId: 'reporting_institute_id'
  }

  for (const [jsKey, dbKey] of Object.entries(keyMap)) {
    if (updates[jsKey] === undefined) continue
    params.push(updates[jsKey])
    setClauses.push(`${dbKey} = $${params.length}`)
  }
  if (setClauses.length === 0) return { updated: false }

  params.push(instituteId)
  await query(
    `UPDATE institutes SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE institute_id = $${params.length}`,
    params
  )

  for (const [jsKey, dbKey] of Object.entries(keyMap)) {
    if (updates[jsKey] === undefined || !allowed.includes(dbKey)) continue
    await query(`
      INSERT INTO report_edits_audit
        (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
      VALUES (0, $1, 'institutes', $2, NULL, $3, 'Admin updated institute')
    `, [adminUser.staffId, dbKey, String(updates[jsKey])])
  }

  return { updated: true }
}

export async function setInstituteActive(adminUser, instituteId, active) {
  await assertInstituteInScope(adminUser, instituteId)

  await query(
    'UPDATE institutes SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE institute_id = $2',
    [active, instituteId]
  )
  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    VALUES (0, $1, 'institutes', 'is_active', $2, $3, $4)
  `, [adminUser.staffId, String(!active), String(active), active ? 'Admin reactivated institute' : 'Admin deactivated institute'])

  return { active }
}

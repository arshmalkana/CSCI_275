import { query } from '../database/db.js'
import { OVERSIGHT_ROLE } from '../config/roles.js'

function requireHQ(user) {
  if (user.role !== OVERSIGHT_ROLE) {
    const err = new Error('Oversight role required')
    err.statusCode = 403
    throw err
  }
}

/** Return a period record, enriched with real on-time/late/missing counts. */
async function enrichPeriod(row) {
  return {
    periodId:       row.period_id,
    reportingMonth: row.reporting_month,
    opensAt:        row.opens_at,
    deadline:       row.deadline,
    closesAt:       row.closes_at,
    isLocked:       row.is_locked,
    lockedAt:       row.locked_at,
    createdAt:      row.created_at,
  }
}

export async function listPeriods() {
  const result = await query(
    'SELECT * FROM reporting_periods ORDER BY reporting_month DESC LIMIT 24'
  )
  return Promise.all(result.rows.map(enrichPeriod))
}

export async function getPeriod(month) {
  const result = await query(
    'SELECT * FROM reporting_periods WHERE reporting_month = $1', [month]
  )
  if (!result.rows.length) {
    const err = new Error('Period not found')
    err.statusCode = 404
    throw err
  }
  return enrichPeriod(result.rows[0])
}

export async function createPeriod(adminUser, { reportingMonth, opensAt, deadline, closesAt }) {
  requireHQ(adminUser)

  const result = await query(`
    INSERT INTO reporting_periods (reporting_month, opens_at, deadline, closes_at, created_by)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (reporting_month) DO UPDATE
      SET opens_at = EXCLUDED.opens_at,
          deadline = EXCLUDED.deadline,
          closes_at = EXCLUDED.closes_at,
          updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [reportingMonth, opensAt, deadline, closesAt || null, adminUser.staffId])

  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    VALUES (0, $1, 'reporting_periods', 'reporting_month', NULL, $2, 'Period created/updated')
  `, [adminUser.staffId, reportingMonth])

  return enrichPeriod(result.rows[0])
}

export async function reopenPeriod(adminUser, month) {
  requireHQ(adminUser)

  const result = await query(`
    UPDATE reporting_periods
    SET is_locked = FALSE, locked_by = NULL, locked_at = NULL, closes_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE reporting_month = $1
    RETURNING *
  `, [month])

  if (!result.rows.length) {
    const err = new Error('Period not found')
    err.statusCode = 404
    throw err
  }

  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    VALUES (0, $1, 'reporting_periods', 'is_locked', 'true', 'false', 'Admin reopened period')
  `, [adminUser.staffId])

  return enrichPeriod(result.rows[0])
}

export async function lockPeriod(adminUser, month) {
  requireHQ(adminUser)

  const result = await query(`
    UPDATE reporting_periods
    SET is_locked = TRUE, locked_by = $1, locked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE reporting_month = $2
    RETURNING *
  `, [adminUser.staffId, month])

  if (!result.rows.length) {
    const err = new Error('Period not found')
    err.statusCode = 404
    throw err
  }

  await query(`
    INSERT INTO report_edits_audit
      (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
    VALUES (0, $1, 'reporting_periods', 'is_locked', 'false', 'true', 'Admin locked period')
  `, [adminUser.staffId])

  return enrichPeriod(result.rows[0])
}

/**
 * Get the submission status for a given month, computing on-time/late based on
 * the period deadline.  Falls back to returning raw submission_status if no
 * period record exists.
 */
export async function getMonthStatus(month) {
  const periodRes = await query(
    'SELECT deadline FROM reporting_periods WHERE reporting_month = $1', [month]
  )
  const deadline = periodRes.rows[0]?.deadline || null

  return { month, deadline }
}

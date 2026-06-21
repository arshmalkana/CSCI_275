/**
 * Scope resolution — the single chokepoint for data-isolation.
 *
 * HIERARCHY:
 *   institutes.reporting_authority_id is the FK to the parent institute.
 *   Village inst → Tehsil HQ → District HQ → State HQ
 *
 * ROLE → VISIBLE SCOPE:
 *   INAPH / AIW     → own institute only
 *   Tehsil_Admin    → own institute + entire recursive subtree below it
 *   District_Admin  → own institute + entire recursive subtree below it
 *   HQ_Admin        → own institute + entire recursive subtree below it
 *   Super_Admin     → all institutes (no filter)
 *
 * All authorization guards AND aggregation queries MUST call this function.
 * Never scatter `reporting_authority_id` logic across controllers.
 */

import { query } from '../database/db.js'

const ADMIN_ROLES = ['Tehsil_Admin', 'District_Admin', 'HQ_Admin', 'Super_Admin']

/**
 * Returns the set of institute_ids this user is permitted to see/act on.
 * @param {{ staffId: number, role: string, instituteId: number }} user
 * @returns {Promise<number[]>} Array of visible institute_ids
 */
export async function getVisibleInstituteIds(user) {
  const { role, instituteId } = user

  // Super_Admin sees everything
  if (role === 'Super_Admin') {
    const result = await query('SELECT institute_id FROM institutes WHERE is_active = TRUE')
    return result.rows.map(r => r.institute_id)
  }

  // Field staff see only their own institute
  if (!ADMIN_ROLES.includes(role)) {
    return [instituteId]
  }

  // Admin roles: own institute + full recursive subtree via reporting_authority_id
  const result = await query(`
    WITH RECURSIVE subtree AS (
      SELECT institute_id
      FROM   institutes
      WHERE  institute_id = $1
      UNION ALL
      SELECT i.institute_id
      FROM   institutes i
      JOIN   subtree    s ON i.reporting_authority_id = s.institute_id
      WHERE  i.is_active = TRUE
    )
    SELECT institute_id FROM subtree
  `, [instituteId])

  return result.rows.map(r => r.institute_id)
}

/**
 * Throws 403 if the target institute_id is not within the user's visible scope.
 * Use this for write operations (approve, reject, admin edits).
 * @param {{ staffId: number, role: string, instituteId: number }} user
 * @param {number} targetInstituteId
 */
export async function assertInstituteInScope(user, targetInstituteId) {
  // Super_Admin always in scope
  if (user.role === 'Super_Admin') return

  const visible = await getVisibleInstituteIds(user)
  if (!visible.includes(targetInstituteId)) {
    const err = new Error('Access denied: institute is outside your reporting scope')
    err.statusCode = 403
    throw err
  }
}

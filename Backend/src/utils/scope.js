/**
 * Scope resolution — the single chokepoint for data-isolation.
 *
 * FIXED DECISIONS (from domain re-architecture):
 *
 *   institutes.reporting_institute_id  → the Tehsil institute this field institute
 *                                        routes approvals to and rolls up into.
 *                                        ONE HOP ONLY. Never traversed recursively.
 *
 *   institutes.parent_institute_id     → direct parent for stock-issuing and child
 *                                        discovery only. NEVER used for approval routing.
 *
 * ROLE → VISIBLE SCOPE:
 *   CVD / CVH / PAIW / SemenBank / VaccineBank  → own institute only
 *   Oversight  → all institutes whose reporting_institute_id = their institute_id
 *                (i.e. the Tehsil-level institutes that report to them, one hop)
 *
 * All authorization guards AND aggregation queries MUST call this function.
 * Never scatter reporting_institute_id logic across controllers.
 */

import { query } from '../database/db.js'
import { FIELD_ROLES, OVERSIGHT_ROLE } from '../config/roles.js'

/**
 * Returns the set of institute_ids this user is permitted to see/act on.
 * @param {{ staffId: number, role: string, instituteId: number }} user
 * @returns {Promise<number[]>}
 */
export async function getVisibleInstituteIds(user) {
  const { role, instituteId } = user

  // Field roles: own institute only
  if (FIELD_ROLES.includes(role)) {
    return [instituteId]
  }

  // Oversight: own Tehsil node + every field institute whose reporting_institute_id points to it
  if (role === OVERSIGHT_ROLE) {
    const result = await query(`
      SELECT institute_id FROM institutes
      WHERE  is_active = TRUE
        AND  (institute_id = $1 OR reporting_institute_id = $1)
    `, [instituteId])
    return result.rows.map(r => r.institute_id)
  }

  // Unknown role — no access
  return []
}

/**
 * Returns the set of field institute_ids that submit reports TO this Oversight
 * user's Tehsil — i.e. direct one-hop children for approval purposes.
 * @param {{ staffId: number, role: string, instituteId: number }} user
 * @returns {Promise<number[]>}
 */
export async function getApprovalScopeInstituteIds(user) {
  if (user.role !== OVERSIGHT_ROLE) return []

  const result = await query(`
    SELECT institute_id FROM institutes
    WHERE  reporting_institute_id = $1 AND is_active = TRUE
  `, [user.instituteId])

  return result.rows.map(r => r.institute_id)
}

/**
 * Throws 403 if the target institute_id is not within the user's visible scope.
 * Use this for write operations (approve, reject, admin edits).
 * @param {{ staffId: number, role: string, instituteId: number }} user
 * @param {number} targetInstituteId
 */
export async function assertInstituteInScope(user, targetInstituteId) {
  const visible = await getVisibleInstituteIds(user)
  if (!visible.includes(Number(targetInstituteId))) {
    const err = new Error('Access denied: institute is outside your reporting scope')
    err.statusCode = 403
    throw err
  }
}

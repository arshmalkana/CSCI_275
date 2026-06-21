/**
 * Rollup service — aggregates report data across an admin's visible institute set.
 *
 * All queries start from getVisibleInstituteIds() so data isolation is enforced
 * at a single chokepoint, not re-derived per query.
 */

import { query } from '../database/db.js'
import { getVisibleInstituteIds } from '../utils/scope.js'

/**
 * Get summed report totals for all institutes visible to the admin for a given month.
 * Optionally drill into a single child institute (drill = institute_id to examine).
 */
export async function getRollupSummary(adminUser, { month, drill } = {}) {
  const visibleIds = await getVisibleInstituteIds(adminUser)
  if (visibleIds.length === 0) return null

  // If drilling into a specific institute, verify it's in scope
  const scopedIds = drill ? [parseInt(drill)] : visibleIds
  if (drill && !visibleIds.includes(parseInt(drill))) {
    const err = new Error('Drill target is outside your reporting scope')
    err.statusCode = 403
    throw err
  }

  // Default month to current
  const targetMonth = month || new Date().toISOString().slice(0, 7)

  // Aggregate OPD
  const opdRes = await query(`
    SELECT
      opd.opd_type,
      opd.case_category,
      SUM(opd.total_cases)            AS total_cases,
      SUM(opd.beneficiaries_covered)  AS beneficiaries
    FROM monthly_reports mr
    JOIN opd_report_details opd ON opd.report_id = mr.report_id
    WHERE mr.institute_id = ANY($1)
      AND mr.reporting_month = $2
      AND mr.submission_status IN ('Submitted', 'Approved')
    GROUP BY opd.opd_type, opd.case_category
    ORDER BY opd.opd_type, opd.case_category
  `, [scopedIds, targetMonth])

  // Aggregate AI
  const aiRes = await query(`
    SELECT
      st.semen_code,
      st.semen_name,
      st.species,
      SUM(ai.total_ai_done)      AS total_ai_done,
      SUM(ai.animals_covered)    AS animals_covered,
      SUM(ai.animals_tested)     AS animals_tested,
      SUM(ai.animals_positive)   AS animals_positive,
      SUM(ai.male_calves)        AS male_calves,
      SUM(ai.female_calves)      AS female_calves,
      SUM(ai.beneficiaries_covered) AS beneficiaries
    FROM monthly_reports mr
    JOIN ai_report_details ai ON ai.report_id = mr.report_id
    JOIN semen_types st ON ai.semen_type_id = st.semen_id
    WHERE mr.institute_id = ANY($1)
      AND mr.reporting_month = $2
      AND mr.submission_status IN ('Submitted', 'Approved')
    GROUP BY st.semen_code, st.semen_name, st.species
    ORDER BY st.species, st.semen_code
  `, [scopedIds, targetMonth])

  // Aggregate vaccinations
  const vacRes = await query(`
    SELECT
      v.vaccine_code,
      v.vaccine_name,
      SUM(vr.doses_received)    AS doses_received,
      SUM(vr.doses_used)        AS doses_used,
      SUM(vr.animals_vaccinated) AS animals_vaccinated
    FROM monthly_reports mr
    JOIN vaccination_report_details vr ON vr.report_id = mr.report_id
    JOIN vaccines v ON vr.vaccine_id = v.vaccine_id
    WHERE mr.institute_id = ANY($1)
      AND mr.reporting_month = $2
      AND mr.submission_status IN ('Submitted', 'Approved')
    GROUP BY v.vaccine_code, v.vaccine_name
    ORDER BY v.vaccine_code
  `, [scopedIds, targetMonth])

  // List of child institutes with their status (for drill-down table)
  const childRes = await query(`
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
  `, [scopedIds, targetMonth])

  return {
    month: targetMonth,
    scope: { instituteCount: scopedIds.length, drill: drill ? parseInt(drill) : null },
    opd:          opdRes.rows,
    ai:           aiRes.rows,
    vaccinations: vacRes.rows,
    institutes:   childRes.rows.map(r => ({
      ...r,
      status: r.submission_status || 'Missing'
    }))
  }
}

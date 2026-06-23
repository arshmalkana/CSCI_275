import { query } from '../database/db.js'
import { ADMIN_ROLES } from '../config/roles.js'

function financialYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12
  const start = month >= 4 ? year : year - 1
  return { start: `${start}-04`, end: `${start + 1}-03` }
}

export async function getHomeDataByUserId(userId) {
  // 1. Staff + institute in one query
  const staffResult = await query(`
    SELECT
      s.staff_id, s.full_name, s.user_role,
      i.institute_id, i.institute_name, i.institute_type,
      i.latitude AS institute_lat, i.longitude AS institute_lng
    FROM staff s
    JOIN institutes i ON s.current_institute_id = i.institute_id
    WHERE s.user_id = $1 AND s.is_active = TRUE
  `, [userId])

  if (staffResult.rows.length === 0) return null

  const { staff_id, full_name, user_role, institute_id, institute_name, institute_lat, institute_lng } = staffResult.rows[0]
  const currentMonth = new Date().toISOString().slice(0, 7)
  const fy = financialYear()
  const isAdmin = ADMIN_ROLES.includes(user_role)

  // 2. All remaining queries in parallel
  const [
    allStaffResult,
    villagesResult,
    statsResult,
    vaccineMonthlyResult,
    vaccineAnnualResult,
    targetsResult,
    reportStatusResult,
    attachedResult,
  ] = await Promise.all([
    // Staff at institute
    query(`
      SELECT full_name, designation, mobile, email
      FROM staff
      WHERE current_institute_id = $1 AND is_active = TRUE
      ORDER BY
        CASE designation
          WHEN 'Senior Veterinary Officer' THEN 1
          WHEN 'Veterinary Officer' THEN 2
          WHEN 'Veterinary Inspector' THEN 3
          ELSE 4
        END, full_name
    `, [institute_id]),

    // Service villages
    query(`
      SELECT v.village_name, v.human_population,
             v.equine, v.buffaloes, v.cows, v.pigs, v.goat, v.sheep,
             v.poultry_layers, v.poultry_broilers
      FROM institute_service_villages isv
      JOIN villages v ON isv.village_id = v.village_id
      WHERE isv.institute_id = $1
      ORDER BY isv.is_primary DESC, v.village_name
    `, [institute_id]),

    // OPD + AI stats in one query
    query(`
      SELECT
        COALESCE(SUM(CASE WHEN mr.reporting_month = $2 THEN ord.total_cases END), 0)           AS monthly_opd,
        COALESCE(SUM(CASE WHEN mr.reporting_month >= $3 AND mr.reporting_month <= $4 THEN ord.total_cases END), 0) AS annual_opd,
        COALESCE(SUM(CASE WHEN mr.reporting_month = $2 AND st.species = 'Cattle' THEN ard.total_ai_done END), 0) AS monthly_ai_cow,
        COALESCE(SUM(CASE WHEN mr.reporting_month >= $3 AND mr.reporting_month <= $4 AND st.species = 'Cattle' THEN ard.total_ai_done END), 0) AS annual_ai_cow,
        COALESCE(SUM(CASE WHEN mr.reporting_month = $2 AND st.species = 'Buffalo' THEN ard.total_ai_done END), 0) AS monthly_ai_buf,
        COALESCE(SUM(CASE WHEN mr.reporting_month >= $3 AND mr.reporting_month <= $4 AND st.species = 'Buffalo' THEN ard.total_ai_done END), 0) AS annual_ai_buf
      FROM monthly_reports mr
      LEFT JOIN opd_report_details ord ON ord.report_id = mr.report_id
      LEFT JOIN ai_report_details ard ON ard.report_id = mr.report_id
      LEFT JOIN semen_types st ON ard.semen_type_id = st.semen_id
      WHERE mr.institute_id = $1
        AND mr.submission_status IN ('Submitted', 'Approved')
        AND mr.reporting_month >= $3 AND mr.reporting_month <= $4
    `, [institute_id, currentMonth, fy.start, fy.end]),

    // Vaccine monthly doses
    query(`
      SELECT v.vaccine_code, v.vaccine_name, COALESCE(SUM(vrd.doses_used), 0) AS monthly_doses
      FROM vaccines v
      LEFT JOIN vaccination_report_details vrd ON v.vaccine_id = vrd.vaccine_id
      LEFT JOIN monthly_reports mr ON vrd.report_id = mr.report_id
        AND mr.institute_id = $1
        AND mr.reporting_month = $2
        AND mr.submission_status IN ('Submitted', 'Approved')
      WHERE v.is_active = TRUE
      GROUP BY v.vaccine_id, v.vaccine_code, v.vaccine_name
      ORDER BY v.vaccine_code
    `, [institute_id, currentMonth]),

    // Vaccine annual doses
    query(`
      SELECT v.vaccine_id, v.vaccine_code, COALESCE(SUM(vrd.doses_used), 0) AS annual_doses
      FROM vaccines v
      LEFT JOIN vaccination_report_details vrd ON v.vaccine_id = vrd.vaccine_id
      LEFT JOIN monthly_reports mr ON vrd.report_id = mr.report_id
        AND mr.institute_id = $1
        AND mr.reporting_month >= $2 AND mr.reporting_month <= $3
        AND mr.submission_status IN ('Submitted', 'Approved')
      WHERE v.is_active = TRUE
      GROUP BY v.vaccine_id, v.vaccine_code
      ORDER BY v.vaccine_code
    `, [institute_id, fy.start, fy.end]),

    // Targets
    query(`
      WITH itype AS (SELECT institute_type FROM institutes WHERE institute_id = $1)
      SELECT DISTINCT ON (target_type, vaccine_id)
        target_type, vaccine_id, annual_target,
        CASE WHEN institute_id IS NOT NULL THEN 1 ELSE 2 END AS priority
      FROM institute_targets
      WHERE (institute_id = $1 OR institute_type = (SELECT institute_type FROM itype))
        AND effective_from <= CURRENT_DATE
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
      ORDER BY target_type, vaccine_id, priority ASC
    `, [institute_id]),

    // Report status for current month
    query(`
      SELECT rp.deadline, mr.submitted_at, mr.submission_status
      FROM reporting_periods rp
      LEFT JOIN monthly_reports mr ON mr.institute_id = $1 AND mr.reporting_month = rp.reporting_month
      WHERE rp.reporting_month = $2
      LIMIT 1
    `, [institute_id, currentMonth]),

    // Attached institutes (admin only — skip for field staff)
    isAdmin
      ? query(`
          SELECT i.institute_id, i.institute_name, mr.submission_status AS report_status
          FROM institutes i
          LEFT JOIN monthly_reports mr ON i.institute_id = mr.institute_id AND mr.reporting_month = $2
          WHERE i.reporting_authority_id = $1 AND i.is_active = TRUE
          ORDER BY i.institute_name
        `, [institute_id, currentMonth])
      : Promise.resolve({ rows: [] }),
  ])

  // Build targets map
  const targets = {}
  for (const t of targetsResult.rows) {
    if (t.target_type === 'Vaccine') {
      if (!targets.vaccines) targets.vaccines = {}
      targets.vaccines[t.vaccine_id] = t.annual_target
    } else {
      targets[t.target_type] = t.annual_target
    }
  }

  // Build vaccine map
  const vaccines = {}
  for (const v of vaccineMonthlyResult.rows) {
    const annual = vaccineAnnualResult.rows.find(a => a.vaccine_code === v.vaccine_code)
    vaccines[v.vaccine_code] = {
      name: v.vaccine_name,
      monthly: { completed: Number(v.monthly_doses) },
      annual: {
        completed: annual ? Number(annual.annual_doses) : 0,
        target: annual && targets.vaccines ? (targets.vaccines[annual.vaccine_id] || 0) : 0,
      },
    }
  }

  // Compute reporting status
  let reportingStatus = 'Pending'
  if (reportStatusResult.rows.length > 0) {
    const { deadline, submitted_at, submission_status } = reportStatusResult.rows[0]
    if (submission_status === 'Submitted' || submission_status === 'Approved') {
      reportingStatus = submitted_at && deadline && new Date(submitted_at) <= new Date(deadline) ? 'On Time' : 'Late'
    } else if (deadline && new Date() > new Date(deadline)) {
      reportingStatus = 'Missing'
    }
  }

  const s = statsResult.rows[0]

  return {
    name: institute_name,
    welcomeMessage: `Welcome ${full_name}`,
    location: {
      lat: institute_lat ? `${institute_lat}° N` : 'N/A',
      lng: institute_lng ? `${institute_lng}° E` : 'N/A',
    },
    stats: {
      opd:   { monthly: { completed: Number(s.monthly_opd) },   annual: { completed: Number(s.annual_opd),   target: targets.OPD ?? null } },
      aiCow: { monthly: { completed: Number(s.monthly_ai_cow) }, annual: { completed: Number(s.annual_ai_cow), target: targets.AI_Cattle ?? null } },
      aiBuf: { monthly: { completed: Number(s.monthly_ai_buf) }, annual: { completed: Number(s.annual_ai_buf), target: targets.AI_Buffalo ?? null } },
    },
    vaccines,
    staff: allStaffResult.rows.map(s => ({
      name: s.full_name,
      role: s.designation,
      phone: s.mobile,
      email: s.email,
    })),
    villages: villagesResult.rows.map(v => ({
      name: v.village_name,
      population: v.human_population || 0,
      animalPopulation: {
        equine: v.equine || 0,
        buffaloes: v.buffaloes || 0,
        cows: v.cows || 0,
        pigs: v.pigs || 0,
        goat: v.goat || 0,
        sheep: v.sheep || 0,
        poultryLayers: v.poultry_layers || 0,
        poultryBroilers: v.poultry_broilers || 0,
      },
    })),
    reportingStatus,
    attachedInstitutes: attachedResult.rows.map(r => ({
      id: r.institute_id,
      name: r.institute_name,
      reportStatus: r.report_status || 'Pending',
    })),
  }
}

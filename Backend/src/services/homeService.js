import log from '../utils/logger.js'
// src/services/homeService.js
import { query } from '../database/db.js'

/**
 * Get comprehensive homepage data for a user
 * @param {string} userId - User ID from JWT
 * @returns {Promise<Object>} Homepage data including institute, staff, villages, stats
 */
export async function getHomeDataByUserId(userId) {
  try {
    // 1. Get staff and institute information
    const staffQuery = `
      SELECT
        s.staff_id,
        s.full_name,
        s.designation,
        s.mobile,
        s.email,
        s.user_role,
        i.institute_id,
        i.org_id,
        i.institute_name,
        i.institute_type,
        i.latitude AS institute_lat,
        i.longitude AS institute_lng,
        i.is_cluster_available,
        i.is_lab_available,
        d.district_name,
        t.tehsil_name,
        v.village_name
      FROM staff s
      JOIN institutes i ON s.current_institute_id = i.institute_id
      LEFT JOIN districts d ON i.district_id = d.district_id
      LEFT JOIN tehsils t ON i.tehsil_id = t.tehsil_id
      LEFT JOIN villages v ON i.village_id = v.village_id
      WHERE s.user_id = $1 AND s.is_active = TRUE
    `

    const staffResult = await query(staffQuery, [userId])

    if (staffResult.rows.length === 0) {
      return null
    }

    const mainStaff = staffResult.rows[0]
    const instituteId = mainStaff.institute_id

    // 2. Get all staff members at this institute
    const allStaffQuery = `
      SELECT
        full_name,
        designation,
        mobile,
        email
      FROM staff
      WHERE current_institute_id = $1 AND is_active = TRUE
      ORDER BY
        CASE designation
          WHEN 'Senior Veterinary Officer' THEN 1
          WHEN 'Veterinary Officer' THEN 2
          WHEN 'Veterinary Inspector' THEN 3
          ELSE 4
        END,
        full_name
    `

    const allStaffResult = await query(allStaffQuery, [instituteId])

    // 3. Get attached villages for this institute with populations
    const villagesQuery = `
      SELECT
        v.village_name,
        v.human_population,
        v.equine,
        v.buffaloes,
        v.cows,
        v.pigs,
        v.goat,
        v.sheep,
        v.poultry_layers,
        v.poultry_broilers,
        v.dogs,
        isv.is_primary
      FROM institute_service_villages isv
      JOIN villages v ON isv.village_id = v.village_id
      WHERE isv.institute_id = $1
      ORDER BY isv.is_primary DESC, v.village_name
    `

    const villagesResult = await query(villagesQuery, [instituteId])

    // 4. Get monthly OPD statistics (current month)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    const opdStatsQuery = `
      SELECT
        COALESCE(SUM(total_cases), 0) as monthly_opd
      FROM opd_report_details ord
      JOIN monthly_reports mr ON ord.report_id = mr.report_id
      WHERE mr.institute_id = $1
        AND mr.reporting_month = $2
        AND mr.submission_status IN ('Submitted', 'Approved')
    `

    const opdStatsResult = await query(opdStatsQuery, [instituteId, currentMonth])

    // 5. Get annual OPD statistics (current financial year: April to March)
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonthNum = currentDate.getMonth() + 1 // 1-12

    const financialYearStart = currentMonthNum >= 4 ? currentYear : currentYear - 1
    const fyStartDate = `${financialYearStart}-04`
    const fyEndDate = `${financialYearStart + 1}-03`

    const annualOpdQuery = `
      SELECT
        COALESCE(SUM(total_cases), 0) as annual_opd
      FROM opd_report_details ord
      JOIN monthly_reports mr ON ord.report_id = mr.report_id
      WHERE mr.institute_id = $1
        AND mr.reporting_month >= $2
        AND mr.reporting_month <= $3
        AND mr.submission_status IN ('Submitted', 'Approved')
    `

    const annualOpdResult = await query(annualOpdQuery, [instituteId, fyStartDate, fyEndDate])

    // 6. Get AI Cow statistics (monthly and annual)
    const aiCowMonthlyQuery = `
      SELECT
        COALESCE(SUM(total_ai_done), 0) as monthly_ai_cow
      FROM ai_report_details ard
      JOIN monthly_reports mr ON ard.report_id = mr.report_id
      JOIN semen_types st ON ard.semen_type_id = st.semen_id
      WHERE mr.institute_id = $1
        AND mr.reporting_month = $2
        AND st.species = 'Cattle'
        AND mr.submission_status IN ('Submitted', 'Approved')
    `

    const aiCowMonthlyResult = await query(aiCowMonthlyQuery, [instituteId, currentMonth])

    const aiCowAnnualQuery = `
      SELECT
        COALESCE(SUM(total_ai_done), 0) as annual_ai_cow
      FROM ai_report_details ard
      JOIN monthly_reports mr ON ard.report_id = mr.report_id
      JOIN semen_types st ON ard.semen_type_id = st.semen_id
      WHERE mr.institute_id = $1
        AND mr.reporting_month >= $2
        AND mr.reporting_month <= $3
        AND st.species = 'Cattle'
        AND mr.submission_status IN ('Submitted', 'Approved')
    `

    const aiCowAnnualResult = await query(aiCowAnnualQuery, [instituteId, fyStartDate, fyEndDate])

    // 7. Get AI Buffalo statistics (monthly and annual)
    const aiBufMonthlyQuery = `
      SELECT
        COALESCE(SUM(total_ai_done), 0) as monthly_ai_buf
      FROM ai_report_details ard
      JOIN monthly_reports mr ON ard.report_id = mr.report_id
      JOIN semen_types st ON ard.semen_type_id = st.semen_id
      WHERE mr.institute_id = $1
        AND mr.reporting_month = $2
        AND st.species = 'Buffalo'
        AND mr.submission_status IN ('Submitted', 'Approved')
    `

    const aiBufMonthlyResult = await query(aiBufMonthlyQuery, [instituteId, currentMonth])

    const aiBufAnnualQuery = `
      SELECT
        COALESCE(SUM(total_ai_done), 0) as annual_ai_buf
      FROM ai_report_details ard
      JOIN monthly_reports mr ON ard.report_id = mr.report_id
      JOIN semen_types st ON ard.semen_type_id = st.semen_id
      WHERE mr.institute_id = $1
        AND mr.reporting_month >= $2
        AND mr.reporting_month <= $3
        AND st.species = 'Buffalo'
        AND mr.submission_status IN ('Submitted', 'Approved')
    `

    const aiBufAnnualResult = await query(aiBufAnnualQuery, [instituteId, fyStartDate, fyEndDate])

    // 8. Get vaccine statistics for all vaccines (monthly and annual)
    const vaccineMonthlyQuery = `
      SELECT
        v.vaccine_code,
        v.vaccine_name,
        COALESCE(SUM(vrd.doses_used), 0) as monthly_doses
      FROM vaccines v
      LEFT JOIN vaccination_report_details vrd ON v.vaccine_id = vrd.vaccine_id
      LEFT JOIN monthly_reports mr ON vrd.report_id = mr.report_id
        AND mr.institute_id = $1
        AND mr.reporting_month = $2
        AND mr.submission_status IN ('Submitted', 'Approved')
      WHERE v.is_active = TRUE
      GROUP BY v.vaccine_id, v.vaccine_code, v.vaccine_name
      ORDER BY v.vaccine_code
    `

    const vaccineMonthlyResult = await query(vaccineMonthlyQuery, [instituteId, currentMonth])

    const vaccineAnnualQuery = `
      SELECT
        v.vaccine_id,
        v.vaccine_code,
        v.vaccine_name,
        COALESCE(SUM(vrd.doses_used), 0) as annual_doses
      FROM vaccines v
      LEFT JOIN vaccination_report_details vrd ON v.vaccine_id = vrd.vaccine_id
      LEFT JOIN monthly_reports mr ON vrd.report_id = mr.report_id
        AND mr.institute_id = $1
        AND mr.reporting_month >= $2
        AND mr.reporting_month <= $3
        AND mr.submission_status IN ('Submitted', 'Approved')
      WHERE v.is_active = TRUE
      GROUP BY v.vaccine_id, v.vaccine_code, v.vaccine_name
      ORDER BY v.vaccine_code
    `

    const vaccineAnnualResult = await query(vaccineAnnualQuery, [instituteId, fyStartDate, fyEndDate])

    // 9. Get performance targets from database (institute-specific + type defaults)
    // Priority: Institute-specific targets override institute type defaults
    const targetsQuery = `
      WITH institute_info AS (
        SELECT institute_type FROM institutes WHERE institute_id = $1
      )
      SELECT DISTINCT ON (target_type, vaccine_id)
        target_type,
        vaccine_id,
        annual_target,
        monthly_target,
        CASE
          WHEN institute_id IS NOT NULL THEN 1
          WHEN institute_type IS NOT NULL THEN 2
        END as priority
      FROM institute_targets
      WHERE (institute_id = $1 OR institute_type = (SELECT institute_type FROM institute_info))
        AND effective_from <= CURRENT_DATE
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
      ORDER BY target_type, vaccine_id, priority ASC  -- Lower priority number = higher priority (1 = specific, 2 = type default)
    `

    const targetsResult = await query(targetsQuery, [instituteId])

    // Build targets map for easy lookup
    const targets = {}
    targetsResult.rows.forEach(t => {
      if (t.target_type === 'Vaccine') {
        if (!targets.vaccines) targets.vaccines = {}
        targets.vaccines[t.vaccine_id] = t.annual_target
      } else {
        targets[t.target_type] = t.annual_target
      }
    })

    // 10. Get attached institutes reporting status (for Tehsil/District admins)
    let attachedInstitutes = []

    if (mainStaff.user_role === 'Tehsil_Admin' || mainStaff.user_role === 'District_Admin') {
      const attachedQuery = `
        SELECT
          i.institute_name,
          mr.submission_status as report_status,
          mr.submitted_at,
          CASE
            WHEN mr.submission_status = 'Submitted' OR mr.submission_status = 'Approved' THEN 'success'
            WHEN mr.submission_status = 'Draft' THEN 'warning'
            WHEN mr.submitted_at IS NULL OR mr.submitted_at > (CURRENT_DATE + INTERVAL '5 days') THEN 'error'
            ELSE 'warning'
          END as status_type
        FROM institutes i
        LEFT JOIN monthly_reports mr ON i.institute_id = mr.institute_id
          AND mr.reporting_month = $2
        WHERE i.reporting_authority_id = $1
          AND i.institute_id != $1
          AND i.is_active = TRUE
        ORDER BY i.institute_name
      `

      const attachedResult = await query(attachedQuery, [instituteId, currentMonth])
      attachedInstitutes = attachedResult.rows.map(row => ({
        name: row.institute_name,
        reportStatus: row.report_status || 'Pending',
        statusType: row.status_type || 'error'
      }))
    }

    // 10. Compute real reporting status from reporting_periods + monthly_reports
    const reportStatusResult = await query(`
      SELECT
        rp.deadline,
        mr.submitted_at,
        mr.submission_status
      FROM reporting_periods rp
      LEFT JOIN monthly_reports mr
        ON mr.institute_id = $1
        AND mr.reporting_month = rp.reporting_month
      WHERE rp.reporting_month = $2
      LIMIT 1
    `, [instituteId, currentMonth])

    let reportingStatus = 'Pending'
    if (reportStatusResult.rows.length > 0) {
      const { deadline, submitted_at, submission_status } = reportStatusResult.rows[0]
      if (submission_status === 'Submitted' || submission_status === 'Approved') {
        reportingStatus = (submitted_at && deadline && new Date(submitted_at) <= new Date(deadline))
          ? 'On Time'
          : 'Late'
      } else if (deadline && new Date() > new Date(deadline)) {
        reportingStatus = 'Missing'
      }
    }

    // 11. Construct response object matching HomeScreen structure
    const homeData = {
      name: mainStaff.institute_name,
      welcomeMessage: `Welcome ${mainStaff.full_name}`,
      location: {
        lat: mainStaff.institute_lat ? `${mainStaff.institute_lat}° N` : 'N/A',
        lng: mainStaff.institute_lng ? `${mainStaff.institute_lng}° E` : 'N/A'
      },
      stats: {
        opd: {
          monthly: { completed: parseInt(opdStatsResult.rows[0].monthly_opd) },
          annual: { completed: parseInt(annualOpdResult.rows[0].annual_opd), target: targets.OPD || 1200 }
        },
        aiCow: {
          monthly: { completed: parseInt(aiCowMonthlyResult.rows[0].monthly_ai_cow) },
          annual: { completed: parseInt(aiCowAnnualResult.rows[0].annual_ai_cow), target: targets.AI_Cattle || 600 }
        },
        aiBuf: {
          monthly: { completed: parseInt(aiBufMonthlyResult.rows[0].monthly_ai_buf) },
          annual: { completed: parseInt(aiBufAnnualResult.rows[0].annual_ai_buf), target: targets.AI_Buffalo || 360 }
        }
      },
      vaccines: {},
      staff: allStaffResult.rows.map(s => ({
        name: s.full_name,
        role: s.designation,
        phone: s.mobile,
        email: s.email,
        whatsapp: s.mobile // Same as mobile for WhatsApp
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
          poultryBroilers: v.poultry_broilers || 0
        }
      })),
      reportingStatus,
      attachedInstitutes
    }

    // Add vaccine data with targets from database
    const vaccineData = {}
    vaccineMonthlyResult.rows.forEach(v => {
      const annualData = vaccineAnnualResult.rows.find(av => av.vaccine_code === v.vaccine_code)
      const vaccineTarget = targets.vaccines && annualData ? targets.vaccines[annualData.vaccine_id] : 0

      vaccineData[v.vaccine_code] = {
        name: v.vaccine_name,
        monthly: { completed: parseInt(v.monthly_doses) },
        annual: {
          completed: annualData ? parseInt(annualData.annual_doses) : 0,
          target: vaccineTarget || 0
        }
      }
    })

    homeData.vaccines = vaccineData

    return homeData

  } catch (error) {
    log.error('Error in getHomeDataByUserId:', error)
    throw error
  }
}

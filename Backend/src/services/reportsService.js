import { query } from '../database/db.js'
import { getSemenCode } from '../config/semenTypes.js'
import * as notificationsService from './notificationsService.js'

/**
 * Validate report data for logical consistency and data quality
 */
function validateReportData(data) {
  const errors = []

  // Validate OPD data
  if (data.opd) {
    Object.entries(data.opd).forEach(([category, categoryData]) => {
      Object.entries(categoryData).forEach(([field, value]) => {
        const numValue = parseInt(value)
        if (!isNaN(numValue) && numValue < 0) {
          errors.push(`OPD ${category} - ${field}: Cannot have negative values`)
        }
        if (!isNaN(numValue) && numValue > 100000) {
          errors.push(`OPD ${category} - ${field}: Value ${numValue} seems unusually high`)
        }
      })
    })
  }

  // Validate Certificate data
  if (data.certificates) {
    Object.entries(data.certificates).forEach(([category, categoryData]) => {
      Object.entries(categoryData).forEach(([field, value]) => {
        const numValue = parseInt(value)
        if (!isNaN(numValue) && numValue < 0) {
          errors.push(`Certificate ${category} - ${field}: Cannot have negative values`)
        }
        if (!isNaN(numValue) && numValue > 50000) {
          errors.push(`Certificate ${category} - ${field}: Value ${numValue} seems unusually high`)
        }
      })
    })
  }

  // Validate Lab data
  if (data.lab) {
    Object.entries(data.lab).forEach(([category, categoryData]) => {
      Object.entries(categoryData).forEach(([field, value]) => {
        const numValue = parseInt(value)
        if (!isNaN(numValue) && numValue < 0) {
          errors.push(`Lab ${category} - ${field}: Cannot have negative values`)
        }
        if (!isNaN(numValue) && numValue > 50000) {
          errors.push(`Lab ${category} - ${field}: Value ${numValue} seems unusually high`)
        }
      })
    })
  }

  // Validate Extension data
  if (data.extension) {
    Object.entries(data.extension).forEach(([category, categoryData]) => {
      Object.entries(categoryData).forEach(([field, value]) => {
        const numValue = parseInt(value)
        if (!isNaN(numValue) && numValue < 0) {
          errors.push(`Extension ${category} - ${field}: Cannot have negative values`)
        }
        if (!isNaN(numValue) && numValue > 100000) {
          errors.push(`Extension ${category} - ${field}: Value ${numValue} seems unusually high`)
        }
      })
    })
  }

  // Validate AI Reports data with logical consistency checks
  if (data.aiReports) {
    const categories = ['localSemen', 'girSemen', 'ettImported', 'sexedSemen', 'buffaloes']
    categories.forEach(category => {
      const categoryData = data.aiReports[category]
      if (!categoryData) return

      Object.entries(categoryData).forEach(([breedId, breedData]) => {
        if (!breedData) return

        // Validate current period
        const ai = parseInt(breedData.current?.ai) || 0
        const covered = parseInt(breedData.current?.covered) || 0
        const currentBenef = parseInt(breedData.current?.beneficiaries) || 0

        if (ai < 0 || covered < 0 || currentBenef < 0) {
          errors.push(`AI Reports ${breedId}: Cannot have negative values`)
        }

        // Logical check: animals covered should not exceed AI done
        if (covered > ai && ai > 0) {
          errors.push(`AI Reports ${breedId}: Animals covered (${covered}) cannot exceed AI done (${ai})`)
        }

        // Logical check: beneficiaries should not exceed animals covered
        if (currentBenef > covered && covered > 0) {
          errors.push(`AI Reports ${breedId}: Beneficiaries (${currentBenef}) should not exceed animals covered (${covered})`)
        }

        // Validate 3 months ago period
        const tested = parseInt(breedData.threeMonthsAgo?.tested) || 0
        const positive = parseInt(breedData.threeMonthsAgo?.positive) || 0
        const threeMonthsBenef = parseInt(breedData.threeMonthsAgo?.beneficiaries) || 0

        if (tested < 0 || positive < 0 || threeMonthsBenef < 0) {
          errors.push(`AI Reports ${breedId} (3 months ago): Cannot have negative values`)
        }

        // Logical check: positive cannot exceed tested
        if (positive > tested && tested > 0) {
          errors.push(`AI Reports ${breedId}: Positive tests (${positive}) cannot exceed animals tested (${tested})`)
        }

        // Validate 6 months ago period
        const maleCalves = parseInt(breedData.sixMonthsAgo?.maleCalves) || 0
        const femaleCalves = parseInt(breedData.sixMonthsAgo?.femaleCalves) || 0
        const sixMonthsBenef = parseInt(breedData.sixMonthsAgo?.beneficiaries) || 0

        if (maleCalves < 0 || femaleCalves < 0 || sixMonthsBenef < 0) {
          errors.push(`AI Reports ${breedId} (6 months ago): Cannot have negative values`)
        }

        // Logical check: total calves should roughly match positive tests from 6 months ago
        const totalCalves = maleCalves + femaleCalves
        if (totalCalves > positive * 2 && positive > 0) {
          errors.push(`AI Reports ${breedId}: Total calves (${totalCalves}) seems inconsistent with positive tests (${positive})`)
        }
      })
    })
  }

  return errors
}

/**
 * Save monthly report with all sections
 * Creates or updates report in a transaction
 */
export async function saveMonthlyReport(data) {
  try {
    // Validate data before processing (only for submitted reports, not drafts)
    // TEMPORARILY DISABLED FOR TESTING - TO RE-ENABLE: Uncomment the lines below
    // if (data.status === 'Submitted') {
    //   const validationErrors = validateReportData(data)
    //   if (validationErrors.length > 0) {
    //     const error = new Error(`Validation failed: ${validationErrors.slice(0, 3).join('; ')}${validationErrors.length > 3 ? ` and ${validationErrors.length - 3} more errors` : ''}`)
    //     error.validationErrors = validationErrors
    //     error.statusCode = 400
    //     throw error
    //   }
    // }

    // Start transaction
    await query('BEGIN')

    const {
      reportingMonth,
      status,
      staffId,
      instituteId,
      opd,
      certificates,
      lab,
      extension,
      aiReports
    } = data

    // Calculate start and end dates from reporting month
    const [year, month] = reportingMonth.split('-')
    const startDate = `${year}-${month}-01`
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const endDate = `${year}-${month}-${lastDay}`

    // Check if report already exists for this month
    const existingReport = await query(`
      SELECT report_id, submission_status
      FROM monthly_reports
      WHERE institute_id = $1 AND reporting_month = $2
    `, [instituteId, reportingMonth])

    let reportId

    if (existingReport.rows.length > 0) {
      // Report exists - update it
      reportId = existingReport.rows[0].report_id
      const existingStatus = existingReport.rows[0].submission_status

      // Don't allow updating submitted/approved reports
      if (existingStatus === 'Approved') {
        throw new Error('Cannot modify an approved report')
      }

      // Update main report
      await query(`
        UPDATE monthly_reports
        SET submission_status = $1,
            submitted_at = CASE WHEN $1 = 'Submitted' THEN CURRENT_TIMESTAMP ELSE submitted_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE report_id = $2
      `, [status, reportId])

      // Delete existing details (they will be re-inserted)
      await query('DELETE FROM opd_report_details WHERE report_id = $1', [reportId])
      await query('DELETE FROM certificate_report_details WHERE report_id = $1', [reportId])
      await query('DELETE FROM diagnostic_report_details WHERE report_id = $1', [reportId])
      await query('DELETE FROM extension_activities_details WHERE report_id = $1', [reportId])
      await query('DELETE FROM ai_report_details WHERE report_id = $1', [reportId])
    } else {
      // Create new report
      const insertResult = await query(`
        INSERT INTO monthly_reports (
          institute_id,
          reporting_month,
          start_date,
          end_date,
          prepared_by,
          submission_status,
          submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'Submitted' THEN CURRENT_TIMESTAMP ELSE NULL END)
        RETURNING report_id
      `, [instituteId, reportingMonth, startDate, endDate, staffId, status])

      reportId = insertResult.rows[0].report_id
    }

    // Insert OPD details
    if (opd) {
      const opdTypes = [
        { type: 'Equine', data: opd.equines },
        { type: 'Bovine', data: opd.bovine },
        { type: 'Small', data: opd.smallAnimals },
        { type: 'Dogs', data: opd.dogsCats },
        { type: 'Others', data: opd.gaushala },
        { type: 'Poultry', data: opd.poultryPets }
      ]

      for (const { type, data: opdData } of opdTypes) {
        if (opdData) {
          // Insert New cases
          if (opdData.new) {
            await query(`
              INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
              VALUES ($1, $2, 'New', $3, $4)
            `, [reportId, type, parseInt(opdData.new) || 0, parseInt(opdData.beneficiaries) || 0])
          }
          // Insert Old cases
          if (opdData.old) {
            await query(`
              INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
              VALUES ($1, $2, 'Old', $3, $4)
            `, [reportId, type, parseInt(opdData.old) || 0, parseInt(opdData.beneficiaries) || 0])
          }
        }
      }
    }

    // Insert Certificate details
    if (certificates) {
      // Health Certificates
      if (certificates.healthCertificates) {
        const hc = certificates.healthCertificates
        const total = (parseInt(hc.largeAnimals) || 0) + (parseInt(hc.smallAnimals) || 0) +
                     (parseInt(hc.poultry) || 0) + (parseInt(hc.dogs) || 0)
        if (total > 0) {
          await query(`
            INSERT INTO certificate_report_details (report_id, certificate_type, total_issued, beneficiaries_covered)
            VALUES ($1, 'Health', $2, $3)
          `, [reportId, total, parseInt(hc.beneficiaries) || 0])
        }
      }

      // Post Mortem Certificates
      if (certificates.postMortem) {
        const pm = certificates.postMortem
        const total = (parseInt(pm.largeAnimals) || 0) + (parseInt(pm.smallAnimals) || 0)
        if (total > 0) {
          await query(`
            INSERT INTO certificate_report_details (report_id, certificate_type, total_issued, beneficiaries_covered)
            VALUES ($1, 'PostMortem', $2, $3)
          `, [reportId, total, parseInt(pm.beneficiaries) || 0])
        }
      }

      // Vetro Legal Certificates
      if (certificates.vetroLegal && certificates.vetroLegal.count) {
        await query(`
          INSERT INTO certificate_report_details (report_id, certificate_type, total_issued, beneficiaries_covered)
          VALUES ($1, 'VetroLegal', $2, $3)
        `, [reportId, parseInt(certificates.vetroLegal.count) || 0, parseInt(certificates.vetroLegal.beneficiaries) || 0])
      }
    }

    // Insert Lab/Diagnostic details
    if (lab) {
      const labTests = [
        { type: 'Blood', data: lab.bloodTest },
        { type: 'Milk', data: lab.milkTest },
        { type: 'Fecal', data: lab.fecalTest },
        { type: 'Urine', data: lab.urineTest },
        { type: 'Other', data: lab.xraysPets },
        { type: 'Other', data: lab.ultrasound },
        { type: 'Other', data: lab.other }
      ]

      for (const { type, data: labData } of labTests) {
        if (labData && labData.count) {
          await query(`
            INSERT INTO diagnostic_report_details (report_id, diagnostic_type, tests_conducted, beneficiaries_covered)
            VALUES ($1, $2, $3, $4)
          `, [reportId, type, parseInt(labData.count) || 0, parseInt(labData.beneficiaries) || 0])
        }
      }
    }

    // Insert Extension Activities details
    if (extension) {
      // Farmer Awareness Camps
      if (extension.farmerAwareness && extension.farmerAwareness.camps) {
        await query(`
          INSERT INTO extension_activities_details (
            report_id, activity_type, events_conducted, locations_covered, total_attendees, animals_treated
          ) VALUES ($1, 'Camp', $2, $3, $4, $5)
        `, [
          reportId,
          parseInt(extension.farmerAwareness.camps) || 0,
          parseInt(extension.farmerAwareness.villages) || 0,
          parseInt(extension.farmerAwareness.farmersAttended) || 0,
          parseInt(extension.farmerAwareness.animalsTreated) || 0
        ])
      }

      // School Lectures
      if (extension.schoolLectures && extension.schoolLectures.lectures) {
        await query(`
          INSERT INTO extension_activities_details (
            report_id, activity_type, events_conducted, locations_covered, total_attendees
          ) VALUES ($1, 'SchoolLecture', $2, $3, $4)
        `, [
          reportId,
          parseInt(extension.schoolLectures.lectures) || 0,
          parseInt(extension.schoolLectures.schools) || 0,
          parseInt(extension.schoolLectures.studentsAttended) || 0
        ])
      }

      // Farmer Training
      if (extension.farmerTraining && extension.farmerTraining.trainings) {
        await query(`
          INSERT INTO extension_activities_details (
            report_id, activity_type, events_conducted, locations_covered, total_attendees
          ) VALUES ($1, 'FarmerTraining', $2, $3, $4)
        `, [
          reportId,
          parseInt(extension.farmerTraining.trainings) || 0,
          parseInt(extension.farmerTraining.locations) || 0,
          parseInt(extension.farmerTraining.farmersAttended) || 0
        ])
      }

      // Campaigns
      if (extension.campaigns && extension.campaigns.campaigns) {
        await query(`
          INSERT INTO extension_activities_details (
            report_id, activity_type, events_conducted, locations_covered, total_attendees, animals_treated
          ) VALUES ($1, 'Awareness', $2, $3, $4, $5)
        `, [
          reportId,
          parseInt(extension.campaigns.campaigns) || 0,
          parseInt(extension.campaigns.locations) || 0,
          parseInt(extension.campaigns.participantsAttended) || 0,
          parseInt(extension.campaigns.animalsTreated) || 0
        ])
      }
    }

    // Insert AI Reports details
    if (aiReports) {
      // Process each category and its breeds
      const categories = ['localSemen', 'girSemen', 'ettImported', 'sexedSemen', 'buffaloes']

      for (const category of categories) {
        const categoryData = aiReports[category]
        if (!categoryData) continue

        // Process each breed in the category
        for (const [breedId, breedData] of Object.entries(categoryData)) {
          // Get the semen code for this breed
          const semenCode = getSemenCode(breedId)
          if (!semenCode) {
            console.warn(`Unknown breed ID: ${breedId}, skipping...`)
            continue
          }

          // Look up semen_type_id from database
          const semenTypeResult = await query(`
            SELECT semen_id FROM semen_types WHERE semen_code = $1
          `, [semenCode])

          if (semenTypeResult.rows.length === 0) {
            console.warn(`Semen type not found for code: ${semenCode}, skipping...`)
            continue
          }

          const semenTypeId = semenTypeResult.rows[0].semen_id

          // Extract data from the three periods
          const current = breedData.current || {}
          const threeMonthsAgo = breedData.threeMonthsAgo || {}
          const sixMonthsAgo = breedData.sixMonthsAgo || {}

          // Parse values (frontend sends strings, convert to integers)
          const totalAIDone = parseInt(current.ai) || 0
          const animalsCovered = parseInt(current.covered) || 0
          const currentBeneficiaries = parseInt(current.beneficiaries) || 0

          const animalsTested = parseInt(threeMonthsAgo.tested) || 0
          const animalsPositive = parseInt(threeMonthsAgo.positive) || 0
          const threeMonthsBeneficiaries = parseInt(threeMonthsAgo.beneficiaries) || 0

          const maleCalves = parseInt(sixMonthsAgo.maleCalves) || 0
          const femaleCalves = parseInt(sixMonthsAgo.femaleCalves) || 0
          const sixMonthsBeneficiaries = parseInt(sixMonthsAgo.beneficiaries) || 0

          // Calculate total beneficiaries (sum of all three periods, with deduplication logic)
          // For now, we'll use the max value as beneficiaries might overlap across periods
          const beneficiariesCovered = Math.max(
            currentBeneficiaries,
            threeMonthsBeneficiaries,
            sixMonthsBeneficiaries
          )

          // Only insert if there's actual data
          const hasData = totalAIDone > 0 || animalsCovered > 0 || animalsTested > 0 ||
                         animalsPositive > 0 || maleCalves > 0 || femaleCalves > 0

          if (hasData) {
            await query(`
              INSERT INTO ai_report_details (
                report_id,
                semen_type_id,
                total_ai_done,
                animals_covered,
                animals_tested,
                animals_positive,
                male_calves,
                female_calves,
                beneficiaries_covered
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              reportId,
              semenTypeId,
              totalAIDone,
              animalsCovered,
              animalsTested,
              animalsPositive,
              maleCalves,
              femaleCalves,
              beneficiariesCovered
            ])
          }
        }
      }
    }

    // Create notification if report was submitted (not just saved as draft)
    if (status === 'Submitted' && existingReport.rows.length === 0) {
      // Only send notification for new submissions, not updates
      try {
        await notificationsService.createReportSubmittedNotification(
          reportId,
          reportingMonth,
          staffId,
          instituteId
        )
      } catch (notifError) {
        // Log but don't fail the transaction if notification fails
        console.error('Failed to create notification:', notifError)
      }
    }

    // Commit transaction
    await query('COMMIT')

    return {
      reportId,
      reportingMonth,
      status
    }
  } catch (error) {
    // Rollback on error
    await query('ROLLBACK')
    console.error('Error in saveMonthlyReport:', error)
    throw error
  }
}

/**
 * Get monthly report with all details
 */
export async function getMonthlyReport(instituteId, reportingMonth) {
  try {
    // Get main report
    const reportResult = await query(`
      SELECT
        report_id,
        institute_id,
        reporting_month,
        start_date,
        end_date,
        prepared_by,
        verified_by,
        submission_status as status,
        submitted_at,
        verified_at,
        admin_comment,
        receipt_number,
        created_at,
        updated_at
      FROM monthly_reports
      WHERE institute_id = $1 AND reporting_month = $2
    `, [instituteId, reportingMonth])

    if (reportResult.rows.length === 0) {
      return null
    }

    const report = reportResult.rows[0]
    const reportId = report.report_id

    // Get OPD details
    const opdResult = await query(`
      SELECT opd_type, case_category, total_cases, beneficiaries_covered
      FROM opd_report_details
      WHERE report_id = $1
    `, [reportId])

    // Get certificate details
    const certResult = await query(`
      SELECT certificate_type, total_issued, beneficiaries_covered
      FROM certificate_report_details
      WHERE report_id = $1
    `, [reportId])

    // Get lab details
    const labResult = await query(`
      SELECT diagnostic_type, tests_conducted, beneficiaries_covered
      FROM diagnostic_report_details
      WHERE report_id = $1
    `, [reportId])

    // Get extension details
    const extensionResult = await query(`
      SELECT activity_type, events_conducted, locations_covered, total_attendees, animals_treated
      FROM extension_activities_details
      WHERE report_id = $1
    `, [reportId])

    // Get AI report details with semen type information
    const aiResult = await query(`
      SELECT
        ai.total_ai_done,
        ai.animals_covered,
        ai.animals_tested,
        ai.animals_positive,
        ai.male_calves,
        ai.female_calves,
        ai.beneficiaries_covered,
        st.semen_code
      FROM ai_report_details ai
      JOIN semen_types st ON ai.semen_type_id = st.semen_id
      WHERE ai.report_id = $1
    `, [reportId])

    // Transform AI data back to frontend structure
    // We need to reverse the mapping: semen_code -> breedId -> category structure
    const aiReports = {
      localSemen: { hf: {}, jersey: {}, cb: {}, sahiwal: {} },
      girSemen: { gir: {}, gir2: {} },
      ettImported: { hfETT: {}, jerseyETT: {}, hfImp: {}, jerseyImp: {} },
      sexedSemen: { hfSexed: {}, jerseySexed: {}, cbSexed: {}, sahiwalSexed: {} },
      buffaloes: { murrah: {}, niliRavi: {}, surti: {}, jaffarabadi: {} }
    }

    // Mapping from semen_code back to breedId
    const semenCodeToBreedId = {
      'HF_LOCAL': { category: 'localSemen', breed: 'hf' },
      'JERSEY_LOCAL': { category: 'localSemen', breed: 'jersey' },
      'CB_LOCAL': { category: 'localSemen', breed: 'cb' },
      'SAHIWAL_LOCAL': { category: 'localSemen', breed: 'sahiwal' },
      'GIR': { category: 'girSemen', breed: 'gir' },
      'GIR_2': { category: 'girSemen', breed: 'gir2' },
      'HF_ETT': { category: 'ettImported', breed: 'hfETT' },
      'JERSEY_ETT': { category: 'ettImported', breed: 'jerseyETT' },
      'HF_IMPORTED': { category: 'ettImported', breed: 'hfImp' },
      'JERSEY_IMPORTED': { category: 'ettImported', breed: 'jerseyImp' },
      'HF_SEXED': { category: 'sexedSemen', breed: 'hfSexed' },
      'JERSEY_SEXED': { category: 'sexedSemen', breed: 'jerseySexed' },
      'CB_SEXED': { category: 'sexedSemen', breed: 'cbSexed' },
      'SAHIWAL_SEXED': { category: 'sexedSemen', breed: 'sahiwalSexed' },
      'MURRAH': { category: 'buffaloes', breed: 'murrah' },
      'NILI_RAVI': { category: 'buffaloes', breed: 'niliRavi' },
      'SURTI': { category: 'buffaloes', breed: 'surti' },
      'JAFFARABADI': { category: 'buffaloes', breed: 'jaffarabadi' }
    }

    // Populate AI reports structure from database results
    for (const row of aiResult.rows) {
      const mapping = semenCodeToBreedId[row.semen_code]
      if (mapping) {
        aiReports[mapping.category][mapping.breed] = {
          current: {
            ai: String(row.total_ai_done || ''),
            covered: String(row.animals_covered || ''),
            beneficiaries: String(row.beneficiaries_covered || '')
          },
          threeMonthsAgo: {
            tested: String(row.animals_tested || ''),
            positive: String(row.animals_positive || ''),
            beneficiaries: String(row.beneficiaries_covered || '')
          },
          sixMonthsAgo: {
            maleCalves: String(row.male_calves || ''),
            femaleCalves: String(row.female_calves || ''),
            beneficiaries: String(row.beneficiaries_covered || '')
          }
        }
      }
    }

    return {
      reportId: report.report_id,
      instituteId: report.institute_id,
      reportingMonth: report.reporting_month,
      startDate: report.start_date,
      endDate: report.end_date,
      preparedBy: report.prepared_by,
      verifiedBy: report.verified_by,
      status: report.status,
      submittedAt: report.submitted_at,
      verifiedAt: report.verified_at,
      adminComment: report.admin_comment,
      receiptNumber: report.receipt_number,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      opd: opdResult.rows,
      certificates: certResult.rows,
      diagnostics: labResult.rows,
      extensions: extensionResult.rows,
      aiReports: aiReports
    }
  } catch (error) {
    console.error('Error in getMonthlyReport:', error)
    throw error
  }
}

/**
 * Get available fiscal years based on reports in the database
 */
export async function getAvailableFiscalYears(instituteId) {
  try {
    // Get all unique reporting months from reports
    const result = await query(`
      SELECT DISTINCT reporting_month
      FROM monthly_reports
      WHERE institute_id = $1
      ORDER BY reporting_month DESC
    `, [instituteId])

    if (result.rows.length === 0) {
      // Return current fiscal year if no reports exist
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1 // 1-12

      // If we're in Jan-Mar, we're still in the previous fiscal year
      const fiscalStartYear = currentMonth >= 4 ? currentYear : currentYear - 1
      return [`${fiscalStartYear}-${String(fiscalStartYear + 1).slice(2)}`]
    }

    // Convert reporting months to fiscal years
    // Fiscal year runs from April to March (e.g., 2024-25 = April 2024 to March 2025)
    const fiscalYears = new Set()

    result.rows.forEach(row => {
      const [year, month] = row.reporting_month.split('-').map(Number)

      // Determine which fiscal year this month belongs to
      // April (04) to December (12) = current year's fiscal year (e.g., 2024-25 for 2024-04 to 2024-12)
      // January (01) to March (03) = previous year's fiscal year (e.g., 2024-25 for 2025-01 to 2025-03)
      const fiscalStartYear = month >= 4 ? year : year - 1
      fiscalYears.add(`${fiscalStartYear}-${String(fiscalStartYear + 1).slice(2)}`)
    })

    return Array.from(fiscalYears).sort().reverse()
  } catch (error) {
    console.error('Error in getAvailableFiscalYears:', error)
    throw error
  }
}

/**
 * List monthly reports for an institute with optional filters
 */
export async function listMonthlyReports(instituteId, filters = {}) {
  try {
    const { status, year, fiscalYear } = filters

    let queryText = `
      SELECT
        report_id,
        reporting_month,
        submission_status as status,
        submitted_at,
        created_at,
        updated_at
      FROM monthly_reports
      WHERE institute_id = $1
    `

    const params = [instituteId]
    let paramCount = 1

    // Filter by status if provided
    if (status && status !== 'all') {
      paramCount++
      queryText += ` AND submission_status = $${paramCount}`
      // Map frontend status to backend ENUM values
      const statusMap = {
        'submitted': 'Submitted',
        'draft': 'Draft',
        'rejected': 'Rejected',
        'pending': 'Submitted' // 'pending' maps to 'Submitted' in backend
      }
      params.push(statusMap[status] || status)
    }

    // Filter by calendar year
    if (year) {
      paramCount++
      queryText += ` AND EXTRACT(YEAR FROM TO_DATE(reporting_month, 'YYYY-MM')) = $${paramCount}`
      params.push(parseInt(year))
    }

    // Filter by fiscal year (e.g., "2024-25" includes reports from April 2024 to March 2025)
    if (fiscalYear) {
      const [startYear, endYearShort] = fiscalYear.split('-')
      const startYearNum = parseInt(startYear)
      const endYearNum = parseInt(`20${endYearShort}`)

      paramCount++
      queryText += ` AND (
        (reporting_month >= $${paramCount} AND reporting_month < $${paramCount + 1})
      )`
      params.push(`${startYearNum}-04`, `${endYearNum}-04`)
      paramCount++
    }

    queryText += ` ORDER BY reporting_month DESC`

    const result = await query(queryText, params)

    return result.rows.map(row => ({
      id: row.report_id.toString(),
      reportId: row.report_id,
      month: row.reporting_month,
      reportingMonth: row.reporting_month,
      status: row.status,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  } catch (error) {
    console.error('Error in listMonthlyReports:', error)
    throw error
  }
}

/**
 * Get full monthly report details including all sub-details
 * @param {number} reportId - Report ID
 * @returns {Promise<Object>} - Complete report with all details
 */
export async function getMonthlyReportDetails(reportId) {
  try {
    // Get main report
    const reportResult = await query(`
      SELECT
        report_id,
        institute_id,
        reporting_month,
        start_date,
        end_date,
        prepared_by,
        verified_by,
        submission_status as status,
        submitted_at,
        verified_at,
        admin_comment,
        receipt_number,
        created_at,
        updated_at
      FROM monthly_reports
      WHERE report_id = $1
    `, [reportId])

    if (reportResult.rows.length === 0) {
      return null
    }

    const report = reportResult.rows[0]

    // Get OPD details
    const opdResult = await query(`
      SELECT opd_type, case_category, total_cases, beneficiaries_covered
      FROM opd_report_details
      WHERE report_id = $1
    `, [reportId])

    // Get certificate details
    const certResult = await query(`
      SELECT certificate_type, total_issued, beneficiaries_covered
      FROM certificate_report_details
      WHERE report_id = $1
    `, [reportId])

    // Get diagnostic details
    const diagnosticResult = await query(`
      SELECT diagnostic_type, tests_conducted, beneficiaries_covered
      FROM diagnostic_report_details
      WHERE report_id = $1
    `, [reportId])

    // Get vaccination details
    const vaccineResult = await query(`
      SELECT vaccine_id, doses_received, doses_used, animals_vaccinated, beneficiaries_covered
      FROM vaccination_report_details
      WHERE report_id = $1
    `, [reportId])

    // Get AI details
    const aiResult = await query(`
      SELECT semen_type_id, total_ai_done, animals_covered, beneficiaries_covered,
             straws_received, straws_used_inaph, straws_issued_aiw,
             animals_tested, animals_positive, male_calves, female_calves
      FROM ai_report_details
      WHERE report_id = $1
    `, [reportId])

    // Get extension activities
    const extensionResult = await query(`
      SELECT activity_type, events_conducted, locations_covered, total_attendees, animals_treated
      FROM extension_activities_details
      WHERE report_id = $1
    `, [reportId])

    // Return complete report - properly formatted
    return {
      reportId: report.report_id,
      instituteId: report.institute_id,
      reportingMonth: report.reporting_month,
      startDate: report.start_date,
      endDate: report.end_date,
      preparedBy: report.prepared_by,
      verifiedBy: report.verified_by,
      status: report.status,
      submittedAt: report.submitted_at,
      verifiedAt: report.verified_at,
      adminComment: report.admin_comment,
      receiptNumber: report.receipt_number,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      opd: opdResult.rows,
      certificates: certResult.rows,
      diagnostics: diagnosticResult.rows,
      vaccinations: vaccineResult.rows,
      ai: aiResult.rows,
      extensions: extensionResult.rows
    }
  } catch (error) {
    console.error('Error in getMonthlyReportDetails:', error)
    throw error
  }
}

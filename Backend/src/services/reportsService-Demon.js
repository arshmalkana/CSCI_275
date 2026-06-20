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
          const benef = parseInt(opdData.beneficiaries) || 0
          if (parseInt(opdData.new) > 0) {
            await query(`
              INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
              VALUES ($1, $2, 'New', $3, $4)
            `, [reportId, type, parseInt(opdData.new) || 0, benef])
          }
          if (parseInt(opdData.old) > 0) {
            await query(`
              INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
              VALUES ($1, $2, 'Old', $3, $4)
            `, [reportId, type, parseInt(opdData.old) || 0, benef])
          }
          // Camp cases (spreadsheet column: TREATED IN CAMP)
          if (parseInt(opdData.camp) > 0) {
            await query(`
              INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
              VALUES ($1, $2, 'Camp', $3, $4)
            `, [reportId, type, parseInt(opdData.camp) || 0, benef])
          }
        }
      }
    }

    // Insert Vaccination details
    // data.vaccinations: { hs, fmd, bq, brucellosis, etv, theilaria, rabies }
    // Each entry: { received, used, vaccinated }
    if (data.vaccinations) {
      const vaccineCodeMap = {
        hs:          'HS',
        fmd:         'FMD',
        bq:          'BQ',
        brucellosis: 'BRUCELLOSIS',
        etv:         'ETV',
        theilaria:   'THEILARIA',
        rabies:      'RABIES',
      }

      await query('DELETE FROM vaccination_report_details WHERE report_id = $1', [reportId])

      for (const [key, vacCode] of Object.entries(vaccineCodeMap)) {
        const vac = data.vaccinations[key]
        if (!vac) continue
        const received   = parseInt(vac.received)   || 0
        const used       = parseInt(vac.used)        || 0
        const vaccinated = parseInt(vac.vaccinated)  || 0
        if (received === 0 && used === 0 && vaccinated === 0) continue

        const vacTypeResult = await query(
          `SELECT vaccine_id FROM vaccines WHERE vaccine_code = $1`, [vacCode]
        )
        if (vacTypeResult.rows.length === 0) continue

        const vaccineId = vacTypeResult.rows[0].vaccine_id
        await query(`
          INSERT INTO vaccination_report_details
            (report_id, vaccine_id, doses_received, doses_used, animals_vaccinated)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (report_id, vaccine_id) DO UPDATE
            SET doses_received     = EXCLUDED.doses_received,
                doses_used         = EXCLUDED.doses_used,
                animals_vaccinated = EXCLUDED.animals_vaccinated
        `, [reportId, vaccineId, received, used, vaccinated])
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
      // Fertility Camps – PLDB
      if (extension.pldbCamps) {
        const c = extension.pldbCamps
        await query(`
          INSERT INTO extension_activities_details (
            report_id, activity_type, camp_subtype, events_conducted, animals_treated, total_attendees, ladies_attended
          ) VALUES ($1, 'Camp', 'PLDB', $2, $3, $4, $5)
        `, [
          reportId,
          parseInt(c.camps)   || 0,
          parseInt(c.animals) || 0,
          parseInt(c.farmers) || 0,
          parseInt(c.ladies)  || 0
        ])
      }

      // Fertility Camps – ASCAD
      if (extension.ascadCamps) {
        const c = extension.ascadCamps
        await query(`
          INSERT INTO extension_activities_details (
            report_id, activity_type, camp_subtype, events_conducted, animals_treated, total_attendees, ladies_attended
          ) VALUES ($1, 'Camp', 'ASCAD', $2, $3, $4, $5)
        `, [
          reportId,
          parseInt(c.camps)   || 0,
          parseInt(c.animals) || 0,
          parseInt(c.farmers) || 0,
          parseInt(c.ladies)  || 0
        ])
      }

      // Any Other Camps (formerly farmerAwareness)
      if (extension.otherCamps || extension.farmerAwareness) {
        const c = extension.otherCamps || extension.farmerAwareness
        const hasCamps = parseInt(c.camps) > 0 || parseInt(c.animalsTreated) > 0 ||
                         parseInt(c.farmersAttended) > 0
        if (hasCamps) {
          await query(`
            INSERT INTO extension_activities_details (
              report_id, activity_type, camp_subtype, events_conducted, animals_treated, total_attendees, ladies_attended
            ) VALUES ($1, 'Camp', 'Other', $2, $3, $4, $5)
          `, [
            reportId,
            parseInt(c.camps || c.events)           || 0,
            parseInt(c.animalsTreated || c.animals)  || 0,
            parseInt(c.farmersAttended || c.farmers) || 0,
            parseInt(c.ladies)                       || 0
          ])
        }
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

          // Straw tracking fields (from spreadsheet Form responses)
          const strawsReceived   = parseInt(current.strawsReceived)   || 0
          const strawsUsedINAPH  = parseInt(current.strawsUsedINAPH)  || 0
          const strawsIssuedAIW  = parseInt(current.strawsIssuedAIW)  || 0

          const hasData = totalAIDone > 0 || animalsCovered > 0 || animalsTested > 0 ||
                         animalsPositive > 0 || maleCalves > 0 || femaleCalves > 0 ||
                         strawsReceived > 0 || strawsUsedINAPH > 0 || strawsIssuedAIW > 0

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
                straws_received,
                straws_used_inaph,
                straws_issued_aiw,
                beneficiaries_covered
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              reportId,
              semenTypeId,
              totalAIDone,
              animalsCovered,
              animalsTested,
              animalsPositive,
              maleCalves,
              femaleCalves,
              strawsReceived,
              strawsUsedINAPH,
              strawsIssuedAIW,
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

/**
 * Collect all data required for PDF generation.
 * Mirrors every section in the "Reports" sheet of the Bathinda AH Punjab DB
 * spreadsheet, including progressive (year-to-date) totals and straw balance.
 *
 * @param {number} instituteId
 * @param {string} reportingMonth  'YYYY-MM'
 * @returns {Promise<object>}  data object consumed by pdfService.generateReportPDF()
 */
export async function getReportForPDF(instituteId, reportingMonth) {
  // ── 1. Header info ─────────────────────────────────────────────────────────
  const headerRes = await query(`
    SELECT
      mr.report_id,
      mr.start_date,
      mr.end_date,
      mr.receipt_number,
      mr.submission_status,
      i.institute_name,
      s.full_name    AS prepared_by_name,
      s.designation
    FROM monthly_reports mr
    JOIN institutes i ON mr.institute_id = i.institute_id
    JOIN staff      s ON mr.prepared_by  = s.staff_id
    WHERE mr.institute_id = $1
      AND mr.reporting_month = $2
  `, [instituteId, reportingMonth])

  if (headerRes.rows.length === 0) return null
  const hdr     = headerRes.rows[0]
  const reportId = hdr.report_id

  // ── 2. Fiscal year start ───────────────────────────────────────────────────
  const [yr, mo] = reportingMonth.split('-').map(Number)
  const fiscalStartYear  = mo >= 4 ? yr : yr - 1
  const fiscalStart = `${fiscalStartYear}-04`

  // ── helper: build OPD map { opd_type: { new, old, camp } } ─────────────────
  function buildOPDMap(rows) {
    const m = {}
    rows.forEach(r => {
      const t = (r.opd_type || '').toLowerCase()
      if (!m[t]) m[t] = {}
      m[t][r.case_category.toLowerCase()] = Number(r.total_cases)
    })
    return m
  }

  // ── 3. OPD this month ──────────────────────────────────────────────────────
  const opdMonthRes = await query(`
    SELECT opd_type, case_category, total_cases
    FROM opd_report_details
    WHERE report_id = $1
  `, [reportId])

  // ── 4. OPD progressive (fiscal year to date) ──────────────────────────────
  const opdProgRes = await query(`
    SELECT opd.opd_type, opd.case_category, SUM(opd.total_cases) AS total_cases
    FROM monthly_reports mr
    JOIN opd_report_details opd ON opd.report_id = mr.report_id
    WHERE mr.institute_id = $1
      AND mr.reporting_month >= $2
      AND mr.reporting_month <= $3
    GROUP BY opd.opd_type, opd.case_category
  `, [instituteId, fiscalStart, reportingMonth])

  // ── castrations helper (camp category in Bovine/Others = castrations in OPD) ──
  // Actually castrations are a separate field; for now derive from OPD Camp Bovine/Others
  function castFromOPD(opdMap) {
    return {
      bovine: (opdMap.bovine?.camp || 0),
      others: (opdMap.others?.camp || 0),
    }
  }

  // ── 5. Certificates this month & progressive ──────────────────────────────
  function buildCertMap(rows) {
    const m = {}
    rows.forEach(r => {
      switch (r.certificate_type) {
        case 'Health':     m.hcSmall  = (m.hcSmall  || 0) + Number(r.total_issued); break
        case 'PostMortem': m.pmSmall  = (m.pmSmall  || 0) + Number(r.total_issued); break
        case 'VetroLegal': m.vetroLegal = (m.vetroLegal || 0) + Number(r.total_issued); break
      }
      // The schema stores a single total; split evenly for small/large placeholder
      if (r.certificate_type === 'Health') {
        m.hcLarge = m.hcLarge || 0
      } else if (r.certificate_type === 'PostMortem') {
        m.pmLarge = m.pmLarge || 0
      }
    })
    return m
  }

  const certMonthRes = await query(`
    SELECT certificate_type, total_issued
    FROM certificate_report_details WHERE report_id = $1
  `, [reportId])

  const certProgRes = await query(`
    SELECT cert.certificate_type, SUM(cert.total_issued) AS total_issued
    FROM monthly_reports mr
    JOIN certificate_report_details cert ON cert.report_id = mr.report_id
    WHERE mr.institute_id = $1
      AND mr.reporting_month >= $2
      AND mr.reporting_month <= $3
    GROUP BY cert.certificate_type
  `, [instituteId, fiscalStart, reportingMonth])

  // ── 6. Vaccinations ────────────────────────────────────────────────────────
  const VACCINE_CODES = ['HS','FMD','BQ','BRUC','ETV','SWINE_FEVER','GOAT_POX','PPR','RABIES']

  async function fetchVaccinationsForReports(monthCondition, params) {
    const res = await query(`
      SELECT v.vaccine_code,
             SUM(vr.doses_received)    AS received,
             SUM(vr.doses_used)        AS used,
             SUM(vr.animals_vaccinated) AS vaccinated
      FROM monthly_reports mr
      JOIN vaccination_report_details vr ON vr.report_id = mr.report_id
      JOIN vaccines v ON vr.vaccine_id = v.vaccine_id
      WHERE mr.institute_id = $1
        AND ${monthCondition}
      GROUP BY v.vaccine_code
    `, params)

    return VACCINE_CODES.map(code => {
      const r = res.rows.find(x => x.vaccine_code === code) || {}
      return { code, received: Number(r.received||0), used: Number(r.used||0), vaccinated: Number(r.vaccinated||0) }
    })
  }

  const vacMonth    = await fetchVaccinationsForReports('mr.reporting_month = $2',                             [instituteId, reportingMonth])
  const vacThisYear = await fetchVaccinationsForReports('mr.reporting_month >= $2 AND mr.reporting_month <= $3', [instituteId, fiscalStart, reportingMonth])

  // Balance vaccine = received before this fiscal year – used before this fiscal year
  const vacBeforeYear = await fetchVaccinationsForReports(
    'mr.reporting_month < $2', [instituteId, fiscalStart]
  )
  const vacBalance = VACCINE_CODES.map((code, i) => ({
    code,
    received:   vacBeforeYear[i].received  - vacBeforeYear[i].used,
    used:       0,
    vaccinated: 0,
  }))

  // ── 7. AI data ─────────────────────────────────────────────────────────────
  const SEMEN_CODES = {
    cow: ['HF_LOCAL','JERSEY_LOCAL','CB_LOCAL','SAHIWAL_LOCAL','HF_ETT','JERSEY_ETT','HF_SEXED','JERSEY_SEXED','CB_SEXED','SAHIWAL_SEXED'],
    buffalo: ['MURRAH','NILI_RAVI','MURRAH_SEXED','NILI_RAVI_SEXED'],
  }

  async function fetchAIForMonth(monthCondition, params) {
    const res = await query(`
      SELECT st.semen_code,
             SUM(ai.total_ai_done)     AS ai_done,
             SUM(ai.animals_covered)   AS covered,
             SUM(ai.animals_tested)    AS tested,
             SUM(ai.animals_positive)  AS positive,
             SUM(ai.male_calves)       AS male_calves,
             SUM(ai.female_calves)     AS female_calves,
             SUM(ai.straws_received)   AS straws_received,
             SUM(ai.straws_used_inaph) AS straws_used_inaph,
             SUM(ai.straws_issued_aiw) AS straws_issued_aiw
      FROM monthly_reports mr
      JOIN ai_report_details ai ON ai.report_id = mr.report_id
      JOIN semen_types st ON ai.semen_type_id = st.semen_id
      WHERE mr.institute_id = $1
        AND ${monthCondition}
      GROUP BY st.semen_code
    `, params)

    const map = {}
    res.rows.forEach(r => {
      map[r.semen_code] = {
        code:             r.semen_code,
        ai:               Number(r.ai_done       || 0),
        covered:          Number(r.covered        || 0),
        tested:           Number(r.tested         || 0),
        positive:         Number(r.positive       || 0),
        male:             Number(r.male_calves     || 0),
        female:           Number(r.female_calves   || 0),
        strawsReceived:   Number(r.straws_received  || 0),
        strawsUsedINAPH:  Number(r.straws_used_inaph || 0),
        strawsIssuedAIW:  Number(r.straws_issued_aiw || 0),
      }
    })
    return map
  }

  const aiThisMonth   = await fetchAIForMonth('mr.reporting_month = $2',                             [instituteId, reportingMonth])
  const aiProgressive = await fetchAIForMonth('mr.reporting_month >= $2 AND mr.reporting_month <= $3', [instituteId, fiscalStart, reportingMonth])

  // Reshape into cow / buffalo lists
  function reshapeAICow(aiMap, src) {
    return SEMEN_CODES.cow.map(code => ({ code, ...(aiMap[code] || {}) }))
  }

  function reshapeAIBuf(aiMap) {
    const mu  = aiMap['MURRAH']          || {}
    const nr  = aiMap['NILI_RAVI']       || {}
    const mus = aiMap['MURRAH_SEXED']    || {}
    const nrs = aiMap['NILI_RAVI_SEXED'] || {}
    return {
      murrah:        { ai: n(mu.ai),  covered: n(mu.covered),  tested: n(mu.tested),  positive: n(mu.positive) },
      niliRavi:      { ai: n(nr.ai),  covered: n(nr.covered),  tested: n(nr.tested),  positive: n(nr.positive) },
      murrahSexed:   { ai: n(mus.ai), covered: n(mus.covered), tested: n(mus.tested), positive: n(mus.positive) },
      niliRaviSexed: { ai: n(nrs.ai), covered: n(nrs.covered), tested: n(nrs.tested), positive: n(nrs.positive) },
      calves: {
        male:   n(mu.male)  + n(nr.male)  + n(mus.male)  + n(nrs.male),
        female: n(mu.female)+ n(nr.female)+ n(mus.female) + n(nrs.female),
      },
    }
  }

  const aiPD3MonthsAgo = await fetchAIForMonth(
    `mr.reporting_month = TO_CHAR(TO_DATE($2,'YYYY-MM') - INTERVAL '3 months','YYYY-MM')`,
    [instituteId, reportingMonth]
  )

  // ── 8. Straw balance ───────────────────────────────────────────────────────
  const strawRes = await query(
    `SELECT * FROM get_straw_balance($1, $2)`, [instituteId, reportingMonth]
  )

  const STRAW_ORDER = [
    'HF_LOCAL','JERSEY_LOCAL','CB_LOCAL','SAHIWAL_LOCAL',
    'HF_ETT','JERSEY_ETT',
    'HF_SEXED','JERSEY_SEXED','CB_SEXED','SAHIWAL_SEXED',
    'MURRAH','NILI_RAVI','MURRAH_SEXED','NILI_RAVI_SEXED',
  ]
  const strawAccount = STRAW_ORDER.map(code => {
    const r = strawRes.rows.find(x => x.semen_code === code) || {}
    return {
      code,
      lastYearBalance:   Number(r.last_year_balance   || 0),
      lastMonthBalance:  Number(r.last_month_balance  || 0),
      receivedThisMonth: Number(r.received_this_month || 0),
      usedAIMonth:       Number(r.used_ai_this_month  || 0),
      usedINAPHMonth:    Number(r.used_inaph_month     || 0),
      issuedAIWMonth:    Number(r.issued_aiw_month     || 0),
      receivedThisYear:  Number(r.received_this_year   || 0),
      usedAIYear:        Number(r.used_ai_this_year    || 0),
      usedINAPHYear:     Number(r.used_inaph_year      || 0),
      issuedAIWYear:     Number(r.issued_aiw_year      || 0),
      balanceInHand:     Number(r.balance_in_hand      || 0),
    }
  })

  // ── 9. Extension camps ─────────────────────────────────────────────────────
  const extRes = await query(`
    SELECT camp_subtype, events_conducted, animals_treated, total_attendees, ladies_attended
    FROM extension_activities_details
    WHERE report_id = $1 AND activity_type = 'Camp'
  `, [reportId])

  function extByType(subtype) {
    const r = extRes.rows.find(x => x.camp_subtype === subtype) || {}
    return {
      camps:   Number(r.events_conducted || 0),
      animals: Number(r.animals_treated  || 0),
      farmers: Number(r.total_attendees  || 0),
      ladies:  Number(r.ladies_attended  || 0),
    }
  }

  // ── 10. Lab tests ──────────────────────────────────────────────────────────
  async function fetchLabForMonth(monthCondition, params) {
    const res = await query(`
      SELECT diagnostic_type, SUM(tests_conducted) AS tests
      FROM monthly_reports mr
      JOIN diagnostic_report_details diag ON diag.report_id = mr.report_id
      WHERE mr.institute_id = $1
        AND ${monthCondition}
      GROUP BY diagnostic_type
    `, params)
    const map = {}
    res.rows.forEach(r => { map[(r.diagnostic_type || '').toLowerCase()] = Number(r.tests) })
    return { fecal: map.fecal||0, blood: map.blood||0, urine: map.urine||0, milk: map.milk||0 }
  }

  const labMonth    = await fetchLabForMonth('mr.reporting_month = $2',                             [instituteId, reportingMonth])
  const labProgressive = await fetchLabForMonth('mr.reporting_month >= $2 AND mr.reporting_month <= $3', [instituteId, fiscalStart, reportingMonth])

  // ── 11. Fee rates ──────────────────────────────────────────────────────────
  const feeRateRes = await query(`SELECT service_code, current_rate FROM service_charges WHERE is_active = TRUE`)
  const feeRates = {}
  feeRateRes.rows.forEach(r => { feeRates[r.service_code] = Number(r.current_rate) })

  // ── 12. Fee summary ────────────────────────────────────────────────────────
  const feeSummaryRes = await query(
    `SELECT * FROM get_fee_summary($1, $2)`, [instituteId, reportingMonth]
  )

  // ── Assemble result ────────────────────────────────────────────────────────
  const opdThisMonth   = buildOPDMap(opdMonthRes.rows)
  const opdProgressive = buildOPDMap(opdProgRes.rows)

  return {
    // Header
    instituteName:   hdr.institute_name,
    reportingMonth,
    startDate:       hdr.start_date,
    endDate:         hdr.end_date,
    receiptNumber:   hdr.receipt_number,
    preparedByName:  hdr.prepared_by_name,
    designation:     hdr.designation,

    // OPD
    opd: {
      thisMonth:   opdThisMonth,
      progressive: opdProgressive,
    },
    castrations: {
      thisMonth:   castFromOPD(opdThisMonth),
      progressive: castFromOPD(opdProgressive),
    },
    certificates: {
      thisMonth:   buildCertMap(certMonthRes.rows),
      progressive: buildCertMap(certProgRes.rows),
    },

    // Vaccinations
    vaccinations: {
      thisMonth: vacMonth,
      thisYear:  vacThisYear,
      balance:   vacBalance,
    },

    // AI Cows
    aiCows: {
      thisMonth:   reshapeAICow(aiThisMonth),
      progressive: reshapeAICow(aiProgressive),
    },

    // PD in Cows
    pdCows: {
      threeMonthsAgo: SEMEN_CODES.cow.map(code => ({
        code,
        tested:   n((aiPD3MonthsAgo[code] || {}).tested),
        positive: n((aiPD3MonthsAgo[code] || {}).positive),
      })),
      thisMonth:   SEMEN_CODES.cow.map(code => ({
        code,
        tested:   n((aiThisMonth[code] || {}).tested),
        positive: n((aiThisMonth[code] || {}).positive),
      })),
      progressive: SEMEN_CODES.cow.map(code => ({
        code,
        tested:   n((aiProgressive[code] || {}).tested),
        positive: n((aiProgressive[code] || {}).positive),
      })),
    },

    // Calves
    calves: {
      threeMonthsAgo: SEMEN_CODES.cow.map(code => ({
        code,
        male:   n((aiPD3MonthsAgo[code] || {}).male),
        female: n((aiPD3MonthsAgo[code] || {}).female),
      })),
      thisMonth: SEMEN_CODES.cow.map(code => ({
        code,
        male:   n((aiThisMonth[code] || {}).male),
        female: n((aiThisMonth[code] || {}).female),
      })),
      progressive: SEMEN_CODES.cow.map(code => ({
        code,
        male:   n((aiProgressive[code] || {}).male),
        female: n((aiProgressive[code] || {}).female),
      })),
    },

    // Buffalo AI
    buffaloAI: {
      threeMonthsAgo: reshapeAIBuf(aiPD3MonthsAgo),
      thisMonth:      reshapeAIBuf(aiThisMonth),
      progressive:    reshapeAIBuf(aiProgressive),
    },

    // Straw account
    strawAccount,

    // Extension camps
    extensionCamps: {
      pldb:  extByType('PLDB'),
      ascad: extByType('ASCAD'),
      other: extByType('Other'),
    },

    // Lab
    labTests: {
      thisMonth:   labMonth,
      progressive: labProgressive,
    },

    // Fee
    feeRates,
    feeSummary: feeSummaryRes.rows,
  }

  function n(v) { return Number(v) || 0 }
}

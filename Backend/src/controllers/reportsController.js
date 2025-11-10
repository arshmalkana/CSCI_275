import * as reportsService from '../services/reportsService.js'

/**
 * POST /reports/monthly
 * Submit or save draft monthly report
 */
export async function submitReport(request, reply) {
  try {
    const reportData = request.body

    // TESTING MODE: Use dummy values if authentication is disabled
    // TODO: Remove this when authentication is re-enabled
    const staffId = request.user?.staffId || 1 // Default to staff_id = 1 for testing
    const instituteId = request.user?.instituteId || 1 // Default to institute_id = 1 for testing

    // Submit or save report
    const result = await reportsService.saveMonthlyReport({
      ...reportData,
      staffId,
      instituteId
    })

    return reply.code(201).send({
      success: true,
      message: reportData.status === 'Submitted'
        ? 'Report submitted successfully'
        : 'Report saved as draft',
      data: result
    })
  } catch (error) {
    request.log.error('Report submission error:', error)

    // Handle validation errors
    if (error.statusCode === 400 || error.validationErrors) {
      return reply.code(400).send({
        success: false,
        message: error.message,
        errors: error.validationErrors || []
      })
    }

    // Handle duplicate report error
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return reply.code(400).send({
        success: false,
        message: error.message
      })
    }

    // Handle approved report modification attempt
    if (error.message.includes('Cannot modify an approved report')) {
      return reply.code(403).send({
        success: false,
        message: 'This report has been approved and cannot be modified'
      })
    }

    return reply.code(500).send({
      success: false,
      message: 'Failed to submit report. Please try again later.'
    })
  }
}

/**
 * GET /reports/fiscal-years
 * Get available fiscal years for the institute
 */
export async function getFiscalYears(request, reply) {
  try {
    // TESTING MODE: Use dummy value if authentication is disabled
    // TODO: Remove this when authentication is re-enabled
    const instituteId = request.user?.instituteId || 1

    const fiscalYears = await reportsService.getAvailableFiscalYears(instituteId)

    return reply.send({
      success: true,
      data: fiscalYears
    })
  } catch (error) {
    request.log.error('Get fiscal years error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to retrieve fiscal years'
    })
  }
}

/**
 * GET /reports/monthly
 * List all monthly reports for the user's institute
 */
export async function listReports(request, reply) {
  try {
    // TESTING MODE: Use dummy value if authentication is disabled
    // TODO: Remove this when authentication is re-enabled
    const instituteId = request.user?.instituteId || 1

    const { status, year, fiscalYear } = request.query

    const reports = await reportsService.listMonthlyReports(instituteId, {
      status,
      year,
      fiscalYear
    })

    return reply.send({
      success: true,
      data: reports,
      count: reports.length
    })
  } catch (error) {
    request.log.error('List reports error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to retrieve reports'
    })
  }
}

/**
 * GET /reports/monthly/:month
 * Get monthly report for specific month
 */
export async function getReport(request, reply) {
  try {
    const { month } = request.params

    // TESTING MODE: Use dummy value if authentication is disabled
    // TODO: Remove this when authentication is re-enabled
    const instituteId = request.user?.instituteId || 1 // Default to institute_id = 1 for testing

    const report = await reportsService.getMonthlyReport(instituteId, month)

    if (!report) {
      return reply.code(404).send({
        success: false,
        message: 'Report not found for this month'
      })
    }

    return reply.send({
      success: true,
      data: report
    })
  } catch (error) {
    request.log.error('Get report error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to retrieve report'
    })
  }
}

/**
 * GET /reports/details/:reportId
 * Get full monthly report details by ID with all sub-details
 */
export async function getReportDetails(request, reply) {
  try {
    const { reportId } = request.params

    const reportIdNum = parseInt(reportId)
    if (isNaN(reportIdNum)) {
      return reply.code(400).send({
        success: false,
        message: 'Invalid report ID'
      })
    }

    const report = await reportsService.getMonthlyReportDetails(reportIdNum)

    console.log('[DEBUG] Report details:', JSON.stringify(report, null, 2))

    if (!report) {
      return reply.code(404).send({
        success: false,
        message: 'Report not found'
      })
    }

    const response = {
      success: true,
      data: report
    }

    console.log('[DEBUG] Response:', JSON.stringify(response, null, 2))

    return reply.send(response)
  } catch (error) {
    request.log.error('Get report details error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to retrieve report details'
    })
  }
}

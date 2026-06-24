import * as reportsService from '../services/reportsService.js'
import { generateReportPDF } from '../services/pdfService.js'

/**
 * POST /reports/monthly
 * Submit or save draft monthly report
 */
export async function submitReport(request, reply) {
  try {
    const reportData = request.body
    const staffId = request.user.staffId
    const instituteId = request.user.instituteId

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

    if (error.statusCode === 400 || error.validationErrors) {
      return reply.code(400).send({
        success: false,
        message: error.message,
        errors: error.validationErrors || []
      })
    }

    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return reply.code(400).send({
        success: false,
        message: error.message
      })
    }

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
 */
export async function getFiscalYears(request, reply) {
  try {
    const instituteId = request.user.instituteId
    const fiscalYears = await reportsService.getAvailableFiscalYears(instituteId)
    return reply.send({ success: true, data: fiscalYears })
  } catch (error) {
    request.log.error('Get fiscal years error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to retrieve fiscal years' })
  }
}

/**
 * GET /reports/monthly
 */
export async function listReports(request, reply) {
  try {
    const instituteId = request.user.instituteId
    const { status, year, fiscalYear } = request.query
    const reports = await reportsService.listMonthlyReports(instituteId, { status, year, fiscalYear })
    return reply.send({ success: true, data: reports, count: reports.length })
  } catch (error) {
    request.log.error('List reports error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to retrieve reports' })
  }
}

/**
 * GET /reports/monthly/:month
 */
export async function getReport(request, reply) {
  try {
    const { month } = request.params
    const instituteId = request.user.instituteId
    const report = await reportsService.getMonthlyReport(instituteId, month)

    if (!report) {
      return reply.code(404).send({ success: false, message: 'Report not found for this month' })
    }

    return reply.send({ success: true, data: report })
  } catch (error) {
    request.log.error('Get report error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to retrieve report' })
  }
}

/**
 * GET /reports/monthly/:month/pdf
 */
export async function downloadReportPDF(request, reply) {
  try {
    const { month } = request.params
    const instituteId = request.user.instituteId
    const reportData = await reportsService.getReportForPDF(instituteId, month)

    if (!reportData) {
      return reply.code(404).send({ success: false, message: 'Report not found for this month' })
    }

    const pdfBuffer = await generateReportPDF(reportData)
    const filename = `Monthly_Report_${reportData.instituteName.replace(/\s+/g, '_')}_${month}.pdf`

    return reply
      .code(200)
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Content-Length', pdfBuffer.length)
      .send(pdfBuffer)
  } catch (error) {
    request.log.error('PDF generation error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to generate PDF' })
  }
}

/**
 * PATCH /reports/monthly/:month/approve
 * Tehsil_Admin+ only. Target report must be within caller's scope.
 */
export async function approveReport(request, reply) {
  try {
    const { month } = request.params
    const { instituteId: targetInstituteId } = request.body
    const approver = request.user

    const result = await reportsService.approveReport(approver, targetInstituteId, month)

    return reply.send({ success: true, message: 'Report approved successfully', data: result })
  } catch (error) {
    request.log.error('Approve report error:', error)
    const code = error.statusCode || 500
    return reply.code(code).send({ success: false, message: error.message })
  }
}

/**
 * PATCH /reports/monthly/:month/reject
 * Tehsil_Admin+ only. Requires a reason. Target must be in scope.
 */
export async function rejectReport(request, reply) {
  try {
    const { month } = request.params
    const { instituteId: targetInstituteId, reason } = request.body
    const approver = request.user

    const result = await reportsService.rejectReport(approver, targetInstituteId, month, reason)

    return reply.send({ success: true, message: 'Report returned for revision', data: result })
  } catch (error) {
    request.log.error('Reject report error:', error)
    const code = error.statusCode || 500
    return reply.code(code).send({ success: false, message: error.message })
  }
}

export async function approveSections(request, reply) {
  try {
    const { month } = request.params
    const { instituteId: targetInstituteId, sections } = request.body
    const approver = request.user

    const result = await reportsService.approveSections(approver, targetInstituteId, month, sections)

    const msg = result.fullyApproved ? 'All sections approved — report fully approved' : 'Sections approved'
    return reply.send({ success: true, message: msg, data: result })
  } catch (error) {
    request.log.error('Approve sections error:', error)
    const code = error.statusCode || 500
    return reply.code(code).send({ success: false, message: error.message })
  }
}

export async function rejectSection(request, reply) {
  try {
    const { month } = request.params
    const { instituteId: targetInstituteId, section, reason } = request.body
    const approver = request.user

    const result = await reportsService.rejectSection(approver, targetInstituteId, month, section, reason)

    return reply.send({ success: true, message: 'Section rejected — report returned for revision', data: result })
  } catch (error) {
    request.log.error('Reject section error:', error)
    const code = error.statusCode || 500
    return reply.code(code).send({ success: false, message: error.message })
  }
}

export async function closeTehsilPeriod(request, reply) {
  try {
    const { month } = request.params
    const approver = request.user

    const result = await reportsService.closeTehsilPeriod(approver, month)

    return reply.code(201).send({
      success: true,
      message: `Period ${month} closed and frozen`,
      data: result
    })
  } catch (error) {
    request.log.error('Close period error:', error)
    const code = error.statusCode || 500
    return reply.code(code).send({ success: false, message: error.message })
  }
}

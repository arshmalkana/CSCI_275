import * as rollupService from '../services/rollupService.js'

export async function getRollupSummary(request, reply) {
  try {
    const { month, drill } = request.query
    const data = await rollupService.getRollupSummary(request.user, { month, drill })
    if (!data) return reply.code(404).send({ success: false, message: 'No visible institutes found' })
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function exportRollup(request, reply) {
  try {
    const { month, drill, format = 'pdf' } = request.query

    if (format === 'csv') {
      const summary = await rollupService.getRollupSummary(request.user, { month, drill })
      if (!summary) return reply.code(404).send({ success: false, message: 'No data' })
      const csv = rollupService.generateExportCsv(summary)
      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="rollup-${summary.month}.csv"`)
        .send(csv)
    }

    // Default: PDF
    const pdfBuffer = await rollupService.generateExportPdf(request.user, { month, drill })
    const reportMonth = month || new Date().toISOString().slice(0, 7)
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="rollup-${reportMonth}.pdf"`)
      .send(pdfBuffer)
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

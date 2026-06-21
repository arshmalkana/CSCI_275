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

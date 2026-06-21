import * as periodsService from '../services/periodsService.js'

export async function listPeriods(request, reply) {
  try {
    const data = await periodsService.listPeriods()
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getPeriod(request, reply) {
  try {
    const data = await periodsService.getPeriod(request.params.month)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function createPeriod(request, reply) {
  try {
    const data = await periodsService.createPeriod(request.user, request.body)
    return reply.code(201).send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function reopenPeriod(request, reply) {
  try {
    const data = await periodsService.reopenPeriod(request.user, request.params.month)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function lockPeriod(request, reply) {
  try {
    const data = await periodsService.lockPeriod(request.user, request.params.month)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

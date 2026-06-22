import * as masterDataService from '../services/masterDataService.js'

// ── Service Charges ───────────────────────────────────────────────────────────

export async function listServiceCharges(_request, reply) {
  try {
    const data = await masterDataService.listServiceCharges()
    return reply.send({ success: true, data })
  } catch (err) {
    _request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function createServiceCharge(request, reply) {
  try {
    const data = await masterDataService.createServiceCharge(request.user, request.body)
    return reply.code(201).send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function updateServiceChargeRate(request, reply) {
  try {
    const chargeId = parseInt(request.params.id)
    const data = await masterDataService.updateServiceChargeRate(request.user, chargeId, request.body)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function deactivateServiceCharge(request, reply) {
  try {
    const chargeId = parseInt(request.params.id)
    const data = await masterDataService.setServiceChargeActive(request.user, chargeId, false)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function activateServiceCharge(request, reply) {
  try {
    const chargeId = parseInt(request.params.id)
    const data = await masterDataService.setServiceChargeActive(request.user, chargeId, true)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

// ── Semen Types ───────────────────────────────────────────────────────────────

export async function listSemenTypes(_request, reply) {
  try {
    const data = await masterDataService.listSemenTypes()
    return reply.send({ success: true, data })
  } catch (err) {
    _request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function createSemenType(request, reply) {
  try {
    const data = await masterDataService.createSemenType(request.user, request.body)
    return reply.code(201).send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function updateSemenType(request, reply) {
  try {
    const semenId = parseInt(request.params.id)
    const data = await masterDataService.updateSemenType(request.user, semenId, request.body)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function deactivateSemenType(request, reply) {
  try {
    const semenId = parseInt(request.params.id)
    const data = await masterDataService.setSemenTypeActive(request.user, semenId, false)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function activateSemenType(request, reply) {
  try {
    const semenId = parseInt(request.params.id)
    const data = await masterDataService.setSemenTypeActive(request.user, semenId, true)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

// ── Vaccines ──────────────────────────────────────────────────────────────────

export async function listVaccines(_request, reply) {
  try {
    const data = await masterDataService.listVaccines()
    return reply.send({ success: true, data })
  } catch (err) {
    _request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function createVaccine(request, reply) {
  try {
    const data = await masterDataService.createVaccine(request.user, request.body)
    return reply.code(201).send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function updateVaccine(request, reply) {
  try {
    const vaccineId = parseInt(request.params.id)
    const data = await masterDataService.updateVaccine(request.user, vaccineId, request.body)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function deactivateVaccine(request, reply) {
  try {
    const vaccineId = parseInt(request.params.id)
    const data = await masterDataService.setVaccineActive(request.user, vaccineId, false)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function activateVaccine(request, reply) {
  try {
    const vaccineId = parseInt(request.params.id)
    const data = await masterDataService.setVaccineActive(request.user, vaccineId, true)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

// ── Institute Targets ─────────────────────────────────────────────────────────

export async function listTargets(request, reply) {
  try {
    const instituteId = request.query.instituteId ? parseInt(request.query.instituteId) : undefined
    const data = await masterDataService.listTargets(request.user, { instituteId })
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getTargetsForInstitute(request, reply) {
  try {
    const instituteId = parseInt(request.params.instituteId)
    const data = await masterDataService.getTargetsForInstitute(request.user, instituteId)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function setTarget(request, reply) {
  try {
    const data = await masterDataService.setTarget(request.user, request.body)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

import * as adminService from '../services/adminService.js'

// ── Approval queue ─────────────────────────────────────────────────────────────

export async function getApprovalQueue(request, reply) {
  try {
    const { month, status } = request.query
    const queue = await adminService.getApprovalQueue(request.user, { month, status })
    return reply.send({ success: true, data: queue, count: queue.length })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getSubmissionStatus(request, reply) {
  try {
    const { month } = request.query
    if (!month) return reply.code(400).send({ success: false, message: 'month query param required (YYYY-MM)' })
    const data = await adminService.getSubmissionStatus(request.user, month)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

// ── Remind ────────────────────────────────────────────────────────────────────

export async function sendReminder(request, reply) {
  try {
    const { instituteId, month } = request.body
    const result = await adminService.sendReminder(request.user, instituteId, month)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

// ── Registration lifecycle ────────────────────────────────────────────────────

export async function getPendingRegistrations(request, reply) {
  try {
    const data = await adminService.getPendingRegistrations()
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function approveRegistration(request, reply) {
  try {
    const { id } = request.params
    const result = await adminService.approveRegistration(request.user, parseInt(id), request.body)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function rejectRegistration(request, reply) {
  try {
    const { id } = request.params
    const { reason } = request.body
    const result = await adminService.rejectRegistration(request.user, parseInt(id), reason)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

// ── User management ────────────────────────────────────────────────────────────

export async function createUser(request, reply) {
  try {
    const result = await adminService.createUser(request.user, request.body)
    return reply.code(201).send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function listUsers(request, reply) {
  try {
    const users = await adminService.listUsers(request.user)
    return reply.send({ success: true, data: users, count: users.length })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function updateUser(request, reply) {
  try {
    const { staffId } = request.params
    const result = await adminService.updateUser(request.user, parseInt(staffId), request.body)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function deactivateUser(request, reply) {
  try {
    const { staffId } = request.params
    const result = await adminService.setUserActive(request.user, parseInt(staffId), false)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function reactivateUser(request, reply) {
  try {
    const { staffId } = request.params
    const result = await adminService.setUserActive(request.user, parseInt(staffId), true)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

// ── Institute CRUD ─────────────────────────────────────────────────────────────

export async function listInstitutes(request, reply) {
  try {
    const data = await adminService.listInstitutes(request.user)
    return reply.send({ success: true, data, count: data.length })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function createInstitute(request, reply) {
  try {
    const result = await adminService.createInstitute(request.user, request.body)
    return reply.code(201).send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function updateInstitute(request, reply) {
  try {
    const { instituteId } = request.params
    const result = await adminService.updateInstitute(request.user, parseInt(instituteId), request.body)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function deactivateInstitute(request, reply) {
  try {
    const { instituteId } = request.params
    const result = await adminService.setInstituteActive(request.user, parseInt(instituteId), false)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function reactivateInstitute(request, reply) {
  try {
    const { instituteId } = request.params
    const result = await adminService.setInstituteActive(request.user, parseInt(instituteId), true)
    return reply.send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

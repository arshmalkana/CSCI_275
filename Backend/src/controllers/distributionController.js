import * as distributionService from '../services/distributionService.js'

export async function getVaccines(request, reply) {
  try {
    const data = await distributionService.getVaccinesForDistribution()
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getMyStock(request, reply) {
  try {
    const data = await distributionService.getMyVaccineStock(request.user)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getReceivingInstitutes(request, reply) {
  try {
    const data = await distributionService.getReceivingInstitutes(request.user)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function issueVaccine(request, reply) {
  try {
    const { vaccineId, toInstituteId, dosesIssued, transactionDate, batchNumber } = request.body
    const result = await distributionService.issueVaccine(request.user, {
      vaccineId, toInstituteId, dosesIssued, transactionDate, batchNumber
    })
    return reply.code(201).send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getMyVaccineReceipts(request, reply) {
  try {
    const data = await distributionService.getMyVaccineReceipts(request.user)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getSemenTypes(request, reply) {
  try {
    const data = await distributionService.getSemenTypes()
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getMySemenStock(request, reply) {
  try {
    const data = await distributionService.getMySemenStock(request.user)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getSemenReceivingInstitutes(request, reply) {
  try {
    const data = await distributionService.getSemenReceivingInstitutes(request.user)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function issueSemen(request, reply) {
  try {
    const { semenTypeId, toInstituteId, strawsIssued, transactionDate, batchNumber, expiryDate, notes } = request.body
    const result = await distributionService.issueSemen(request.user, {
      semenTypeId, toInstituteId, strawsIssued, transactionDate, batchNumber, expiryDate, notes
    })
    return reply.code(201).send({ success: true, data: result })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

export async function getMySemenReceipts(request, reply) {
  try {
    const data = await distributionService.getMySemenReceipts(request.user)
    return reply.send({ success: true, data })
  } catch (err) {
    request.log.error(err)
    return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
  }
}

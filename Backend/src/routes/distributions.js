import * as distributionController from '../controllers/distributionController.js'
import { authenticate } from '../middleware/authenticate.js'
import { FIELD_ROLES } from '../config/roles.js'

const VACCINE_ISSUERS = ['VaccineBank', 'CVH']
const SEMEN_ISSUERS = ['SemenBank']

function requireVaccineIssuer(request, reply, done) {
  if (!VACCINE_ISSUERS.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'VaccineBank or CVH role required for vaccine distribution' })
  }
  done()
}

function requireSemenIssuer(request, reply, done) {
  if (!SEMEN_ISSUERS.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'SemenBank role required for semen distribution' })
  }
  done()
}

function requireFieldRole(request, reply, done) {
  if (!FIELD_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Field role required' })
  }
  done()
}

export default async function distributionRoutes(fastify) {
  // Vaccine distribution — VaccineBank and CVH
  fastify.get('/vaccines', {
    preHandler: [authenticate, requireVaccineIssuer],
    schema: { description: 'List active vaccines for distribution', tags: ['Distribution'] }
  }, distributionController.getVaccines)

  fastify.get('/vaccines/stock', {
    preHandler: [authenticate, requireVaccineIssuer],
    schema: { description: 'Get vaccine stock at the issuing institute', tags: ['Distribution'] }
  }, distributionController.getMyStock)

  fastify.get('/institutes', {
    preHandler: [authenticate, requireVaccineIssuer],
    schema: { description: 'List direct-child institutes for vaccine distribution', tags: ['Distribution'] }
  }, distributionController.getReceivingInstitutes)

  fastify.post('/vaccines/issue', {
    preHandler: [authenticate, requireVaccineIssuer],
    schema: {
      description: 'Issue vaccine doses to a direct-child institute',
      tags: ['Distribution'],
      body: {
        type: 'object',
        required: ['vaccineId', 'toInstituteId', 'dosesIssued', 'transactionDate'],
        properties: {
          vaccineId:       { type: 'integer' },
          toInstituteId:   { type: 'integer' },
          dosesIssued:     { type: 'integer', minimum: 1 },
          transactionDate: { type: 'string' },
          batchNumber:     { type: 'string' }
        }
      }
    }
  }, distributionController.issueVaccine)

  fastify.get('/vaccines/received', {
    preHandler: [authenticate, requireFieldRole],
    schema: { description: 'List vaccine doses received by this institute', tags: ['Distribution'] }
  }, distributionController.getMyVaccineReceipts)

  // Semen distribution — SemenBank only
  fastify.get('/semen/types', {
    preHandler: [authenticate, requireSemenIssuer],
    schema: { description: 'List active semen types for distribution', tags: ['Distribution'] }
  }, distributionController.getSemenTypes)

  fastify.get('/semen/stock', {
    preHandler: [authenticate, requireFieldRole],
    schema: { description: 'Get semen stock at the current institute (issuers and receivers)', tags: ['Distribution'] }
  }, distributionController.getMySemenStock)

  fastify.get('/semen/receiving-institutes', {
    preHandler: [authenticate, requireSemenIssuer],
    schema: { description: 'List institutes that can receive semen from this SemenBank', tags: ['Distribution'] }
  }, distributionController.getSemenReceivingInstitutes)

  fastify.post('/semen/issue', {
    preHandler: [authenticate, requireSemenIssuer],
    schema: {
      description: 'Issue semen straws to a direct-child institute',
      tags: ['Distribution'],
      body: {
        type: 'object',
        required: ['semenTypeId', 'toInstituteId', 'strawsIssued', 'transactionDate'],
        properties: {
          semenTypeId:     { type: 'integer' },
          toInstituteId:   { type: 'integer' },
          strawsIssued:    { type: 'integer', minimum: 1 },
          transactionDate: { type: 'string' },
          batchNumber:     { type: 'string' },
          expiryDate:      { type: 'string' },
          notes:           { type: 'string' }
        }
      }
    }
  }, distributionController.issueSemen)

  fastify.get('/semen/received', {
    preHandler: [authenticate, requireFieldRole],
    schema: { description: 'List semen straws received by this institute', tags: ['Distribution'] }
  }, distributionController.getMySemenReceipts)
}

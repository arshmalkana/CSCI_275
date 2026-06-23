import * as distributionController from '../controllers/distributionController.js'
import { authenticate } from '../middleware/authenticate.js'
import { ADMIN_ROLES } from '../config/roles.js'

function requireAdmin(request, reply, done) {
  if (!ADMIN_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Admin role required for vaccine distribution' })
  }
  done()
}

export default async function distributionRoutes(fastify) {
  fastify.get('/vaccines', {
    preHandler: [authenticate, requireAdmin],
    schema: { description: 'List active vaccines for distribution', tags: ['Distribution'] }
  }, distributionController.getVaccines)

  fastify.get('/vaccines/stock', {
    preHandler: [authenticate, requireAdmin],
    schema: { description: "Get vaccine stock at the current admin's institute", tags: ['Distribution'] }
  }, distributionController.getMyStock)

  fastify.get('/institutes', {
    preHandler: [authenticate, requireAdmin],
    schema: { description: "List institutes in admin's scope (distribution targets)", tags: ['Distribution'] }
  }, distributionController.getReceivingInstitutes)

  fastify.post('/vaccines/issue', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: "Issue vaccine doses from admin's institute to a sub-institute",
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
}

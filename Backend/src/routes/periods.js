import * as periodsController from '../controllers/periodsController.js'
import { authenticate } from '../middleware/authenticate.js'

const ADMIN_ROLES = ['Tehsil_Admin', 'District_Admin', 'HQ_Admin', 'Super_Admin']
const HQ_ROLES = ['HQ_Admin', 'Super_Admin']

function requireAdmin(request, reply, done) {
  if (!ADMIN_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Admin role required' })
  }
  done()
}

function requireHQ(request, reply, done) {
  if (!HQ_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'HQ_Admin or Super_Admin required' })
  }
  done()
}

const monthParam = { type: 'object', required: ['month'], properties: { month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } } }

export default async function periodsRoutes(fastify) {
  fastify.get('/', {
    preHandler: [authenticate, requireAdmin],
    schema: { description: 'List reporting periods', tags: ['Periods'] }
  }, periodsController.listPeriods)

  fastify.get('/:month', {
    preHandler: [authenticate, requireAdmin],
    schema: { description: 'Get a single reporting period', tags: ['Periods'], params: monthParam }
  }, periodsController.getPeriod)

  fastify.post('/', {
    preHandler: [authenticate, requireHQ],
    schema: {
      description: 'Create or update a reporting period (upsert by month)',
      tags: ['Periods'],
      body: {
        type: 'object',
        required: ['reportingMonth', 'opensAt', 'deadline'],
        properties: {
          reportingMonth: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          opensAt:        { type: 'string', format: 'date-time' },
          deadline:       { type: 'string', format: 'date-time' },
          closesAt:       { type: 'string', format: 'date-time' }
        }
      }
    }
  }, periodsController.createPeriod)

  fastify.post('/:month/reopen', {
    preHandler: [authenticate, requireHQ],
    schema: { description: 'Reopen a locked period (Super_Admin / HQ_Admin)', tags: ['Periods'], params: monthParam }
  }, periodsController.reopenPeriod)

  fastify.post('/:month/lock', {
    preHandler: [authenticate, requireHQ],
    schema: { description: 'Lock a period so no further changes are allowed', tags: ['Periods'], params: monthParam }
  }, periodsController.lockPeriod)
}

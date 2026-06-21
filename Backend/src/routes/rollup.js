import * as rollupController from '../controllers/rollupController.js'
import { authenticate } from '../middleware/authenticate.js'

const ADMIN_ROLES = ['Tehsil_Admin', 'District_Admin', 'HQ_Admin', 'Super_Admin']

function requireAdmin(request, reply, done) {
  if (!ADMIN_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Admin role required' })
  }
  done()
}

export default async function rollupRoutes(fastify) {
  fastify.get('/summary', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Aggregated report totals across the requesting admin\'s visible institute set',
      tags: ['Rollup'],
      querystring: {
        type: 'object',
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$', description: 'YYYY-MM format; defaults to current month' },
          drill: { type: 'string', description: 'institute_id to restrict to a single sub-institute' }
        }
      }
    }
  }, rollupController.getRollupSummary)
}

import * as ctrl from '../controllers/masterDataController.js'
import { authenticate } from '../middleware/authenticate.js'

const ADMIN_ROLES = ['Tehsil_Admin', 'District_Admin', 'HQ_Admin', 'Super_Admin']
const SENIOR_ADMIN_ROLES = ['HQ_Admin', 'Super_Admin']

function requireAdmin(request, reply, done) {
  if (!ADMIN_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Admin role required' })
  }
  done()
}

function requireSeniorAdmin(request, reply, done) {
  if (!SENIOR_ADMIN_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'HQ_Admin or Super_Admin required' })
  }
  done()
}

export default async function masterDataRoutes(fastify) {
  // ── Service Charges (HQ_Admin+) ───────────────────────────────────────────

  fastify.get('/charges', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: { description: 'List all service charges', tags: ['Master Data'] }
  }, ctrl.listServiceCharges)

  fastify.post('/charges', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Create a new service charge',
      tags: ['Master Data'],
      body: {
        type: 'object',
        required: ['serviceCode', 'serviceName', 'category', 'currentRate'],
        properties: {
          serviceCode:  { type: 'string' },
          serviceName:  { type: 'string' },
          category:     { type: 'string' },
          currentRate:  { type: 'number' },
          effectiveFrom:{ type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }
        }
      }
    }
  }, ctrl.createServiceCharge)

  fastify.patch('/charges/:id/rate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Update the current rate of a service charge (records history)',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } },
      body: {
        type: 'object',
        required: ['newRate', 'effectiveMonth'],
        properties: {
          newRate:        { type: 'number' },
          effectiveMonth: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }
        }
      }
    }
  }, ctrl.updateServiceChargeRate)

  fastify.post('/charges/:id/deactivate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Soft-deactivate a service charge',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } }
    }
  }, ctrl.deactivateServiceCharge)

  fastify.post('/charges/:id/activate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Re-activate a service charge',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } }
    }
  }, ctrl.activateServiceCharge)

  // ── Semen Types (HQ_Admin+) ───────────────────────────────────────────────

  fastify.get('/semen', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: { description: 'List all semen types', tags: ['Master Data'] }
  }, ctrl.listSemenTypes)

  fastify.post('/semen', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Create a new semen type',
      tags: ['Master Data'],
      body: {
        type: 'object',
        required: ['semenCode', 'semenName', 'species', 'semenCategory'],
        properties: {
          semenCode:     { type: 'string' },
          semenName:     { type: 'string' },
          species:       { type: 'string', enum: ['Cattle', 'Buffalo'] },
          semenCategory: { type: 'string' }
        }
      }
    }
  }, ctrl.createSemenType)

  fastify.patch('/semen/:id', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Update a semen type',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } },
      body: {
        type: 'object',
        properties: {
          semenName:     { type: 'string' },
          species:       { type: 'string', enum: ['Cattle', 'Buffalo'] },
          semenCategory: { type: 'string' }
        }
      }
    }
  }, ctrl.updateSemenType)

  fastify.post('/semen/:id/deactivate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Soft-deactivate a semen type',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } }
    }
  }, ctrl.deactivateSemenType)

  fastify.post('/semen/:id/activate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Re-activate a semen type',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } }
    }
  }, ctrl.activateSemenType)

  // ── Vaccines (HQ_Admin+) ──────────────────────────────────────────────────

  fastify.get('/vaccines', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: { description: 'List all vaccines', tags: ['Master Data'] }
  }, ctrl.listVaccines)

  fastify.post('/vaccines', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Create a new vaccine',
      tags: ['Master Data'],
      body: {
        type: 'object',
        required: ['vaccineCode', 'vaccineName'],
        properties: {
          vaccineCode:     { type: 'string' },
          vaccineName:     { type: 'string' },
          serviceChargeId: { type: 'integer' }
        }
      }
    }
  }, ctrl.createVaccine)

  fastify.patch('/vaccines/:id', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Update a vaccine',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } },
      body: {
        type: 'object',
        properties: {
          vaccineName:     { type: 'string' },
          serviceChargeId: { type: ['integer', 'null'] }
        }
      }
    }
  }, ctrl.updateVaccine)

  fastify.post('/vaccines/:id/deactivate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Soft-deactivate a vaccine',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } }
    }
  }, ctrl.deactivateVaccine)

  fastify.post('/vaccines/:id/activate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Re-activate a vaccine',
      tags: ['Master Data'],
      params: { type: 'object', properties: { id: { type: 'string' } } }
    }
  }, ctrl.activateVaccine)

  // ── Institute Targets (Admin+ / subtree-scoped) ───────────────────────────

  fastify.get('/targets', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'List institute targets within admin scope',
      tags: ['Master Data'],
      querystring: {
        type: 'object',
        properties: { instituteId: { type: 'integer' } }
      }
    }
  }, ctrl.listTargets)

  fastify.get('/targets/:instituteId', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Get all targets for a specific institute',
      tags: ['Master Data'],
      params: { type: 'object', properties: { instituteId: { type: 'string' } } }
    }
  }, ctrl.getTargetsForInstitute)

  fastify.post('/targets', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Create or update a target for an institute',
      tags: ['Master Data'],
      body: {
        type: 'object',
        required: ['instituteId', 'targetType', 'annualTarget', 'effectiveFrom', 'financialYear'],
        properties: {
          instituteId:   { type: 'integer' },
          targetType:    { type: 'string', enum: ['OPD', 'AI_Cattle', 'AI_Buffalo', 'Vaccine'] },
          vaccineId:     { type: 'integer' },
          annualTarget:  { type: 'integer', minimum: 0 },
          effectiveFrom: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          financialYear: { type: 'string' }
        }
      }
    }
  }, ctrl.setTarget)
}

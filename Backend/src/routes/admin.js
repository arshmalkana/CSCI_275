import * as adminController from '../controllers/adminController.js'
import { authenticate } from '../middleware/authenticate.js'
import { ADMIN_ROLES, SENIOR_ADMIN_ROLES } from '../config/roles.js'

function requireAdmin(request, reply, done) {
  if (!ADMIN_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Admin role required' })
  }
  done()
}

function requireSeniorAdmin(request, reply, done) {
  if (!SENIOR_ADMIN_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Oversight role required' })
  }
  done()
}

export default async function adminRoutes(fastify) {
  // ── Approval queue (Tehsil_Admin and above) ────────────────────────────────

  fastify.get('/reports/queue', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'List submitted reports within admin scope awaiting approval',
      tags: ['Admin'],
      querystring: {
        type: 'object',
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          status: { type: 'string', enum: ['Submitted', 'Rejected', 'Approved'] }
        }
      }
    }
  }, adminController.getApprovalQueue)

  fastify.get('/reports/submission-status', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Show which institutes have / have not submitted for a given month',
      tags: ['Admin'],
      querystring: {
        type: 'object',
        required: ['month'],
        properties: { month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } }
      }
    }
  }, adminController.getSubmissionStatus)

  fastify.post('/remind', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Send a report-submission reminder to field staff at a specific institute',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['instituteId', 'month'],
        properties: {
          instituteId: { type: 'integer' },
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }
        }
      }
    }
  }, adminController.sendReminder)

  // ── Registration lifecycle (HQ_Admin / Super_Admin only) ───────────────────

  fastify.get('/registrations', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'List institutes pending activation (is_active = false)',
      tags: ['Admin']
    }
  }, adminController.getPendingRegistrations)

  fastify.post('/registrations/:id/approve', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Approve a pending registration — activates institute and assigns user credentials',
      tags: ['Admin'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      body: {
        type: 'object',
        required: ['userId', 'password', 'role', 'instituteId'],
        properties: {
          userId:      { type: 'string' },
          password:    { type: 'string', minLength: 8 },
          role:        { type: 'string', enum: ['CVD', 'CVH', 'PAIW', 'SemenBank', 'VaccineBank', 'Oversight'] },
          instituteId: { type: 'integer' }
        }
      }
    }
  }, adminController.approveRegistration)

  fastify.post('/registrations/:id/reject', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Reject a pending registration',
      tags: ['Admin'],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      body: {
        type: 'object',
        required: ['reason'],
        properties: { reason: { type: 'string', minLength: 5 } }
      }
    }
  }, adminController.rejectRegistration)

  // ── User management (Tehsil_Admin and above) ───────────────────────────────

  fastify.post('/users', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Create a staff user directly (bypasses registration queue)',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['fullName', 'userId', 'password', 'role', 'instituteId'],
        properties: {
          fullName:    { type: 'string', minLength: 2 },
          userId:      { type: 'string', minLength: 3 },
          password:    { type: 'string', minLength: 8 },
          role:        { type: 'string', enum: ['CVD', 'CVH', 'PAIW', 'SemenBank', 'VaccineBank', 'Oversight'] },
          instituteId: { type: 'integer' },
          designation: { type: 'string' },
          mobile:      { type: 'string' },
          email:       { type: 'string' }
        }
      }
    }
  }, adminController.createUser)

  fastify.get('/users', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'List all staff within admin scope',
      tags: ['Admin']
    }
  }, adminController.listUsers)

  fastify.patch('/users/:staffId', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Update a staff member\'s profile (role, institute, designation, contact)',
      tags: ['Admin'],
      params: { type: 'object', required: ['staffId'], properties: { staffId: { type: 'string' } } },
      body: {
        type: 'object',
        properties: {
          full_name:             { type: 'string' },
          mobile:                { type: 'string' },
          email:                 { type: 'string' },
          user_role:             { type: 'string' },
          designation:           { type: 'string' },
          current_institute_id:  { type: 'integer' }
        }
      }
    }
  }, adminController.updateUser)

  fastify.post('/users/:staffId/deactivate', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Deactivate a staff member (soft delete — they cannot log in)',
      tags: ['Admin'],
      params: { type: 'object', required: ['staffId'], properties: { staffId: { type: 'string' } } }
    }
  }, adminController.deactivateUser)

  fastify.post('/users/:staffId/reactivate', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Reactivate a previously deactivated staff member',
      tags: ['Admin'],
      params: { type: 'object', required: ['staffId'], properties: { staffId: { type: 'string' } } }
    }
  }, adminController.reactivateUser)

  // ── Institute CRUD (HQ_Admin / Super_Admin only) ────────────────────────────

  fastify.get('/institutes', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: { description: 'List all institutes in admin scope', tags: ['Admin'] }
  }, adminController.listInstitutes)

  fastify.post('/institutes', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Create a new institute',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['instituteName', 'instituteType'],
        properties: {
          instituteName:        { type: 'string', minLength: 3 },
          instituteType:        { type: 'string', enum: ['HQ', 'District_HQ', 'TehsilHQ', 'CVH', 'CVD', 'ASC'] },
          orgId:                { type: 'string' },
          reportingAuthorityId: { type: 'integer' },
          districtId:           { type: 'integer' },
          tehsilId:             { type: 'integer' },
          villageId:            { type: 'integer' }
        }
      }
    }
  }, adminController.createInstitute)

  fastify.patch('/institutes/:instituteId', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Rename, retype, or reassign parent of an institute',
      tags: ['Admin'],
      params: { type: 'object', required: ['instituteId'], properties: { instituteId: { type: 'string' } } },
      body: {
        type: 'object',
        properties: {
          instituteName:        { type: 'string', minLength: 3 },
          instituteType:        { type: 'string' },
          orgId:                { type: 'string' },
          reportingAuthorityId: { type: 'integer' }
        }
      }
    }
  }, adminController.updateInstitute)

  fastify.post('/institutes/:instituteId/deactivate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Deactivate an institute (soft delete)',
      tags: ['Admin'],
      params: { type: 'object', required: ['instituteId'], properties: { instituteId: { type: 'string' } } }
    }
  }, adminController.deactivateInstitute)

  fastify.post('/institutes/:instituteId/reactivate', {
    preHandler: [authenticate, requireSeniorAdmin],
    schema: {
      description: 'Reactivate a deactivated institute',
      tags: ['Admin'],
      params: { type: 'object', required: ['instituteId'], properties: { instituteId: { type: 'string' } } }
    }
  }, adminController.reactivateInstitute)
}

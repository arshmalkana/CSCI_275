// src/routes/auth.js
import authController from '../controllers/authController.js'
import * as passwordResetService from '../services/passwordResetService.js'
import { authenticate } from '../middleware/authenticate.js'
import { query } from '../database/db.js'
import authService from '../services/authService.js'

export default async function (fastify, opts) {
  // Login endpoint
  fastify.post('/login', {
    schema: {
      description: 'User login',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string', minLength: 6 },
          rememberMe: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            user: { type: 'object', additionalProperties: true },
            token: { type: 'string' },
            expiresIn: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
          errorResponseBuilder: (request, context) => {
            return {
              statusCode: 429,
              error: 'Too Many Login Attempts',
              message: 'Too many failed login attempts. Please try again in 15 minutes.',
              retryAfter: Math.ceil(context.after / 1000)
            }
          }
        }
      }
  }, authController.login)

  // Logout endpoint
  fastify.post('/logout', {
    schema: {
      description: 'User logout',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, authController.logout)

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh access token',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            expiresIn: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    config: {
        rateLimit: {
          max: 10,
          timeWindow: '15 minutes'
        }
      }
  }, authController.refreshToken)

  // Session management endpoints (requires authentication)
  fastify.get('/sessions', {
    preHandler: authenticate,
    schema: {
      description: 'Get all active sessions (requires JWT)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            sessions: { type: 'array' }
          }
        }
      }
    }
  }, authController.getSessions)

  fastify.delete('/sessions/:tokenId', {
    preHandler: authenticate,
    schema: {
      description: 'Revoke a specific session (requires JWT)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          tokenId: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, authController.revokeSession)

  fastify.post('/sessions/revoke-all-others', {
    preHandler: authenticate,
    schema: {
      description: 'Revoke all other sessions except current (requires JWT)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, authController.revokeAllOtherSessions)

  // ── Forgot password ──────────────────────────────────────────────────────
  fastify.post('/forgot-password', {
    schema: {
      description: 'Request a password reset link by email',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } }
      }
    },
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } }
  }, async (request, reply) => {
    try {
      await passwordResetService.requestPasswordReset(request.body.email)
      // Always return 200 to prevent email enumeration
      return reply.send({ success: true, message: 'If that email is registered, a reset link has been sent.' })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({ success: false, message: 'Failed to send reset email' })
    }
  })

  fastify.post('/reset-password', {
    schema: {
      description: 'Set a new password using a valid reset token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token:       { type: 'string' },
          newPassword: { type: 'string', minLength: 8 }
        }
      }
    },
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
  }, async (request, reply) => {
    try {
      await passwordResetService.resetPassword(request.body.token, request.body.newPassword)
      return reply.send({ success: true, message: 'Password updated. Please log in with your new password.' })
    } catch (err) {
      request.log.error(err)
      return reply.code(err.statusCode || 500).send({ success: false, message: err.message })
    }
  })

  // ── Change password (authenticated) ─────────────────────────────────────
  fastify.patch('/change-password', {
    preHandler: [authenticate],
    schema: {
      description: 'Change own password (requires current password and valid JWT)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword:     { type: 'string', minLength: 8 }
        }
      }
    },
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
  }, async (request, reply) => {
    try {
      const { staffId } = request.user
      const { currentPassword, newPassword } = request.body

      const staffResult = await query(
        'SELECT password_hash FROM staff WHERE staff_id = $1 AND is_active = TRUE',
        [staffId]
      )
      if (staffResult.rows.length === 0) {
        return reply.code(401).send({ success: false, message: 'User not found' })
      }

      const isValid = await authService.verifyPassword(currentPassword, staffResult.rows[0].password_hash)
      if (!isValid) {
        return reply.code(401).send({ success: false, message: 'Current password is incorrect' })
      }

      if (currentPassword === newPassword) {
        return reply.code(400).send({ success: false, message: 'New password must differ from current password' })
      }

      const newHash = await authService.hashPassword(newPassword)
      await query(
        'UPDATE staff SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE staff_id = $2',
        [newHash, staffId]
      )

      await query(`
        INSERT INTO report_edits_audit
          (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
        VALUES (0, $1, 'staff', 'password_hash', '[redacted]', '[redacted]', 'Staff changed own password')
      `, [staffId])

      return reply.send({ success: true, message: 'Password updated successfully' })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({ success: false, message: 'Failed to change password' })
    }
  })
}

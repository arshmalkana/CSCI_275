// src/routes/auth.js
import authController from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'

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
}

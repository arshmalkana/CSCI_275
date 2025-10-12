// src/routes/webauthn.js
import webauthnController from '../controllers/webauthnController.js'
import { authenticate } from '../middleware/authenticate.js'

export default async function (fastify, opts) {
  // Registration endpoints (requires authentication)
  fastify.post('/register/options', {
    preHandler: authenticate,
    schema: {
      description: 'Get WebAuthn registration options for passkey setup (requires JWT)',
      tags: ['WebAuthn'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {}
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            options: { type: 'object', additionalProperties: true }
          }
        }
      }
    }
  }, webauthnController.registerOptions)

  fastify.post('/register/verify', {
    preHandler: authenticate,
    schema: {
      description: 'Verify WebAuthn registration response and save credential (requires JWT)',
      tags: ['WebAuthn'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['response'],
        properties: {
          response: { type: 'object', additionalProperties: true },
          deviceName: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            credential: { type: 'object', additionalProperties: true }
          }
        }
      }
    }
  }, webauthnController.registerVerify)

  // Login endpoints (public)
  fastify.post('/login/options', {
    schema: {
      description: 'Get WebAuthn authentication options for passkey login',
      tags: ['WebAuthn'],
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', description: 'User login username' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            options: { type: 'object', additionalProperties: true }
          }
        }
      }
    }
  }, webauthnController.loginOptions)

  fastify.post('/login/verify', {
    schema: {
      description: 'Verify WebAuthn authentication and login user',
      tags: ['WebAuthn'],
      body: {
        type: 'object',
        required: ['username', 'response'],
        properties: {
          username: { type: 'string' },
          response: { type: 'object', additionalProperties: true }
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
        }
      }
    }
  }, webauthnController.loginVerify)

  // Credential management endpoints (requires authentication)
  fastify.get('/credentials', {
    preHandler: authenticate,
    schema: {
      description: 'List user registered passkeys (requires JWT)',
      tags: ['WebAuthn'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            credentials: {
              type: 'array',
              items: { type: 'object', additionalProperties: true }
            }
          }
        }
      }
    }
  }, webauthnController.listCredentials)

  fastify.delete('/credentials/:credentialId', {
    preHandler: authenticate,
    schema: {
      description: 'Delete a registered passkey (requires JWT)',
      tags: ['WebAuthn'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          credentialId: { type: 'string' }
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
  }, webauthnController.deleteCredential)
}
// src/routes/webauthn.js
import webauthnController from '../controllers/webauthnController.js'

export default async function (fastify, opts) {
  // Registration endpoints (requires authentication)
  fastify.post('/register/options', {
    schema: {
      description: 'Get WebAuthn registration options for passkey setup',
      tags: ['WebAuthn'],
      body: {
        type: 'object',
        required: ['staffId'],
        properties: {
          staffId: { type: 'number', description: 'User staff ID' }
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
  }, webauthnController.registerOptions)

  fastify.post('/register/verify', {
    schema: {
      description: 'Verify WebAuthn registration response and save credential',
      tags: ['WebAuthn'],
      body: {
        type: 'object',
        required: ['staffId', 'response'],
        properties: {
          staffId: { type: 'number' },
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
    schema: {
      description: 'List user registered passkeys',
      tags: ['WebAuthn'],
      querystring: {
        type: 'object',
        required: ['staffId'],
        properties: {
          staffId: { type: 'number' }
        }
      },
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
  }, async (request, reply) => {
    // Convert query param to body for controller
    request.body = { staffId: parseInt(request.query.staffId) }
    return webauthnController.listCredentials(request, reply)
  })

  fastify.delete('/credentials/:credentialId', {
    schema: {
      description: 'Delete a registered passkey',
      tags: ['WebAuthn'],
      params: {
        type: 'object',
        properties: {
          credentialId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['staffId'],
        properties: {
          staffId: { type: 'number' }
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
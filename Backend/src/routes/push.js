import * as pushController from '../controllers/pushController.js'

export default async function pushRoutes(fastify, options) {
  // Get VAPID public key
  fastify.get('/vapid-public-key', {
    schema: {
      description: 'Get VAPID public key for push notifications',
      tags: ['push'],
      response: {
        200: {
          description: 'VAPID public key retrieved',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                publicKey: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: pushController.getVapidPublicKey
  })

  // Subscribe to push notifications
  fastify.post('/subscribe', {
    schema: {
      description: 'Subscribe to push notifications',
      tags: ['push'],
      body: {
        type: 'object',
        required: ['subscription'],
        properties: {
          subscription: {
            type: 'object',
            required: ['endpoint', 'keys'],
            properties: {
              endpoint: { type: 'string' },
              expirationTime: { type: ['string', 'null'] },
              keys: {
                type: 'object',
                required: ['p256dh', 'auth'],
                properties: {
                  p256dh: { type: 'string' },
                  auth: { type: 'string' }
                }
              }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Subscription saved',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              additionalProperties: true
            }
          }
        }
      }
    },
    handler: pushController.subscribe
  })

  // Unsubscribe from push notifications
  fastify.post('/unsubscribe', {
    schema: {
      description: 'Unsubscribe from push notifications',
      tags: ['push'],
      body: {
        type: 'object',
        required: ['endpoint'],
        properties: {
          endpoint: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Unsubscribed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: pushController.unsubscribe
  })

  // Send test push notification
  fastify.post('/test', {
    schema: {
      description: 'Send test push notification',
      tags: ['push'],
      response: {
        200: {
          description: 'Test notification sent',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              additionalProperties: true
            }
          }
        }
      }
    },
    handler: pushController.sendTestPush
  })
}

import * as notificationsController from '../controllers/notificationsController.js'
import { authenticate } from '../middleware/authenticate.js'

export default async function notificationsRoutes(fastify, options) {
  // Get user's notifications (requires authentication
  fastify.get('/', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute'
      }
    },
    schema: {
      description: 'Get user notifications with pagination (requires JWT)',
      tags: ['notifications'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 50 },
          offset: { type: 'integer', default: 0 },
          unreadOnly: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          description: 'Notifications retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true
              }
            },
            count: { type: 'integer' }
          }
        }
      }
    },
    handler: notificationsController.getNotifications
  })

  // Get unread notification count (requires authentication)
  fastify.get('/unread-count', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute'
      }
    },
    schema: {
      description: 'Get count of unread notifications (requires JWT)',
      tags: ['notifications'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Unread count retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                count: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    handler: notificationsController.getUnreadCount
  })

  // Get notification by ID (requires authentication)
  fastify.get('/:id', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute'
      }
    },
    schema: {
      description: 'Get notification details by ID (requires JWT)',
      tags: ['notifications'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Notification ID' }
        }
      },
      response: {
        200: {
          description: 'Notification retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              additionalProperties: true
            }
          }
        }
      }
    },
    handler: notificationsController.getNotification
  })

  // Mark notification as read (requires authentication)
  fastify.patch('/:id/read', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute'
      }
    },
    schema: {
      description: 'Mark notification as read (requires JWT)',
      tags: ['notifications'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Notification ID' }
        }
      },
      response: {
        200: {
          description: 'Notification marked as read',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: notificationsController.markAsRead
  })

  // Mark all notifications as read (requires authentication)
  fastify.patch('/read-all', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    },
    schema: {
      description: 'Mark all notifications as read (requires JWT)',
      tags: ['notifications'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'All notifications marked as read',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                count: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    handler: notificationsController.markAllAsRead
  })

  // Delete notification (requires authentication)
  fastify.delete('/:id', {
    preHandler: authenticate,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute'
      }
    },
    schema: {
      description: 'Delete a notification (requires JWT)',
      tags: ['notifications'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Notification ID' }
        }
      },
      response: {
        200: {
          description: 'Notification deleted',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: notificationsController.deleteNotification
  })
}

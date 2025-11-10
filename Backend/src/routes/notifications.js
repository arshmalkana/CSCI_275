import * as notificationsController from '../controllers/notificationsController.js'

export default async function notificationsRoutes(fastify, options) {
  // Get user's notifications
  fastify.get('/', {
    schema: {
      description: 'Get user notifications with pagination',
      tags: ['notifications'],
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

  // Get unread notification count
  fastify.get('/unread-count', {
    schema: {
      description: 'Get count of unread notifications',
      tags: ['notifications'],
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

  // Get notification by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get notification details by ID',
      tags: ['notifications'],
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

  // Mark notification as read
  fastify.patch('/:id/read', {
    schema: {
      description: 'Mark notification as read',
      tags: ['notifications'],
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

  // Mark all notifications as read
  fastify.patch('/read-all', {
    schema: {
      description: 'Mark all notifications as read',
      tags: ['notifications'],
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

  // Delete notification
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a notification',
      tags: ['notifications'],
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

// src/routes/profile.js
import * as profileController from '../controllers/profileController.js'
import { authenticate } from '../middleware/authenticate.js'

export default async function profileRoutes(fastify, options) {
  // Get user profile
  fastify.get(
    '/',
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      schema: {
        description: 'Get user profile details',
        tags: ['Profile'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Profile retrieved successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  staffId: { type: 'number' },
                  fullName: { type: 'string' },
                  designation: { type: 'string' },
                  mobile: { type: 'string' },
                  email: { type: 'string' },
                  whatsappNumber: { type: 'string' },
                  dateOfBirth: { type: 'string' },
                  dateOfJoining: { type: 'string' },
                  userRole: { type: 'string' },
                  profilePictureUrl: { type: 'string' },
                  institute: { type: 'object' },
                  serviceVillages: { type: 'array' }
                }
              }
            }
          }
        }
      }
    },
    profileController.getProfile
  )

  // Update user profile
  fastify.put(
    '/',
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute'
        }
      },
      schema: {
        description: 'Update user profile',
        tags: ['Profile'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            mobile: { type: 'string' },
            email: { type: 'string' },
            whatsappNumber: { type: 'string' },
            dateOfBirth: { type: 'string' }
          }
        },
        response: {
          200: {
            description: 'Profile updated successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    profileController.updateProfile
  )

  // Update institute location
  fastify.put(
    '/location',
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute'
        }
      },
      schema: {
        description: 'Update institute location',
        tags: ['Profile'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 }
          }
        },
        response: {
          200: {
            description: 'Location updated successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  instituteId: { type: 'number' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                }
              },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    profileController.updateLocation
  )

  // Upload profile picture
  fastify.post(
    '/picture',
    {
      preHandler: authenticate,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute'
        }
      },
      schema: {
        description: 'Upload profile picture',
        tags: ['Profile'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['pictureUrl'],
          properties: {
            pictureUrl: { type: 'string' }
          }
        },
        response: {
          200: {
            description: 'Profile picture uploaded successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  profilePictureUrl: { type: 'string' }
                }
              },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    profileController.uploadProfilePicture
  )
}

// src/routes/home.js
import * as homeController from '../controllers/homeController.js'
import { authenticate } from '../middleware/authenticate.js'

export default async function homeRoutes(fastify, options) {
  // Get homepage data for authenticated user
  fastify.get(
    '/',
    {
      preHandler: authenticate, // Requires authentication
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      schema: {
        description: 'Get homepage data for the authenticated user',
        tags: ['Home'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Homepage data retrieved successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Institute name' },
                  welcomeMessage: { type: 'string', description: 'Welcome message with user name' },
                  location: {
                    type: 'object',
                    properties: {
                      lat: { type: 'string', description: 'Latitude' },
                      lng: { type: 'string', description: 'Longitude' }
                    }
                  },
                  stats: {
                    type: 'object',
                    properties: {
                      opd: {
                        type: 'object',
                        properties: {
                          monthly: { type: 'object', properties: { completed: { type: 'number' } } },
                          annual: { type: 'object', properties: { completed: { type: 'number' }, target: { type: 'number' } } }
                        }
                      },
                      aiCow: {
                        type: 'object',
                        properties: {
                          monthly: { type: 'object', properties: { completed: { type: 'number' } } },
                          annual: { type: 'object', properties: { completed: { type: 'number' }, target: { type: 'number' } } }
                        }
                      },
                      aiBuf: {
                        type: 'object',
                        properties: {
                          monthly: { type: 'object', properties: { completed: { type: 'number' } } },
                          annual: { type: 'object', properties: { completed: { type: 'number' }, target: { type: 'number' } } }
                        }
                      }
                    }
                  },
                  vaccines: { type: 'object', description: 'Vaccine statistics by vaccine code' },
                  staff: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        role: { type: 'string' },
                        phone: { type: 'string' },
                        email: { type: 'string' },
                        whatsapp: { type: 'string' }
                      }
                    }
                  },
                  villages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        population: { type: 'number' },
                        animalPopulation: { type: 'object' }
                      }
                    }
                  },
                  reportingStatus: { type: 'string' },
                  attachedInstitutes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        reportStatus: { type: 'string' },
                        statusType: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Not Found',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    homeController.getHomeData
  )
}

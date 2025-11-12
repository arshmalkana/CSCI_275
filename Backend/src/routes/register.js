import * as registerController from '../controllers/registerController.js'
import { VALID_DESIGNATIONS } from '../config/designations.js'

/**
 * Registration routes for new institutes
 */
export default async function registerRoutes(fastify) {
  // POST /register - Submit institute registration
  fastify.post('/', {
    schema: {
      description: 'Submit new institute registration for approval',
      tags: ['Registration'],
      body: {
        type: 'object',
        required: ['district', 'tehsil', 'village', 'instituteType', 'latitude', 'longitude', 'incharge'],
        properties: {
          district: { type: 'string', description: 'District name' },
          tehsil: { type: 'string', description: 'Tehsil name' },
          village: { type: 'string', description: 'Village of establishment' },
          serviceVillages: {
            type: 'array',
            items: { type: 'string' },
            description: 'Other villages served (optional)'
          },
          instituteType: {
            type: 'string',
            enum: ['CVH', 'CVD', 'PAIW', 'CVH_Lab', 'Semen_Cluster'],
            description: 'Type of institute'
          },
          isClusterAvailable: { type: 'boolean', default: false },
          isLabAvailable: { type: 'boolean', default: false },
          isTehsilHQ: { type: 'boolean', default: false },
          latitude: { type: 'string', description: 'Institute latitude' },
          longitude: { type: 'string', description: 'Institute longitude' },
          incharge: {
            type: 'object',
            required: ['type', 'name', 'mobile', 'email'],
            properties: {
              type: { type: 'string', enum: VALID_DESIGNATIONS, description: 'Designation type' },
              name: { type: 'string', minLength: 2 },
              mobile: { type: 'string', pattern: '^[6-9]\\d{9}$' },
              email: { type: 'string', format: 'email' }
            }
          },
          employees: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'name', 'mobile'],
              properties: {
                type: { type: 'string', enum: VALID_DESIGNATIONS },
                name: { type: 'string', minLength: 2 },
                mobile: { type: 'string', pattern: '^[6-9]\\d{9}$' },
                email: { type: 'string', format: 'email' }
              }
            },
            maxItems: 10
          },
          villagePopulations: {
            type: 'object',
            description: 'Animal population data per village',
            additionalProperties: {
              type: 'object',
              required: ['equine', 'buffaloes', 'cows', 'pigs', 'goat', 'sheep', 'poultryLayers', 'poultryBroilers'],
              properties: {
                equine: { type: 'integer', minimum: 0 },
                buffaloes: { type: 'integer', minimum: 0 },
                cows: { type: 'integer', minimum: 0 },
                pigs: { type: 'integer', minimum: 0 },
                goat: { type: 'integer', minimum: 0 },
                sheep: { type: 'integer', minimum: 0 },
                poultryLayers: { type: 'integer', minimum: 0 },
                poultryBroilers: { type: 'integer', minimum: 0 }
              }
            }
          }
        }
      },
      response: {
        201: {
          description: 'Registration submitted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                registrationId: { type: 'integer' },
                instituteName: { type: 'string' },
                orgId: { type: 'string' },
                status: { type: 'string' },
                failedServiceVillages: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Villages that could not be found in database'
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, registerController.submitRegistration)
}
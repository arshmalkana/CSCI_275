import * as reportsController from '../controllers/reportsController.js'
import { authenticate } from '../middleware/authenticate.js'
import { ADMIN_ROLES } from '../config/roles.js'

function requireAdminRole(request, reply, done) {
  if (!ADMIN_ROLES.includes(request.user?.role)) {
    return reply.code(403).send({ success: false, message: 'Admin role required' })
  }
  done()
}

/**
 * JSON Schema definitions for reusable structures
 */
const breedAIDataSchema = {
  type: 'object',
  properties: {
    current: {
      type: 'object',
      properties: {
        ai: { type: 'string' },
        covered: { type: 'string' },
        beneficiaries: { type: 'string' }
      }
    },
    threeMonthsAgo: {
      type: 'object',
      properties: {
        tested: { type: 'string' },
        positive: { type: 'string' },
        beneficiaries: { type: 'string' }
      }
    },
    sixMonthsAgo: {
      type: 'object',
      properties: {
        maleCalves: { type: 'string' },
        femaleCalves: { type: 'string' },
        beneficiaries: { type: 'string' }
      }
    }
  }
}

/**
 * Reports routes - organized by report type
 */
export default async function reportsRoutes(fastify) {
  // Register the schema definition for reuse
  fastify.addSchema({
    $id: 'BreedAIData',
    ...breedAIDataSchema
  })
  // POST /reports/monthly - Submit or save draft monthly report
  fastify.post('/monthly', {
    
    preHandler: authenticate, // Requires authentication
    schema: {
      description: 'Submit or save draft monthly report',
      tags: ['Reports'],
      body: {
        type: 'object',
        required: ['reportingMonth', 'status'],
        properties: {
          reportingMonth: { type: 'string', pattern: '^\\d{4}-\\d{2}$', description: 'YYYY-MM format' },
          status: { type: 'string', enum: ['Draft', 'Submitted'], description: 'Report status' },

          // OPD Section
          opd: {
            type: 'object',
            properties: {
              equines: {
                type: 'object',
                properties: {
                  new: { type: 'integer', minimum: 0 },
                  old: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              bovine: {
                type: 'object',
                properties: {
                  new: { type: 'integer', minimum: 0 },
                  old: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              smallAnimals: {
                type: 'object',
                properties: {
                  new: { type: 'integer', minimum: 0 },
                  old: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              dogsCats: {
                type: 'object',
                properties: {
                  new: { type: 'integer', minimum: 0 },
                  old: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              gaushala: {
                type: 'object',
                properties: {
                  new: { type: 'integer', minimum: 0 },
                  old: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              poultryPets: {
                type: 'object',
                properties: {
                  new: { type: 'integer', minimum: 0 },
                  old: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              }
            }
          },

          // Certificates Section
          certificates: {
            type: 'object',
            properties: {
              healthCertificates: {
                type: 'object',
                properties: {
                  largeAnimals: { type: 'integer', minimum: 0 },
                  smallAnimals: { type: 'integer', minimum: 0 },
                  poultry: { type: 'integer', minimum: 0 },
                  dogs: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              postMortem: {
                type: 'object',
                properties: {
                  largeAnimals: { type: 'integer', minimum: 0 },
                  smallAnimals: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              vetroLegal: {
                type: 'object',
                properties: {
                  count: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              }
            }
          },

          // Lab Section
          lab: {
            type: 'object',
            properties: {
              bloodTest: {
                type: 'object',
                properties: {
                  count: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              milkTest: {
                type: 'object',
                properties: {
                  count: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              fecalTest: {
                type: 'object',
                properties: {
                  count: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              urineTest: {
                type: 'object',
                properties: {
                  count: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              xraysPets: {
                type: 'object',
                properties: {
                  count: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              ultrasound: {
                type: 'object',
                properties: {
                  count: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              },
              other: {
                type: 'object',
                properties: {
                  count: { type: 'integer', minimum: 0 },
                  beneficiaries: { type: 'integer', minimum: 0 }
                }
              }
            }
          },

          // Extension Activities Section
          extension: {
            type: 'object',
            properties: {
              farmerAwareness: {
                type: 'object',
                properties: {
                  camps: { type: 'integer', minimum: 0 },
                  villages: { type: 'integer', minimum: 0 },
                  farmersAttended: { type: 'integer', minimum: 0 },
                  animalsTreated: { type: 'integer', minimum: 0 }
                }
              },
              schoolLectures: {
                type: 'object',
                properties: {
                  lectures: { type: 'integer', minimum: 0 },
                  schools: { type: 'integer', minimum: 0 },
                  studentsAttended: { type: 'integer', minimum: 0 }
                }
              },
              farmerTraining: {
                type: 'object',
                properties: {
                  trainings: { type: 'integer', minimum: 0 },
                  locations: { type: 'integer', minimum: 0 },
                  farmersAttended: { type: 'integer', minimum: 0 }
                }
              },
              campaigns: {
                type: 'object',
                properties: {
                  campaigns: { type: 'integer', minimum: 0 },
                  locations: { type: 'integer', minimum: 0 },
                  participantsAttended: { type: 'integer', minimum: 0 },
                  animalsTreated: { type: 'integer', minimum: 0 }
                }
              }
            }
          },

          // AI Reports Section
          aiReports: {
            type: 'object',
            properties: {
              localSemen: {
                type: 'object',
                properties: {
                  hf: { $ref: 'BreedAIData#' },
                  jersey: { $ref: 'BreedAIData#' },
                  cb: { $ref: 'BreedAIData#' },
                  sahiwal: { $ref: 'BreedAIData#' }
                }
              },
              girSemen: {
                type: 'object',
                properties: {
                  gir: { $ref: 'BreedAIData#' },
                  gir2: { $ref: 'BreedAIData#' }
                }
              },
              ettImported: {
                type: 'object',
                properties: {
                  hfETT: { $ref: 'BreedAIData#' },
                  jerseyETT: { $ref: 'BreedAIData#' },
                  hfImp: { $ref: 'BreedAIData#' },
                  jerseyImp: { $ref: 'BreedAIData#' }
                }
              },
              sexedSemen: {
                type: 'object',
                properties: {
                  hfSexed: { $ref: 'BreedAIData#' },
                  jerseySexed: { $ref: 'BreedAIData#' },
                  cbSexed: { $ref: 'BreedAIData#' },
                  sahiwalSexed: { $ref: 'BreedAIData#' }
                }
              },
              buffaloes: {
                type: 'object',
                properties: {
                  murrah: { $ref: 'BreedAIData#' },
                  niliRavi: { $ref: 'BreedAIData#' },
                  surti: { $ref: 'BreedAIData#' },
                  jaffarabadi: { $ref: 'BreedAIData#' }
                }
              }
            }
          }
        }
      },
      response: {
        201: {
          description: 'Report saved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                reportId: { type: 'integer' },
                reportingMonth: { type: 'string' },
                status: { type: 'string' }
              }
            }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
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
  }, reportsController.submitReport)

  // GET /reports/fiscal-years - Get available fiscal years
  fastify.get('/fiscal-years', {
    
    preHandler: authenticate,
    schema: {
      description: 'Get available fiscal years based on reports',
      tags: ['Reports'],
      response: {
        200: {
          description: 'Fiscal years retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of fiscal years in YYYY-YY format (e.g., 2024-25)'
            }
          }
        }
      }
    }
  }, reportsController.getFiscalYears)

  // GET /reports/monthly - List all monthly reports with filters
  fastify.get('/monthly', {
    
    preHandler: authenticate,
    schema: {
      description: 'List all monthly reports for the institute with optional filters',
      tags: ['Reports'],
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['all', 'submitted', 'draft', 'pending', 'rejected'],
            description: 'Filter by report status'
          },
          year: {
            type: 'string',
            pattern: '^\\d{4}$',
            description: 'Filter by calendar year (YYYY)'
          },
          fiscalYear: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}$',
            description: 'Filter by fiscal year (e.g., 2024-25 = April 2024 to March 2025)'
          }
        }
      },
      response: {
        200: {
          description: 'Reports retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  reportId: { type: 'number' },
                  month: { type: 'string' },
                  reportingMonth: { type: 'string' },
                  status: { type: 'string' },
                  submittedAt: { type: ['string', 'null'] },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            },
            count: { type: 'number' }
          }
        }
      }
    }
  }, reportsController.listReports)

  // GET /reports/monthly/:month - Get monthly report for specific month
  fastify.get('/monthly/:month', {
    
    preHandler: authenticate,
    schema: {
      description: 'Get monthly report for a specific month',
      tags: ['Reports'],
      params: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$', description: 'YYYY-MM format' }
        }
      },
      response: {
        200: {
          description: 'Report retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              additionalProperties: true
            }
          }
        },
        404: {
          description: 'Report not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, reportsController.getReport)

  // GET /reports/monthly/:month/pdf - Download monthly report as PDF
  fastify.get('/monthly/:month/pdf', {
    preHandler: authenticate,
    schema: {
      description: 'Download monthly report as PDF (matches official report template)',
      tags: ['Reports'],
      params: {
        type: 'object',
        required: ['month'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$', description: 'YYYY-MM format' }
        }
      },
      response: {
        200: { description: 'PDF file', type: 'string', format: 'binary' },
        404: {
          type: 'object',
          properties: { success: { type: 'boolean' }, message: { type: 'string' } }
        }
      }
    }
  }, reportsController.downloadReportPDF)

  // PATCH /reports/monthly/:month/approve
  fastify.patch('/monthly/:month/approve', {
    preHandler: [authenticate, requireAdminRole],
    schema: {
      description: 'Approve a submitted monthly report (Tehsil_Admin and above)',
      tags: ['Reports'],
      params: {
        type: 'object',
        required: ['month'],
        properties: { month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } }
      },
      body: {
        type: 'object',
        required: ['instituteId'],
        properties: { instituteId: { type: 'integer', description: 'Institute that submitted the report' } }
      }
    }
  }, reportsController.approveReport)

  // PATCH /reports/monthly/:month/reject
  fastify.patch('/monthly/:month/reject', {
    preHandler: [authenticate, requireAdminRole],
    schema: {
      description: 'Reject / return a submitted monthly report for revision (Tehsil_Admin and above)',
      tags: ['Reports'],
      params: {
        type: 'object',
        required: ['month'],
        properties: { month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } }
      },
      body: {
        type: 'object',
        required: ['instituteId', 'reason'],
        properties: {
          instituteId: { type: 'integer' },
          reason: { type: 'string', minLength: 5, maxLength: 1000, description: 'Reason for rejection / revision request' }
        }
      }
    }
  }, reportsController.rejectReport)
}

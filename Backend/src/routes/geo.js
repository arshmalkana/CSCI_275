import * as geoController from '../controllers/geoController.js'

/**
 * Geography routes
 * Hierarchical endpoints for Punjab geography data
 */
export default async function geoRoutes(fastify) {
  // GET /geo/districts - Get all districts
  fastify.get('/districts', {
    schema: {
      description: 'Get all districts in Punjab',
      tags: ['Geography'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                stateName: { type: 'string' },
                districts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      districtId: { type: 'integer' },
                      districtName: { type: 'string' },
                      stateName: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, geoController.getDistricts)

  // GET /geo/:districtName/tehsils - Get tehsils in a district
  fastify.get('/:districtName/tehsils', {
    schema: {
      description: 'Get all tehsils in a specific district',
      tags: ['Geography'],
      params: {
        type: 'object',
        required: ['districtName'],
        properties: {
          districtName: {
            type: 'string',
            description: 'Name of the district (e.g., "Hoshiarpur")'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                districtName: { type: 'string' },
                stateName: { type: 'string' },
                tehsils: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tehsilId: { type: 'integer' },
                      tehsilName: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, geoController.getTehsils)

  // GET /geo/:districtName/:tehsilName/villages - Get villages in a tehsil
  fastify.get('/:districtName/:tehsilName/villages', {
    schema: {
      description: 'Get all villages in a specific tehsil',
      tags: ['Geography'],
      params: {
        type: 'object',
        required: ['districtName', 'tehsilName'],
        properties: {
          districtName: {
            type: 'string',
            description: 'Name of the district'
          },
          tehsilName: {
            type: 'string',
            description: 'Name of the tehsil'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                districtName: { type: 'string' },
                tehsilName: { type: 'string' },
                stateName: { type: 'string' },
                villages: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      villageId: { type: 'integer' },
                      villageName: { type: 'string' },
                      pincode: { type: ['string', 'null'] },
                      latitude: { type: ['number', 'null'] },
                      longitude: { type: ['number', 'null'] },
                      population: {
                        type: 'object',
                        properties: {
                          human: { type: 'integer' },
                          equine: { type: 'integer' },
                          buffaloes: { type: 'integer' },
                          cows: { type: 'integer' },
                          pigs: { type: 'integer' },
                          goat: { type: 'integer' },
                          sheep: { type: 'integer' },
                          poultryLayers: { type: 'integer' },
                          poultryBroilers: { type: 'integer' },
                          dogs: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, geoController.getVillages)

  // GET /geo/search/villages - Search villages
  fastify.get('/search/villages', {
    schema: {
      description: 'Search villages by name (autocomplete)',
      tags: ['Geography'],
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: {
            type: 'string',
            description: 'Search query (minimum 2 characters)',
            minLength: 2
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of results',
            default: 20,
            minimum: 1,
            maximum: 100
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                count: { type: 'integer' },
                villages: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      villageId: { type: 'integer' },
                      villageName: { type: 'string' },
                      tehsilName: { type: 'string' },
                      districtName: { type: 'string' },
                      stateName: { type: 'string' },
                      fullPath: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, geoController.searchVillages)

  // GET /geo/hierarchy - Get complete hierarchy (for caching)
  fastify.get('/hierarchy', {
    schema: {
      description: 'Get complete geography hierarchy (districts and tehsils only)',
      tags: ['Geography'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                stateName: { type: 'string' },
                districts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      districtId: { type: 'integer' },
                      districtName: { type: 'string' },
                      stateName: { type: 'string' },
                      tehsils: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            tehsilId: { type: 'integer' },
                            tehsilName: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, geoController.getHierarchy)

  // GET /geo/parent-institutes - Get eligible parent institutes based on type and location
  fastify.get('/parent-institutes', {
    schema: {
      description: 'Get eligible parent/reporting institutes based on institute type and location',
      tags: ['Geography'],
      querystring: {
        type: 'object',
        required: ['district', 'tehsil', 'instituteType'],
        properties: {
          district: { type: 'string', description: 'District name' },
          tehsil: { type: 'string', description: 'Tehsil name' },
          instituteType: {
            type: 'string',
            enum: ['PAIW', 'CVD', 'CVH', 'CVH_Lab', 'Semen_Cluster'],
            description: 'Type of institute being registered'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                institutes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      instituteId: { type: 'integer' },
                      instituteName: { type: 'string' },
                      instituteType: { type: 'string' },
                      villageName: { type: 'string' },
                      tehsilName: { type: 'string' },
                      districtName: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, geoController.getParentInstitutes)
}

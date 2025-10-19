import * as geoService from '../services/geoService.js'

/**
 * GET /geo/districts
 * Get all districts in Punjab
 */
export async function getDistricts(request, reply) {
  try {
    const districts = await geoService.getAllDistricts()

    return reply.code(200).send({
      success: true,
      data: {
        stateName: 'Punjab',
        districts
      }
    })
  } catch (error) {
    request.log.error('Get districts error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to fetch districts'
    })
  }
}

/**
 * GET /geo/:districtName/tehsils
 * Get all tehsils in a specific district
 */
export async function getTehsils(request, reply) {
  try {
    const { districtName } = request.params

    const result = await geoService.getTehsilsByDistrict(districtName)

    if (!result) {
      return reply.code(404).send({
        success: false,
        message: `District '${districtName}' not found`
      })
    }

    return reply.code(200).send({
      success: true,
      data: result
    })
  } catch (error) {
    request.log.error('Get tehsils error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to fetch tehsils'
    })
  }
}

/**
 * GET /geo/:districtName/:tehsilName/villages
 * Get all villages in a specific tehsil
 */
export async function getVillages(request, reply) {
  try {
    const { districtName, tehsilName } = request.params

    const result = await geoService.getVillagesByTehsil(districtName, tehsilName)

    if (!result) {
      return reply.code(404).send({
        success: false,
        message: `Tehsil '${tehsilName}' in district '${districtName}' not found`
      })
    }

    return reply.code(200).send({
      success: true,
      data: result
    })
  } catch (error) {
    request.log.error('Get villages error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to fetch villages'
    })
  }
}

/**
 * GET /geo/search/villages?q=searchTerm&limit=20
 * Search villages by name
 */
export async function searchVillages(request, reply) {
  try {
    const { q, limit = 20 } = request.query

    if (!q || q.trim().length < 2) {
      return reply.code(400).send({
        success: false,
        message: 'Search query must be at least 2 characters'
      })
    }

    const villages = await geoService.searchVillages(q, parseInt(limit))

    return reply.code(200).send({
      success: true,
      data: {
        query: q,
        count: villages.length,
        villages
      }
    })
  } catch (error) {
    request.log.error('Search villages error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to search villages'
    })
  }
}

/**
 * GET /geo/hierarchy
 * Get complete geography hierarchy (districts and tehsils only, no villages)
 * This is useful for initial app load and caching
 */
export async function getHierarchy(request, reply) {
  try {
    const hierarchy = await geoService.getGeographyHierarchy()

    return reply.code(200).send({
      success: true,
      data: hierarchy
    })
  } catch (error) {
    request.log.error('Get hierarchy error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to fetch geography hierarchy'
    })
  }
}

/**
 * GET /geo/parent-institutes?district=X&tehsil=Y&instituteType=Z
 * Get eligible parent/reporting institutes based on type and location
 */
export async function getParentInstitutes(request, reply) {
  try {
    const { district, tehsil, instituteType } = request.query

    const institutes = await geoService.getEligibleParentInstitutes(
      district,
      tehsil,
      instituteType
    )

    return reply.code(200).send({
      success: true,
      data: {
        institutes
      }
    })
  } catch (error) {
    request.log.error('Get parent institutes error:', error)
    return reply.code(500).send({
      success: false,
      message: 'Failed to fetch parent institutes'
    })
  }
}

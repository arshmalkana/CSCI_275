// src/controllers/homeController.js
import * as homeService from '../services/homeService.js'

/**
 * Get homepage data for the authenticated user
 * Returns institute info, staff, villages, stats, and reporting status
 */
export async function getHomeData(request, reply) {
  try {
    // Get user info from JWT (set by authenticate middleware)
    const { userId } = request.user

    if (!userId) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'User ID not found in token'
      })
    }

    // Fetch comprehensive homepage data
    const homeData = await homeService.getHomeDataByUserId(userId)

    if (!homeData) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Institute or staff data not found for this user'
      })
    }

    return reply.code(200).send({
      success: true,
      data: homeData
    })

  } catch (error) {
    request.log.error('Error fetching home data:', error)
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to fetch homepage data'
    })
  }
}

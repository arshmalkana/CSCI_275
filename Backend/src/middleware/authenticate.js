// src/middleware/authenticate.js
import jwtUtils from '../utils/jwt.js'

/**
 * JWT Authentication Middleware
 * Verifies the access token and attaches user data to request
 */
export async function authenticate(request, reply) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        message: 'Access token required'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const payload = jwtUtils.verifyAccessToken(token)

    if (!payload) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid or expired token'
      })
    }

    // Attach user data to request for use in route handlers
    request.user = {
      staffId: payload.staffId,
      userId: payload.userId,
      role: payload.role,
      designation: payload.designation
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return reply.code(401).send({
      success: false,
      message: 'Authentication failed'
    })
  }
}
// src/middleware/authenticate.js
import jwtUtils from '../utils/jwt.js'
import { query } from '../database/db.js'

/**
 * JWT Authentication Middleware
 * Verifies the access token, attaches user data to request, and issues a new token
 * Rolling token approach: each request gets a fresh token
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

    // Verify the account is still active in the DB (catches deactivation between JWT issuance)
    const activeCheck = await query('SELECT is_active FROM staff WHERE staff_id = $1', [payload.staffId])
    if (!activeCheck.rows[0]?.is_active) {
      return reply.code(401).send({ success: false, message: 'Account is inactive' })
    }

    // Attach user data to request for use in route handlers
    request.user = {
      staffId: payload.staffId,
      userId: payload.userId,
      role: payload.role,
      designation: payload.designation,
      instituteId: payload.instituteId
    }

    // Generate new access token (rolling token approach)
    const newAccessToken = jwtUtils.generateAccessToken({
      staffId: payload.staffId,
      userId: payload.userId,
      role: payload.role,
      designation: payload.designation,
      instituteId: payload.instituteId
    })

    // Add new token to response header
    reply.header('X-New-Token', newAccessToken)

  } catch (error) {
    request.log.error('Authentication error:', error)
    return reply.code(401).send({
      success: false,
      message: 'Authentication failed'
    })
  }
}
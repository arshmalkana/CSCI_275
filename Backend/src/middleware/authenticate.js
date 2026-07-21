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

    // Re-read the live identity from the DB on every request. This is the
    // authorization source of truth — the JWT payload is only a claim.
    //   - is_active   : catches deactivation between token issuance and use
    //   - user_role / current_institute_id / designation : catch role changes and
    //     transfers so RBAC scope is NEVER stale (fixes B1)
    //   - has_session : an unrevoked, unexpired refresh-token session must exist
    //     for the rolling token to keep renewing (bounds a stolen access token to
    //     one token lifetime after logout/revocation) (fixes B2)
    const identity = await query(
      `SELECT s.is_active,
              s.user_role,
              s.current_institute_id,
              s.designation,
              EXISTS (
                SELECT 1 FROM refresh_tokens rt
                WHERE rt.staff_id = s.staff_id
                  AND rt.is_revoked = FALSE
                  AND rt.expires_at > NOW()
              ) AS has_session
       FROM staff s
       WHERE s.staff_id = $1`,
      [payload.staffId]
    )

    const row = identity.rows[0]
    if (!row?.is_active) {
      return reply.code(401).send({ success: false, message: 'Account is inactive' })
    }

    // Attach FRESH user data (not the possibly-stale token claims) to the request
    request.user = {
      staffId: payload.staffId,
      userId: payload.userId,
      role: row.user_role,
      designation: row.designation,
      instituteId: row.current_institute_id
    }

    // Rolling token: re-issue a fresh access token carrying the fresh identity,
    // but ONLY while a valid session exists. Once the session is revoked/expired,
    // the current token stops rolling and expires on its own (≤ its TTL).
    if (row.has_session) {
      const newAccessToken = jwtUtils.generateAccessToken({
        staffId: payload.staffId,
        userId: payload.userId,
        role: row.user_role,
        designation: row.designation,
        instituteId: row.current_institute_id
      })
      reply.header('X-New-Token', newAccessToken)
    }

  } catch (error) {
    request.log.error('Authentication error:', error)
    return reply.code(401).send({
      success: false,
      message: 'Authentication failed'
    })
  }
}
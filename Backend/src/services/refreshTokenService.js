// src/services/refreshTokenService.js
import crypto from 'crypto'
import { query } from '../database/db.js'

const refreshTokenService = {
  /**
   * Hash a refresh token using SHA256
   * @param {String} token - The refresh token
   * @returns {String} SHA256 hash
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex')
  },

  /**
   * Parse User-Agent to extract device information
   * @param {String} userAgent - User-Agent header
   * @returns {String} Human-readable device name
   */
  parseDeviceName(userAgent) {
    if (!userAgent) return 'Unknown Device'

    let device = ''
    let browser = ''

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome'
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge'
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari'
    }

    // Detect device/OS
    if (userAgent.includes('iPhone')) {
      device = 'iPhone'
    } else if (userAgent.includes('iPad')) {
      device = 'iPad'
    } else if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) {
      device = 'Mac'
    } else if (userAgent.includes('Windows NT 10.0')) {
      device = 'Windows PC'
    } else if (userAgent.includes('Windows NT')) {
      device = 'Windows PC'
    } else if (userAgent.includes('Android')) {
      const androidMatch = userAgent.match(/Android.*;\s*([^)]+)\)/)
      if (androidMatch && androidMatch[1]) {
        device = androidMatch[1].trim()
      } else {
        device = 'Android Device'
      }
    } else if (userAgent.includes('Linux')) {
      device = 'Linux PC'
    }

    // Construct device name
    if (device && browser) {
      return `${device} (${browser})`
    } else if (device) {
      return device
    } else if (browser) {
      return `${browser} Browser`
    }

    return 'Unknown Device'
  },

  /**
   * Store a refresh token in the database
   * @param {Object} params - Token parameters
   * @param {Number} params.expiresIn - Optional expiry time in milliseconds (defaults to 7 days)
   * @returns {Promise<Object>} Created token record
   */
  async storeToken({ token, staffId, userAgent, ipAddress, expiresIn }) {
    const tokenHash = this.hashToken(token)
    const deviceName = this.parseDeviceName(userAgent)
    // Use provided expiresIn or default to 7 days
    const expiry = expiresIn || 7 * 24 * 60 * 60 * 1000
    const expiresAt = new Date(Date.now() + expiry)

    const sql = `
      INSERT INTO refresh_tokens (token_hash, staff_id, device_info, ip_address, device_name, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING token_id, created_at
    `

    const result = await query(sql, [
      tokenHash,
      staffId,
      userAgent,
      ipAddress,
      deviceName,
      expiresAt
    ])

    return result.rows[0]
  },

  /**
   * Verify a refresh token exists and is valid
   * @param {String} token - The refresh token
   * @returns {Promise<Object|null>} Token record or null
   */
  async verifyToken(token) {
    const tokenHash = this.hashToken(token)

    const sql = `
      SELECT rt.*, s.user_id, s.full_name
      FROM refresh_tokens rt
      JOIN staff s ON rt.staff_id = s.staff_id
      WHERE rt.token_hash = $1
        AND rt.expires_at > CURRENT_TIMESTAMP
        AND rt.is_revoked = FALSE
    `

    const result = await query(sql, [tokenHash])
    return result.rows.length > 0 ? result.rows[0] : null
  },

  /**
   * Update last used timestamp for a token
   * @param {String} token - The refresh token
   */
  async updateLastUsed(token) {
    const tokenHash = this.hashToken(token)

    await query(
      'UPDATE refresh_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = $1',
      [tokenHash]
    )
  },

  /**
   * Revoke a specific refresh token
   * @param {String} token - The refresh token to revoke
   * @param {String} reason - Reason for revocation
   */
  async revokeToken(token, reason = 'User logged out') {
    const tokenHash = this.hashToken(token)

    await query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = CURRENT_TIMESTAMP, revoked_reason = $2
       WHERE token_hash = $1`,
      [tokenHash, reason]
    )
  },

  /**
   * Revoke a token by token_id (for session management)
   * @param {Number} tokenId - The token_id
   * @param {Number} staffId - Staff ID (for authorization)
   * @param {String} reason - Reason for revocation
   * @returns {Promise<Boolean>} Success
   */
  async revokeTokenById(tokenId, staffId, reason = 'Revoked by user') {
    const result = await query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = CURRENT_TIMESTAMP, revoked_reason = $3
       WHERE token_id = $1 AND staff_id = $2`,
      [tokenId, staffId, reason]
    )

    return result.rowCount > 0
  },

  /**
   * Revoke all tokens for a user (force logout everywhere)
   * @param {Number} staffId - Staff ID
   * @param {String} reason - Reason for revocation
   */
  async revokeAllUserTokens(staffId, reason = 'Logout from all devices') {
    await query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = CURRENT_TIMESTAMP, revoked_reason = $2
       WHERE staff_id = $1 AND is_revoked = FALSE`,
      [staffId, reason]
    )
  },

  /**
   * Revoke all tokens except the current one (logout from other devices)
   * @param {Number} staffId - Staff ID
   * @param {String} currentToken - Current refresh token to keep active
   * @param {String} reason - Reason for revocation
   */
  async revokeAllOtherTokens(staffId, currentToken, reason = 'Logout from all other devices') {
    const currentTokenHash = this.hashToken(currentToken)

    await query(
      `UPDATE refresh_tokens
       SET is_revoked = TRUE, revoked_at = CURRENT_TIMESTAMP, revoked_reason = $3
       WHERE staff_id = $1 AND token_hash != $2 AND is_revoked = FALSE`,
      [staffId, currentTokenHash, reason]
    )
  },

  /**
   * Get all active sessions for a user
   * @param {Number} staffId - Staff ID
   * @param {String} currentTokenHash - Hash of current token (to mark as current)
   * @returns {Promise<Array>} Active sessions
   */
  async getUserSessions(staffId, currentTokenHash = null) {
    const sql = `
      SELECT
        token_id,
        device_name,
        device_info,
        ip_address,
        created_at,
        last_used_at,
        expires_at,
        CASE WHEN token_hash = $2 THEN TRUE ELSE FALSE END as is_current
      FROM refresh_tokens
      WHERE staff_id = $1
        AND expires_at > CURRENT_TIMESTAMP
        AND is_revoked = FALSE
      ORDER BY is_current DESC, last_used_at DESC
    `

    const result = await query(sql, [staffId, currentTokenHash])
    return result.rows
  },

  /**
   * Clean up expired and revoked tokens
   */
  async cleanupExpiredTokens() {
    await query('SELECT cleanup_expired_refresh_tokens()')
  }
}

export default refreshTokenService
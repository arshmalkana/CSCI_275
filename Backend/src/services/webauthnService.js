// src/services/webauthnService.js
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server'
import { query } from '../database/db.js'
import { WebAuthnError, NotFoundError, ValidationError } from '../utils/errors.js'

// Relying Party (RP) configuration
const RP_NAME = process.env.RP_NAME || 'AH Punjab Reporting'
const RP_ID = process.env.RP_ID || 'localhost'
const RP_ORIGIN = process.env.RP_ORIGIN || 'http://localhost:3000'

// Challenge storage now uses database (see webauthn_challenges table)
// Removed in-memory Map for security and scalability

const webauthnService = {
  /**
   * Store challenge in database
   * @param {String} challengeKey - Unique key for challenge
   * @param {String} challenge - Challenge string
   * @param {Number} staffId - Staff ID (optional)
   * @param {String} challengeType - 'registration' or 'authentication'
   * @param {Number} expiryMinutes - Expiry time in minutes
   * @param {String} ipAddress - Client IP address
   * @param {String} userAgent - Client user agent
   */
  async storeChallenge(challengeKey, challenge, staffId, challengeType, expiryMinutes, ipAddress = null, userAgent = null) {
    try {
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

      await query(
        `INSERT INTO webauthn_challenges
         (challenge_key, challenge, staff_id, challenge_type, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (challenge_key)
         DO UPDATE SET
           challenge = EXCLUDED.challenge,
           expires_at = EXCLUDED.expires_at,
           ip_address = EXCLUDED.ip_address,
           user_agent = EXCLUDED.user_agent`,
        [challengeKey, challenge, staffId, challengeType, expiresAt, ipAddress, userAgent]
      )
    } catch (error) {
      throw new WebAuthnError(`Failed to store challenge: ${error.message}`)
    }
  },

  /**
   * Get challenge from database
   * @param {String} challengeKey - Unique key for challenge
   * @returns {Object|null} Challenge data or null if not found/expired
   */
  async getChallenge(challengeKey) {
    try {
      const result = await query(
        `SELECT challenge, staff_id, expires_at
         FROM webauthn_challenges
         WHERE challenge_key = $1 AND expires_at > NOW()`,
        [challengeKey]
      )

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0]
    } catch (error) {
      throw new WebAuthnError(`Failed to retrieve challenge: ${error.message}`)
    }
  },

  /**
   * Delete challenge from database
   * @param {String} challengeKey - Unique key for challenge
   */
  async deleteChallenge(challengeKey) {
    try {
      await query(
        'DELETE FROM webauthn_challenges WHERE challenge_key = $1',
        [challengeKey]
      )
    } catch (error) {
      // Don't throw on delete errors, just log
      console.error('Failed to delete challenge:', error)
    }
  },

  /**
   * Cleanup expired challenges (called periodically)
   * @returns {Number} Number of challenges deleted
   */
  async cleanupExpiredChallenges() {
    try {
      const result = await query(
        'DELETE FROM webauthn_challenges WHERE expires_at < NOW()'
      )
      return result.rowCount
    } catch (error) {
      console.error('Failed to cleanup expired challenges:', error)
      return 0
    }
  },

  /**
   * Generate registration options for a new passkey
   * @param {Object} user - User object with staff_id, user_id, full_name
   * @param {String} ipAddress - Client IP address
   * @param {String} userAgent - Client user agent
   * @returns {Object} Registration options to send to browser
   */
  async generateRegistrationOptions(user, ipAddress = null, userAgent = null) {
    // Validate user object
    if (!user || !user.staff_id) {
      throw new ValidationError('Invalid user object: staff_id is required', 'staff_id')
    }

    // Get existing credentials for this user
    const existingCredentials = await this.getUserCredentials(user.staff_id)

    // Convert staff_id to Uint8Array (required by @simplewebauthn/server v10+)
    const userIdBuffer = Buffer.from(String(user.staff_id), 'utf-8')

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new Uint8Array(userIdBuffer),
      userName: user.user_id,
      userDisplayName: user.full_name,
      // Timeout after 5 minutes
      timeout: 300000,
      // Prefer platform authenticators (Face ID, Windows Hello)
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      },
      // Exclude already registered credentials
      excludeCredentials: existingCredentials.map(cred => ({
        id: cred.credential_id,
        type: 'public-key',
        transports: cred.transports || []
      })),
      // Request attestation for authenticator info
      attestationType: 'none'
    })

    // Store challenge in database (expires in 5 minutes)
    await this.storeChallenge(
      String(user.staff_id),
      options.challenge,
      user.staff_id,
      'registration',
      5,
      ipAddress,
      userAgent
    )

    return options
  },

  /**
   * Verify registration response and save credential
   * @param {Number} staffId - User's staff ID
   * @param {Object} response - Registration response from browser
   * @param {String} deviceName - Optional device name
   * @param {String} userAgent - User-Agent header from request
   * @returns {Object} Verification result
   */
  async verifyRegistration(staffId, response, deviceName = null, userAgent = '') {
    // Get stored challenge from database
    const storedChallenge = await this.getChallenge(String(staffId))

    if (!storedChallenge) {
      throw new WebAuthnError('Challenge not found or expired', 'registration')
    }

    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: RP_ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: false
      })

      if (!verification.verified) {
        throw new WebAuthnError('Registration verification failed', 'registration')
      }

      const { registrationInfo } = verification

      const {
        credential,
        credentialID,
        credentialPublicKey,
        counter,
        aaguid,
        credentialDeviceType,
        credentialBackedUp
      } = registrationInfo

      // Auto-generate device name if not provided
      const finalDeviceName = deviceName || this.generateDeviceName(response, userAgent)

      // Handle both old and new @simplewebauthn API versions
      const finalCredentialID = credentialID || credential?.id
      const finalCredentialPublicKey = credentialPublicKey || credential?.publicKey
      const finalCounter = counter ?? credential?.counter ?? 0

      if (!finalCredentialID || !finalCredentialPublicKey) {
        throw new WebAuthnError('Invalid credential data received', 'registration')
      }

      // Convert aaguid to hex (handle undefined case)
      const aaguidHex = aaguid ? Buffer.from(aaguid).toString('hex') : null

      // Save credential to database
      await this.saveCredential({
        credentialId: Buffer.from(finalCredentialID).toString('base64url'),
        staffId,
        publicKey: Buffer.from(finalCredentialPublicKey).toString('base64url'),
        counter: finalCounter,
        deviceName: finalDeviceName,
        aaguid: aaguidHex,
        credentialDeviceType,
        transports: response.response.transports || []
      })

      // Update staff passkey_enabled flag
      await query(
        'UPDATE staff SET passkey_enabled = true WHERE staff_id = $1',
        [staffId]
      )

      // Clear challenge from database
      await this.deleteChallenge(String(staffId))

      return {
        verified: true,
        credentialId: Buffer.from(finalCredentialID).toString('base64url'),
        deviceName: finalDeviceName
      }
    } catch (error) {
      // Clear challenge on error
      await this.deleteChallenge(String(staffId))
      throw error
    }
  },

  /**
   * Generate authentication options for passkey login
   * @param {String} userId - User's login username
   * @param {String} ipAddress - Client IP address
   * @param {String} userAgent - Client user agent
   * @returns {Object} Authentication options
   */
  async generateAuthenticationOptions(userId, ipAddress = null, userAgent = null) {
    // Find user by user_id (case-insensitive)
    const userResult = await query(
      'SELECT staff_id FROM staff WHERE LOWER(user_id) = LOWER($1) AND is_active = true',
      [userId]
    )

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User', userId)
    }

    const staffId = userResult.rows[0].staff_id

    // Get user's credentials
    const credentials = await this.getUserCredentials(staffId)

    if (credentials.length === 0) {
      throw new WebAuthnError('No passkeys registered for this user', 'authentication')
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      timeout: 60000,
      allowCredentials: credentials.map(cred => ({
        id: cred.credential_id,
        type: 'public-key',
        transports: cred.transports || []
      })),
      userVerification: 'preferred'
    })

    // Store challenge in database with username prefix (expires in 1 minute)
    await this.storeChallenge(
      `auth_${userId}`,
      options.challenge,
      staffId,
      'authentication',
      1,
      ipAddress,
      userAgent
    )

    return options
  },

  /**
   * Verify authentication response
   * @param {String} userId - User's login username
   * @param {Object} response - Authentication response from browser
   * @returns {Object} User data if verified
   */
  async verifyAuthentication(userId, response) {
    // Get stored challenge from database
    const storedChallenge = await this.getChallenge(`auth_${userId}`)

    if (!storedChallenge) {
      throw new WebAuthnError('Challenge not found or expired', 'authentication')
    }

    try {
      // Get credential from database
      const credResult = await query(
        `SELECT wc.*, s.user_id, s.full_name, s.user_role, s.designation,
                s.current_institute_id, s.is_first_time, s.mobile, s.email,
                i.institute_name, i.institute_type,
                d.district_name, t.tehsil_name
         FROM webauthn_credentials wc
         JOIN staff s ON wc.staff_id = s.staff_id
         LEFT JOIN institutes i ON s.current_institute_id = i.institute_id
         LEFT JOIN districts d ON i.district_id = d.district_id
         LEFT JOIN tehsils t ON i.tehsil_id = t.tehsil_id
         WHERE wc.credential_id = $1 AND s.is_active = true`,
        [response.id]
      )

      if (credResult.rows.length === 0) {
        throw new NotFoundError('Credential', response.id)
      }

      const cred = credResult.rows[0]

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: RP_ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: cred.credential_id,
          publicKey: Buffer.from(cred.public_key, 'base64url'),
          counter: parseInt(cred.counter, 10) || 0,
          transports: cred.transports || undefined,
        },
        requireUserVerification: false
      })

      if (!verification.verified) {
        throw new WebAuthnError('Authentication verification failed', 'authentication')
      }

      // Update counter and last_used_at
      await query(
        `UPDATE webauthn_credentials
         SET counter = $1, last_used_at = CURRENT_TIMESTAMP
         WHERE credential_id = $2`,
        [verification.authenticationInfo.newCounter, cred.credential_id]
      )

      // Clear challenge from database
      await this.deleteChallenge(`auth_${userId}`)

      // Return user data (same format as password login)
      return {
        staff_id: cred.staff_id,
        user_id: cred.user_id,
        full_name: cred.full_name,
        user_role: cred.user_role,
        designation: cred.designation,
        current_institute_id: cred.current_institute_id,
        is_first_time: cred.is_first_time,
        mobile: cred.mobile,
        email: cred.email,
        institute_name: cred.institute_name,
        institute_type: cred.institute_type,
        district_name: cred.district_name,
        tehsil_name: cred.tehsil_name
      }
    } catch (error) {
      // Clear challenge on error
      await this.deleteChallenge(`auth_${userId}`)
      throw error
    }
  },

  /**
   * Get all credentials for a user
   * @param {Number} staffId - User's staff ID
   * @returns {Array} List of credentials
   */
  async getUserCredentials(staffId) {
    const result = await query(
      `SELECT credential_id, device_name, transports, created_at, last_used_at
       FROM webauthn_credentials
       WHERE staff_id = $1
       ORDER BY created_at DESC`,
      [staffId]
    )
    return result.rows
  },

  /**
   * Delete a credential
   * @param {String} credentialId - Credential ID to delete
   * @param {Number} staffId - User's staff ID (for authorization)
   * @returns {Boolean} Success
   */
  async deleteCredential(credentialId, staffId) {
    const result = await query(
      'DELETE FROM webauthn_credentials WHERE credential_id = $1 AND staff_id = $2',
      [credentialId, staffId]
    )

    // If user has no more credentials, set passkey_enabled to false
    const remaining = await query(
      'SELECT COUNT(*) FROM webauthn_credentials WHERE staff_id = $1',
      [staffId]
    )

    if (parseInt(remaining.rows[0].count) === 0) {
      await query(
        'UPDATE staff SET passkey_enabled = false WHERE staff_id = $1',
        [staffId]
      )
    }

    return result.rowCount > 0
  },

  /**
   * Save credential to database
   * @param {Object} credential - Credential data
   */
  async saveCredential(credential) {
    await query(
      `INSERT INTO webauthn_credentials
       (credential_id, staff_id, public_key, counter, device_name, aaguid,
        credential_device_type, transports)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        credential.credentialId,
        credential.staffId,
        credential.publicKey,
        credential.counter,
        credential.deviceName,
        credential.aaguid,
        credential.credentialDeviceType,
        credential.transports
      ]
    )
  },

  /**
   * Generate device name from user agent
   * @param {Object} response - Registration response
   * @param {String} userAgent - User-Agent header from request
   * @returns {String} Device name
   */
  generateDeviceName(response, userAgent = '') {
    const transports = response.response.transports || []

    if (transports.includes('internal')) {
      // Platform authenticator - parse user agent to detect device
      return this.parseUserAgent(userAgent)
    } else if (transports.includes('usb')) {
      return 'Security Key (USB)'
    } else if (transports.includes('nfc')) {
      return 'Security Key (NFC)'
    } else if (transports.includes('ble')) {
      return 'Security Key (Bluetooth)'
    }

    return 'Unknown Device'
  },

  /**
   * Parse User-Agent to extract device and browser info
   * @param {String} userAgent - User-Agent header
   * @returns {String} Formatted device name
   */
  parseUserAgent(userAgent) {
    if (!userAgent) return 'This Device'

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
      // Try to extract device model
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

    return 'This Device'
  }
}

export default webauthnService

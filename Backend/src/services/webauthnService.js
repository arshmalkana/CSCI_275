// src/services/webauthnService.js
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server'
import { query } from '../database/db.js'

// Relying Party (RP) configuration
const RP_NAME = process.env.RP_NAME || 'AH Punjab Reporting'
const RP_ID = process.env.RP_ID || 'ahpunjabdev.itsarsh.dev'
const RP_ORIGIN = process.env.RP_ORIGIN || 'https://ahpunjabdev.itsarsh.dev'

// Temporary storage for challenges (in production, use Redis)
const challengeStore = new Map()

const webauthnService = {
  /**
   * Generate registration options for a new passkey
   * @param {Object} user - User object with staff_id, user_id, full_name
   * @returns {Object} Registration options to send to browser
   */
  async generateRegistrationOptions(user) {
    // Validate user object
    if (!user || !user.staff_id) {
      throw new Error('Invalid user object: staff_id is required')
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
      excludeCredentials: existingCredentials.map(cred => {
        // credential_id is already base64url string, convert to Uint8Array
        // const idBuffer = Buffer.from(cred.credential_id, 'base64url')
        return {
          // id: new Uint8Array(idBuffer),
          id: cred.credential_id,
          type: 'public-key',
          transports: cred.transports || []
        }
      }),
      // Request attestation for authenticator info
      attestationType: 'none'
    })

    // Store challenge temporarily (expires in 5 minutes)
    challengeStore.set(user.staff_id, {
      challenge: options.challenge,
      timestamp: Date.now()
    })

    return options
  },

  /**
   * Verify registration response and save credential
   * @param {Number} staffId - User's staff ID
   * @param {Object} response - Registration response from browser
   * @param {String} deviceName - Optional device name
   * @returns {Object} Verification result
   */
  async verifyRegistration(staffId, response, deviceName = null) {
    // Get stored challenge
    const storedChallenge = challengeStore.get(staffId)
    if (!storedChallenge) {
      throw new Error('Challenge not found or expired')
    }

    // Check if challenge expired (5 minutes)
    if (Date.now() - storedChallenge.timestamp > 300000) {
      challengeStore.delete(staffId)
      throw new Error('Challenge expired')
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
        throw new Error('Registration verification failed')
      }

      console.log('Verification response:', JSON.stringify(verification, null, 2))

      const { registrationInfo } = verification

      console.log('Registration info:', JSON.stringify(registrationInfo, null, 2))

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
      const finalDeviceName = deviceName || this.generateDeviceName(response)

      // Handle both old and new @simplewebauthn API versions
      const finalCredentialID = credentialID || credential?.id
      const finalCredentialPublicKey = credentialPublicKey || credential?.publicKey
      const finalCounter = counter ?? credential?.counter ?? 0

      if (!finalCredentialID || !finalCredentialPublicKey) {
        console.error('Missing credential data:', { credentialID, credential })
        throw new Error('Invalid credential data received')
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

      // Clear challenge
      challengeStore.delete(staffId)

      return {
        verified: true,
        credentialId: Buffer.from(finalCredentialID).toString('base64url'),
        deviceName: finalDeviceName
      }
    } catch (error) {
      challengeStore.delete(staffId)
      throw error
    }
  },

  /**
   * Generate authentication options for passkey login
   * @param {String} userId - User's login username
   * @returns {Object} Authentication options
   */
  async generateAuthenticationOptions(userId) {
    // Find user by user_id
    const userResult = await query(
      'SELECT staff_id FROM staff WHERE user_id = $1 AND is_active = true',
      [userId]
    )

    if (userResult.rows.length === 0) {
      throw new Error('User not found')
    }

    const staffId = userResult.rows[0].staff_id
    console.log("stafffffffffffffffffff  ", staffId)
    // Get user's credentials
    const credentials = await this.getUserCredentials(staffId)

    if (credentials.length === 0) {
      throw new Error('No passkeys registered for this user')
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

    // Store challenge with username (not staff_id since user isn't logged in yet)
    challengeStore.set(`auth_${userId}`, {
      challenge: options.challenge,
      staffId,
      timestamp: Date.now()
    })

    return options
  },

  /**
   * Verify authentication response
   * @param {String} userId - User's login username
   * @param {Object} response - Authentication response from browser
   * @returns {Object} User data if verified
   */
  async verifyAuthentication(userId, response) {
    // Get stored challenge
    const storedChallenge = challengeStore.get(`auth_${userId}`)
    if (!storedChallenge) {
      throw new Error('Challenge not found or expired')
    }

    // Check if challenge expired (1 minute)
    if (Date.now() - storedChallenge.timestamp > 60000) {
      challengeStore.delete(`auth_${userId}`)
      throw new Error('Challenge expired')
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
        [Buffer.from(response.id, 'base64url').toString('base64url')]
      )

      if (credResult.rows.length === 0) {
        throw new Error('Credential not found')
      }

      const credential = credResult.rows[0]

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: RP_ORIGIN,
        expectedRPID: RP_ID,
        authenticator: {
          credentialID: Buffer.from(credential.credential_id, 'base64url'),
          credentialPublicKey: Buffer.from(credential.public_key, 'base64url'),
          counter: parseInt(credential.counter)
        },
        requireUserVerification: false
      })

      if (!verification.verified) {
        throw new Error('Authentication verification failed')
      }

      // Update counter and last_used_at
      await query(
        `UPDATE webauthn_credentials
         SET counter = $1, last_used_at = CURRENT_TIMESTAMP
         WHERE credential_id = $2`,
        [verification.authenticationInfo.newCounter, credential.credential_id]
      )

      // Clear challenge
      challengeStore.delete(`auth_${userId}`)

      // Return user data (same format as password login)
      return {
        staff_id: credential.staff_id,
        user_id: credential.user_id,
        full_name: credential.full_name,
        user_role: credential.user_role,
        designation: credential.designation,
        current_institute_id: credential.current_institute_id,
        is_first_time: credential.is_first_time,
        mobile: credential.mobile,
        email: credential.email,
        institute_name: credential.institute_name,
        institute_type: credential.institute_type,
        district_name: credential.district_name,
        tehsil_name: credential.tehsil_name
      }
    } catch (error) {
      challengeStore.delete(`auth_${userId}`)
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
   * @returns {String} Device name
   */
  generateDeviceName(response) {
    const transports = response.response.transports || []

    if (transports.includes('internal')) {
      // Platform authenticator - try to detect device
      return 'This Device'
    } else if (transports.includes('usb')) {
      return 'Security Key (USB)'
    } else if (transports.includes('nfc')) {
      return 'Security Key (NFC)'
    } else if (transports.includes('ble')) {
      return 'Security Key (Bluetooth)'
    }

    return 'Unknown Device'
  }
}

export default webauthnService

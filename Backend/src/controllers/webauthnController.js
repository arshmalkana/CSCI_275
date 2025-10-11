// src/controllers/webauthnController.js
import webauthnService from '../services/webauthnService.js'
import authService from '../services/authService.js'

const webauthnController = {
  /**
   * Generate registration options for passkey setup
   * Requires authenticated user (JWT token)
   */
  async registerOptions(request, reply) {
    try {
      // Get user from JWT token (will be set by auth middleware)
      const { staffId } = request.body

      console.log('Register options - staffId received:', staffId)

      if (!staffId) {
        return reply.code(400).send({
          success: false,
          message: 'staffId is required'
        })
      }

      // Get user data
      const staff = await authService.findStaffById(staffId)

      console.log('Register options - staff found:', staff ? `Yes (${staff.staff_id})` : 'No')

      if (!staff) {
        return reply.code(404).send({
          success: false,
          message: 'User not found'
        })
      }

      const options = await webauthnService.generateRegistrationOptions({
        staff_id: staff.staff_id,
        user_id: staff.user_id,
        full_name: staff.full_name
      })

      return reply.code(200).send({
        success: true,
        options
      })
    } catch (error) {
      console.error('Register options error:', error)
      return reply.code(500).send({
        success: false,
        message: 'Failed to generate registration options'
      })
    }
  },

  /**
   * Verify registration response and save credential
   */
  async registerVerify(request, reply) {
    try {
      const { staffId, response, deviceName } = request.body

      const result = await webauthnService.verifyRegistration(
        staffId,
        response,
        deviceName
      )

      return reply.code(200).send({
        success: true,
        message: 'Passkey registered successfully',
        credential: {
          id: result.credentialId,
          deviceName: result.deviceName
        }
      })
    } catch (error) {
      console.error('Register verify error:', error)
      return reply.code(400).send({
        success: false,
        message: error.message || 'Failed to verify registration'
      })
    }
  },

  /**
   * Generate authentication options for passkey login
   */
  async loginOptions(request, reply) {
    try {
      const { username } = request.body

      if (!username) {
        return reply.code(400).send({
          success: false,
          message: 'Username is required'
        })
      }

      const options = await webauthnService.generateAuthenticationOptions(username)

      return reply.code(200).send({
        success: true,
        options
      })
    } catch (error) {
      console.error('Login options error:', error)

      // Don't reveal if user exists or not (security)
      return reply.code(400).send({
        success: false,
        message: 'No passkeys available for this user'
      })
    }
  },

  /**
   * Verify authentication response and log user in
   */
  async loginVerify(request, reply) {
    try {
      const { username, response } = request.body

      // Verify passkey authentication
      const staff = await webauthnService.verifyAuthentication(username, response)

      // Generate JWT tokens (same as password login)
      const { accessToken, refreshToken } = authService.generateTokens(staff)

      // Set refresh token in HTTP-only cookie
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      })

      // Return success response (same format as password login)
      return reply.code(200).send({
        success: true,
        message: 'Login successful',
        user: {
          id: staff.staff_id,
          username: staff.user_id,
          name: staff.full_name,
          role: staff.user_role,
          designation: staff.designation,
          institute: staff.institute_name,
          instituteType: staff.institute_type,
          district: staff.district_name,
          tehsil: staff.tehsil_name,
          mobile: staff.mobile,
          email: staff.email,
          isFirstTime: staff.is_first_time
        },
        token: accessToken,
        expiresIn: '15m'
      })
    } catch (error) {
      console.error('Login verify error:', error)
      return reply.code(401).send({
        success: false,
        message: 'Authentication failed'
      })
    }
  },

  /**
   * List user's registered passkeys
   * Requires authenticated user
   */
  async listCredentials(request, reply) {
    try {
      const { staffId } = request.body

      const credentials = await webauthnService.getUserCredentials(staffId)

      return reply.code(200).send({
        success: true,
        credentials: credentials.map(cred => ({
          id: cred.credential_id,
          deviceName: cred.device_name,
          createdAt: cred.created_at,
          lastUsedAt: cred.last_used_at
        }))
      })
    } catch (error) {
      console.error('List credentials error:', error)
      return reply.code(500).send({
        success: false,
        message: 'Failed to retrieve credentials'
      })
    }
  },

  /**
   * Delete a passkey
   * Requires authenticated user
   */
  async deleteCredential(request, reply) {
    try {
      const { credentialId } = request.params
      const { staffId } = request.body

      const deleted = await webauthnService.deleteCredential(credentialId, staffId)

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          message: 'Credential not found'
        })
      }

      return reply.code(200).send({
        success: true,
        message: 'Passkey deleted successfully'
      })
    } catch (error) {
      console.error('Delete credential error:', error)
      return reply.code(500).send({
        success: false,
        message: 'Failed to delete credential'
      })
    }
  }
}

export default webauthnController

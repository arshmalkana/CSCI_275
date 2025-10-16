// src/controllers/webauthnController.js
import webauthnService from '../services/webauthnService.js'
import authService from '../services/authService.js'
import refreshTokenService from '../services/refreshTokenService.js'
import { NotFoundError, ValidationError, WebAuthnError } from '../utils/errors.js'

const webauthnController = {
  /**
   * Generate registration options for passkey setup
   * Requires authenticated user (JWT token)
   */
  async registerOptions(request, reply) {
    try {
      // Get staffId from JWT token (set by authenticate middleware)
      const { staffId } = request.user

      // Get user data
      const staff = await authService.findStaffById(staffId)

      if (!staff) {
        throw new NotFoundError('User', staffId)
      }

      const options = await webauthnService.generateRegistrationOptions(
        {
          staff_id: staff.staff_id,
          user_id: staff.user_id,
          full_name: staff.full_name
        },
        request.ip,
        request.headers['user-agent']
      )

      return reply.code(200).send({
        success: true,
        options
      })
    } catch (error) {
      request.log.error({ error, staffId: request.user?.staffId }, 'Register options error')

      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          success: false,
          error: error.name,
          message: error.message
        })
      }

      return reply.code(500).send({
        success: false,
        error: 'InternalServerError',
        message: 'Failed to generate registration options'
      })
    }
  },

  /**
   * Verify registration response and save credential
   * Requires authenticated user (JWT token)
   */
  async registerVerify(request, reply) {
    try {
      // Get staffId from JWT token (set by authenticate middleware)
      const { staffId } = request.user
      const { response, deviceName } = request.body
      const userAgent = request.headers['user-agent'] || ''

      if (!response) {
        throw new ValidationError('Registration response is required', 'response')
      }

      const result = await webauthnService.verifyRegistration(
        staffId,
        response,
        deviceName,
        userAgent
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
      request.log.error({ error, staffId: request.user?.staffId }, 'Register verify error')

      if (error instanceof ValidationError) {
        return reply.code(400).send({
          success: false,
          error: error.name,
          message: error.message,
          field: error.field
        })
      }

      if (error instanceof WebAuthnError) {
        return reply.code(400).send({
          success: false,
          error: error.name,
          message: error.message
        })
      }

      return reply.code(400).send({
        success: false,
        error: 'RegistrationError',
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
        throw new ValidationError('Username is required', 'username')
      }

      const options = await webauthnService.generateAuthenticationOptions(
        username,
        request.ip,
        request.headers['user-agent']
      )

      return reply.code(200).send({
        success: true,
        options
      })
    } catch (error) {
      request.log.warn({ error, username: request.body.username }, 'Login options error')

      // Don't reveal if user exists or not (security)
      return reply.code(400).send({
        success: false,
        error: 'AuthenticationError',
        message: 'No passkeys available for this user'
      })
    }
  },

  /**
   * Verify authentication response and log user in
   */
  async loginVerify(request, reply) {
    try {
      const { username, response, rememberMe } = request.body

      if (!username) {
        throw new ValidationError('Username is required', 'username')
      }

      if (!response) {
        throw new ValidationError('Authentication response is required', 'response')
      }

      // Verify passkey authentication
      const staff = await webauthnService.verifyAuthentication(username, response)

      // Generate JWT tokens (same as password login)
      const { accessToken, refreshToken } = authService.generateTokens(staff)

      // Determine token expiry based on rememberMe
      const tokenExpiry = rememberMe
        ? 90 * 24 * 60 * 60 * 1000  // 90 days if remember me
        : 7 * 24 * 60 * 60 * 1000   // 7 days default

      // Store refresh token in database
      await refreshTokenService.storeToken({
        token: refreshToken,
        staffId: staff.staff_id,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        expiresIn: tokenExpiry
      })

      // Set refresh token in HTTP-only cookie
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokenExpiry,
        path: '/'
      })

      request.log.info({ staffId: staff.staff_id, username }, 'Passkey login successful')

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
      request.log.error({ error, username: request.body.username }, 'Login verify error')

      if (error instanceof ValidationError) {
        return reply.code(400).send({
          success: false,
          error: error.name,
          message: error.message,
          field: error.field
        })
      }

      return reply.code(401).send({
        success: false,
        error: 'AuthenticationError',
        message: 'Authentication failed'
      })
    }
  },

  /**
   * List user's registered passkeys
   * Requires authenticated user (JWT token)
   */
  async listCredentials(request, reply) {
    try {
      // Get staffId from JWT token (set by authenticate middleware)
      const { staffId } = request.user

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
      request.log.error({ error, staffId: request.user?.staffId }, 'List credentials error')

      return reply.code(500).send({
        success: false,
        error: 'InternalServerError',
        message: 'Failed to retrieve credentials'
      })
    }
  },

  /**
   * Delete a passkey
   * Requires authenticated user (JWT token)
   */
  async deleteCredential(request, reply) {
    try {
      const { credentialId } = request.params
      // Get staffId from JWT token (set by authenticate middleware)
      const { staffId } = request.user

      if (!credentialId) {
        throw new ValidationError('Credential ID is required', 'credentialId')
      }

      const deleted = await webauthnService.deleteCredential(credentialId, staffId)

      if (!deleted) {
        throw new NotFoundError('Credential', credentialId)
      }

      request.log.info({ staffId, credentialId }, 'Passkey deleted successfully')

      return reply.code(200).send({
        success: true,
        message: 'Passkey deleted successfully'
      })
    } catch (error) {
      request.log.error({ error, staffId: request.user?.staffId, credentialId: request.params.credentialId }, 'Delete credential error')

      if (error instanceof ValidationError) {
        return reply.code(400).send({
          success: false,
          error: error.name,
          message: error.message,
          field: error.field
        })
      }

      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          success: false,
          error: error.name,
          message: error.message
        })
      }

      return reply.code(500).send({
        success: false,
        error: 'InternalServerError',
        message: 'Failed to delete credential'
      })
    }
  }
}

export default webauthnController
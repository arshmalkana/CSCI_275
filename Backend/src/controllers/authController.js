// src/controllers/authController.js
import authService from '../services/authService.js'
import refreshTokenService from '../services/refreshTokenService.js'

const authController = {
  async login(request, reply) {
    const { username, password, rememberMe } = request.body

    try {
      // Find staff member by user_id (username)
      const staff = await authService.findStaffByUserId(username)

      // Check if user exists
      if (!staff) {
        return reply.code(401).send({
          success: false,
          message: 'Invalid username or password'
        })
      }

      // Verify password
      const isPasswordValid = authService.verifyPassword(password, staff.password_hash)

      if (!isPasswordValid) {
        return reply.code(401).send({
          success: false,
          message: 'Invalid username or password'
        })
      }

      // Generate JWT tokens
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

      // Return success response with access token
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
      console.error('Login error:', error)
      return reply.code(500).send({
        success: false,
        message: 'An error occurred during login'
      })
    }
  },

  async logout(request, reply) {
    try {
      // Revoke refresh token in database
      const refreshToken = request.cookies.refreshToken
      if (refreshToken) {
        await refreshTokenService.revokeToken(refreshToken, 'User logged out')
      }

      // Clear refresh token cookie
      reply.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })

      return reply.code(200).send({
        success: true,
        message: 'Logged out successfully'
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear cookie even if DB operation fails
      reply.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })
      return reply.code(200).send({
        success: true,
        message: 'Logged out successfully'
      })
    }
  },

  async refreshToken(request, reply) {
    try {
      // Get refresh token from cookie
      const refreshToken = request.cookies.refreshToken

      if (!refreshToken) {
        return reply.code(401).send({
          success: false,
          message: 'No refresh token provided'
        })
      }

      // Verify token exists in database and is valid
      const tokenRecord = await refreshTokenService.verifyToken(refreshToken)

      if (!tokenRecord) {
        return reply.code(401).send({
          success: false,
          message: 'Invalid or expired refresh token'
        })
      }

      // Verify JWT signature
      const decoded = authService.verifyRefreshToken(refreshToken)

      // Find staff member
      const staff = await authService.findStaffByUserId(decoded.userId)

      if (!staff) {
        return reply.code(401).send({
          success: false,
          message: 'User not found'
        })
      }

      // Revoke old token (rotation)
      await refreshTokenService.revokeToken(refreshToken, 'Token rotated')

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = authService.generateTokens(staff)

      // Store new refresh token in database
      await refreshTokenService.storeToken({
        token: newRefreshToken,
        staffId: staff.staff_id,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip
      })

      // Set new refresh token in cookie
      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      })

      return reply.code(200).send({
        success: true,
        token: accessToken,
        expiresIn: '15m'
      })
    } catch (error) {
      console.error('Refresh token error:', error)
      return reply.code(401).send({
        success: false,
        message: 'Invalid or expired refresh token'
      })
    }
  },

  /**
   * Get all active sessions for the authenticated user
   */
  async getSessions(request, reply) {
    try {
      const { staffId } = request.user
      const currentToken = request.cookies.refreshToken
      const currentTokenHash = currentToken ? refreshTokenService.hashToken(currentToken) : null

      const sessions = await refreshTokenService.getUserSessions(staffId, currentTokenHash)

      return reply.code(200).send({
        success: true,
        sessions
      })
    } catch (error) {
      console.error('Get sessions error:', error)
      return reply.code(500).send({
        success: false,
        message: 'Failed to retrieve sessions'
      })
    }
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(request, reply) {
    try {
      const { staffId } = request.user
      const { tokenId } = request.params

      const success = await refreshTokenService.revokeTokenById(
        tokenId,
        staffId,
        'Revoked by user from session management'
      )

      if (!success) {
        return reply.code(404).send({
          success: false,
          message: 'Session not found'
        })
      }

      return reply.code(200).send({
        success: true,
        message: 'Session revoked successfully'
      })
    } catch (error) {
      console.error('Revoke session error:', error)
      return reply.code(500).send({
        success: false,
        message: 'Failed to revoke session'
      })
    }
  },

  /**
   * Revoke all sessions except current
   */
  async revokeAllOtherSessions(request, reply) {
    try {
      const { staffId } = request.user
      const currentToken = request.cookies.refreshToken

      if (!currentToken) {
        return reply.code(400).send({
          success: false,
          message: 'No current session found'
        })
      }

      // Revoke all tokens except current using service
      await refreshTokenService.revokeAllOtherTokens(
        staffId,
        currentToken,
        'Revoked by user - logout from all other devices'
      )

      return reply.code(200).send({
        success: true,
        message: 'All other sessions revoked successfully'
      })
    } catch (error) {
      console.error('Revoke all sessions error:', error)
      return reply.code(500).send({
        success: false,
        message: 'Failed to revoke sessions'
      })
    }
  }
}

export default authController

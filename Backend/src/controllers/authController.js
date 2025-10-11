// src/controllers/authController.js
import authService from '../services/authService.js'

const authController = {
  async login(request, reply) {
    const { username, password } = request.body

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

      // Set refresh token in HTTP-only cookie
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
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

      // Verify refresh token
      const decoded = authService.verifyRefreshToken(refreshToken)

      // Find staff member
      const staff = await authService.findStaffByUserId(decoded.userId)

      if (!staff) {
        return reply.code(401).send({
          success: false,
          message: 'User not found'
        })
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = authService.generateTokens(staff)

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
  }
}

export default authController

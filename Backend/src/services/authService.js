// src/services/authService.js
import { query } from '../database/db.js'
import jwtUtils from '../utils/jwt.js'

const authService = {
  /**
   * Find staff member by user_id (username)
   * @param {string} userId - The user_id from staff table
   * @returns {Promise<Object|null>} Staff member object or null
   */
  async findStaffByUserId(userId) {
    const sql = `
      SELECT
        s.staff_id,
        s.user_id,
        s.full_name,
        s.designation,
        s.mobile,
        s.email,
        s.password_hash,
        s.user_role,
        s.current_institute_id,
        s.is_first_time,
        s.is_active,
        i.institute_name,
        i.institute_type,
        d.district_name,
        t.tehsil_name
      FROM staff s
      LEFT JOIN institutes i ON s.current_institute_id = i.institute_id
      LEFT JOIN districts d ON i.district_id = d.district_id
      LEFT JOIN tehsils t ON i.tehsil_id = t.tehsil_id
      WHERE s.user_id = $1 AND s.is_active = true
    `

    try {
      const result = await query(sql, [userId])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      console.error('Error finding staff by user_id:', error)
      throw error
    }
  },

  /**
   * Find staff member by staff_id
   * @param {number} staffId - The staff_id from staff table
   * @returns {Promise<Object|null>} Staff member object or null
   */
  async findStaffById(staffId) {
    const sql = `
      SELECT
        s.staff_id,
        s.user_id,
        s.full_name,
        s.designation,
        s.mobile,
        s.email,
        s.user_role,
        s.current_institute_id,
        s.is_first_time,
        s.is_active,
        s.passkey_enabled,
        i.institute_name,
        i.institute_type,
        d.district_name,
        t.tehsil_name
      FROM staff s
      LEFT JOIN institutes i ON s.current_institute_id = i.institute_id
      LEFT JOIN districts d ON i.district_id = d.district_id
      LEFT JOIN tehsils t ON i.tehsil_id = t.tehsil_id
      WHERE s.staff_id = $1 AND s.is_active = true
    `

    try {
      const result = await query(sql, [staffId])
      return result.rows.length > 0 ? result.rows[0] : null
    } catch (error) {
      console.error('Error finding staff by staff_id:', error)
      throw error
    }
  },

  /**
   * Verify password (currently plain text, will be hashed with Argon2id later)
   * @param {string} plainPassword - Password entered by user
   * @param {string} storedHash - Password hash from database
   * @returns {boolean} True if passwords match
   */
  verifyPassword(plainPassword, storedHash) {
    // TODO: Replace with Argon2id verification
    // For now, using plain text comparison
    return plainPassword === storedHash
  },

  /**
   * Generate JWT tokens (access + refresh)
   * @param {Object} staff - Staff object from database
   * @returns {Object} Object containing accessToken and refreshToken
   */
  generateTokens(staff) {
    const payload = {
      staffId: staff.staff_id,
      userId: staff.user_id,
      role: staff.user_role,
      designation: staff.designation
      // instituteId: staff.current_institute_id
    }

    const accessToken = jwtUtils.generateAccessToken(payload)
    const refreshToken = jwtUtils.generateRefreshToken(payload)

    return { accessToken, refreshToken }
  },

  /**
   * Verify and decode access token
   * @param {string} token - JWT access token
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    return jwtUtils.verifyAccessToken(token)
  },

  /**
   * Verify and decode refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    return jwtUtils.verifyRefreshToken(token)
  }
}

export default authService

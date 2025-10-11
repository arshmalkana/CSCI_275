// src/utils/jwt.js
import jwt from 'jsonwebtoken'

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production'

const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d' // 7 days

export const jwtUtils = {
  /**
   * Generate access token (short-lived)
   * @param {Object} payload - User data to encode in token
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'ahpunjab-api',
      audience: 'ahpunjab-client'
    })
  },

  /**
   * Generate refresh token (long-lived)
   * @param {Object} payload - User data to encode in token
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'ahpunjab-api',
      audience: 'ahpunjab-client'
    })
  },

  /**
   * Verify access token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'ahpunjab-api',
        audience: 'ahpunjab-client'
      })
    } catch (error) {
      throw new Error('Invalid or expired access token')
    }
  },

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token to verify
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'ahpunjab-api',
        audience: 'ahpunjab-client'
      })
    } catch (error) {
      throw new Error('Invalid or expired refresh token')
    }
  },

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token to decode
   * @returns {Object} Decoded token payload
   */
  decodeToken(token) {
    return jwt.decode(token)
  }
}

export default jwtUtils

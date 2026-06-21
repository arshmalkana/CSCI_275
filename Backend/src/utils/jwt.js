// src/utils/jwt.js
import jwt from 'jsonwebtoken'

// JWT Configuration — fail-fast in production so misconfigured deploys crash on boot
const IS_PROD = process.env.NODE_ENV === 'production'

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (IS_PROD) throw new Error('FATAL: JWT_SECRET env var is required in production')
  return 'dev-only-jwt-secret-do-not-use-in-production'
})()

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (() => {
  if (IS_PROD) throw new Error('FATAL: JWT_REFRESH_SECRET env var is required in production')
  return 'dev-only-refresh-secret-do-not-use-in-production'
})()

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

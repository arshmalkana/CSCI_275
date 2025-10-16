// src/middleware/sanitize.js
// Input sanitization middleware to prevent XSS and injection attacks

import createDOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

const DOMPurify = createDOMPurify()

/**
 * Sanitize input data to prevent XSS and injection attacks
 * Applies to request body, query params, and URL params
 */
export async function sanitizeInput(request, reply) {
  try {
    // Sanitize body
    if (request.body && typeof request.body === 'object') {
      request.body = sanitizeObject(request.body)
    }

    // Sanitize query params
    if (request.query && typeof request.query === 'object') {
      request.query = sanitizeObject(request.query)
    }

    // Sanitize URL params
    if (request.params && typeof request.params === 'object') {
      request.params = sanitizeObject(request.params)
    }
  } catch (error) {
    request.log.error({ error }, 'Input sanitization error')
    // Continue even if sanitization fails (don't block requests)
  }
}

/**
 * Recursively sanitize an object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizeString(item)
      } else if (typeof item === 'object') {
        return sanitizeObject(item)
      }
      return item
    })
  }

  // Handle objects
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const cleanKey = sanitizeString(key)

    if (typeof value === 'string') {
      sanitized[cleanKey] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[cleanKey] = sanitizeObject(value)
    } else {
      sanitized[cleanKey] = value
    }
  }

  return sanitized
}

/**
 * Sanitize a string value
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return str
  }

  // Remove HTML tags and dangerous characters using DOMPurify
  let cleaned = DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep text content
  })

  // Trim whitespace
  cleaned = cleaned.trim()

  // Additional sanitization for common injection patterns
  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '')

  // Escape dangerous Unicode characters
  cleaned = validator.escape(cleaned)

  return cleaned
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false
  }
  return validator.isEmail(email, {
    allow_utf8_local_part: false
  })
}

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Check for valid Indian mobile number
  // Format: +91XXXXXXXXXX or 10 digits starting with 6-9
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validatePassword(password) {
  const errors = []

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'Password123', '12345678', 'qwerty123',
    'admin123', 'Admin@123', 'Welcome@123'
  ]

  if (commonPasswords.includes(password)) {
    errors.push('Password is too common, please choose a stronger password')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate user ID format
 * @param {string} userId - User ID to validate
 * @returns {boolean} True if valid
 */
export function isValidUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return false
  }

  // User ID format: Alphanumeric, underscore, hyphen (3-50 chars)
  return /^[a-zA-Z0-9_-]{3,50}$/.test(userId)
}

/**
 * Sanitize SQL input (for dynamic queries - use with caution!)
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeSQL(input) {
  if (!input || typeof input !== 'string') {
    return input
  }

  // Remove SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, '') // Remove multi-line comment end
    .replace(/\bUNION\b/gi, '') // Remove UNION
    .replace(/\bSELECT\b/gi, '') // Remove SELECT
    .replace(/\bINSERT\b/gi, '') // Remove INSERT
    .replace(/\bUPDATE\b/gi, '') // Remove UPDATE
    .replace(/\bDELETE\b/gi, '') // Remove DELETE
    .replace(/\bDROP\b/gi, '') // Remove DROP
    .trim()
}

export default {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidUserId,
  sanitizeSQL
}
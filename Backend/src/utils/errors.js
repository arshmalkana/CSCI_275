// src/utils/errors.js
// Custom error classes for proper error handling

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // Capture stack trace (excludes constructor from stack)
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV !== 'production' && { stack: this.stack })
    }
  }
}

/**
 * Validation error (400)
 * Used for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message, field = null, details = null) {
    super(message, 400)
    this.name = 'ValidationError'
    this.field = field
    this.details = details
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      details: this.details
    }
  }
}

/**
 * Authentication error (401)
 * Used when user credentials are invalid or missing
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error (403)
 * Used when user lacks permission for an action
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not found error (404)
 * Used when a resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = null) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, 404)
    this.name = 'NotFoundError'
    this.resource = resource
    this.identifier = identifier
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      identifier: this.identifier
    }
  }
}

/**
 * Conflict error (409)
 * Used when a resource already exists (e.g., duplicate user)
 */
export class ConflictError extends AppError {
  constructor(message, field = null) {
    super(message, 409)
    this.name = 'ConflictError'
    this.field = field
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field
    }
  }
}

/**
 * Database error (500)
 * Used for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message, query = null, originalError = null) {
    super(message, 500)
    this.name = 'DatabaseError'
    this.query = query
    this.originalError = originalError
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(process.env.NODE_ENV !== 'production' && {
        query: this.query,
        originalError: this.originalError?.message
      })
    }
  }
}

/**
 * Rate limit error (429)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests, please try again later', 429)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter
    }
  }
}

/**
 * WebAuthn error (400)
 * Used for WebAuthn-specific failures
 */
export class WebAuthnError extends AppError {
  constructor(message, phase = null) {
    super(message, 400)
    this.name = 'WebAuthnError'
    this.phase = phase // 'registration' or 'authentication'
  }

  toJSON() {
    return {
      ...super.toJSON(),
      phase: this.phase
    }
  }
}

/**
 * Global error handler for Fastify
 * @param {Error} error - Error object
 * @param {FastifyRequest} request - Fastify request
 * @param {FastifyReply} reply - Fastify reply
 */
export async function errorHandler(error, request, reply) {
  // Log error
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational
    },
    request: {
      method: request.method,
      url: request.url,
      headers: {
        'user-agent': request.headers['user-agent'],
        'x-forwarded-for': request.headers['x-forwarded-for']
      },
      ip: request.ip
    }
  }

  if (error.statusCode >= 500) {
    request.log.error(logData, 'Server error')
  } else if (error.statusCode >= 400) {
    request.log.warn(logData, 'Client error')
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      ...error.toJSON()
    })
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Request validation failed',
      details: error.validation
    })
  }

  // Handle database errors (from pg library)
  if (error.code && error.code.startsWith('23')) {
    // PostgreSQL constraint violation errors (23xxx)
    if (error.code === '23505') {
      // Unique violation
      return reply.code(409).send({
        success: false,
        error: 'ConflictError',
        message: 'A record with this value already exists',
        details: error.detail
      })
    }

    if (error.code === '23503') {
      // Foreign key violation
      return reply.code(400).send({
        success: false,
        error: 'ValidationError',
        message: 'Referenced record does not exist',
        details: error.detail
      })
    }
  }

  // Handle rate limit errors
  if (error.statusCode === 429) {
    return reply.code(429).send({
      success: false,
      error: 'RateLimitError',
      message: error.message || 'Too many requests',
      retryAfter: error.retryAfter
    })
  }

  // Handle unknown errors (don't expose internal details in production)
  const isProduction = process.env.NODE_ENV === 'production'

  return reply.code(500).send({
    success: false,
    error: 'InternalServerError',
    message: isProduction
      ? 'An unexpected error occurred'
      : error.message,
    ...(! isProduction && {
      stack: error.stack,
      details: error
    })
  })
}

/**
 * Async error wrapper for route handlers
 * Catches errors and passes them to error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(fn) {
  return async (request, reply) => {
    try {
      await fn(request, reply)
    } catch (error) {
      await errorHandler(error, request, reply)
    }
  }
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  RateLimitError,
  WebAuthnError,
  errorHandler,
  asyncHandler
}
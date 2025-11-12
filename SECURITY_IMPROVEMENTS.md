# Security Improvements Implementation Plan

## Overview
Comprehensive security audit findings and implementation plan for the AH Punjab Reporting System backend.

## Issues Found & Status

### 1. ✅ IN-MEMORY CHALLENGE STORAGE (CRITICAL)
**Issue**: WebAuthn challenges stored in memory Map
**Risk**: Data loss on server restart, no scalability
**Solution**: Move to database storage
**Files**:
- ✅ `Database/init/08-webauthn-challenges.sql` - Created challenges table
- 🔄 `Backend/src/services/webauthnService.js` - Replace Map with DB queries

### 2. 🔄 DEBUG CONSOLE.LOG STATEMENTS (MEDIUM)
**Issue**: Console.log statements leak sensitive data in logs
**Risk**: Information disclosure in production logs
**Solution**: Remove or replace with proper logging
**Files to check**:
- `Backend/src/services/webauthnService.js` (lines 110, 114, 135, 191)
- `Backend/src/controllers/*.js` (all files)
- `Backend/src/services/*.js` (all files)

### 3. 🔄 GENERIC CATCH BLOCKS (MEDIUM)
**Issue**: Generic error handling makes debugging difficult
**Risk**: Poor error visibility, security issues hidden
**Solution**: Implement proper error types and handling
**Pattern**: Replace `catch (error)` with specific error handling

### 4. 🔄 NO INPUT SANITIZATION (CRITICAL)
**Issue**: No input sanitization middleware
**Risk**: XSS, SQL injection, NoSQL injection
**Solution**: Add sanitization middleware using DOMPurify/validator.js
**Implementation**:
- Create `Backend/src/middleware/sanitize.js`
- Apply to all POST/PUT routes
- Sanitize query parameters, body, params

### 5. 🔄 NO RATE LIMITING (CRITICAL)
**Issue**: No rate limiting on endpoints
**Risk**: Brute force attacks, DDoS
**Solution**: Implement rate limiting with @fastify/rate-limit
**Endpoints Priority**:
- ⚠️ `/auth/login` - 5 attempts per 15 min
- ⚠️ `/auth/register` - 3 attempts per hour
- ⚠️ `/auth/refresh` - 10 attempts per 15 min
- ⚠️ `/auth/webauthn/*` - 5 attempts per 15 min
- 🔒 All other endpoints - 100 requests per 15 min

### 6. 🔄 DUPLICATE CODE (LOW)
**Issue**: Code duplication across files
**Risk**: Maintenance burden, inconsistent behavior
**Solution**: Extract common patterns to utilities
**Files to check**:
- `HomeScreen.tsx` (duplicate code after line 620)
- Error handling patterns in controllers
- Validation logic across services

### 7. 🔄 MISSING VALIDATION (HIGH)
**Issue**: Insufficient input validation
**Risk**: Invalid data in database, logic errors
**Solution**: Add JSON Schema validation to all endpoints
**Requirements**:
- Email format validation
- Phone number format validation
- Password strength validation
- User ID format validation
- Enum value validation

## Implementation Order

### Phase 1: Critical Security (Priority 1)
1. ✅ Database challenge storage
2. Input sanitization middleware
3. Rate limiting on auth endpoints

### Phase 2: Error Handling (Priority 2)
4. Remove console.log statements
5. Implement proper error handling
6. Add validation schemas

### Phase 3: Code Quality (Priority 3)
7. Remove duplicate code
8. Add comprehensive tests
9. Security audit

## Detailed Implementation

### Input Sanitization Middleware

```javascript
// Backend/src/middleware/sanitize.js
import createDOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

const DOMPurify = createDOMPurify()

export async function sanitizeInput(request, reply) {
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
}

function sanitizeObject(obj) {
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove HTML tags and dangerous characters
      sanitized[key] = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      }).trim()
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}
```

### Rate Limiting Configuration

```javascript
// Backend/src/plugins/rateLimiter.js
import fastifyRateLimit from '@fastify/rate-limit'

export default async function rateLimiter(fastify, opts) {
  // Global rate limit
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    cache: 10000,
    skipOnError: false
  })

  // Stricter limits for auth endpoints
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/v1/auth/login')) {
      // 5 attempts per 15 minutes for login
      await rateLimiter({ max: 5, timeWindow: '15 minutes' })
    } else if (request.url.startsWith('/v1/auth/register')) {
      // 3 attempts per hour for registration
      await rateLimiter({ max: 3, timeWindow: '1 hour' })
    }
  })
}
```

### Custom Error Classes

```javascript
// Backend/src/utils/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400)
    this.field = field
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class DatabaseError extends AppError {
  constructor(message, query) {
    super(message, 500)
    this.name = 'DatabaseError'
    this.query = query
  }
}
```

### Structured Logging

```javascript
// Backend/src/utils/logger.js
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['password', 'token', 'refreshToken', 'authorization'],
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined
})

export default logger
```

## Testing Requirements

### Security Tests
- [ ] Test rate limiting with automated requests
- [ ] Test input sanitization with XSS payloads
- [ ] Test SQL injection attempts
- [ ] Test authentication bypass attempts
- [ ] Test WebAuthn challenge replay attacks

### Integration Tests
- [ ] Test full login flow with sanitization
- [ ] Test registration with invalid inputs
- [ ] Test WebAuthn flow end-to-end
- [ ] Test token refresh mechanism

## Monitoring & Alerting

### Metrics to Track
- Failed login attempts per IP
- Rate limit violations
- Input sanitization triggers
- Database query performance
- Challenge expiration rate

### Alerts
- ⚠️ >10 failed logins from same IP in 5 min
- ⚠️ Rate limit hit >50 times in 1 hour
- ⚠️ Database connection pool exhausted
- ⚠️ Response time >500ms on auth endpoints

## Deployment Checklist

- [ ] Run database migration for challenges table
- [ ] Install new dependencies (rate-limit, sanitize, validator)
- [ ] Update environment variables
- [ ] Test all endpoints with Postman/curl
- [ ] Run security audit with npm audit
- [ ] Update documentation
- [ ] Monitor logs for first 24 hours

## Dependencies to Install

```bash
cd Backend
npm install @fastify/rate-limit isomorphic-dompurify validator pino pino-pretty
```

## Environment Variables

```env
# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m

# WebAuthn
RP_NAME=AH Punjab Reporting
RP_ID=localhost
RP_ORIGIN=http://localhost:3000
```

## Files Created/Modified

### Created
- ✅ `Database/init/08-webauthn-challenges.sql`
- 🔄 `Backend/src/middleware/sanitize.js`
- 🔄 `Backend/src/plugins/rateLimiter.js`
- 🔄 `Backend/src/utils/errors.js`
- 🔄 `Backend/src/utils/logger.js`
- 🔄 `Backend/src/utils/validation.js`

### Modified
- 🔄 `Backend/src/services/webauthnService.js`
- 🔄 `Backend/src/controllers/webauthnController.js`
- 🔄 `Backend/src/controllers/authController.js`
- 🔄 `Backend/src/controllers/homeController.js`
- 🔄 `Backend/src/server.js`
- 🔄 `ahpunjabfrontend/src/screens/HomeScreen.tsx`

## Timeline

- **Phase 1**: 2 hours (Critical security fixes)
- **Phase 2**: 2 hours (Error handling & validation)
- **Phase 3**: 1 hour (Code cleanup & testing)
- **Total**: ~5 hours

## Notes

- All changes are backward compatible
- No breaking API changes
- Database migration required before deployment
- Existing tokens remain valid
- WebAuthn challenges will migrate seamlessly
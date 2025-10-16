import userSchema from './schemas/userSchema.js'
import refreshTokenService from './services/refreshTokenService.js'
import webauthnService from './services/webauthnService.js'
import { sanitizeInput } from './middleware/sanitize.js'
import { errorHandler } from './utils/errors.js'

export default async function (fastify, opts) {
  // Register cookie support
  await fastify.register(import('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || 'your-cookie-secret-change-in-production',
    parseOptions: {}
  })

  // Register CORS plugin
  await fastify.register(import('./plugins/cors.js'))

  // Register rate limiting plugin (SECURITY FIX)
  await fastify.register(import('./plugins/rateLimiter.js'))

  // Register input sanitization middleware (SECURITY FIX)
  fastify.addHook('preHandler', sanitizeInput)

  // Register global error handler (SECURITY FIX)
  fastify.setErrorHandler(errorHandler)

  // Load schemas
  fastify.addSchema(userSchema)
  // Swagger generator
  await fastify.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'AH Punjab Backend',
        description: 'Fastify + OpenAPI demo',
        version: '1.0.0'
      }
    }
  })

  // Swagger UI
  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  })

  // Routes
  await fastify.register(import('./routes/auth.js'), { prefix: '/v1/auth' })
  await fastify.register(import('./routes/webauthn.js'), { prefix: '/v1/auth/webauthn' })
  await fastify.register(import('./routes/home.js'), { prefix: '/v1/home' })

  // Cleanup expired data on server startup (SECURITY FIX)
  fastify.addHook('onReady', async () => {
    try {
      // Cleanup expired refresh tokens
      await refreshTokenService.cleanupExpiredTokens()
      fastify.log.info('Expired refresh tokens cleaned up on startup')

      // Cleanup expired WebAuthn challenges
      const challengesDeleted = await webauthnService.cleanupExpiredChallenges()
      fastify.log.info({ challengesDeleted }, 'Expired WebAuthn challenges cleaned up on startup')
    } catch (error) {
      fastify.log.warn('Failed to cleanup expired data on startup:', error.message)
    }
  })

  // Schedule periodic cleanup (every hour)
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      try {
        await refreshTokenService.cleanupExpiredTokens()
        await webauthnService.cleanupExpiredChallenges()
      } catch (error) {
        fastify.log.error('Periodic cleanup error:', error)
      }
    }, 60 * 60 * 1000) // Every hour
  }
}

import userSchema from './schemas/userSchema.js'
import refreshTokenService from './services/refreshTokenService.js'
import webauthnService from './services/webauthnService.js'
import * as notificationsService from './services/notificationsService.js'
import { sanitizeInput } from './middleware/sanitize.js'
import { errorHandler } from './utils/errors.js'

export default async function (fastify, opts) {
  const IS_PROD = process.env.NODE_ENV === 'production'
  const cookieSecret = process.env.COOKIE_SECRET || (() => {
    if (IS_PROD) throw new Error('FATAL: COOKIE_SECRET env var is required in production')
    return 'dev-only-cookie-secret-do-not-use-in-production'
  })()

  // Register cookie support
  await fastify.register(import('@fastify/cookie'), {
    secret: cookieSecret,
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
  await fastify.register(import('./routes/register.js'), { prefix: '/v1/register' })
  await fastify.register(import('./routes/home.js'), { prefix: '/v1/home' })
  await fastify.register(import('./routes/profile.js'), { prefix: '/v1/profile' })
  await fastify.register(import('./routes/geo.js'), { prefix: '/v1/geo' })
  await fastify.register(import('./routes/reports.js'), { prefix: '/v1/reports' })
  await fastify.register(import('./routes/admin.js'), { prefix: '/v1/admin' })
  await fastify.register(import('./routes/rollup.js'), { prefix: '/v1/rollup' })
  await fastify.register(import('./routes/periods.js'), { prefix: '/v1/periods' })
  await fastify.register(import('./routes/notifications.js'), { prefix: '/v1/notifications' })
  await fastify.register(import('./routes/push.js'), { prefix: '/v1/push' })

  // Cleanup expired data + send deadline reminders on server startup
  fastify.addHook('onReady', async () => {
    try {
      await refreshTokenService.cleanupExpiredTokens()
      fastify.log.info('Expired refresh tokens cleaned up on startup')

      const challengesDeleted = await webauthnService.cleanupExpiredChallenges()
      fastify.log.info({ challengesDeleted }, 'Expired WebAuthn challenges cleaned up on startup')

      const notificationsDeleted = await notificationsService.cleanupExpiredNotifications()
      fastify.log.info({ notificationsDeleted }, 'Expired notifications cleaned up on startup')

      const periodsNotified = await notificationsService.sendDeadlineReminders()
      fastify.log.info({ periodsNotified }, 'Startup deadline reminders sent')
    } catch (error) {
      fastify.log.warn('Failed to run startup tasks:', error.message)
    }
  })

  // Periodic cleanup every hour; deadline reminders every 24 h
  setInterval(async () => {
    try {
      await refreshTokenService.cleanupExpiredTokens()
      await webauthnService.cleanupExpiredChallenges()
      await notificationsService.cleanupExpiredNotifications()
    } catch (error) {
      fastify.log.error('Periodic cleanup error:', error)
    }
  }, 60 * 60 * 1000)

  setInterval(async () => {
    try {
      const periodsNotified = await notificationsService.sendDeadlineReminders()
      fastify.log.info({ periodsNotified }, 'Daily deadline reminders sent')
    } catch (error) {
      fastify.log.error('Deadline reminder error:', error)
    }
  }, 24 * 60 * 60 * 1000)
}

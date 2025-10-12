import userSchema from './schemas/userSchema.js'
import refreshTokenService from './services/refreshTokenService.js'

export default async function (fastify, opts) {
  // Register cookie support
  await fastify.register(import('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || 'your-cookie-secret-change-in-production',
    parseOptions: {}
  })

  // Load schemas
  fastify.addSchema(userSchema)
  await fastify.register(import('./plugins/cors.js'))
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

  // Cleanup expired tokens on server startup
  fastify.addHook('onReady', async () => {
    try {
      await refreshTokenService.cleanupExpiredTokens()
      fastify.log.info('Expired refresh tokens cleaned up on startup')
    } catch (error) {
      fastify.log.warn('Failed to cleanup expired tokens on startup:', error.message)
    }
  })
}

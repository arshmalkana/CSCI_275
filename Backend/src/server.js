import userSchema from './schemas/userSchema.js'

export default async function (fastify, opts) {
  // Register cookie support
  await fastify.register(import('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || 'your-cookie-secret-change-in-production',
    parseOptions: {}
  })

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
  await fastify.register(import('./routes/user.js'), { prefix: '/users' })
}

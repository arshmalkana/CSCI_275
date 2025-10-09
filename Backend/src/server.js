import userSchema from './schemas/userSchema.js'

export default async function (fastify, opts) {
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
  await fastify.register(import('./routes/user.js'), { prefix: '/users' })
}

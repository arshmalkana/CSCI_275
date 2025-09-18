// src/server.js
import userSchema from './schemas/userSchema.js'

export default async function (fastify, opts) {
  // Load schemas
  fastify.addSchema(userSchema)

  // Register plugins
  await fastify.register(import('./plugins/cors.js'))
  await fastify.register(import('./routes/user.js'), { prefix: '/users' })
}

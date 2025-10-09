// src/plugins/cors.js
import fastifyCors from '@fastify/cors'

export default async function (fastify, opts) {
  fastify.register(fastifyCors, {
    origin: true, // Allows any origin AND works with credentials
    credentials: true // Required for cookies to work cross-origin
  })
}

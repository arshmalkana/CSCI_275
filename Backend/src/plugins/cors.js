// src/plugins/cors.js
import fastifyCors from '@fastify/cors'

export default async function (fastify, opts) {
  fastify.register(fastifyCors, {
    origin: '*'
  })
}

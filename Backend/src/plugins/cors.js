// src/plugins/cors.js
import fastifyCors from '@fastify/cors'

const IS_PROD = process.env.NODE_ENV === 'production'

// In production, read allowed origins from CORS_ORIGINS env (comma-separated).
// In development, allow any origin so the Vite dev server works.
function getAllowedOrigins() {
  if (!IS_PROD) return true // any origin in dev

  const raw = process.env.CORS_ORIGINS
  if (!raw) {
    throw new Error('FATAL: CORS_ORIGINS env var is required in production (comma-separated list of allowed origins)')
  }
  return raw.split(',').map(o => o.trim()).filter(Boolean)
}

export default async function (fastify, opts) {
  fastify.register(fastifyCors, {
    origin: getAllowedOrigins(),
    credentials: true, // required for HttpOnly cookie to be sent cross-origin
    // Rolling-token header must be readable by the browser client. Without this,
    // cross-origin responses hide X-New-Token from JS and the rolling mechanism
    // silently no-ops (falls back to /auth/refresh every 15m). (fixes F1)
    exposedHeaders: ['X-New-Token']
  })
}

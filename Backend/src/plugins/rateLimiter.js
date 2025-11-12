// src/plugins/rateLimiter.js
// Rate limiting plugin to prevent brute force and DDoS attacks

import fastifyRateLimit from '@fastify/rate-limit'

/**
 * Rate limiter plugin with different limits for different endpoints
 */
export default async function rateLimiterPlugin(fastify, opts) {
  // Global rate limit (fallback for all endpoints)
  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 100, // 100 requests
    timeWindow: '15 minutes',
    cache: 10000, // Cache up to 10k clients
    allowList: ['127.0.0.1', '::1'], // Whitelist localhost for development
    skipOnError: false, // Don't skip on errors
    redis: opts.redis, // Optional Redis for distributed systems
    nameSpace: 'ahpunjab-rate-limit:',
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.after / 1000)} seconds.`,
        retryAfter: Math.ceil(context.after / 1000)
      }
    }
  })



    // Registration endpoint - 3 attempts per hour
    // fastify.post('/v1/auth/register', {
    //   config: {
    //     rateLimit: {
    //       max: 3,
    //       timeWindow: '1 hour',
    //       errorResponseBuilder: (request, context) => {
    //         return {
    //           statusCode: 429,
    //           error: 'Too Many Registration Attempts',
    //           message: 'Registration limit exceeded. Please try again later.',
    //           retryAfter: Math.ceil(context.after / 1000)
    //         }
    //       }
    //     }
    //   }
    // }, async () => {})

    // Report endpoints - 20 requests per minute
    // const reportLimit = {
    //   max: 20,
    //   timeWindow: '1 minute'
    // }

  //   fastify.get('/v1/reports', {
  //     config: { rateLimit: reportLimit }
  //   }, async () => {})

  //   fastify.post('/v1/reports', {
  //     config: { rateLimit: reportLimit }
  //   }, async () => {})
  // })

  fastify.log.info('Rate limiter plugin registered successfully')
}
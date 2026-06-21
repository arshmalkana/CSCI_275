import pino from 'pino'

// Shared logger for code that runs outside a request context (services, background jobs).
// Controllers/routes use request.log from Fastify — this is for the service layer only.
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
})

export default logger

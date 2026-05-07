import Fastify from 'fastify'
import appPlugin from './src/server.js'

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    ...(process.env.NODE_ENV !== 'production' && {
      transport: { target: 'pino-pretty', options: { colorize: true } }
    })
  }
})

await app.register(appPlugin)

await app.listen({
  port: parseInt(process.env.PORT || '8080'),
  host: process.env.HOST || '0.0.0.0'
})

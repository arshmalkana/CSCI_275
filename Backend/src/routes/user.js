// src/routes/user.js
import userController from '../controllers/userController.js'

export default async function (fastify, opts) {
  fastify.get('/', {
    schema: {
      description: 'Get all users',
      tags: ['Users'],
      response: {
        200: {
          type: 'array',
          items: { $ref: 'userSchema#' }
        }
      }
    }
  }, userController.getUsers)
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new user',
        tags: ['Users'],
        body: { $ref: 'userSchema#' },   // request validation
        response: {
          201: {                         // response on success
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              age: { type: 'number' }
            }
          },
          400: {                         // validation error (Fastify auto)
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    userController.createUser
  )

}
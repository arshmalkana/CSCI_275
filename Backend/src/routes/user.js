// src/routes/user.js
import userController from '../controllers/userController.js'

export default async function (fastify, opts) {
  fastify.get('/', userController.getUsers)
  fastify.post('/', {
    schema: {
      body: { $ref: 'userSchema#' }
    }
  }, userController.createUser)
}

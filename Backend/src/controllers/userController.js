// src/controllers/userController.js
import * as userService from '../services/userService.js'

async function getUsers(request, reply) {
  const users = await userService.findAll()
  return users
}

async function createUser(request, reply) {
  const user = await userService.create(request.body)
  reply.code(201)
  return user
}

export default { getUsers, createUser }

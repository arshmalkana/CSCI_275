// test/basic.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import appPlugin from '../src/server.js'
import userSchema from '../src/schemas/userSchema.js'

test('GET /users should return users', async () => {
  const app = Fastify()
  app.addSchema(userSchema)
  await app.register(appPlugin)

  const res = await app.inject({ method: 'GET', url: '/users' })
  assert.equal(res.statusCode, 200)
  assert.ok(Array.isArray(JSON.parse(res.payload)))
})

test('POST /users should create a new user', async () => {
  const app = Fastify()
  app.addSchema(userSchema)
  await app.register(appPlugin)

  const res = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { name: 'NewUser', age: 30 }
  })

  assert.equal(res.statusCode, 201)
  assert.equal(JSON.parse(res.payload).name, 'NewUser')
})

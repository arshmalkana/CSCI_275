// src/schemas/userSchema.js
export default {
  $id: 'userSchema',
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  }
}

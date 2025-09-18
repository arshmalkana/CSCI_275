// src/services/userService.js
// Mock service (later replace with DB calls)
let users = [{ id: 1, name: 'Arsh', age: 21 }]

export async function findAll() {
  return users
}

export async function create(data) {
  const newUser = { id: users.length + 1, ...data }
  users.push(newUser)
  return newUser
}

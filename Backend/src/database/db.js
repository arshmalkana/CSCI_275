// src/database/db.js
import pg from 'pg'
const { Pool } = pg

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ahpunjab_db',
  user: process.env.DB_USER || 'ahpunjab',
  password: process.env.DB_PASSWORD || 'ahpunjab_dev_2024',
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err)
  process.exit(-1)
})

// Query helper function
export const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Get a client from pool for transactions
export const getClient = async () => {
  const client = await pool.connect()
  return client
}

export default pool

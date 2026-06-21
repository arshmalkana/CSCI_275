// src/database/db.js
import pg from 'pg'
import log from '../utils/logger.js'

const { Pool } = pg

const IS_PROD = process.env.NODE_ENV === 'production'

if (IS_PROD && !process.env.DB_PASSWORD) {
  throw new Error('FATAL: DB_PASSWORD env var is required in production')
}

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ahpunjab_db',
  user: process.env.DB_USER || 'ahpunjab',
  password: process.env.DB_PASSWORD || 'ahpunjab_dev_2024',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('connect', () => {
  log.info('Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  log.error({ err }, 'Unexpected error on idle database client')
  process.exit(-1)
})

// Query helper function
export const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    log.debug({ text, duration, rows: res.rowCount }, 'Executed query')
    return res
  } catch (error) {
    log.error({ err: error, text }, 'Database query error')
    throw error
  }
}

// Get a client from pool for transactions
export const getClient = async () => {
  const client = await pool.connect()
  return client
}

export default pool

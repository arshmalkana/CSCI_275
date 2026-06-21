import crypto from 'node:crypto'
import { query } from '../database/db.js'
import { sendPasswordResetEmail } from './emailService.js'
import authService from './authService.js'

const TOKEN_TTL_HOURS = 1

function sha256(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function requestPasswordReset(email) {
  // Find staff by email
  const res = await query(
    'SELECT staff_id, email, full_name FROM staff WHERE LOWER(email) = LOWER($1) AND is_active = TRUE LIMIT 1',
    [email]
  )

  // Always respond success to prevent email enumeration
  if (!res.rows.length) return { sent: false }

  const staff = res.rows[0]

  // Invalidate any previous unused tokens for this staff
  await query(
    'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE staff_id = $1 AND used_at IS NULL',
    [staff.staff_id]
  )

  // Create a new token
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = sha256(rawToken)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)

  await query(
    'INSERT INTO password_reset_tokens (staff_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [staff.staff_id, tokenHash, expiresAt]
  )

  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
  const resetLink = `${frontendOrigin}/reset-password?token=${rawToken}`

  await sendPasswordResetEmail(staff.email, resetLink)

  return { sent: true }
}

export async function resetPassword(rawToken, newPassword) {
  if (!rawToken || !newPassword || newPassword.length < 8) {
    const err = new Error('Invalid token or password too short (min 8 chars)')
    err.statusCode = 400
    throw err
  }

  const tokenHash = sha256(rawToken)

  const res = await query(`
    SELECT prt.token_id, prt.staff_id, prt.expires_at, prt.used_at
    FROM password_reset_tokens prt
    WHERE prt.token_hash = $1
  `, [tokenHash])

  if (!res.rows.length) {
    const err = new Error('Invalid or expired reset token')
    err.statusCode = 400
    throw err
  }

  const { token_id, staff_id, expires_at, used_at } = res.rows[0]

  if (used_at) {
    const err = new Error('This reset link has already been used')
    err.statusCode = 400
    throw err
  }

  if (new Date() > new Date(expires_at)) {
    const err = new Error('Reset link has expired — please request a new one')
    err.statusCode = 400
    throw err
  }

  const newHash = await authService.hashPassword(newPassword)

  await query('UPDATE staff SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE staff_id = $2', [newHash, staff_id])
  await query('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_id = $1', [token_id])

  return { success: true }
}

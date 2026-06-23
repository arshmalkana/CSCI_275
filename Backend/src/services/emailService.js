import { Resend } from 'resend'
import log from '../utils/logger.js'

const IS_PROD = process.env.NODE_ENV === 'production'
const EMAIL_FROM = process.env.EMAIL_FROM || 'AH Punjab <noreply@ahdp.in>'

function getClient() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (IS_PROD) throw new Error('FATAL: RESEND_API_KEY env var is required in production')
    return null
  }
  return new Resend(key)
}

export async function sendPasswordResetEmail(toEmail, resetLink) {
  const client = getClient()

  const payload = {
    from: EMAIL_FROM,
    to: [toEmail],
    subject: 'Password Reset — AH Punjab Reporting',
    text: [
      'You requested a password reset for your AH Punjab account.',
      '',
      `Reset link (valid 1 hour): ${resetLink}`,
      '',
      'If you did not request this, ignore this email.',
    ].join('\n'),
    html: `
      <p>You requested a password reset for your <strong>AH Punjab</strong> account.</p>
      <p><a href="${resetLink}" style="background:#f59e0b;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Reset Password
      </a></p>
      <p style="color:#6b7280;font-size:13px;">Link expires in 1 hour. If you did not request this, ignore this email.</p>
    `,
  }

  if (!client) {
    log.info({ to: toEmail, resetLink }, 'Password reset email (dev mode — not sent via Resend)')
    return
  }

  const { data, error } = await client.emails.send(payload)
  if (error) throw new Error(`Resend error: ${error.message}`)
  return data
}

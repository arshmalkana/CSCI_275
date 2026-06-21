import nodemailer from 'nodemailer'
import log from '../utils/logger.js'

const IS_PROD = process.env.NODE_ENV === 'production'

function createTransport() {
  if (IS_PROD) {
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
    const missing = required.filter(k => !process.env[k])
    if (missing.length) throw new Error(`FATAL: Missing SMTP env vars: ${missing.join(', ')}`)

    return nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Development: print to console, no real sending
  return nodemailer.createTransport({ jsonTransport: true })
}

export async function sendPasswordResetEmail(toEmail, resetLink) {
  const transport = createTransport()
  const from = process.env.SMTP_FROM || 'AH Punjab <noreply@ahpunjab.gov.in>'

  const info = await transport.sendMail({
    from,
    to: toEmail,
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
  })

  if (!IS_PROD) {
    log.info({ email: JSON.parse(info.message) }, 'Password reset email sent (dev mode — not real)'  )
  }

  return info
}

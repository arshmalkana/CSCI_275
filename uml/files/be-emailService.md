# File: Backend/src/services/emailService.js

Thin wrapper around Resend for transactional email. Currently only sends password-reset emails.

```mermaid
flowchart TD
    A[emailService.js] --> G[getClient\nreturns Resend instance or null]
    A --> S[sendPasswordResetEmail toEmail, resetLink]

    G --> G1{RESEND_API_KEY set?}
    G1 -->|no + prod| G2[throw FATAL error — server refuses to start]
    G1 -->|no + dev| G3[return null — dev mode]
    G1 -->|yes| G4[return new Resend key]

    S --> S1[getClient]
    S1 --> S2[build payload:\nfrom: EMAIL_FROM env or noreply@ahdp.in\nto: toEmail\nsubject: Password Reset — AH Punjab Reporting\ntext + HTML body with amber Reset Password button]
    S2 --> S3{client is null?}
    S3 -->|yes| S4[log.info { to, resetLink } dev mode — not sent\nreturn undefined]
    S3 -->|no| S5[client.emails.send payload]
    S5 --> S6{error?}
    S6 -->|yes| S7[throw Error Resend error: message]
    S6 -->|no| S8[return Resend data object]
```

**Configuration:**
- `RESEND_API_KEY` — Resend API key (required in production).
- `EMAIL_FROM` — sender address; defaults to `AH Punjab <noreply@ahdp.in>`.
- `NODE_ENV` — when `production`, missing API key is a fatal startup error.

**Dev mode:** When `RESEND_API_KEY` is absent in development, the email payload is logged to stdout at info level (with the full reset link) so developers can test without an email account.

**Extension point:** Additional email types (report deadline reminders, approval notifications) would be added as new exported functions in this file, each calling `getClient()` internally.

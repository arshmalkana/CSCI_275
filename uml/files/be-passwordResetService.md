# File: Backend/src/services/passwordResetService.js

Handles the forgot-password flow: generates a one-time token, emails a reset link, and validates the token when the user submits a new password.

```mermaid
flowchart TD
    A[passwordResetService.js] --> R[requestPasswordReset email]
    A --> P[resetPassword rawToken, newPassword]

    R --> R1[SELECT staff WHERE email=$1 AND is_active=TRUE]
    R1 --> R2{found?}
    R2 -->|no| R3[return { sent: false }\nno error — prevents email enumeration]
    R2 -->|yes| R4[UPDATE password_reset_tokens\nSET used_at=now WHERE staff_id=$1 AND used_at IS NULL\n— invalidate previous tokens]
    R4 --> R5[crypto.randomBytes 32 → rawToken\nsha256 rawToken → tokenHash]
    R5 --> R6[INSERT password_reset_tokens\n staff_id, token_hash, expires_at=now+1h]
    R6 --> R7[build resetLink: FRONTEND_ORIGIN/reset-password?token=rawToken]
    R7 --> R8[sendPasswordResetEmail email, resetLink]
    R8 --> R9[return { sent: true }]

    P --> P1{rawToken valid? newPassword >= 8 chars?}
    P1 -->|no| P2[throw 400]
    P1 -->|yes| P3[sha256 rawToken → tokenHash\nSELECT password_reset_tokens WHERE token_hash=$1]
    P3 --> P4{token exists?}
    P4 -->|no| P5[throw 400 Invalid or expired token]
    P4 -->|yes| P6{used_at IS NULL AND expires_at > now?}
    P6 -->|no| P7[throw 400 Token already used or expired]
    P6 -->|yes| P8[argon2.hash newPassword]
    P8 --> P9[UPDATE staff SET password_hash=$1 WHERE staff_id=$2]
    P9 --> P10[UPDATE password_reset_tokens SET used_at=now WHERE token_id=$1]
    P10 --> P11[authService.revokeAllRefreshTokens staffId\n— log out all sessions after password change]
    P11 --> P12[return { success: true }]
```

**Security details:**
- Only the SHA-256 hash of the token is stored in the DB; the raw token travels only in the email link.
- Email enumeration is prevented: `requestPasswordReset` always returns `{ sent: false }` for unknown emails (no 404).
- After a successful reset, all existing refresh tokens for that user are revoked, forcing re-login on all devices.
- Token TTL is 1 hour (`TOKEN_TTL_HOURS = 1`).

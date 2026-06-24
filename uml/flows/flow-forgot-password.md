# Flow: Forgot Password → Reset

```mermaid
sequenceDiagram
    actor User
    participant FP as ForgetPasswordScreen.tsx
    participant RP as ResetPasswordScreen.tsx
    participant BE as Backend
    participant PRS as passwordResetService.js
    participant ES as emailService.js
    participant DB as PostgreSQL

    User->>FP: Enter userId / email
    FP->>BE: POST /v1/auth/forgot-password {userId}
    BE->>PRS: createResetToken(userId)
    PRS->>DB: SELECT staff WHERE user_id=$1
    PRS->>PRS: generate random token, hash SHA-256
    PRS->>DB: INSERT password_reset_tokens (hash, expires 1h)
    PRS->>ES: sendPasswordResetEmail(email, rawToken)
    ES-->>User: Email with reset link
    BE-->>FP: 200 (always — no user enumeration)

    User->>RP: Click link → /reset-password?token=...
    RP->>BE: POST /v1/auth/reset-password {token, newPassword}
    BE->>PRS: consumeResetToken(token, newPassword)
    PRS->>DB: SELECT WHERE token_hash=SHA256(token) AND used_at IS NULL AND expires_at > NOW()
    alt valid token
        PRS->>PRS: argon2id.hash(newPassword)
        PRS->>DB: UPDATE staff SET password_hash=?
        PRS->>DB: UPDATE password_reset_tokens SET used_at=NOW()
        PRS->>DB: DELETE refresh_tokens WHERE staff_id=? (revoke all sessions)
        BE-->>RP: 200
        RP->>Router: navigate /login
    else expired/used
        BE-->>RP: 400 "Token invalid or expired"
    end
```

**Key files:**
- `ahpunjabfrontend/src/screens/ForgetPasswordScreen.tsx`, `ResetPasswordScreen.tsx`
- `Backend/src/services/passwordResetService.js`
- `Backend/src/services/emailService.js`
- `Backend/src/routes/auth.js`
- `Database/schema.sql` — `password_reset_tokens` table (section 28)

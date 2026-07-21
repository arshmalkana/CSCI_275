# File: PWA/src/screens/ResetPasswordScreen.tsx

Loaded via the email reset link: `/reset-password?token=<rawToken>`. Public screen (no auth).

```mermaid
flowchart TD
    A[ResetPasswordScreen] --> B[Extract token from URL\nuseSearchParams token]
    B --> C{token present?}
    C -->|no| D[Error: Invalid reset link\nButton: Back to Login]
    C -->|yes| E[Form:\nnewPassword FloatingLabelField\nconfirmPassword FloatingLabelField]

    E --> F[Submit]
    F --> G{client validation\npasswords match AND length >= 8?}
    G -->|no| H[inline error]
    G -->|yes| I[POST /v1/auth/reset-password\nbody: { token, newPassword }]

    I --> J{response}
    J -->|200| K[Success screen:\nPassword reset!\nLog in with new password\n→ /login]
    J -->|400 invalid/expired token| L[Error: Link has expired or already used\nRequest a new one → /forgot-password]
    J -->|400 password too short| M[Error: Minimum 8 characters]
    J -->|other| N[Generic error]
```

**Notes:**
- The raw token in the URL is a 32-byte hex string; only its SHA-256 hash is stored in the DB.
- After successful reset, all the user's existing refresh tokens are revoked server-side.
- Token is one-time use: the `password_reset_tokens.used_at` is set on consumption, blocking replay.
- Expired tokens (older than 1 hour) return the same 400 as invalid tokens to avoid timing attacks.

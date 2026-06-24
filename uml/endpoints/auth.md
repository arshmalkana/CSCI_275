# Endpoints: Authentication

```mermaid
sequenceDiagram
    participant C as Client
    participant M as authenticate middleware
    participant R as routes/auth.js
    participant S as authService.js
    participant DB as PostgreSQL

    Note over C,DB: POST /v1/auth/login
    C->>R: POST /auth/login {userId, password}
    R->>S: login(userId, password)
    S->>DB: SELECT staff WHERE user_id=$1
    S->>S: argon2.verify(hash, password)
    S->>DB: INSERT refresh_tokens
    S-->>R: {accessToken, user}
    R-->>C: 200 Set-Cookie:refreshToken {accessToken, user}

    Note over C,DB: POST /v1/auth/logout
    C->>M: authenticate (verifies JWT)
    M->>R: POST /auth/logout
    R->>S: logout(refreshToken from cookie)
    S->>DB: UPDATE refresh_tokens SET is_revoked=true
    R-->>C: 200 Set-Cookie:refreshToken="" (cleared)

    Note over C,DB: POST /v1/auth/refresh
    C->>R: POST /auth/refresh (refreshToken cookie)
    R->>S: refreshAccessToken(tokenHash)
    S->>DB: SELECT refresh_tokens WHERE hash=? AND NOT revoked AND NOT expired
    S->>S: sign new 15min JWT
    S->>DB: UPDATE last_used_at
    S-->>R: {accessToken}
    R-->>C: 200 {accessToken}

    Note over C,DB: POST /v1/auth/forgot-password
    C->>R: POST /auth/forgot-password {userId}
    R->>S: createResetToken(userId)
    S->>DB: INSERT password_reset_tokens
    S->>emailService: sendResetEmail
    R-->>C: 200 (always, no enumeration)

    Note over C,DB: POST /v1/auth/reset-password
    C->>R: POST /auth/reset-password {token, newPassword}
    R->>S: consumeResetToken(token, newPassword)
    S->>DB: SELECT WHERE hash=SHA256(token) AND unused AND not expired
    S->>DB: UPDATE staff.password_hash (argon2id)
    S->>DB: UPDATE token used_at
    S->>DB: DELETE all refresh_tokens for staff (revoke all sessions)
    R-->>C: 200
```

**Key files:** `Backend/src/routes/auth.js`, `Backend/src/services/authService.js`, `Backend/src/services/passwordResetService.js`, `Backend/src/services/refreshTokenService.js`

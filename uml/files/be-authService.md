# File: Backend/src/services/authService.js

```mermaid
flowchart TD
    subgraph IMPORTS
        DB[database/db.js query]
        JWT[utils/jwt.js]
        ARGON[argon2 library]
        RTS[refreshTokenService.js]
    end

    LOGIN["login(userId, password)"] --> DB1[SELECT staff WHERE user_id=?]
    DB1 -->|not found| ERR401[401 Invalid credentials]
    DB1 -->|found| ARGON1[argon2.verify password_hash]
    ARGON1 -->|wrong| ERR401
    ARGON1 -->|correct| JWT1[generateAccessToken 15m]
    JWT1 --> RTS1[refreshTokenService.createToken]
    RTS1 --> DB2[INSERT refresh_tokens\nhash SHA256, 7-day expiry]
    JWT1 & DB2 --> RET1[return {accessToken, refreshToken, user}]

    LOGOUT["logout(refreshToken)"] --> RTS2[refreshTokenService.revokeToken]
    RTS2 --> DB3[UPDATE refresh_tokens\nSET is_revoked=true]

    REFRESH["refreshAccessToken(tokenFromCookie)"] --> RTS3[refreshTokenService.validateToken]
    RTS3 --> DB4[SELECT WHERE hash=? AND NOT revoked AND NOT expired]
    DB4 -->|invalid| ERR401R[401 Refresh token invalid]
    DB4 -->|valid| JWT2[generateAccessToken new 15m]
    JWT2 --> DB5[UPDATE last_used_at]
    JWT2 --> RET2[return {accessToken}]
```

**Key files:** `Backend/src/services/authService.js`, `Backend/src/services/refreshTokenService.js`, `Backend/src/utils/jwt.js`

Login uses Argon2id for password verification (OWASP-recommended). Access tokens are 15 minutes; refresh tokens are 7 days stored as SHA-256 hashes (not raw tokens) in the DB. The frontend sends the refresh token as an HttpOnly cookie — it is never readable by JavaScript.

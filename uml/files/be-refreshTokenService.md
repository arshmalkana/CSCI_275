# File: Backend/src/services/refreshTokenService.js

Manages opaque refresh tokens: SHA-256 hashing, device name parsing, rotation on use, and cleanup of expired tokens.

```mermaid
flowchart TD
    A[refreshTokenService.js] --> H[hashToken rawToken\ncrypto SHA-256 hex digest]
    A --> P[parseDeviceName userAgent\nBrowser + OS detection string]
    A --> C[createToken staffId, userAgent, rememberMe\nreturns { rawToken, expiresAt }]
    A --> R[rotateToken oldRawToken, userAgent\nreturns { rawToken, expiresAt }]
    A --> RV[revokeToken rawToken]
    A --> RA[revokeAllForUser staffId]
    A --> CL[cleanupExpired\nDELETE WHERE expires_at < now]
    A --> LS[listSessions staffId\nreturns active sessions for /profile/sessions]

    C --> C1[crypto.randomBytes 32 → rawToken]
    C1 --> C2[parseDeviceName userAgent → deviceName]
    C2 --> C3[TTL: rememberMe ? 30d : 7d]
    C3 --> C4[INSERT refresh_tokens\ntoken_hash, staff_id, device_name, expires_at]
    C4 --> C5[return { rawToken, expiresAt }]

    R --> R1[hashToken oldRawToken → oldHash]
    R1 --> R2[SELECT refresh_tokens WHERE token_hash=$oldHash\nAND expires_at>now AND revoked_at IS NULL]
    R2 --> R3{found?}
    R3 -->|no| R4[throw 401 Invalid refresh token]
    R3 -->|yes| R5[createToken same staffId, userAgent]
    R5 --> R6[UPDATE old token SET revoked_at=now]
    R6 --> R7[return new { rawToken, expiresAt }]

    RV --> RV1[hashToken → UPDATE revoked_at=now]
    RA --> RA1[UPDATE revoked_at=now WHERE staff_id=$1]
```

**Notes:**
- `rememberMe=true` sets 30-day TTL; `false` sets 7-day TTL.
- `parseDeviceName` extracts browser (Chrome/Firefox/Safari/Edge) and device/OS (iPhone/iPad/Mac/Windows/Android/Linux) from the User-Agent header to populate the Active Sessions screen.
- Token rotation invalidates the old token and issues a new one atomically — prevents refresh token reuse attacks.
- `cleanupExpired` is called by `server.js` on startup and every 24 hours via `setInterval`.

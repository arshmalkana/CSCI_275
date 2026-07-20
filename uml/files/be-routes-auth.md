# File: Backend/src/routes/auth.js

Authentication route definitions. Mounted at `/v1/auth`. Handles login, logout, token refresh, password change, active sessions, and password reset flow.

```mermaid
flowchart TD
    A[auth.js routes\nprefix: /v1/auth] --> B[POST /login\nbody: username, password, rememberMe\nrate limit: 5 per 15 min\n→ authController.login]
    A --> C[POST /logout\n→ authController.logout]
    A --> D[POST /refresh\nbody or cookie: refreshToken\n→ authController.refresh]
    A --> E[POST /change-password\nbody: currentPassword, newPassword\npreHandler: authenticate\n→ authController.changePassword]
    A --> F[GET /sessions\npreHandler: authenticate\n→ authController.listSessions]
    A --> G[DELETE /sessions/:tokenId\npreHandler: authenticate\n→ authController.revokeSession]
    A --> H[POST /forgot-password\nbody: email\nrate limit: 3 per hour\n→ authController.forgotPassword]
    A --> I[POST /reset-password\nbody: token, newPassword\n→ authController.resetPassword]

    subgraph Rate limits
        RL1[Login: 5 req / 15 min\n429 with retryAfter seconds]
        RL2[Forgot-password: 3 req / 1 hour]
    end
```

**Notes:**
- Login rate limit uses a custom `errorResponseBuilder` that includes `retryAfter` in seconds for the PWA to display a countdown.
- `POST /refresh` reads the token from `request.cookies.refreshToken` (HttpOnly cookie) or `request.body.refreshToken`; cookie is preferred.
- `GET /sessions` returns all active (non-revoked, non-expired) refresh tokens for the current user with `deviceName` and `lastUsedAt` so the user can revoke individual sessions from the UI.
- `POST /forgot-password` always returns 200 regardless of whether the email exists (anti-enumeration).

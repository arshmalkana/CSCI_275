# File: Backend/src/server.js

```mermaid
flowchart TD
    E[Entry: app.js / fastify.config.json] --> S[server.js export default plugin]

    S --> C1[@fastify/cookie\ncookieSecret from COOKIE_SECRET env]
    C1 --> C2[plugins/cors.js]
    C2 --> C3[plugins/rateLimiter.js]
    C3 --> C4[preHandler hook: sanitize.js]
    C4 --> C5[setErrorHandler: errors.js]

    C5 --> SCHEMA[addSchema: userSchema.js]
    SCHEMA --> SW1[@fastify/swagger OpenAPI spec]
    SW1 --> SW2[@fastify/swagger-ui /docs]

    SW2 --> R1[routes/auth.js → /v1/auth]
    R1 --> R2[routes/webauthn.js → /v1/auth/webauthn]
    R2 --> R3[routes/register.js → /v1/register]
    R3 --> R4[routes/home.js → /v1/home]
    R4 --> R5[routes/profile.js → /v1/profile]
    R5 --> R6[routes/geo.js → /v1/geo]
    R6 --> R7[routes/reports.js → /v1/reports]
    R7 --> R8[routes/admin.js → /v1/admin]
    R8 --> R9[routes/rollup.js → /v1/rollup]
    R9 --> R10[routes/periods.js → /v1/periods]
    R10 --> R11[routes/notifications.js → /v1/notifications]
    R11 --> R12[routes/push.js → /v1/push]
    R12 --> R13[routes/masterData.js → /v1/admin/master-data]
    R13 --> R14[routes/distributions.js → /v1/admin/distributions]

    R14 --> H1[onReady hook]
    H1 --> H1A[refreshTokenService.cleanupExpiredTokens]
    H1 --> H1B[webauthnService.cleanupExpiredChallenges]
    H1 --> H1C[notificationsService.cleanupExpiredNotifications]
    H1 --> H1D[notificationsService.sendDeadlineReminders]

    H1 --> T1[setInterval 1h: token + challenge + notification cleanup]
    T1 --> T2[setInterval 24h: deadline reminders]
```

**Key files:** `Backend/src/server.js`

Plugin registration is strictly sequential (each `await fastify.register(...)` must complete before the next). Cookies are registered first because auth routes need signed cookies for refresh tokens. Rate limiting applies globally before any route handler runs. The `onReady` hook performs startup maintenance.

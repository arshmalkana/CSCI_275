# Flow: Logout

```mermaid
sequenceDiagram
    actor User
    participant SM as SideMenu.tsx
    participant AC as apiClient.ts
    participant Auth as routes/auth.js
    participant AS as authService.js
    participant DB as PostgreSQL

    User->>SM: Tap "Logout"
    SM->>SM: handleLogout() [async]
    SM->>AC: await authService.logout()
    AC->>AC: cancel any in-flight token refresh
    AC->>Auth: POST /v1/auth/logout (with refreshToken cookie)
    Auth->>AS: logout(refreshToken)
    AS->>DB: UPDATE refresh_tokens SET is_revoked=true WHERE token_hash=$1
    AS-->>Auth: 200
    Auth-->>AC: 200 Set-Cookie: refreshToken="" (cleared)
    AC->>AC: clear accessToken from memory
    AC-->>SM: resolved
    SM->>Router: navigate /login
```

**Why async matters:** Before this fix, `handleLogout` returned without awaiting. The logout POST would race against a background token refresh — the refresh could re-write the accessToken after logout cleared it, leaving a valid session open. Now logout awaits the POST before navigating.

**Key files:**
- `PWA/src/components/SideMenu.tsx` — `handleLogout` is `async`, `await authService.logout()`
- `PWA/src/services/authService.ts` — `logout()` cancels refresh, POSTs logout
- `Backend/src/services/authService.js` — revokes refresh token in DB
- `Backend/src/services/refreshTokenService.js` — `revokeToken()`

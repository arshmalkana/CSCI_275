# Flow: Login (Password + WebAuthn)

## Password Login

```mermaid
sequenceDiagram
    actor User
    participant LS as LoginScreen.tsx
    participant AC as apiClient.ts
    participant Auth as routes/auth.js
    participant AS as authService.js
    participant DB as PostgreSQL

    User->>LS: Enter userId (trimmed) + password
    LS->>AC: POST /v1/auth/login {userId, password}
    AC->>Auth: Request
    Auth->>AS: login(userId, password)
    AS->>DB: SELECT staff WHERE user_id=$1
    DB-->>AS: staff row (password_hash, role, instituteId)
    AS->>AS: argon2.verify(password_hash, password)
    alt valid
        AS->>AS: sign JWT (15min, staffId+role+instituteId)
        AS->>DB: INSERT refresh_tokens (hash, expires 7d)
        AS-->>Auth: {accessToken, user}
        Auth-->>AC: 200 Set-Cookie: refreshToken (HttpOnly)
        AC-->>LS: {accessToken, user}
        LS->>LS: store accessToken in memory
        LS->>LS: check role — Oversight → show error "use oversight panel"
        LS->>Router: navigate /home
    else invalid
        AS-->>Auth: 401
        Auth-->>LS: {message: "Invalid credentials"}
    end
```

## WebAuthn Passkey Login

```mermaid
sequenceDiagram
    actor User
    participant LS as LoginScreen.tsx
    participant AC as apiClient.ts
    participant WA as routes/webauthn.js
    participant WS as webauthnService.js
    participant DB as PostgreSQL

    User->>LS: Enter userId, click "Sign in with passkey"
    LS->>AC: POST /v1/auth/webauthn/authenticate/options {userId}
    AC->>WA: options request
    WA->>WS: generateAuthenticationOptions(userId)
    WS->>DB: SELECT webauthn_credentials WHERE staff_id=?
    WS->>DB: INSERT webauthn_challenges (expires 5min)
    WS-->>LS: {challenge, allowCredentials}
    LS->>Browser: navigator.credentials.get(options)
    Browser-->>LS: assertion (signature + counter)
    LS->>AC: POST /v1/auth/webauthn/authenticate/verify {userId, assertion}
    AC->>WA: verify request
    WA->>WS: verifyAuthentication(userId, assertion)
    WS->>DB: SELECT credential, challenge
    WS->>WS: verify signature, check counter replay
    WS->>DB: UPDATE counter, DELETE challenge
    WS->>AS: issueTokens(staffId)
    AS->>DB: INSERT refresh_tokens
    AS-->>LS: 200 Set-Cookie: refreshToken + {accessToken, user}
    LS->>Router: navigate /home
```

**Key files:**
- `PWA/src/screens/LoginScreen.tsx` — username trim at all 4 call sites, Oversight block
- `Backend/src/services/authService.js` — argon2id verify, JWT sign
- `Backend/src/services/webauthnService.js` — FIDO2 challenge/verify
- `Backend/src/routes/auth.js`, `routes/webauthn.js`

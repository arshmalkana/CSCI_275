# File: ahpunjabfrontend/src/services/authService.ts

Authentication state manager — token storage, login, logout, user retrieval.

```mermaid
flowchart TD
    A[login - username, password] --> B["POST /v1/auth/login
credentials: include for cookie"]
    B --> C{response.ok?}
    C -->|yes| D["localStorage.setItem authToken, tokenExpiry, user"]
    D --> E[return LoginResponse]
    C -->|no| F[return error response]

    G[logout] --> H["DELETE /v1/auth/logout
with current token"]
    H --> I["localStorage.removeItem authToken, tokenExpiry, user"]
    I --> J[return void]

    K[isAuthenticated] --> L{authToken in localStorage?}
    L -->|no| M[return false]
    L -->|yes| N{tokenExpiry > now - 30s?}
    N -->|no| O[return false — expired]
    N -->|yes| P[return true]

    Q[getUser] --> R{"user in localStorage?"}
    R -->|no| S[return null]
    R -->|yes| T[return parsed User object]

    U[refreshToken] --> V["POST /v1/auth/refresh
credentials: include"]
    V --> W{success?}
    W -->|yes| X["localStorage.setItem authToken, tokenExpiry, user"]
    X --> Y[return true]
    W -->|no| Z["localStorage.removeItem all auth keys"]
    Z --> AA[return false]
```

**Token strategy:**
- Access token: localStorage, 15-minute expiry, refreshed by `apiClient.ts` on 401
- Refresh token: HttpOnly cookie (never accessible from JS), 7-day rolling

**File:** `ahpunjabfrontend/src/services/authService.ts`

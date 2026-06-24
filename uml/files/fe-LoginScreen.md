# File: ahpunjabfrontend/src/screens/LoginScreen.tsx

Password + passkey login with Oversight block.

```mermaid
flowchart TD
    A[LoginScreen] --> B[render form]
    B --> C[FloatingLabelField: User ID]
    B --> D[FloatingLabelField: Password]
    B --> E[Submit button]
    B --> F[Passkey button - if supported]
    B --> G[Forgot password link]

    C -->|onChange| H[trim whitespace on userId]

    E -->|click| I[handlePasswordLogin]
    I --> J["authService.login(userId, password)"]
    J --> K{success?}
    K -->|yes| L{isFieldRole user.role?}
    L -->|no — Oversight| M[logout + show error: Use oversight panel]
    L -->|yes| N[navigate to /home]
    K -->|no| O[show error message]

    F -->|click| P[handlePasskeyLogin]
    P --> Q["webauthnService.startAuthentication()"]
    Q --> R["POST /v1/auth/webauthn/authenticate"]
    R --> S{verified?}
    S -->|yes| T[save token + navigate /home]
    S -->|no| U[show error]
```

**Oversight block:** Even if an Oversight user's credentials are valid, they are logged out immediately and shown "Please use the oversight panel." This prevents privilege confusion.

**File:** `ahpunjabfrontend/src/screens/LoginScreen.tsx`

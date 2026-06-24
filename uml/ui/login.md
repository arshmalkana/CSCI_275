# UI: Login Screen

```mermaid
graph TD
    A[LoginScreen] --> B[PWAWrapper - safe-top inset]
    B --> C[Logo + App Title]
    B --> D[Tagline]
    B --> E[Form Card]

    E --> F[FloatingLabelField: User ID]
    E --> G[FloatingLabelField: Password - toggle show/hide]
    E --> H[Login Button - yellow gradient]

    E --> I{WebAuthn supported?}
    I -->|yes| J[Sign in with Passkey button]

    E --> K[Forgot Password link → /forgot-password]

    B --> L[Version / build stamp footer]

    M[Error states] --> N[Invalid credentials toast]
    M --> O[Oversight block: Please use oversight panel]
    M --> P[Account inactive banner]
```

**API calls:** `POST /v1/auth/login`, `POST /v1/auth/webauthn/authenticate-options` + `POST /v1/auth/webauthn/authenticate`

**Roles:** Public (blocks Oversight after successful auth)

**Layout:** Fits entirely on one screen without scrolling (no scroll container needed)

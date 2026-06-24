# File: ahpunjabfrontend/src/App.tsx

Root router with role-gating guards — blocks Oversight from PWA.

```mermaid
flowchart TD
    A[App.tsx] --> B[BrowserRouter + Routes]

    B --> C[PublicRoute wrapper]
    C --> D["/login → LoginScreen"]
    C --> E["/register → RegisterScreen"]
    B --> F["/forgot-password → ForgetPasswordScreen"]
    B --> G["/reset-password → ResetPasswordScreen"]

    B --> H[ProtectedRoute wrapper]
    H --> I["/home → HomeScreen"]
    H --> J["/profile → ProfileScreen"]
    H --> K["/notifications → NotificationsScreen"]
    H --> L["/vaccine-distribution → VaccineDistributionScreen"]
    H --> M["/semen-distribution → SemenDistributionScreen"]
    H --> N["/semen-ledger → SemenLedgerScreen"]
    H --> O["/reports/monthly → MonthlyReportScreen"]
    H --> P["/reports/create → CreateReportScreen"]
    H --> Q["/setup-passkey → PasskeySetupScreen"]
    H --> R["/manage-passkeys → ManagePasskeysScreen"]

    B --> S["/ → Navigate to /login"]
    B --> T["* → 404 page"]

    U[ProtectedRoute] --> V{authService.isAuthenticated?}
    V -->|no| W[Navigate to /login]
    V -->|yes| X{isFieldRole user.role?}
    X -->|no — Oversight user| Y[Navigate to /login]
    X -->|yes| Z[render children]

    AA[PublicRoute] --> BB{isAuthenticated AND isFieldRole?}
    BB -->|yes| CC[Navigate to /home]
    BB -->|no| DD[render children]
```

**Key behaviors:**
- `isFieldRole` comes from `src/config/roles.ts` — blocks Oversight users from logging into PWA
- `useEffect` on mount calls `initializePushNotifications()` when already logged in
- `AllScreensScreen` is lazy-loaded, dev-only

**File:** `ahpunjabfrontend/src/App.tsx`

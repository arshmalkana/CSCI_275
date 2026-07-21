# File: PWA/src/screens/ForgetPasswordScreen.tsx

Public screen (no auth required). User enters their email to receive a password reset link.

```mermaid
flowchart TD
    A[ForgetPasswordScreen] --> B[Email FloatingLabelField]
    B --> C[Submit]
    C --> D{email format valid?}
    D -->|no| E[inline validation error]
    D -->|yes| F[POST /v1/auth/forgot-password\nbody: { email }]

    F --> G[Always 200 response\nanonymized: does not reveal if email exists]
    G --> H[Show success state:\n'If an account exists with that email,\nyou will receive a reset link shortly.']

    H --> I[Back to Login button → /login]

    subgraph Loading state
        LS[Spinner on submit button\ndisabled during request]
    end

    subgraph Rate limit
        RL[Backend enforces 3 requests per hour per IP\n429 shown as: Too many requests, try again later]
    end
```

**Notes:**
- The success message is intentionally vague to prevent email enumeration — the same message is shown whether the email exists or not.
- The 429 rate limit response is the only case where the response differs from success.
- This screen is accessible from the LoginScreen "Forgot Password?" link.

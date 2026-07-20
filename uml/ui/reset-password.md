# UI: Reset Password Screen

Opened via email link. Public screen (no JWT required).

```mermaid
flowchart TD
    A[ResetPasswordScreen] --> TOKEN{token param in URL?}
    TOKEN -->|no| INVALID[Error card\nInvalid reset link\nRequest a new one → /forgot-password]
    TOKEN -->|yes| FORM[Reset form\nnewPassword FloatingLabelField + eye toggle\nconfirmPassword FloatingLabelField + eye toggle]

    FORM --> SUB[Reset Password button\nyellow gradient]

    SUB --> VAL{client validation}
    VAL -->|mismatch| E1[Passwords do not match]
    VAL -->|< 8 chars| E2[Minimum 8 characters]
    VAL -->|valid| API[POST /v1/auth/reset-password\n{ token: urlParam, newPassword }]

    API --> R{response}
    R -->|200| SUCCESS[Success screen:\nYour password has been reset\nLog in with your new password\nGo to Login button → /login]
    R -->|400 expired/used| EXPIRED[Link has expired or already been used\nRequest a new link → /forgot-password]
    R -->|400 validation| E3[Server-side validation error shown]

    subgraph One-time token
        OTT[Token consumed on use\nused_at set in password_reset_tokens\nCannot be reused]
    end
```

**Route:** `/reset-password?token=<hex64>` — the raw token is extracted with `useSearchParams`.

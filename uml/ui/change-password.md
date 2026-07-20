# UI: Change Password Screen

Authenticated user changes their password.

```mermaid
flowchart TD
    A[ChangePasswordScreen] --> H[Header\nBack  ·  Change Password]

    H --> FORM[Centered form\ncurrentPassword FloatingLabelField + eye toggle\nnewPassword FloatingLabelField + eye toggle\nconfirmPassword FloatingLabelField + eye toggle]

    FORM --> SUB[Submit button: Update Password\nyellow gradient, full-width]

    SUB --> VAL{Client validation}
    VAL -->|mismatch| E1[Error below confirmPassword: Passwords do not match]
    VAL -->|too short| E2[Error: Minimum 8 characters]
    VAL -->|valid| API[POST /v1/auth/change-password\n{ currentPassword, newPassword }]

    API --> R{response}
    R -->|200| OK[Success toast\nclear local auth state\nnavigate to /login\nAll sessions revoked server-side]
    R -->|401| E3[Error: Incorrect current password]
    R -->|other| E4[Generic error]

    subgraph Loading
        L[Button shows spinner\ndisabled during request]
    end
```

**After success:** The backend revokes all refresh tokens for the user; `authService.logout()` clears local state; user is redirected to `/login`.

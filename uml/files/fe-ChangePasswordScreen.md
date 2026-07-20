# File: ahpunjabfrontend/src/screens/ChangePasswordScreen.tsx

Allows an authenticated user to change their password. Requires current password confirmation.

```mermaid
flowchart TD
    A[ChangePasswordScreen] --> B[Form:\ncurrentPassword FloatingLabelField + show/hide toggle\nnewPassword FloatingLabelField\nconfirmPassword FloatingLabelField]

    B --> C[Submit]
    C --> D{Client validation}
    D -->|newPassword !== confirmPassword| E[Error: Passwords do not match]
    D -->|newPassword.length < 8| F[Error: Minimum 8 characters]
    D -->|valid| G[POST /v1/auth/change-password\nbody: { currentPassword, newPassword }\npreHandler: authenticate]

    G --> H{response}
    H -->|200| I[Success toast\nAll other sessions revoked\nNavigate to /login\nClear local auth state]
    H -->|401 wrong current password| J[Error: Incorrect current password]
    H -->|other| K[Generic error message]

    subgraph Layout
        LAY[Fixed header: Back + Change Password\nCentered form\nYellow Submit button]
    end
```

**Notes:**
- After a successful password change, `authService` clears the local JWT and the backend revokes all refresh tokens for the user, logging out all other sessions.
- Show/hide password toggles are implemented via `type="text"/"password"` switching on each field independently.
- The `FloatingLabelField` component handles the visual floating label animation.

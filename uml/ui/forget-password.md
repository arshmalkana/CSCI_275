# UI: Forget Password Screen

Public screen. User requests a password reset email.

```mermaid
flowchart TD
    A[ForgetPasswordScreen] --> H[Header\nBack to Login  ·  Forgot Password]

    H --> BODY[Illustration\nExplanatory text: Enter your registered email\nwe will send a reset link]

    BODY --> FORM[email FloatingLabelField\nplaceholder: Email address]

    FORM --> SUB[Send Reset Link\nyellow gradient button]

    SUB --> VAL{email format valid?}
    VAL -->|no| E1[inline: Please enter a valid email]
    VAL -->|yes| API[POST /v1/auth/forgot-password { email }]

    API --> R{response}
    R -->|200 always| SUCCESS[Success state:\nCheck your inbox\nIf an account exists for that email\nyou will receive a link shortly\nBack to Login button]
    R -->|429| E2[Too many requests\nPlease try again later]

    subgraph Security note in UI
        SEC[The 200 success message is always shown\neven if the email is not registered\nto prevent account enumeration]
    end
```

**Navigation:** Accessed from `LoginScreen` "Forgot Password?" link. Back button returns to `/login`.

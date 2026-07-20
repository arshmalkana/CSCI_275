# UI: Passkey Setup Screen

Guides user through registering a new WebAuthn passkey.

```mermaid
flowchart TD
    A[PasskeySetupScreen] --> H[Header\nBack  ·  Add Passkey]

    H --> SUPPORT{window.PublicKeyCredential?}
    SUPPORT -->|no| NOSUPPORT[Not supported card\nYour device does not support passkeys\nUse password login instead\nBack button]
    SUPPORT -->|yes| INTRO[Intro card\nFingerprint / Face / Hardware key illustration\nWhat are passkeys explanation\nFaster and more secure than passwords]

    INTRO --> CTA[Set Up Passkey button\nyellow gradient]

    CTA --> API1[POST /v1/auth/webauthn/register/options\nreturns PublicKeyCredentialCreationOptions JSON]
    API1 --> PROMPT[navigator.credentials.create options\nOS biometric / hardware key prompt]

    PROMPT --> USER{User action}
    USER -->|cancelled| INTRO2[Return to intro screen\nno error — user can retry]
    USER -->|success| API2[POST /v1/auth/webauthn/register/verify\nbody: attestation response base64url-encoded]

    API2 --> RESULT{verified?}
    RESULT -->|200| SUCCESS[Success card\nPasskey registered!\nYou can now sign in with your fingerprint or face\nDone button → /manage-passkeys]
    RESULT -->|error| ERR[Error card\nSetup failed — try again\nUse password login if issue persists]
```

**Technical note:** ArrayBuffers in the `PublicKeyCredential` response are converted to Base64url strings before JSON serialization for transmission to the server.

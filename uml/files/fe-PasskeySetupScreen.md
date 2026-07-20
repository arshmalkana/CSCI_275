# File: ahpunjabfrontend/src/screens/PasskeySetupScreen.tsx

Guides the user through registering a new WebAuthn passkey (biometric or hardware key).

```mermaid
flowchart TD
    A[PasskeySetupScreen] --> B{WebAuthn supported?\nwindow.PublicKeyCredential?}
    B -->|no| C[Not supported message\nThis device does not support passkeys\nBack to Profile]
    B -->|yes| D[Intro screen:\nWhat are passkeys explanation\nSet Up Passkey button]

    D --> E[POST /v1/auth/webauthn/register/options\npreHandler: authenticate\nreturns PublicKeyCredentialCreationOptions]

    E --> F[navigator.credentials.create options\nOS biometric prompt / hardware key tap]
    F --> G{user completed?}
    G -->|cancelled| H[Return to intro screen\nno error shown]
    G -->|success| I[POST /v1/auth/webauthn/register/verify\nbody: attestation response JSON\npreHandler: authenticate]

    I --> J{response}
    J -->|200 verified| K[Success screen:\nPasskey registered!\nYou can now log in with your fingerprint/face\nBack to Profile]
    J -->|error| L[Error: Setup failed\ntry again or use password login]
```

**Notes:**
- `navigator.credentials.create` triggers the platform authenticator (Touch ID, Face ID, Windows Hello, hardware key).
- The attestation response is serialized to JSON using `JSON.stringify` with ArrayBuffer → Base64url conversion before sending to the server.
- `relyingPartyId` is set to the domain (e.g., `ahdp.in`) so passkeys are scoped to the production domain only.

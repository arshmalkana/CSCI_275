# File: Backend/src/routes/webauthn.js

WebAuthn passkey registration and authentication. Mounted at `/v1/auth/webauthn`. Uses `@simplewebauthn/server` under the hood.

```mermaid
flowchart TD
    A[webauthn.js routes\nprefix: /v1/auth/webauthn] --> B[POST /register/options\npreHandler: authenticate\n→ webauthnController.registrationOptions]
    A --> C[POST /register/verify\npreHandler: authenticate\nbody: attestation response\n→ webauthnController.registrationVerify]
    A --> D[POST /authenticate/options\nbody: { username }\nno auth\n→ webauthnController.authenticationOptions]
    A --> E[POST /authenticate/verify\nbody: assertion response + username\nno auth\n→ webauthnController.authenticationVerify]
    A --> F[DELETE /credentials/:credentialId\npreHandler: authenticate\n→ webauthnController.deleteCredential]

    subgraph Registration flow
        B --> B1[webauthnService.generateRegistrationOptions userId\nStore challenge in webauthn_challenges table TTL 5 min]
        B1 --> B2[return PublicKeyCredentialCreationOptions]
        C --> C1[webauthnService.verifyRegistration userId, attestation\nLookup challenge, verify, store credential in webauthn_credentials]
        C1 --> C2[return { verified: true, credentialId }]
    end

    subgraph Authentication flow
        D --> D1[webauthnService.generateAuthenticationOptions username\nStore challenge]
        D1 --> D2[return PublicKeyCredentialRequestOptions]
        E --> E1[webauthnService.verifyAuthentication username, assertion\nVerify signature, update counter, issue JWT + refresh token]
        E1 --> E2[return { token, user } — same shape as password login]
    end
```

**Notes:**
- Challenges are stored in the `webauthn_challenges` table with a 5-minute TTL and consumed on verification (one-time use).
- `webauthn_credentials` stores `credential_id`, `public_key` (COSE format), `sign_count`, `device_name`, and `created_at`.
- Authentication verify issues a JWT and refresh token identical to password login — the rest of the app doesn't distinguish auth method.
- `DELETE /credentials/:credentialId` allows users to remove a passkey from the ManagePasskeys screen.
- Counter verification detects cloned authenticators: if the incoming counter ≤ stored counter, verification fails.

# File: PWA/src/screens/ManagePasskeysScreen.tsx

Lists registered WebAuthn passkeys and allows the user to delete them.

```mermaid
flowchart TD
    A[ManagePasskeysScreen] --> B[GET /v1/auth/webauthn/credentials on mount\nreturns [ { credentialId, deviceName, createdAt, lastUsedAt } ]]

    B --> C{any passkeys?}
    C -->|none| D[Empty state:\nNo passkeys registered\nAdd your first passkey button → /passkey-setup]
    C -->|some| E[Passkey list\neach card: deviceName, createdAt, lastUsedAt]

    E --> F[Delete icon on each card]
    F --> G[Confirm dialog:\nRemove passkey from deviceName?]
    G -->|confirmed| H[DELETE /v1/auth/webauthn/credentials/:credentialId]
    H --> I{response}
    I -->|200| J[Remove from list optimistically\nsuccess toast]
    I -->|error| K[error toast, keep in list]

    E --> L[Add New Passkey button → /passkey-setup]

    subgraph Warning
        W[If deleting last passkey:\nadditional warning: You will only be able to log in with password]
    end
```

**Notes:**
- `deviceName` is the string parsed from the User-Agent at registration time (e.g., "Chrome on iPhone").
- Deleting the last passkey shows an extra warning since the user would be locked to password-only login.
- This screen is linked from ProfileScreen.

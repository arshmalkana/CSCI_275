# File: PWA/src/screens/ActiveSessionsScreen.tsx

Shows all active login sessions (refresh tokens) across devices and allows revoking individual sessions.

```mermaid
flowchart TD
    A[ActiveSessionsScreen] --> B[GET /v1/auth/sessions on mount\nreturns active refresh tokens with deviceName, lastUsedAt, createdAt]

    B --> C[Session list\neach card: deviceName, browser/OS, lastUsedAt\nThis device badge on current session]

    C --> D{Action per session}
    D --> E[Revoke session button on non-current sessions\nconfirm dialog]
    E --> F[DELETE /v1/auth/sessions/:tokenId]
    F --> G{response}
    G -->|200| H[Remove from list\nsuccess toast]
    G -->|error| I[error toast]

    C --> J[Revoke All Other Sessions button\nDELETE /v1/auth/sessions/all-others]
    J --> K[Removes all sessions except current\nRefetch list]

    subgraph Security notice
        SN[If you see a session you don't recognize,\nrevoke it and change your password.]
    end
```

**Notes:**
- The current session is identified by matching the current JWT's `jti` (token ID) against the session list.
- "Revoke All Other Sessions" is a one-click security measure for account compromise scenarios.
- `deviceName` is parsed from the User-Agent at login time by `refreshTokenService.parseDeviceName()`.
- This screen is linked from ProfileScreen under Security settings.

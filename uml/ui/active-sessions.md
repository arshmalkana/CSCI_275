# UI: Active Sessions Screen

View and revoke active login sessions across all devices.

```mermaid
flowchart TD
    A[ActiveSessionsScreen] --> H[Header\nBack  ·  Active Sessions]

    H --> LOAD[GET /v1/auth/sessions\nreturns active refresh tokens]

    LOAD --> LIST[Session list]

    LIST --> CURRENT[Current session card\n This device  badge\ndeviceName  ·  Started date\nNo revoke button cannot revoke self]

    LIST --> OTHER[Other session cards\ndeviceName  ·  last used date\nRevoke button]

    OTHER --> REVOKE[Revoke button → confirm dialog\nDELETE /v1/auth/sessions/:tokenId\n200 → remove from list]

    LIST --> REVOKEALL[Revoke All Other Sessions button at bottom\nDELETE /v1/auth/sessions/all-others\nRefetch list — only current session remains]

    subgraph Security prompt
        SP[If unrecognized session detected:\nHighlighted warning banner\nRevoke it and change your password]
    end
```

**Linked from:** ProfileScreen → Security section.

**Device identification:** `deviceName` is parsed from the User-Agent at login time: browser + OS (e.g., "Chrome on iPhone", "Safari on Mac").

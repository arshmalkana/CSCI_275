# File: Backend/src/middleware/authenticate.js

```mermaid
flowchart TD
    REQ[Incoming Request] --> AH{Authorization header?\nBearer token?}
    AH -->|No| R401A[401 Access token required]
    AH -->|Yes| VT[jwtUtils.verifyAccessToken\ntoken]

    VT -->|Invalid / expired| R401B[401 Invalid or expired token]
    VT -->|Valid payload| DBCHK[query: SELECT is_active\nFROM staff WHERE staff_id=?]

    DBCHK -->|is_active = false| R401C[401 Account is inactive]
    DBCHK -->|is_active = true| ATTACH[request.user = {\nstaffId, userId, role,\ndesignation, instituteId\n}]

    ATTACH --> ROLL[generateAccessToken\nnew 15-min JWT]
    ROLL --> HEADER[reply.header\nX-New-Token: newToken]
    HEADER --> NEXT[next handler]

    NEXT --> RES[Response carries\nX-New-Token header\nFrontend stores new token]
```

**Key files:** `Backend/src/middleware/authenticate.js`, `Backend/src/utils/jwt.js`

Rolling token strategy: every authenticated request silently issues a new 15-minute JWT in the `X-New-Token` response header. The frontend (`apiClient.ts`) reads this header and stores the new token in memory. This means a continuously-active session never hits the 15-minute expiry; the 7-day refresh token only comes into play when the tab is closed and reopened.

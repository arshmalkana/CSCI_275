# File: Backend/src/config/roles.js

```mermaid
flowchart TD
    subgraph FIELD_ROLES["FIELD_ROLES (PWA only)"]
        CVD[CVD\nVeterinary Officer]
        CVH[CVH\nVet Hospital]
        PAIW[PAIW\nAI Worker]
        SB[SemenBank]
        VB[VaccineBank]
    end

    subgraph OVERSIGHT["OVERSIGHT_ROLE = 'Oversight' (Panel only)"]
        OV[Oversight\nTehsil/District/Punjab HQ]
    end

    ADMIN_ROLES["ADMIN_ROLES = ['Oversight']\nalias for requireAdmin guard"] --> OV
    SENIOR_ADMIN_ROLES["SENIOR_ADMIN_ROLES = ['Oversight']\nlegacy alias — scheduled for removal"] --> OV

    FIELD_ROLES --> PWA[PWA PWA\nApp.tsx ProtectedRoute\n!isFieldRole → redirect to /login]
    OVERSIGHT --> PANEL[OversightPanel\nOversight-only desktop app]
```

**Key files:** `Backend/src/config/roles.js`, `PWA/src/config/roles.ts`

`OVERSIGHT_ROLE` holds the actual string `'Oversight'` (the agreed placeholder). `ADMIN_ROLES` and `SENIOR_ADMIN_ROLES` are legacy aliases kept during the PWA/panel split — they will be removed once the panel takes over admin routes. Field staff who log in on the PWA will be redirected to `/login` if their role is not in `FIELD_ROLES`.

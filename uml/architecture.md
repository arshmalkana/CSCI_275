# System Architecture

```mermaid
flowchart TD
    subgraph Internet
        CF[Cloudflare Tunnel]
    end

    subgraph Users
        FU["Field Staff\nCVD / CVH / PAIW\nSemenBank / VaccineBank"]
        OV["Oversight Staff\nTehsil / District / Punjab"]
    end

    subgraph Docker["Docker Compose Stack"]
        FE["ahpunjab-frontend\nnginx:80 → :8082\nReact PWA\n(vite-plugin-pwa)"]
        BE["ahpunjab-backend\nFastify :8080\nNode.js ES modules"]
        PG["ahpunjab-postgres\nPostgreSQL :5432\n(internal only)"]
        PGA["ahpunjab-pgadmin\n:5050\n(admin UI)"]
        PANEL["ahpunjabpanel\ndev: :3001\nReact (no PWA plugin)"]
    end

    FU -->|HTTPS| CF
    OV -->|HTTPS| CF
    CF --> FE
    CF --> BE
    FE -->|/v1/* proxy| BE
    PANEL -->|/v1/* proxy| BE
    BE -->|pg pool| PG
    PGA -->|admin| PG

    subgraph RoleMap["Role → App Mapping"]
        R1["CVD / CVH / PAIW\nSemenBank / VaccineBank"] --> FE
        R2["Oversight"] --> PANEL
    end
```

**Two deployments, one backend.** The PWA serves field staff who submit monthly reports, issue/receive vaccines and semen. The panel serves oversight staff (Tehsil/District/Punjab) who approve report sections, compile frozen period reports, and manage master data. The backend enforces role separation: field routes reject Oversight (403), panel routes reject field roles (403).

Key files:
- `ahpunjabfrontend/src/config/roles.ts` — `FIELD_ROLES`, `isFieldRole()`
- `ahpunjabpanel/src/config/roles.ts` — `OVERSIGHT_ROLE`, `isOversightRole()`
- `Backend/src/config/roles.js` — server-side role constants
- `Backend/src/server.js` — route registration with prefixes

# File: Backend/src/routes/distributions.js

Distribution route definitions — separate role guards for vaccine issuers vs semen issuers vs field receivers.

```mermaid
flowchart TD
    A[distributionRoutes plugin] --> B

    B --> C["GET /vaccines
[authenticate, requireVaccineIssuer]
→ getVaccines"]
    B --> D["GET /vaccines/stock
[authenticate, requireVaccineIssuer]
→ getMyStock"]
    B --> E["GET /institutes
[authenticate, requireVaccineIssuer]
→ getReceivingInstitutes"]
    B --> F["POST /vaccines/issue
[authenticate, requireVaccineIssuer]
→ issueVaccine"]
    B --> G["GET /vaccines/received
[authenticate, requireFieldRole]
→ getMyVaccineReceipts"]

    B --> H["GET /semen/types
[authenticate, requireSemenIssuer]
→ getSemenTypes"]
    B --> I["GET /semen/stock
[authenticate, requireFieldRole]
→ getMySemenStock"]
    B --> J["GET /semen/receiving-institutes
[authenticate, requireSemenIssuer]
→ getSemenReceivingInstitutes"]
    B --> K["POST /semen/issue
[authenticate, requireSemenIssuer]
→ issueSemen"]
    B --> L["GET /semen/received
[authenticate, requireFieldRole]
→ getMySemenReceipts"]

    M[requireVaccineIssuer] -->|role not in VaccineBank,CVH| N[403]
    O[requireSemenIssuer] -->|role != SemenBank| P[403]
    Q[requireFieldRole] -->|role not in FIELD_ROLES| R[403]
```

**Registered at:** `server.js` → `fastify.register(routes/distributions.js, {prefix: /v1/admin/distributions})`

**File:** `Backend/src/routes/distributions.js`

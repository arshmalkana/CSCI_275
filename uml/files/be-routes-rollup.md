# File: Backend/src/routes/rollup.js

Rollup route definitions — Oversight only.

```mermaid
flowchart TD
    A[rollupRoutes plugin] --> B

    B --> C["GET /summary
[authenticate, requireAdmin]
→ rollupController.getRollupSummary
Query: ?month=YYYY-MM&drill=instituteId"]
    B --> D["GET /export
[authenticate, requireAdmin]
→ rollupController.exportRollup
Query: ?month&drill&format=pdf|csv"]

    E[requireAdmin] --> F{role in ADMIN_ROLES?}
    F -->|no| G[403 Admin role required]
    F -->|yes| H[pass to handler]
```

**GET /summary response:**

```mermaid
flowchart LR
    A{period closed?} -->|yes — compiled_reports exists| B["return frozen JSONB snapshot
(compiled_reports.payload_json)"]
    A -->|no — live| C["live SUM query across
all approved monthly_reports
for visible institutes"]
```

**Registered at:** `server.js` → `fastify.register(routes/rollup.js, {prefix: /v1/rollup})`

**File:** `Backend/src/routes/rollup.js`

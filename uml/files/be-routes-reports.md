# File: Backend/src/routes/reports.js

Report route definitions with inline role guards.

```mermaid
flowchart TD
    A[reportsRoutes plugin] --> B[addSchema BreedAIData]

    B --> C["POST /monthly
[authenticate, requireFieldRole]
→ reportsController.submitReport"]
    B --> D["GET /fiscal-years
[authenticate]
→ reportsController.getFiscalYears"]
    B --> E["GET /monthly
[authenticate]
→ reportsController.listReports"]
    B --> F["GET /monthly/:month
[authenticate]
→ reportsController.getReport"]
    B --> G["GET /monthly/:month/pdf
[authenticate]
→ reportsController.downloadReportPDF"]
    B --> H["PATCH /monthly/:month/approve-sections
[authenticate, requireAdminRole]
→ reportsController.approveSections"]
    B --> I["PATCH /monthly/:month/reject-section
[authenticate, requireAdminRole]
→ reportsController.rejectSection"]
    B --> J["POST /monthly/:month/close-period
[authenticate, requireAdminRole]
→ reportsController.closeTehsilPeriod"]

    K[requireFieldRole] -->|role not in FIELD_ROLES| L[403 Field role required]
    M[requireAdminRole] -->|role not in ADMIN_ROLES| N[403 Admin role required]
```

**Registered at:** `server.js` → `fastify.register(routes/reports.js, {prefix: /v1/reports})`

**FIELD_ROLES:** CVD, CVH, PAIW, SemenBank, VaccineBank

**ADMIN_ROLES:** Oversight

**File:** `Backend/src/routes/reports.js`

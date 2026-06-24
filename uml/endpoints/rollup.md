# Endpoints: Rollup / Consolidated Summary

```mermaid
sequenceDiagram
    participant A as Oversight user
    participant M as requireAdmin
    participant R as routes/rollup.js
    participant S as rollupService.js
    participant DB as PostgreSQL

    Note over A,DB: GET rollup summary (live or frozen)
    A->>M: GET /v1/rollup/summary?month=2026-04&instituteId=12
    M->>R: Oversight only
    R->>S: getRollupSummary(adminUser, month, instituteId)
    S->>DB: SELECT reporting_periods WHERE institute_id=? AND month=?
    alt period is Closed
        S->>DB: SELECT compiled_reports WHERE period_id=?
        S->>S: parse JSONB payload (frozen snapshot)
        S-->>R: {opd, ai, vaccinations, totalFee, source:'compiled'}
    else period is Open
        S->>DB: SELECT SUM across approved monthly_reports
        S->>DB: SELECT get_fee_summary(instituteId, month)
        S-->>R: {opd, ai, vaccinations, totalFee, source:'live'}
    end
    R-->>A: rollup payload with source flag

    Note over A,DB: Export rollup as PDF/CSV
    A->>M: GET /v1/rollup/export?month=2026-04&format=pdf
    M->>R: Oversight only
    R->>S: exportRollup(adminUser, month, format)
    S->>S: getRollupSummary (same live/frozen branch)
    S->>S: render template (PDF or CSV)
    R-->>A: binary file response
```

**Key files:** `Backend/src/routes/rollup.js`, `Backend/src/services/rollupService.js`

**Inconsistency flagged:** The panel's `ConsolidatedDashboardScreen.tsx` reads keys `aiSummary`, `opdSummary`, `vaccinationSummary` — but `getRollupSummary` returns `ai`, `opd`, `vaccinations`. Also `total_doses`/`total_animals` vs actual `doses_used`/`animals_vaccinated`. These mismatches mean the panel dashboard renders empty/undefined data.

# Endpoints: Reporting Periods

```mermaid
sequenceDiagram
    participant A as Oversight user
    participant M as requireAdmin
    participant R as routes/periods.js
    participant S as periodsService.js
    participant DB as PostgreSQL

    Note over A,DB: List periods
    A->>M: GET /v1/periods?instituteId=12
    M->>R: Oversight only
    R->>S: listPeriods(adminUser, instituteId)
    S->>DB: SELECT reporting_periods WHERE institute_id=? ORDER BY month DESC
    R-->>A: [{period_id, month, status, closed_at, compiled_id}]

    Note over A,DB: Create period (open a new month)
    A->>M: POST /v1/periods {month: '2026-05', instituteId: 12}
    M->>R: Oversight only
    R->>S: createPeriod(adminUser, month, instituteId)
    S->>DB: assertInstituteInScope(adminUser, instituteId)
    S->>DB: INSERT reporting_periods (status=Open)
    R-->>A: 201 {periodId}

    Note over A,DB: Lock period (close — triggers compile)
    A->>M: POST /v1/periods/:id/close
    M->>R: Oversight only
    R->>S: closePeriod(adminUser, periodId)
    S->>S: delegates to reportsService.closeTehsilPeriod
    S->>DB: validates all submitted reports resolved
    S->>DB: INSERT compiled_reports snapshot
    S->>DB: UPDATE reporting_periods SET status=Closed
    R-->>A: 200 {compiledId}

    Note over A,DB: Reopen period (admin only)
    A->>M: POST /v1/periods/:id/reopen
    M->>R: Oversight only
    R->>S: reopenPeriod(adminUser, periodId)
    S->>DB: UPDATE reporting_periods SET status=Open
    S->>DB: DELETE compiled_reports WHERE period_id=? (invalidate frozen snapshot)
    R-->>A: 200
```

**Key files:** `Backend/src/routes/periods.js`, `Backend/src/services/periodsService.js`, `Backend/src/services/reportsService.js`

Once a period is Closed, rollup reads from `compiled_reports` (frozen JSONB). Reopening deletes the snapshot and switches rollup back to live SUM mode.

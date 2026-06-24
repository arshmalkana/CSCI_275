# Flow: Tehsil Close Period → Frozen Compile

```mermaid
sequenceDiagram
    actor OV as Oversight (Tehsil user)
    participant Panel as Panel ConsolidatedDashboard
    participant BE as Backend
    participant RS as reportsService.js
    participant RUS as rollupService.js
    participant DB as PostgreSQL

    OV->>Panel: Click "Close Period" for 2026-04
    Panel->>Panel: Confirm dialog
    OV->>Panel: Confirm
    Panel->>BE: POST /v1/reports/monthly/2026-04/close-period
    BE->>RS: closeTehsilPeriod(approver, '2026-04')

    RS->>DB: SELECT compiled_reports WHERE tier='Tehsil' AND institute_id=? AND month=?
    alt already closed
        RS-->>BE: 409 "Period already closed"
    end

    RS->>DB: SELECT institutes WHERE reporting_institute_id=approver.instituteId (field children)
    RS->>DB: SELECT monthly_reports WHERE institute_id IN (...) AND status NOT IN ('Approved')
    alt any unapproved submitted reports
        RS-->>BE: 422 "Cannot close: [names] are unapproved"
    end

    RS->>RUS: buildLiveRollup(fieldIds, '2026-04')
    RUS->>DB: SUM opd_report_details, ai_report_details, vaccination_report_details
    RUS-->>RS: {opd, ai, vaccinations, institutes}

    RS->>DB: SELECT get_fee_summary(tehsilId, '2026-04')
    DB-->>RS: fee breakdown per institute

    RS->>DB: INSERT compiled_reports (tier='Tehsil', status='Closed', payload=JSONB)
    Note over DB: payload = {opd, ai, vaccinations, feeSummary, totalFee=62425, closedAt, ...}

    RS-->>Panel: {compiled:true, totalFee:62425}
    Panel->>Panel: Refresh → getRollupSummary → reads from compiled_reports (frozen)
```

**Why this matters:** After close, `getRollupSummary` will ALWAYS return the frozen payload — never live SUM. This matches the physical paper workflow where the Tehsil locks in the month's numbers and sends them up to District.

**Regression anchor:** Talwandi Sabo Tehsil, April 2026 → `totalFee = ₹62,425` (verified in Phase 1).

**Key files:**
- `Backend/src/services/reportsService.js` — `closeTehsilPeriod` (line ~1612)
- `Backend/src/services/rollupService.js` — `buildLiveRollup`, `getRollupSummary`
- `Database/schema.sql` — `compiled_reports` table (section 33), `get_fee_summary` function (section 31)

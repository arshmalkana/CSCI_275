# File: Backend/src/services/reportsService.js

```mermaid
flowchart TD
    subgraph EXPORTS
        SR[saveReport]
        SUB[submitReport]
        AS[approveSections]
        RS[rejectSection]
        CP[closeTehsilPeriod]
        LIST[listReports]
    end

    SR --> DB1[UPSERT monthly_reports\nstatus=Draft, data JSONB]
    SUB --> DB2[UPDATE monthly_reports\nstatus=Submitted]

    AS --> SC[scope.assertInstituteInScope]
    SC -->|out of scope| ERR403[403]
    SC -->|in scope| USS[UPSERT report_section_status\nstatus=Approved per section]
    USS --> CHECK{All 5 sections Approved?}
    CHECK -->|No| DONE1[done — report stays Submitted]
    CHECK -->|Yes| DB3[UPDATE monthly_reports\nstatus=Approved]

    RS --> SC2[scope.assertInstituteInScope]
    SC2 --> USS2[UPSERT report_section_status\nstatus=Rejected]
    USS2 --> DB4[UPDATE monthly_reports\nstatus=Draft]

    CP --> VAL{Any Submitted reports\nin scope?}
    VAL -->|Yes| ERR409[409 Resolve pending first]
    VAL -->|No| LIVE[buildLiveRollup\nSUM across Approved reports]
    LIVE --> FEE[get_fee_summary instituteId month]
    FEE --> SNAP[INSERT compiled_reports\nJSONB payload + totalFee]
    SNAP --> LOCK[UPDATE reporting_periods\nstatus=Closed]
```

**Key files:** `Backend/src/services/reportsService.js`, `Backend/src/utils/scope.js`, `Backend/src/services/rollupService.js`

Per-section status lives in `report_section_status` (one row per report×section). The parent `monthly_reports.status` is derived: all 5 approved → Approved; any rejected → returns to Draft. The `closeTehsilPeriod` compile step is the critical path — once the period is Closed the frozen `compiled_reports` JSONB snapshot becomes the authoritative source for rollup reads at higher tiers.

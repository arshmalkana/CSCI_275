# Flow: Rollup Summary Read (Live vs Frozen)

```mermaid
flowchart TD
    A["GET /v1/rollup/summary?month=2026-04"] --> B[authenticate + requireAdmin]
    B --> C[rollupController.getRollupSummary]
    C --> D[rollupService.getRollupSummary]
    D --> E["getVisibleInstituteIds - scope.js"]
    E --> F{role?}
    F -->|Oversight| G["SELECT WHERE reporting_institute_id = approver.instituteId"]
    F -->|field role| H["return [own instituteId only]"]
    G --> I[scopedIds array]
    H --> I

    I --> J["SELECT compiled_reports WHERE tier='Tehsil'\nAND institute_id=? AND month=?\nAND status='Closed'"]
    J --> K{frozen row exists?}

    K -->|YES - period closed| L["Return payload JSONB directly\n(no DB aggregation)"]
    K -->|NO - period open| M["buildLiveRollup(scopedIds, month)"]
    M --> N["SUM opd_report_details\nSUM ai_report_details\nSUM vaccination_report_details\nGET institutes list"]
    N --> O["Return live aggregation\nfrozen:false"]
    L --> P["Return frozen snapshot\nfrozen:true, closedAt:..."]
    O --> Q[Response to client]
    P --> Q
```

**Key files:**
- `Backend/src/services/rollupService.js` — `getRollupSummary` (checks `compiled_reports` first), `buildLiveRollup`
- `Backend/src/utils/scope.js` — `getVisibleInstituteIds`
- `Backend/src/routes/rollup.js` — `requireAdmin` guard (Oversight only)
- `Database/schema.sql` — `compiled_reports` (section 33)

**Inconsistency flagged (do not fix here):** The panel's `ConsolidatedDashboardScreen.tsx` reads `aiSummary`/`opdSummary`/`vaccinationSummary` but the API returns `ai`/`opd`/`vaccinations`. Panel tables will be empty until this key mismatch is fixed.

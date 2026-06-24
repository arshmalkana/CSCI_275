# File: Backend/src/services/rollupService.js

```mermaid
flowchart TD
    GRS["getRollupSummary(adminUser, month, instituteId)"]
    GRS --> PER[SELECT reporting_periods\nWHERE institute_id=? AND month=?]

    PER -->|status=Closed| FROZEN[SELECT compiled_reports\nWHERE period_id=?]
    FROZEN --> PARSE[parse JSONB payload\nreturn {opd, ai, vaccinations,\ntotalFee, source:'compiled'}]

    PER -->|status=Open| LIVE[buildLiveRollup\nSELECT SUM across approved\nmonthly_reports in scope]
    LIVE --> FEE[get_fee_summary instituteId month]
    FEE --> RETL[return {opd, ai, vaccinations,\ntotalFee, source:'live'}]

    EXP["exportRollup(adminUser, month, format)"] --> GRS
    GRS --> RENDER{format?}
    RENDER -->|pdf| PDF[pdfService.renderRollup]
    RENDER -->|csv| CSV[csv stringify]
    PDF & CSV --> BINARY[binary file response]

    WARN["⚠️ Inconsistency flagged:"]
    WARN --> K1["API returns keys: ai / opd / vaccinations"]
    WARN --> K2["Panel ConsolidatedDashboard reads: aiSummary / opdSummary / vaccinationSummary"]
    WARN --> K3["API: doses_used / animals_vaccinated"]
    WARN --> K4["Panel reads: total_doses / total_animals"]
```

**Key files:** `Backend/src/services/rollupService.js`, `Backend/src/services/reportsService.js`, `Backend/src/services/pdfService.js`

**Known inconsistency (unfixed):** `getRollupSummary` returns `{opd, ai, vaccinations}` but the panel's `ConsolidatedDashboardScreen.tsx` destructures `{aiSummary, opdSummary, vaccinationSummary}` — these will be `undefined`. Vaccination sub-fields are also mismatched (`doses_used` vs `total_doses`). The panel is deferred; document only.

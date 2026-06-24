# Endpoints: Monthly Reports

```mermaid
sequenceDiagram
    participant F as Field Staff (CVD/CVH/PAIW)
    participant M as authenticate + requireFieldRole
    participant R as routes/reports.js
    participant S as reportsService.js
    participant DB as PostgreSQL

    Note over F,DB: List reports for current month
    F->>M: GET /v1/reports/monthly?month=2026-04
    M->>R: pass
    R->>S: listReports(user, month)
    S->>DB: SELECT monthly_reports WHERE institute_id=user.instituteId AND month=?
    R-->>F: [{report_id, status, section_statuses, submitted_at}]

    Note over F,DB: Create / save draft
    F->>M: POST /v1/reports/monthly {month, sections: {ai, vaccination, opd, camp, lab}}
    M->>R: pass
    R->>S: saveReport(user, data)
    S->>DB: UPSERT monthly_reports (status=Draft, data JSONB)
    R-->>F: 201 {reportId}

    Note over F,DB: Submit report
    F->>M: POST /v1/reports/monthly/:id/submit
    M->>R: pass
    R->>S: submitReport(user, reportId)
    S->>DB: SELECT report, verify institute ownership
    S->>DB: UPDATE monthly_reports SET status=Submitted
    R-->>F: 200

    Note over F,DB: Oversight approves sections
    F->>M: PATCH /v1/reports/monthly/:id/sections (requireAdmin)
    M->>R: Oversight only
    R->>S: approveSections(adminUser, reportId, {sections: [ai,opd,...]})
    S->>DB: assertInstituteInScope(adminUser, report.institute_id)
    S->>DB: UPSERT report_section_status SET status=Approved per section
    S->>DB: Check all 5 sections Approved → UPDATE monthly_reports status=Approved
    R-->>F: 200

    Note over F,DB: Oversight rejects a section
    F->>M: PATCH /v1/reports/monthly/:id/sections (requireAdmin, status=Rejected)
    M->>R: Oversight only
    R->>S: rejectSection(adminUser, reportId, sectionName, reason)
    S->>DB: assertInstituteInScope
    S->>DB: UPSERT report_section_status SET status=Rejected
    S->>DB: UPDATE monthly_reports SET status=Draft (returns to field)
    R-->>F: 200

    Note over F,DB: Close period (Oversight/Tehsil)
    F->>M: POST /v1/reports/periods/:month/close (requireAdmin)
    M->>R: pass
    R->>S: closeTehsilPeriod(adminUser, month)
    S->>DB: Check no Submitted reports remain
    S->>DB: buildLiveRollup for scope
    S->>DB: get_fee_summary(instituteId, month)
    S->>DB: INSERT compiled_reports JSONB snapshot
    S->>DB: UPDATE reporting_periods SET status=Closed
    R-->>F: 200 {compiledId}
```

**Key files:** `Backend/src/routes/reports.js`, `Backend/src/services/reportsService.js`, `Backend/src/utils/scope.js`, `Backend/src/services/rollupService.js`

**Critical distinction:** `approveSections` checks per-section status; only when ALL 5 sections (ai_report, vaccination_report, camp_report, opd_report, lab_report) are Approved does the parent `monthly_reports` row flip to Approved. A single `rejectSection` call immediately returns the report to Draft status, requiring the field staff to resubmit after correction.

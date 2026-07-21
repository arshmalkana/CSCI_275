# Flow: Monthly Report Lifecycle

```mermaid
sequenceDiagram
    actor Field as Field Staff (CVD/CVH/PAIW)
    actor Oversight as Oversight (Tehsil)
    participant MRS as MonthlyReportScreen
    participant CRS as CreateReportScreen
    participant BE as Backend /reports
    participant RS as reportsService.js
    participant DB as PostgreSQL

    Field->>MRS: Open Monthly Reports
    MRS->>BE: GET /v1/reports/monthly?month=2026-04
    BE-->>MRS: [{report_id, submission_status, section_statuses}]

    Field->>CRS: Create / Edit report
    CRS->>BE: POST /v1/reports/monthly (full form data)
    BE->>RS: saveReport(user, data) [upsert]
    RS->>DB: UPSERT monthly_reports (status=Draft)
    RS->>DB: INSERT/UPDATE opd/ai/vaccination/lab/cert detail tables

    Field->>CRS: Submit
    CRS->>BE: POST /v1/reports/monthly (with submit:true)
    RS->>DB: UPDATE submission_status='Submitted', submitted_at=NOW()
    RS->>DB: INSERT report_section_status rows (all Pending)
    RS-->>Field: 200

    Oversight->>BE: GET /v1/admin/reports/queue?month=2026-04
    BE-->>Oversight: [{institute, section_statuses:[{section, status, reason}]}]

    loop For each section
        Oversight->>BE: PATCH /v1/reports/monthly/2026-04/approve-sections
        BE->>RS: approveSections(approver, instituteId, [sectionName])
        RS->>DB: UPSERT report_section_status status='Approved'
        RS->>RS: check if ALL 5 sections approved
        alt all approved
            RS->>DB: UPDATE monthly_reports status='Approved'
            RS->>notificationsService: createReportApprovedNotification
        end

        alt reject instead
            Oversight->>BE: PATCH /v1/reports/monthly/2026-04/reject-section
            BE->>RS: rejectSection(approver, instituteId, section, reason)
            RS->>DB: UPSERT report_section_status status='Rejected', reason=?
            RS->>DB: UPDATE monthly_reports status='Draft'
            RS->>notificationsService: createRejectionNotification
        end
    end

    note over Field: Field user sees rejection reason on the report
    Field->>CRS: Fix rejected section, resubmit
    CRS->>BE: POST /v1/reports/monthly (resubmit)
    RS->>DB: status='Submitted', reset section to Pending
```

**Key files:**
- `PWA/src/screens/MonthlyReportScreen.tsx` — lists reports with section status dots
- `PWA/src/screens/CreateReportScreen.tsx` — multi-section form
- `Backend/src/services/reportsService.js` — `saveReport`, `approveSections`, `rejectSection`
- `Backend/src/routes/reports.js` — `requireFieldRole` guard on POST, `requireAdminRole` on PATCH
- `Database/schema.sql` — `monthly_reports`, `report_section_status` (sections 10, 32)

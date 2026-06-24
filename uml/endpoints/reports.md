# Endpoints: Reports (`/v1/reports`)

Monthly report lifecycle — create/save draft, submit, section-level approve/reject, close period.

```mermaid
sequenceDiagram
    participant F as Field Staff (CVD/CVH/PAIW)
    participant O as Oversight (Tehsil)
    participant B as Backend /v1/reports
    participant DB as PostgreSQL

    F->>B: POST /monthly {reportingMonth, status, opd, aiReports, …}
    B->>DB: UPSERT monthly_reports + report_form_data JSONB
    B-->>F: 201 {reportId, reportingMonth, status}

    F->>B: GET /monthly?status=pending&fiscalYear=2025-26
    B->>DB: SELECT reports + section_status join WHERE institute_id=?
    B-->>F: 200 [{reportId, month, status, sectionStatuses[]}]

    F->>B: GET /monthly/2026-04
    B->>DB: SELECT report + form_data JSONB
    B-->>F: 200 {data: {opd, aiReports, …}}

    F->>B: GET /monthly/2026-04/pdf
    B->>B: pdfService.generateReportPDF()
    B-->>F: 200 application/pdf

    O->>B: PATCH /monthly/2026-04/approve-sections {instituteId, sections}
    B->>B: assertInstituteInScope (scope.js)
    B->>DB: UPDATE report_section_status SET status=Approved
    B->>DB: if all 5 sections approved → UPDATE monthly_reports SET status=Approved
    B-->>O: 200 {message}

    O->>B: PATCH /monthly/2026-04/reject-section {instituteId, section, reason}
    B->>DB: UPDATE report_section_status SET status=Rejected
    B->>DB: UPDATE monthly_reports SET status=Draft
    B-->>O: 200 {message}

    O->>B: POST /monthly/2026-04/close-period
    B->>DB: verify all reports Approved
    B->>DB: INSERT compiled_reports {payload_json JSONB snapshot}
    B-->>O: 200 {compiledAt, total}
```

## Route → Guard matrix

| Method | Path | Guard |
|---|---|---|
| POST | /monthly | authenticate + requireFieldRole |
| GET | /monthly | authenticate |
| GET | /monthly/:month | authenticate |
| GET | /monthly/:month/pdf | authenticate |
| PATCH | /monthly/:month/approve-sections | authenticate + requireAdminRole |
| PATCH | /monthly/:month/reject-section | authenticate + requireAdminRole |
| POST | /monthly/:month/close-period | authenticate + requireAdminRole |

**Sections:** `ai_report`, `vaccination_report`, `camp_report`, `opd_report`, `lab_report`

**File:** `Backend/src/routes/reports.js`

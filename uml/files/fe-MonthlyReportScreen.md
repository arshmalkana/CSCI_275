# File: ahpunjabfrontend/src/screens/MonthlyReportScreen.tsx

Report list with section-level status indicators.

```mermaid
flowchart TD
    A[MonthlyReportScreen] --> B["useQuery: api.listReports(filters)"]
    B --> C["GET /v1/reports/monthly?status=&fiscalYear="]
    C --> D[render report list]

    D --> E{reports.length == 0?}
    E -->|yes| F[empty state with Create button]
    E -->|no| G[render ReportCard per item]

    G --> H[ReportCard: month label, StatusBadge]
    H --> I[section status dots - 5 dots: ai, vaccination, camp, opd, lab]
    I --> J{each section status}
    J -->|Approved| K[green dot]
    J -->|Rejected| L[red dot]
    J -->|Pending| M[yellow dot]
    J -->|null| N[gray dot]

    H --> O{report.status == Draft or no report?}
    O -->|yes| P[Edit/Start button → /reports/create?month=]
    O -->|no| Q[View button → /reports/create?month=&readonly=true]

    D --> R[Download PDF button → api.downloadReportPDF(month)]

    A --> S[fiscal year filter: SearchableSelect]
    A --> T[status filter: all/submitted/draft/pending/rejected]
    S -->|change| U[refetch with fiscalYear param]
    T -->|change| V[refetch with status param]
```

**File:** `ahpunjabfrontend/src/screens/MonthlyReportScreen.tsx`

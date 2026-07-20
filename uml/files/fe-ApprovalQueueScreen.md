# File: ahpunjabfrontend/src/screens/ApprovalQueueScreen.tsx

Admin-only screen for reviewing and acting on submitted monthly reports. Only visible to users with an oversight/admin role.

```mermaid
flowchart TD
    A[ApprovalQueueScreen] --> B[GET /v1/admin/reports/queue?month=&status=\non mount + when filters change]
    B --> C[Report list:\neach row: instituteName, month, submittedAt, statusBadge]

    C --> D[Tap report → expand detail panel]
    D --> E[GET /v1/reports/monthly/:month?instituteId=\nload full report sections]

    E --> F{Admin action}
    F --> G[Approve all\nPATCH /v1/admin/reports/monthly/:month/approve\nbody: { instituteId }]
    F --> H[Approve sections\nPATCH /v1/admin/reports/monthly/:month/approve-sections\nbody: { sections: ai_report, opd_report, ... }]
    F --> I[Reject section\nPATCH /v1/admin/reports/monthly/:month/reject-section\nbody: { section, reason }]
    F --> J[Send reminder\nPOST /v1/admin/remind\nbody: { instituteId, month }]

    G & H & I --> K[Refetch queue\nUpdate list optimistically]

    subgraph Filters
        FL[Month picker default current month\nStatus filter: All/Submitted/Approved/Rejected]
    end
```

**Notes:**
- Only institutes within the admin's `reporting_institute_id` scope appear in the queue.
- Section-level approval allows partial approval: admin can approve `ai_report` while returning `opd_report` for correction.
- Rejected sections show the rejection reason to the field staff when they reopen their report.

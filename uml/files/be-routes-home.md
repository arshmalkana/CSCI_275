# File: Backend/src/routes/home.js

Dashboard summary endpoint. Mounted at `/v1/home`. Returns everything the HomeScreen needs in a single request.

```mermaid
flowchart TD
    A[home.js routes\nprefix: /v1/home] --> B[GET /\npreHandler: authenticate\n→ homeController.getDashboardSummary]

    B --> B1[homeService.getDashboardSummary user]
    B1 --> B2[SELECT reporting_targets WHERE institute_id=$1 AND month=$currentMonth]
    B1 --> B3[SELECT monthly_reports WHERE institute_id=$1 ORDER BY month DESC LIMIT 6\nstatus, progress, sections_approved]
    B1 --> B4[SELECT reporting_periods WHERE is_open=TRUE\ndeadline, days_remaining]
    B1 --> B5[scope check: getVisibleInstituteIds user\nfor oversight: count submitted vs total]

    B2 & B3 & B4 & B5 --> B6[return { currentPeriod, targets,\nrecentReports, pendingCount,\nsubmissionStatus, quickStats }]

    subgraph Response
        R[{\n  currentPeriod: { month, deadline, daysRemaining }\n  targets: { opd, ai }\n  recentReports: [ { month, status, progress } ]\n  pendingApprovals: N  ← oversight only\n  submissionStatus: submitted/notStarted/draft\n}]
    end
```

**Notes:**
- For field-role users (`FIELD_ROLES`), `pendingApprovals` is omitted.
- For oversight users, `pendingApprovals` is the count of reports in `Submitted` status within their scope.
- `submissionStatus` reflects the current month's report: `submitted`, `draft`, or `not_started`.
- This is intentionally a single fat endpoint to minimize mobile round-trips on app load.

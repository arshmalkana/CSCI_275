# File: Backend/src/routes/periods.js

Reporting period lifecycle management. Mounted at `/v1/periods`. HQ controls which months are open for submission.

```mermaid
flowchart TD
    A[periods.js routes\nprefix: /v1/periods] --> B[GET /\npreHandler: authenticate\n→ periodsController.listPeriods\nreturns all periods ordered by month DESC]
    A --> C[POST /\nbody: month YYYY-MM, deadline, notes\npreHandler: authenticate + requireSeniorAdmin\n→ periodsController.createPeriod]
    A --> D[PATCH /:month/lock\npreHandler: authenticate + requireSeniorAdmin\n→ periodsController.lockPeriod\nSET is_open=false]
    A --> E[PATCH /:month/reopen\npreHandler: authenticate + requireSeniorAdmin\n→ periodsController.reopenPeriod\nSET is_open=true]

    B --> B1[SELECT reporting_periods\nWHERE is_active=TRUE\nORDER BY month DESC]

    subgraph reporting_periods table
        RP[period_id, month YYYY-MM,\ndeadline DATE, is_open BOOL,\nnotes TEXT, created_by,\ncreated_at, updated_at]
    end

    D -->|side-effect| D1[notificationsService.createNotification\nfor all field staff: period now locked]
```

**Business rules:**
- Only one period per month (`month` is a unique key). `createPeriod` returns 409 if the month already exists.
- Field staff can only submit reports when `is_open = TRUE` for that month; the reports route checks this before allowing `POST /reports/monthly`.
- Reopening a period after lock allows late submissions (used for error corrections approved by HQ).
- `lockPeriod` triggers a notification to all affected field staff.

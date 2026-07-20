# UI: Period Config Screen

HQ Admin controls which reporting months are open for submission.

```mermaid
flowchart TD
    A[PeriodConfigScreen] --> H[Header\nBack  ·  Reporting Periods  ·  + New button]

    H --> LIST[Period list most recent first\ncard: month YYYY-MM, deadline date, status badge, notes]

    LIST --> STATUS{is_open?}
    STATUS -->|open: green| LOCK[Lock button\nconfirm: This will close submission for month\nPATCH /periods/:month/lock]
    STATUS -->|locked: red| REOPEN[Reopen button\nconfirm: Allow late submissions?\nPATCH /periods/:month/reopen]

    H --> NEW[+ New Period → modal]
    NEW --> FORM[Period form\nMonth: YYYY-MM picker\nDeadline: date picker\nNotes: optional text\nPOST /v1/periods]

    FORM --> DUP{409 conflict?}
    DUP -->|yes| ERR[Error: Period for this month already exists]
    DUP -->|no| OK[Add to top of list]

    subgraph Side-effect
        SE[Locking a period → push notification\nto all field staff with open reports]
    end
```

**API calls:** `GET /v1/periods`, `POST /v1/periods`, `PATCH /v1/periods/:month/lock`, `PATCH /v1/periods/:month/reopen`.

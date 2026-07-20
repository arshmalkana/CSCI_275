# File: ahpunjabfrontend/src/screens/PeriodConfigScreen.tsx

HQ Admin screen to manage reporting periods — open new months, set deadlines, lock or reopen.

```mermaid
flowchart TD
    A[PeriodConfigScreen] --> B[GET /v1/periods on mount\nlist all periods ordered by month DESC]

    B --> C[Period list\neach row: month, deadline, is_open badge, notes]

    C --> D[+ Open New Period button → modal]
    D --> E[Period form:\nmonth: YYYY-MM picker\ndeadline: date picker\nnotes: optional\nPOST /v1/periods]

    C --> F[Lock button if is_open=true\nconfirm dialog\nPATCH /v1/periods/:month/lock\nSET is_open=false\nnotifies all field staff]

    C --> G[Reopen button if is_open=false\nconfirm dialog\nPATCH /v1/periods/:month/reopen\nSET is_open=true]

    F & G --> H[Refetch periods list]

    subgraph State indicators
        SI[Open: green badge\nField staff can submit\nLocked: red badge\nSubmission blocked for this month]
    end
```

**Notes:**
- Only one period per `month` value — the API returns 409 if the month already exists.
- Locking a period triggers push notifications + in-app notifications to all field staff whose reports are not yet submitted.
- Reopening is a recoverable action if a field staff member needs to amend after the initial lock.
- Deadline date is informational; the system does not automatically lock periods at deadline — an admin must manually lock.

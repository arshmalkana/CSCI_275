# File: Backend/src/services/periodsService.js

Reporting period lifecycle — create, lock, reopen.

```mermaid
flowchart TD
    A[listPeriods] --> B["SELECT * FROM reporting_periods
ORDER BY reporting_month DESC"]
    B --> C[return periods with isLocked, opensAt, deadline, closesAt]

    D[createPeriod - data] --> E["INSERT INTO reporting_periods
{reporting_month, opens_at, deadline}"]
    E --> F[return periodId]

    G[lockPeriod - month] --> H["UPDATE reporting_periods
SET is_locked=true, closes_at=NOW()
WHERE reporting_month=$1"]
    H --> I["Sends deadline-passed notifications to field staff
with pending/draft reports"]
    I --> J[return updated period]

    K[reopenPeriod - month] --> L["UPDATE reporting_periods
SET is_locked=false, closes_at=NULL
WHERE reporting_month=$1"]
    L --> M[return updated period]

    N[getPeriodForMonth - month] --> O["SELECT * FROM reporting_periods
WHERE reporting_month=$1"]
    O --> P{found?}
    P -->|yes| Q[return period]
    P -->|no| R[return null — period not configured]
```

**Effect of locking:** Field staff can no longer save or submit reports for that month. `POST /reports/monthly` checks `is_locked` and returns 403 if true.

**Called by:** `periodsController.js`, `reportsService.js` (lock check)

**File:** `Backend/src/services/periodsService.js`

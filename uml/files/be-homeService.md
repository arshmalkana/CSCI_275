# File: Backend/src/services/homeService.js

Dashboard data aggregation for the PWA HomeScreen.

```mermaid
flowchart TD
    A[getHomeDashboard - user] --> B{user.role}

    B -->|FIELD_ROLES| C[getFieldDashboard - user]
    C --> D["SELECT current month report status
for user.instituteId"]
    D --> E["SELECT unreadCount FROM notifications
WHERE staff_id=user.staffId"]
    E --> F["SELECT latest distribution receipts (vaccines + semen)
ORDER BY transaction_date DESC LIMIT 3"]
    F --> G[return {reportStatus, unreadCount, recentReceipts, institute}]

    B -->|Oversight| H[getOversightDashboard - user]
    H --> I["SELECT counts: total field institutes,
submitted, approved, pending for current month
WHERE reporting_institute_id=user.instituteId"]
    I --> J["SELECT unreadCount for this Oversight user"]
    J --> K[return {submissionSummary, unreadCount, institute}]
```

**Returned fields (FIELD_ROLES):**
- `reportStatus` — Draft / Submitted / Approved / null (not started)
- `unreadCount` — badge count for notification bell
- `recentReceipts` — last 3 distribution transactions
- `institute` — name, type, tehsil, district

**File:** `Backend/src/services/homeService.js`

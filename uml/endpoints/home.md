# Endpoints: Home / Dashboard

```mermaid
sequenceDiagram
    participant U as Field Staff
    participant M as authenticate
    participant R as routes/home.js
    participant S as homeService.js
    participant DB as PostgreSQL

    U->>M: GET /v1/home
    M->>R: any authenticated user
    R->>S: getDashboardData(user)
    par Fetch pending report status
        S->>DB: SELECT monthly_reports WHERE institute_id=? AND month=current_month
    and Fetch stock summary
        S->>DB: SELECT vaccine_stock + semen_stock WHERE institute_id=?
    and Fetch notifications count
        S->>DB: SELECT COUNT unread notifications WHERE staff_id=?
    and Fetch recent activity
        S->>DB: SELECT last 5 transactions (vaccine + semen)
    end
    S-->>R: {reportStatus, vaccineStock, semenStock, unreadCount, recentActivity}
    R-->>U: 200 dashboard payload
```

**Key files:** `Backend/src/routes/home.js`, `Backend/src/services/homeService.js`

The home endpoint aggregates across multiple tables in parallel queries to minimize latency. The `reportStatus` field tells the PWA whether to show a "submit pending" badge on the Monthly Reporting quick action.

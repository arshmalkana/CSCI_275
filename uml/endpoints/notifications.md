# Endpoints: Notifications

```mermaid
sequenceDiagram
    participant U as Authenticated Staff
    participant M as authenticate
    participant R as routes/notifications.js
    participant S as notificationsService.js
    participant DB as PostgreSQL

    Note over U,DB: List notifications
    U->>M: GET /v1/notifications?unreadOnly=true
    M->>R: authenticated
    R->>S: listNotifications(staffId, filters)
    S->>DB: SELECT notifications WHERE staff_id=? ORDER BY created_at DESC
    R-->>U: [{notif_id, title, body, read_at, archived_at, created_at}]

    Note over U,DB: Mark one as read
    U->>M: PATCH /v1/notifications/:id/read
    M->>R: authenticated
    R->>S: markRead(staffId, notifId)
    S->>DB: UPDATE notifications SET read_at=now() WHERE id=? AND staff_id=?
    R-->>U: 200

    Note over U,DB: Mark all as read
    U->>M: POST /v1/notifications/mark-all-read
    M->>R: authenticated
    R->>S: markAllRead(staffId)
    S->>DB: UPDATE notifications SET read_at=now() WHERE staff_id=? AND read_at IS NULL
    R-->>U: 200 {updated: count}

    Note over U,DB: Archive notification
    U->>M: PATCH /v1/notifications/:id/archive
    M->>R: authenticated
    R->>S: archiveNotification(staffId, notifId)
    S->>DB: UPDATE notifications SET archived_at=now() WHERE id=? AND staff_id=?
    R-->>U: 200

    Note over U,DB: Clear all archived
    U->>M: DELETE /v1/notifications/archived
    M->>R: authenticated
    R->>S: clearArchived(staffId)
    S->>DB: DELETE FROM notifications WHERE staff_id=? AND archived_at IS NOT NULL
    R-->>U: 200
```

**Key files:** `Backend/src/routes/notifications.js`, `Backend/src/services/notificationsService.js`

Notifications are created server-side by events: report approval/rejection, period close, and distribution receipts. They are staff-scoped (each staff member has their own queue). PWA badge count comes from `GET /v1/home` unreadCount field, not a separate poll.

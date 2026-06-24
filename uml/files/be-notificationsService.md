# File: Backend/src/services/notificationsService.js

In-app notification creation, delivery, and cleanup.

```mermaid
flowchart TD
    A[createNotification - staffId, type, title, body, metadata] --> B["INSERT INTO notifications
{staff_id, type, title, body, metadata_json}"]
    B --> C[sendPushNotification if subscribed]
    C --> D[return notificationId]

    E[listNotifications - staffId, filters] --> F["SELECT notifications WHERE staff_id=?
AND archived_at IS NULL
ORDER BY created_at DESC LIMIT 50"]
    F --> G[return rows + unreadCount]

    H[markRead - staffId, notifId] --> I["UPDATE notifications SET read_at=NOW()
WHERE id=? AND staff_id=?"]

    J[markAllRead - staffId] --> K["UPDATE notifications SET read_at=NOW()
WHERE staff_id=? AND read_at IS NULL"]

    L[archiveNotification - staffId, notifId] --> M["UPDATE notifications SET archived_at=NOW()
WHERE id=? AND staff_id=?"]

    N[sendDeadlineReminders] --> O["SELECT reporting_periods WHERE deadline
BETWEEN NOW() AND NOW()+3days"]
    O --> P["SELECT staff WHERE is_active=true AND role IN FIELD_ROLES"]
    P --> Q[createNotification for each staff member]

    R[cleanupExpiredNotifications] --> S["DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL 90 days
AND is_read=true"]
    S --> T[return count deleted]
```

**Called by:** `distributionService.js` (receipt notifications), `reportsService.js` (approval/rejection), `server.js` (startup cleanup + deadline reminders)

**File:** `Backend/src/services/notificationsService.js`

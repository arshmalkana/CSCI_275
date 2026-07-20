# File: Backend/src/routes/notifications.js

In-app notification inbox management. Mounted at `/v1/notifications`. All routes require authentication.

```mermaid
flowchart TD
    A[notifications.js routes\nprefix: /v1/notifications] --> B[GET /\npreHandler: authenticate\nquery: unreadOnly=bool, limit, offset\n→ notificationsController.getNotifications]
    A --> C[PATCH /:id/read\npreHandler: authenticate\n→ notificationsController.markRead]
    A --> D[PATCH /read-all\npreHandler: authenticate\n→ notificationsController.markAllRead]
    A --> E[DELETE /:id\npreHandler: authenticate\n→ notificationsController.deleteNotification]
    A --> F[GET /unread-count\npreHandler: authenticate\n→ notificationsController.getUnreadCount]

    B --> B1[SELECT notifications\nWHERE staff_id=$userId\nAND is_read = false if unreadOnly\nORDER BY created_at DESC\nLIMIT/OFFSET]

    subgraph Notification types
        NT[registration_request\nregistration_approved\nregistration_rejected\nreport_submitted\nreport_approved\nreport_rejected\ndeadline_reminder\nsystem_message]
    end
```

**Notes:**
- `GET /unread-count` is polled periodically by the PWA to update the notification badge in the nav bar.
- Notifications are created by other services (not directly via this API): `notificationsService.createNotification(staffId, type, title, body, metadata)`.
- `cleanupExpired()` is called at server startup and every 24 hours to delete notifications older than 90 days.
- All `PATCH` and `DELETE` operations include an ownership check: `WHERE notification_id=$1 AND staff_id=$userId` prevents users from modifying other users' notifications.

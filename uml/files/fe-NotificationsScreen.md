# File: PWA/src/screens/NotificationsScreen.tsx

In-app notification inbox. Supports mark read, mark all read, and delete.

```mermaid
flowchart TD
    A[NotificationsScreen] --> B[GET /v1/notifications?limit=30 on mount]
    B --> C[Notification list\neach item: icon by type, title, body, time-ago, read indicator]

    C --> D{User action}
    D --> E[Tap notification\nPATCH /v1/notifications/:id/read\nmark as read + navigate to relevant screen if action_url set]
    D --> F[Mark All Read button\nPATCH /v1/notifications/read-all\nupdate all items in local state]
    D --> G[Swipe-to-delete / delete icon\nDELETE /v1/notifications/:id\nremove from list]

    subgraph Notification types and icons
        NT[registration_request → UserPlus icon\nregistration_approved → CheckCircle green\nregistration_rejected → XCircle red\nreport_submitted → FileText\nreport_approved → CheckCircle\nreport_rejected → AlertCircle\ndeadline_reminder → Clock orange\nsystem_message → Bell]
    end

    subgraph Header
        H2[Notifications title\nUnread count badge\nMark All Read button right]
    end
```

**Notes:**
- Unread notifications have a yellow left border accent.
- `action_url` field on a notification (e.g., `/reports/2025-06`) causes tap to navigate there after marking read.
- The unread count badge in the app nav bar polls `GET /v1/notifications/unread-count` every 60 seconds.

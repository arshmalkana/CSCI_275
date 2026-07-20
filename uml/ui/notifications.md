# UI: Notifications Screen

In-app notification inbox.

```mermaid
flowchart TD
    A[NotificationsScreen] --> H[Header\nNotifications  ·  unread-count badge  ·  Mark All Read button]

    H --> LIST[Notification list\neach item: icon, title, body, time-ago\nunread = yellow left border + bold title]

    LIST --> TAP[Tap notification\nPATCH /notifications/:id/read\nnavigate to action_url if set]

    LIST --> SWIPE[Swipe left / delete icon\nDELETE /notifications/:id\nslide out animation]

    H --> MAR[Mark All Read\nPATCH /notifications/read-all\nall items update to read state instantly]

    subgraph Notification icons by type
        IC[registration_request → user-plus\nregistration_approved → check-circle green\nregistration_rejected → x-circle red\nreport_submitted → file-text\nreport_approved → check-circle\nreport_rejected → alert-circle\ndeadline_reminder → clock orange\nsystem_message → bell]
    end

    subgraph Empty state
        ES[No notifications illustration\nYou're all caught up!]
    end
```

**API calls:** `GET /v1/notifications?limit=30`, `PATCH /v1/notifications/:id/read`, `PATCH /v1/notifications/read-all`, `DELETE /v1/notifications/:id`.

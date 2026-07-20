# UI: Notification Settings Screen

Controls push notification preferences and subscription state.

```mermaid
flowchart TD
    A[NotificationSettingsScreen] --> H[Header\nBack  ·  Notification Settings]

    H --> PERM{Browser permission?}
    PERM -->|default| ENABLE[Enable Push Notifications button\nyellow gradient CTA]
    PERM -->|denied| BLOCKED[Blocked notice\nSteps to re-enable in browser settings\nlink to browser settings]
    PERM -->|granted| SETTINGS[Settings panel]

    ENABLE --> REQUEST[Notification.requestPermission\n→ granted → POST /push/subscribe]

    SETTINGS --> TOGGLE_LIST[Toggle list:\nDeadline reminders\nReport approved\nReport rejected\nNew registrations HQ only\nSystem messages]
    TOGGLE_LIST --> SAVE[Auto-save on toggle change\nPATCH /notifications/preferences]

    SETTINGS --> DISABLE[Disable All Push button\nPOST /push/unsubscribe { endpoint }]

    SETTINGS --> TEST[Test Push button\nPOST /push/test\nshows: If a push arrives, setup is working]

    subgraph Current status
        CS[Shows subscription endpoint truncated\nand last active time]
    end
```

**API calls:** `GET /v1/push/vapid-public-key`, `POST /v1/push/subscribe`, `POST /v1/push/unsubscribe`, `PATCH /v1/notifications/preferences`, `POST /v1/push/test`.

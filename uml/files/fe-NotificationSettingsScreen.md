# File: ahpunjabfrontend/src/screens/NotificationSettingsScreen.tsx

Controls which types of push notifications the user receives and manages their push subscription.

```mermaid
flowchart TD
    A[NotificationSettingsScreen] --> B{Push permission state?}
    B -->|default| C[Enable Notifications button\nrequests Notification.requestPermission]
    B -->|denied| D[Show blocked instructions\nlink to browser settings]
    B -->|granted| E[Settings form]

    C --> F{User grants?}
    F -->|yes| G[serviceWorker.pushManager.subscribe\nGET /v1/push/vapid-public-key first\nPOST /v1/push/subscribe with subscription]
    F -->|no| D

    E --> H[Toggle list:\nDeadline Reminders on/off\nReport Approved on/off\nReport Rejected on/off\nNew Registration on/off HQ only\nSystem Messages on/off]
    H --> I[PATCH /v1/notifications/preferences\nbody: { preferences: { ... } }]

    E --> J[Disable All Pushes button\nPOST /v1/push/unsubscribe { endpoint }\nUpdate push_subscriptions is_active=false]

    E --> K[Test Push button dev mode\nPOST /v1/push/test]
```

**Notes:**
- Push subscription state is checked on mount via `serviceWorker.pushManager.getSubscription()`.
- Preferences are stored in the DB; push payloads are filtered server-side before delivery.
- "Disable All Pushes" differs from browser-level denial: it marks the subscription inactive in the DB but the browser permission remains granted, so re-enabling doesn't require another permission dialog.

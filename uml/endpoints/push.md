# Endpoints: /v1/push

Web Push subscription management using the Web Push Protocol (VAPID).

```mermaid
sequenceDiagram
    participant PWA as Service Worker / App
    participant BE as Backend /v1/push
    participant PS as pushService.js
    participant DB as push_subscriptions table
    participant WP as web-push (npm)

    Note over PWA: App loads — fetch VAPID public key first
    PWA->>BE: GET /vapid-public-key (no auth)
    BE-->>PWA: { publicKey: "BF..." }
    Note over PWA: serviceWorker.pushManager.subscribe({<br/>  userVisibleOnly: true,<br/>  applicationServerKey: publicKey<br/>})

    PWA->>BE: POST /push/subscribe (Bearer JWT required)<br/>body: { subscription: { endpoint, expirationTime, keys: {p256dh, auth} } }
    BE->>PS: savePushSubscription(staffId, subscription)
    PS->>DB: UPSERT push_subscriptions (endpoint unique key)<br/>UPDATE last_used_at if exists
    BE-->>PWA: 200 { message: 'Subscribed successfully' }

    Note over BE: When notificationsService.sendDeadlineReminders() runs<br/>or createNotification() triggers push:
    BE->>PS: sendPushNotification(staffId, { title, body, url })
    PS->>DB: SELECT endpoint, p256dh_key, auth_key WHERE staff_id=$1 AND is_active=TRUE
    PS->>WP: webpush.sendNotification(subscription, payload)
    WP-->>PWA: Push delivery (via browser/OS)

    Note over PWA: User unsubscribes (settings screen)
    PWA->>BE: POST /push/unsubscribe (Bearer JWT)<br/>body: { endpoint }
    BE->>PS: removePushSubscription(staffId, endpoint)
    PS->>DB: UPDATE is_active=false WHERE endpoint=$1 AND staff_id=$2
    BE-->>PWA: 200 { message: 'Unsubscribed' }

    Note over PWA: Dev-only test endpoint
    PWA->>BE: POST /push/test (Bearer JWT, rate limit 5/min)
    BE->>PS: sendPushNotification to self
    BE-->>PWA: 200 { message: 'Test notification sent' }
```

**Endpoints:**

| Method | Path | Auth | Rate limit |
|--------|------|------|------------|
| GET | `/v1/push/vapid-public-key` | None | Default |
| POST | `/v1/push/subscribe` | JWT | 10/min |
| POST | `/v1/push/unsubscribe` | JWT | 10/min |
| POST | `/v1/push/test` | JWT | 5/min |

**VAPID config** — set via env vars `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. If keys are absent the service logs a warning and silently skips push delivery.

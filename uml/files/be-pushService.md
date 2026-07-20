# File: Backend/src/services/pushService.js

Manages Web Push subscriptions in the database and delivers push payloads via the `web-push` npm library using VAPID keys.

```mermaid
flowchart TD
    A[pushService.js] --> B[savePushSubscription\nstaffId, subscription]
    A --> C[removePushSubscription\nstaffId, endpoint]
    A --> D[sendPushNotification\nstaffId, payload]
    A --> E[sendTestPush\nstaffId]

    B --> B1{endpoint exists in DB?}
    B1 -->|yes| B2[UPDATE staff_id, p256dh_key, auth_key\nSET last_used_at=now, is_active=TRUE]
    B1 -->|no| B3[INSERT push_subscriptions\n endpoint, p256dh_key, auth_key]

    C --> C1[UPDATE is_active=false\nWHERE endpoint=$1 AND staff_id=$2]

    D --> D1[SELECT endpoint, p256dh_key, auth_key\nWHERE staff_id=$1 AND is_active=TRUE]
    D1 --> D2[for each subscription:\nwebpush.sendNotification subscription, JSON.stringify payload]
    D2 --> D3{410 Gone from browser?}
    D3 -->|yes| D4[UPDATE is_active=false — stale subscription]
    D3 -->|no| D5[log error, continue]

    E --> E1[sendPushNotification staffId\n{ title: 'Test', body: 'Push works!' }]

    subgraph VAPID config
        V[process.env.VAPID_PUBLIC_KEY\nprocess.env.VAPID_PRIVATE_KEY\nprocess.env.VAPID_SUBJECT\nwebpush.setVapidDetails on module load]
    end
```

**Notes:**
- VAPID keys must be set as env vars. If absent, the module logs a warning and `sendPushNotification` is a no-op (no error thrown) so the rest of the notification flow still completes.
- The `410 Gone` status from the push gateway means the browser unsubscribed externally; the service marks it inactive rather than crashing.
- Multiple subscriptions per staff member are supported (same user logged in on multiple devices).

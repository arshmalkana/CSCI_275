# File: Backend/src/routes/push.js

Web Push subscription endpoints. Mounted at `/v1/push`. VAPID key endpoint is public; subscribe/unsubscribe/test require JWT.

```mermaid
flowchart TD
    A[push.js routes\nprefix: /v1/push] --> B[GET /vapid-public-key\nno auth — called before login for SW setup\n→ pushController.getVapidPublicKey]
    A --> C[POST /subscribe\npreHandler: authenticate\nrate limit: 10/min\nbody: subscription{endpoint, expirationTime, keys{p256dh,auth}}\n→ pushController.subscribe]
    A --> D[POST /unsubscribe\npreHandler: authenticate\nrate limit: 10/min\nbody: { endpoint }\n→ pushController.unsubscribe]
    A --> E[POST /test\npreHandler: authenticate\nrate limit: 5/min\n→ pushController.sendTestPush]

    B --> B1[return { publicKey: process.env.VAPID_PUBLIC_KEY }]
    C --> C1[pushService.savePushSubscription staffId, subscription\nUPSERT push_subscriptions]
    D --> D1[pushService.removePushSubscription staffId, endpoint\nUPDATE is_active=false]
    E --> E1[pushService.sendPushNotification staffId, testPayload]
```

**Notes:**
- The route file imports from `'../controllers/pushController.js'` (not directly from the service) — controllers handle request/response shaping.
- Rate limits are set per-route using Fastify's `config.rateLimit` object (requires `@fastify/rate-limit` plugin registered globally).
- `POST /test` is primarily for developers to verify the VAPID setup is working; in production it is gated by authentication so users cannot spam test pushes.

/* eslint-disable no-undef */
/// <reference lib="webworker" />

// Service Worker for AH Punjab PWA with Push Notifications + Offline Sync

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
)

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
)

// API caching — matches /v1/home, /v1/reports, /v1/profile, /v1/notifications, /v1/geo
// Excludes /v1/auth (tokens must always be fresh) and /v1/push (subscription management)
registerRoute(
  ({ url }) => url.pathname.startsWith('/v1/') &&
    !url.pathname.startsWith('/v1/auth') &&
    !url.pathname.startsWith('/v1/push'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 5 // 5 minutes
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
)

// ── Offline report submission queue ──────────────────────────────────────────
// When the device is offline, POST requests to /v1/reports/monthly are queued
// in IndexedDB and replayed automatically when connectivity returns.
const reportSyncPlugin = new BackgroundSyncPlugin('report-submission-queue', {
  maxRetentionTime: 24 * 60, // 24 hours in minutes
  onSync: async ({ queue }) => {
    let entry
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request)
        // Notify the open tab that a queued report has synced
        const clients = await self.clients.matchAll({ type: 'window' })
        clients.forEach(c => c.postMessage({ type: 'REPORT_SYNCED' }))
      } catch {
        await queue.unshiftRequest(entry)
        throw new Error('Sync failed — will retry')
      }
    }
  }
})

registerRoute(
  ({ url, request }) =>
    url.pathname === '/v1/reports/monthly' && request.method === 'POST',
  new NetworkFirst({
    cacheName: 'report-submissions',
    plugins: [reportSyncPlugin],
  }),
  'POST'
)

// Push notification event handler
self.addEventListener('push', function(event) {
  console.log('[Service Worker] 🔔 Push notification received!')
  console.log('[Service Worker] Event:', event)
  console.log('[Service Worker] Event data:', event.data)

  let notificationData = {
    title: 'AH Punjab',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: '/notifications'
    }
  }

  if (event.data) {
    try {
      const parsedData = event.data.json()
      console.log('[Service Worker] Parsed notification data:', parsedData)
      notificationData = parsedData
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e)
      try {
        console.log('[Service Worker] Raw data text:', event.data.text())
      } catch (textError) {
        console.error('[Service Worker] Could not get text from event data')
      }
    }
  } else {
    console.warn('[Service Worker] No data in push event')
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: notificationData.data?.notificationId || 'default',
    requireInteraction: false,
    data: notificationData.data,
    actions: notificationData.actions || []
  }

  console.log('[Service Worker] Showing notification with title:', notificationData.title)
  console.log('[Service Worker] Notification options:', options)

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('[Service Worker] ✓ Notification shown successfully!')
      })
      .catch((error) => {
        console.error('[Service Worker] ✗ Failed to show notification:', error)
      })
  )
})

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received:', event)

  event.notification.close()

  const urlToOpen = event.action || event.notification.data?.url || '/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate to the URL and focus the window
            client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen
            })
            return client.focus()
          }
        }

        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log('[Service Worker] Loaded with push notification support')

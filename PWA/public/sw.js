/* eslint-disable no-undef */
/// <reference lib="webworker" />

// Service Worker for AH Punjab PWA with Push Notifications

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

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

// API caching
registerRoute(
  /\/v1\/api\/.*/i,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5 // 5 minutes
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
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

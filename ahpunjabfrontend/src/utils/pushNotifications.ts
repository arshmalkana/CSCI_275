/**
 * Push Notifications utility
 * Handles Web Push API subscription and permission management
 */

import api from './api'

// Convert base64 URL-safe string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  try {
    // Check support
    if (!isPushSupported()) {
      console.warn('Push notifications not supported')
      return false
    }

    // Request permission
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return false
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready

    // Get VAPID public key from backend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { publicKey } = await api.getVapidPublicKey() as any

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })

    // Send subscription to backend
    // await api.subscribe Push(subscription.toJSON())

    console.log('Successfully subscribed to push notifications')
    return true
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return false
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!isPushSupported()) {
      return false
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      console.log('No active subscription found')
      return false
    }

    // Unsubscribe from push manager
    await subscription.unsubscribe()

    // Notify backend
    await api.unsubscribePush(subscription.endpoint)

    console.log('Successfully unsubscribed from push notifications')
    return true
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return false
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!isPushSupported()) {
      return false
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    return subscription !== null
  } catch (error) {
    console.error('Error checking push subscription:', error)
    return false
  }
}

/**
 * Initialize push notifications on app start
 * Call this from your main App component
 */
export async function initializePushNotifications(): Promise<void> {
  try {
    if (!isPushSupported()) {
      console.log('Push notifications not supported on this browser')
      return
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready

    // Check if already subscribed
    const isSubscribed = await isPushSubscribed()

    if (isSubscribed) {
      console.log('Already subscribed to push notifications')
      return
    }

    // Check if permission was previously granted
    if (Notification.permission === 'granted') {
      // Auto-subscribe if permission was already granted
      await subscribeToPushNotifications()
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error)
  }
}

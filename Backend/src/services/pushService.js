import { query } from '../database/db.js'
import webpush from 'web-push'

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@ahpunjab.gov.in'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
} else {
  console.warn('VAPID keys not configured. Push notifications will not work.')
}

/**
 * Save or update push subscription for a user
 */
export async function savePushSubscription(staffId, subscription) {
  const { endpoint, keys } = subscription

  try {
    // Check if subscription already exists
    const existing = await query(`
      SELECT subscription_id FROM push_subscriptions
      WHERE endpoint = $1
    `, [endpoint])

    if (existing.rows.length > 0) {
      // Update existing subscription
      await query(`
        UPDATE push_subscriptions
        SET staff_id = $1, p256dh_key = $2, auth_key = $3, last_used_at = CURRENT_TIMESTAMP, is_active = TRUE
        WHERE endpoint = $4
      `, [staffId, keys.p256dh, keys.auth, endpoint])

      return { subscriptionId: existing.rows[0].subscription_id, updated: true }
    } else {
      // Create new subscription
      const result = await query(`
        INSERT INTO push_subscriptions (staff_id, endpoint, p256dh_key, auth_key)
        VALUES ($1, $2, $3, $4)
        RETURNING subscription_id
      `, [staffId, endpoint, keys.p256dh, keys.auth])

      return { subscriptionId: result.rows[0].subscription_id, updated: false }
    }
  } catch (error) {
    console.error('Error saving push subscription:', error)
    throw error
  }
}

/**
 * Remove push subscription
 */
export async function removePushSubscription(staffId, endpoint) {
  try {
    const result = await query(`
      UPDATE push_subscriptions
      SET is_active = FALSE
      WHERE staff_id = $1 AND endpoint = $2
    `, [staffId, endpoint])

    return result.rowCount > 0
  } catch (error) {
    console.error('Error removing push subscription:', error)
    throw error
  }
}

/**
 * Get all active subscriptions for a user
 */
export async function getUserSubscriptions(staffId) {
  try {
    const result = await query(`
      SELECT endpoint, p256dh_key, auth_key
      FROM push_subscriptions
      WHERE staff_id = $1 AND is_active = TRUE
    `, [staffId])

    return result.rows.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh_key,
        auth: row.auth_key
      }
    }))
  } catch (error) {
    console.error('Error getting user subscriptions:', error)
    throw error
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(staffId, payload) {
  try {
    console.log(`[PushService] Attempting to send push notification to staff ${staffId}`)
    console.log(`[PushService] Payload:`, payload)

    const subscriptions = await getUserSubscriptions(staffId)
    console.log(`[PushService] Found ${subscriptions.length} active subscription(s)`)

    if (subscriptions.length === 0) {
      console.log(`[PushService] No active subscriptions found for staff ${staffId}`)
      return { sent: 0, failed: 0, total: 0 }
    }

    const payloadString = JSON.stringify(payload)
    console.log(`[PushService] Sending to ${subscriptions.length} endpoint(s)...`)

    const results = await Promise.allSettled(
      subscriptions.map((subscription, index) =>
        webpush.sendNotification(subscription, payloadString)
          .then(() => {
            console.log(`[PushService] ✓ Successfully sent to endpoint ${index + 1}`)
          })
          .catch(error => {
            console.error(`[PushService] ✗ Failed to send to endpoint ${index + 1}:`, error.message)
            // If subscription is invalid (410 Gone), mark as inactive
            if (error.statusCode === 410) {
              console.log(`[PushService] Subscription expired for staff ${staffId}, marking as inactive`)
              query(`
                UPDATE push_subscriptions
                SET is_active = FALSE
                WHERE endpoint = $1
              `, [subscription.endpoint])
            }
            throw error
          })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`[PushService] Push notification sent to ${sent}/${subscriptions.length} devices for staff ${staffId}`)
    if (failed > 0) {
      console.log(`[PushService] Failed deliveries: ${failed}`)
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[PushService] Endpoint ${index + 1} error:`, result.reason)
        }
      })
    }

    return { sent, failed, total: subscriptions.length }
  } catch (error) {
    console.error('[PushService] Error sending push notification:', error)
    throw error
  }
}

/**
 * Send push notification for a database notification
 */
export async function sendPushForNotification(notificationId, recipientId, title, message, actions = null) {
  const payload = {
    title,
    body: message,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      notificationId,
      url: actions && actions.length > 0 ? actions[0].path : '/notifications'
    },
    actions: actions ? actions.slice(0, 2).map(action => ({
      action: action.path,
      title: action.label
    })) : []
  }

  return await sendPushNotification(recipientId, payload)
}

/**
 * Get VAPID public key (for frontend)
 */
export function getVapidPublicKey() {
  return vapidPublicKey
}

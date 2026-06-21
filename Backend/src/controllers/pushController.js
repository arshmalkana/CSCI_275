import * as pushService from '../services/pushService.js'

export async function getVapidPublicKey(request, reply) {
  try {
    const publicKey = pushService.getVapidPublicKey()

    if (!publicKey) {
      return reply.code(503).send({ success: false, message: 'Push notifications not configured' })
    }

    return reply.send({ success: true, data: { publicKey } })
  } catch (error) {
    request.log.error('Get VAPID public key error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to retrieve VAPID public key' })
  }
}

export async function subscribe(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const { subscription } = request.body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return reply.code(400).send({ success: false, message: 'Invalid subscription object' })
    }

    const result = await pushService.savePushSubscription(staffId, subscription)

    return reply.send({
      success: true,
      message: result.updated ? 'Subscription updated' : 'Subscription created',
      data: result
    })
  } catch (error) {
    request.log.error('Push subscribe error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to save push subscription' })
  }
}

export async function unsubscribe(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const { endpoint } = request.body

    if (!endpoint) return reply.code(400).send({ success: false, message: 'Endpoint required' })

    const success = await pushService.removePushSubscription(staffId, endpoint)

    if (!success) return reply.code(404).send({ success: false, message: 'Subscription not found' })

    return reply.send({ success: true, message: 'Unsubscribed successfully' })
  } catch (error) {
    request.log.error('Push unsubscribe error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to unsubscribe' })
  }
}

export async function sendTestPush(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const result = await pushService.sendPushNotification(staffId, {
      title: 'Test Notification',
      body: 'This is a test push notification from AH Punjab',
      icon: '/icon-192x192.png',
      data: { url: '/notifications' }
    })

    return reply.send({ success: true, message: 'Test notification sent', data: result })
  } catch (error) {
    request.log.error('Send test push error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to send test notification' })
  }
}

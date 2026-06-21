import * as notificationsService from '../services/notificationsService.js'

export async function getNotifications(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const { limit = 50, offset = 0, unreadOnly = false } = request.query

    const notifications = await notificationsService.getUserNotifications(staffId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true' || unreadOnly === true
    })

    return reply.send({
      success: true,
      data: notifications,
      count: notifications.length
    })
  } catch (error) {
    request.log.error('Get notifications error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to retrieve notifications' })
  }
}

export async function getUnreadCount(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const count = await notificationsService.getUnreadCount(staffId)

    return reply.send({ success: true, data: { count } })
  } catch (error) {
    request.log.error('Get unread count error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to retrieve unread count' })
  }
}

export async function getNotification(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const notificationId = parseInt(request.params.id)
    if (isNaN(notificationId)) {
      return reply.code(400).send({ success: false, message: 'Invalid notification ID' })
    }

    const notification = await notificationsService.getNotificationById(notificationId, staffId)

    if (!notification) {
      return reply.code(404).send({ success: false, message: 'Notification not found' })
    }

    return reply.send({ success: true, data: notification })
  } catch (error) {
    request.log.error('Get notification error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to retrieve notification' })
  }
}

export async function markAsRead(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const notificationId = parseInt(request.params.id)
    if (isNaN(notificationId)) {
      return reply.code(400).send({ success: false, message: 'Invalid notification ID' })
    }

    const success = await notificationsService.markAsRead(notificationId, staffId)

    if (!success) return reply.code(404).send({ success: false, message: 'Notification not found' })

    return reply.send({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    request.log.error('Mark as read error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to mark notification as read' })
  }
}

export async function markAllAsRead(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const count = await notificationsService.markAllAsRead(staffId)

    return reply.send({
      success: true,
      message: `${count} notification${count !== 1 ? 's' : ''} marked as read`,
      data: { count }
    })
  } catch (error) {
    request.log.error('Mark all as read error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to mark notifications as read' })
  }
}

export async function deleteNotification(request, reply) {
  try {
    const staffId = request.user?.staffId
    if (!staffId) return reply.code(401).send({ success: false, message: 'Unauthorized' })

    const notificationId = parseInt(request.params.id)
    if (isNaN(notificationId)) {
      return reply.code(400).send({ success: false, message: 'Invalid notification ID' })
    }

    const success = await notificationsService.deleteNotification(notificationId, staffId)

    if (!success) return reply.code(404).send({ success: false, message: 'Notification not found' })

    return reply.send({ success: true, message: 'Notification deleted' })
  } catch (error) {
    request.log.error('Delete notification error:', error)
    return reply.code(500).send({ success: false, message: 'Failed to delete notification' })
  }
}

import { query } from '../database/db.js'
import * as pushService from './pushService.js'
import log from '../utils/logger.js'

/**
 * Create a new notification
 */
export async function createNotification({
  recipientId,
  senderId = null,
  notificationType,
  category,
  title,
  message,
  priority = 'normal',
  actions = null,
  attachments = null,
  relatedEntityType = null,
  relatedEntityId = null,
  expiresAt = null
}) {
  const result = await query(`
    INSERT INTO notifications (
      recipient_id, sender_id, notification_type, category, title, message,
      priority, actions, attachments, related_entity_type, related_entity_id, expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING notification_id, created_at
  `, [
    recipientId, senderId, notificationType, category, title, message,
    priority, actions ? JSON.stringify(actions) : null, attachments ? JSON.stringify(attachments) : null,
    relatedEntityType, relatedEntityId, expiresAt
  ])

  const notification = result.rows[0]

  // Send push notification (async, don't wait for it)
  if (notification.notification_id) {
    pushService.sendPushForNotification(
      notification.notification_id,
      recipientId,
      title,
      message,
      actions
    ).catch(error => {
      log.error({ err: error }, 'Failed to send push notification')
    })
  }

  return notification
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotifications(staffId, { limit = 50, offset = 0, unreadOnly = false }) {
  const conditions = ['n.recipient_id = $1', 'n.deleted_at IS NULL']
  const params = [staffId]

  if (unreadOnly) {
    conditions.push('n.is_read = FALSE')
  }

  const whereClause = conditions.join(' AND ')

  const result = await query(`
    SELECT
      n.notification_id,
      n.notification_type,
      n.category,
      n.title,
      n.message,
      n.priority,
      n.actions,
      n.attachments,
      n.related_entity_type,
      n.related_entity_id,
      n.is_read,
      n.read_at,
      n.created_at,
      s.full_name AS sender_name,
      s.designation AS sender_designation
    FROM notifications n
    LEFT JOIN staff s ON n.sender_id = s.staff_id
    WHERE ${whereClause}
    ORDER BY n.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `, [...params, limit, offset])

  return result.rows
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(staffId) {
  const result = await query(`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE recipient_id = $1 AND is_read = FALSE AND deleted_at IS NULL
  `, [staffId])

  return parseInt(result.rows[0].count, 10)
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId, staffId) {
  const result = await query(`
    UPDATE notifications
    SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE notification_id = $1 AND recipient_id = $2 AND deleted_at IS NULL
    RETURNING notification_id
  `, [notificationId, staffId])

  return result.rowCount > 0
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(staffId) {
  const result = await query(`
    UPDATE notifications
    SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE recipient_id = $1 AND is_read = FALSE AND deleted_at IS NULL
  `, [staffId])

  return result.rowCount
}

/**
 * Delete (soft delete) a notification
 */
export async function deleteNotification(notificationId, staffId) {
  const result = await query(`
    UPDATE notifications
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE notification_id = $1 AND recipient_id = $2 AND deleted_at IS NULL
    RETURNING notification_id
  `, [notificationId, staffId])

  return result.rowCount > 0
}

/**
 * Create notification for report submission
 */
export async function createReportSubmittedNotification(reportId, reportingMonth, staffId, instituteId) {
  // Find the admin responsible for this institute's parent (reporting_authority)
  const supervisorResult = await query(`
    SELECT s.staff_id, s.full_name
    FROM institutes i
    JOIN institutes parent ON parent.institute_id = i.reporting_authority_id
    JOIN staff s ON s.current_institute_id = parent.institute_id
    WHERE i.institute_id = $1
      AND s.is_active = TRUE
      AND s.user_role IN ('Tehsil_Admin', 'District_Admin', 'HQ_Admin', 'Super_Admin')
    LIMIT 1
  `, [instituteId])

  if (supervisorResult.rows.length === 0) {
    return null // No supervisor found
  }

  const supervisor = supervisorResult.rows[0]

  // Get staff name who submitted
  const staffResult = await query(`
    SELECT full_name FROM staff WHERE staff_id = $1
  `, [staffId])

  const staffName = staffResult.rows[0]?.full_name || 'Staff member'

  const [year, month] = reportingMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return await createNotification({
    recipientId: supervisor.staff_id,
    senderId: staffId,
    notificationType: 'system',
    category: 'report_submitted',
    title: 'New Report Submitted',
    message: `${staffName} has submitted the monthly report for ${monthName}`,
    priority: 'high',
    actions: [
      {
        label: 'View Report',
        type: 'navigate',
        path: `/reports/monthly/${reportingMonth}`,
        requiredPermission: 'view_reports'
      }
    ],
    relatedEntityType: 'monthly_report',
    relatedEntityId: reportId
  })
}

/**
 * Create notification for report approval
 */
export async function createReportApprovedNotification(reportId, reportingMonth, supervisorId, staffId) {
  const supervisorResult = await query(`
    SELECT full_name FROM staff WHERE staff_id = $1
  `, [supervisorId])

  const supervisorName = supervisorResult.rows[0]?.full_name || 'Supervisor'

  const [year, month] = reportingMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return await createNotification({
    recipientId: staffId,
    senderId: supervisorId,
    notificationType: 'system',
    category: 'report_approved',
    title: 'Report Approved',
    message: `Your monthly report for ${monthName} has been approved by ${supervisorName}`,
    priority: 'normal',
    actions: [
      {
        label: 'View Report',
        type: 'navigate',
        path: `/reports/monthly/${reportingMonth}`,
        requiredPermission: 'view_reports'
      }
    ],
    relatedEntityType: 'monthly_report',
    relatedEntityId: reportId,
    expiresAt: null // Keep forever for audit trail
  })
}

/**
 * Create notification for report rejection/needs revision
 */
export async function createReportRejectedNotification(reportId, reportingMonth, supervisorId, staffId, comment) {
  const supervisorResult = await query(`
    SELECT full_name FROM staff WHERE staff_id = $1
  `, [supervisorId])

  const supervisorName = supervisorResult.rows[0]?.full_name || 'Supervisor'

  const [year, month] = reportingMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return await createNotification({
    recipientId: staffId,
    senderId: supervisorId,
    notificationType: 'system',
    category: 'report_rejected',
    title: 'Report Needs Revision',
    message: `Your monthly report for ${monthName} needs revision. ${supervisorName}: "${comment}"`,
    priority: 'high',
    actions: [
      {
        label: 'Edit Report',
        type: 'navigate',
        path: `/reports/create?month=${reportingMonth}`,
        requiredPermission: 'edit_reports'
      }
    ],
    relatedEntityType: 'monthly_report',
    relatedEntityId: reportId,
    expiresAt: null // Keep forever for audit trail
  })
}

/**
 * Create deadline reminder notification
 */
export async function createDeadlineReminderNotification(staffId, reportingMonth, daysRemaining) {
  const [year, month] = reportingMonth.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  let priority = 'normal'
  if (daysRemaining <= 1) priority = 'urgent'
  else if (daysRemaining <= 3) priority = 'high'

  return await createNotification({
    recipientId: staffId,
    notificationType: 'system',
    category: 'deadline_reminder',
    title: 'Report Deadline Approaching',
    message: `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining to submit your monthly report for ${monthName}`,
    priority,
    actions: [
      {
        label: 'Create Report',
        type: 'navigate',
        path: '/reports/create',
        requiredPermission: 'create_reports'
      }
    ]
  })
}

/**
 * Get notification by ID (with permission check)
 */
export async function getNotificationById(notificationId, staffId) {
  const result = await query(`
    SELECT
      n.notification_id,
      n.notification_type,
      n.category,
      n.title,
      n.message,
      n.priority,
      n.actions,
      n.attachments,
      n.related_entity_type,
      n.related_entity_id,
      n.is_read,
      n.read_at,
      n.created_at,
      s.full_name AS sender_name,
      s.designation AS sender_designation
    FROM notifications n
    LEFT JOIN staff s ON n.sender_id = s.staff_id
    WHERE n.notification_id = $1 AND n.recipient_id = $2 AND n.deleted_at IS NULL
  `, [notificationId, staffId])

  return result.rows[0] || null
}

/**
 * Clean up expired notifications (run periodically)
 */
export async function cleanupExpiredNotifications() {
  const result = await query(`
    UPDATE notifications
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE expires_at < CURRENT_TIMESTAMP AND deleted_at IS NULL
  `)

  return result.rowCount
}

/**
 * Send deadline reminder notifications to staff who have not yet submitted
 * for any reporting period whose deadline is within the next 3 days.
 * Called once on server boot and every 24 h thereafter.
 */
export async function sendDeadlineReminders() {
  const upcomingResult = await query(`
    SELECT reporting_month, deadline
    FROM reporting_periods
    WHERE is_locked = FALSE
      AND deadline BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '3 days'
  `)

  for (const period of upcomingResult.rows) {
    const msRemaining = new Date(period.deadline) - Date.now()
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))

    // Staff with roles that submit reports but have not submitted for this month
    const staffResult = await query(`
      SELECT s.staff_id
      FROM staff s
      WHERE s.is_active = TRUE
        AND s.user_role IN ('INAPH', 'AIW')
        AND NOT EXISTS (
          SELECT 1
          FROM monthly_reports mr
          WHERE mr.institute_id = s.current_institute_id
            AND mr.reporting_month = $1
            AND mr.submission_status IN ('Submitted', 'Approved')
        )
    `, [period.reporting_month])

    for (const row of staffResult.rows) {
      await createDeadlineReminderNotification(row.staff_id, period.reporting_month, daysRemaining)
        .catch(err => log.error({ err, staffId: row.staff_id }, 'Failed to send deadline reminder'))
    }
  }

  return upcomingResult.rows.length
}

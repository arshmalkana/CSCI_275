-- Seed data for notifications table
-- Creates sample notifications for testing

-- Insert sample notifications for staff_id = 1 (testing user)

-- 1. Report submitted notification (high priority)
INSERT INTO notifications (
  recipient_id,
  sender_id,
  notification_type,
  category,
  title,
  message,
  priority,
  actions,
  related_entity_type,
  related_entity_id,
  created_at
) VALUES (
  1,
  NULL,
  'system',
  'report_submitted',
  'New Report Submitted',
  'Staff member has submitted the monthly report for July 2024',
  'high',
  '[{"label": "View Report", "type": "navigate", "path": "/reports/monthly/2024-07"}]'::jsonb,
  'monthly_report',
  9,
  CURRENT_TIMESTAMP - INTERVAL '2 hours'
);

-- 2. Report approved notification (normal priority, read)
INSERT INTO notifications (
  recipient_id,
  sender_id,
  notification_type,
  category,
  title,
  message,
  priority,
  actions,
  related_entity_type,
  related_entity_id,
  is_read,
  read_at,
  created_at,
  expires_at
) VALUES (
  1,
  NULL,
  'system',
  'report_approved',
  'Report Approved',
  'Your monthly report for June 2024 has been approved',
  'normal',
  '[{"label": "View Report", "type": "navigate", "path": "/reports/monthly/2024-06"}]'::jsonb,
  'monthly_report',
  8,
  TRUE,
  CURRENT_TIMESTAMP - INTERVAL '1 day',
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  NULL -- Keep forever (audit trail)
);

-- 3. Deadline reminder (urgent priority, unread)
INSERT INTO notifications (
  recipient_id,
  notification_type,
  category,
  title,
  message,
  priority,
  actions,
  created_at
) VALUES (
  1,
  'system',
  'deadline_reminder',
  'Report Deadline Approaching',
  '1 day remaining to submit your monthly report for November 2025',
  'urgent',
  '[{"label": "Create Report", "type": "navigate", "path": "/reports/create"}]'::jsonb,
  CURRENT_TIMESTAMP - INTERVAL '30 minutes'
);

-- 4. Report needs revision (high priority, unread)
INSERT INTO notifications (
  recipient_id,
  sender_id,
  notification_type,
  category,
  title,
  message,
  priority,
  actions,
  related_entity_type,
  related_entity_id,
  created_at,
  expires_at
) VALUES (
  1,
  2,
  'system',
  'report_rejected',
  'Report Needs Revision',
  'Your monthly report for August 2024 needs revision. Supervisor: "Please verify the OPD numbers for bovine category"',
  'high',
  '[{"label": "Edit Report", "type": "navigate", "path": "/reports/create?month=2024-08"}]'::jsonb,
  'monthly_report',
  10,
  CURRENT_TIMESTAMP - INTERVAL '5 hours',
  NULL -- Keep forever (audit trail)
);

-- 5. System announcement (normal priority, read)
INSERT INTO notifications (
  recipient_id,
  notification_type,
  category,
  title,
  message,
  priority,
  attachments,
  is_read,
  read_at,
  created_at
) VALUES (
  1,
  'broadcast',
  'announcement',
  'New Circular Available',
  'Monthly vaccination guidelines have been updated. Please review the attached circular.',
  'normal',
  '[{"type": "pdf", "filename": "vaccination-guidelines-nov-2024.pdf", "path": "/circulars/2024-11.pdf"}]'::jsonb,
  TRUE,
  CURRENT_TIMESTAMP - INTERVAL '2 days',
  CURRENT_TIMESTAMP - INTERVAL '1 week'
);

-- 6. Target achievement notification (normal priority, unread)
INSERT INTO notifications (
  recipient_id,
  notification_type,
  category,
  title,
  message,
  priority,
  created_at
) VALUES (
  1,
  'system',
  'target_achievement',
  'Monthly Target Achieved',
  'Congratulations! You have achieved 105% of your AI target for October 2024',
  'normal',
  CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- 7. User-to-user notification (normal priority, unread)
INSERT INTO notifications (
  recipient_id,
  sender_id,
  notification_type,
  category,
  title,
  message,
  priority,
  actions,
  created_at
) VALUES (
  1,
  2,
  'user',
  'query',
  'Query About Report Data',
  'Can you please clarify the beneficiaries count in your July report?',
  'normal',
  '[{"label": "View Report", "type": "navigate", "path": "/reports/monthly/2024-07"}, {"label": "Respond", "type": "navigate", "path": "/messages"}]'::jsonb,
  CURRENT_TIMESTAMP - INTERVAL '3 hours'
);

-- Display notification count
SELECT
  'Total notifications created: ' || COUNT(*) AS summary,
  COUNT(*) FILTER (WHERE is_read = FALSE) AS unread_count,
  COUNT(*) FILTER (WHERE is_read = TRUE) AS read_count
FROM notifications
WHERE recipient_id = 1 AND deleted_at IS NULL;

-- Display sample notifications
SELECT
  notification_id,
  category,
  title,
  priority,
  is_read,
  created_at
FROM notifications
WHERE recipient_id = 1 AND deleted_at IS NULL
ORDER BY created_at DESC;

// PWA field roles — submit reports, manage own institute's data
export const FIELD_ROLES = ['CVD', 'CVH', 'PAIW', 'SemenBank', 'VaccineBank']

// Panel oversight role — approve/reject reports, compile periods, view rollups
// Not a PWA role; lives in the separate panel deployment.
// Using the agreed placeholder name until the panel app is named.
export const OVERSIGHT_ROLE = 'Oversight'

// Legacy alias — any code that needs "can this user do admin operations?"
// Maps to Oversight only; the old multi-level hierarchy is gone.
export const ADMIN_ROLES = ['Oversight']

// Kept for compatibility with existing admin-route guards during the PWA/panel split (Phase 2).
// Will be removed when panel app takes over the admin.js routes.
export const SENIOR_ADMIN_ROLES = ['Oversight']

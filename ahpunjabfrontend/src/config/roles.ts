export const ADMIN_ROLES = ['Tehsil_Admin', 'District_Admin', 'HQ_Admin', 'Super_Admin'] as const
export const HQ_ROLES = ['HQ_Admin', 'Super_Admin'] as const

export type AdminRole = typeof ADMIN_ROLES[number]
export type HQRole = typeof HQ_ROLES[number]

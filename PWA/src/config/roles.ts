export const FIELD_ROLES = ['CVD', 'CVH', 'PAIW', 'SemenBank', 'VaccineBank'] as const
export const OVERSIGHT_ROLE = 'Oversight' as const

export type FieldRole = typeof FIELD_ROLES[number]

export function isFieldRole(role: string): role is FieldRole {
  return (FIELD_ROLES as readonly string[]).includes(role)
}

export const OVERSIGHT_ROLE = 'Oversight' as const

export function isOversightRole(role: string): boolean {
  return role === OVERSIGHT_ROLE
}

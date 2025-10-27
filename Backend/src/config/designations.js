/**
 * Valid designation types for staff registration and app usage
 *
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for valid designations.
 * Update this list when designation requirements change.
 *
 * Note: The database enum 'designation_type' contains ALL possible designations
 * for historical records, but only these 6 types can register and use the app.
 */
export const VALID_DESIGNATIONS = [
  'Veterinary Officer',
  'Senior Veterinary Officer',
  'Veterinary Inspector',
  'Senior Veterinary Inspector',
  'Private AI Worker',
  'Lab Attendant'
]

/**
 * Check if a designation is valid for registration
 */
export function isValidDesignation(designation) {
  return VALID_DESIGNATIONS.includes(designation)
}

/**
 * Get all valid designations
 */
export function getValidDesignations() {
  return [...VALID_DESIGNATIONS]
}
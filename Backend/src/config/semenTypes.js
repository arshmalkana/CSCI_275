/**
 * Semen Type Mappings
 * Maps frontend breed IDs to database semen codes
 *
 * This is the single source of truth for AI report breed mappings.
 * Update this file to add/modify breed types across the application.
 */

export const SEMEN_TYPE_MAPPING = {
  // Local Semen
  'hf': 'HF_LOCAL',
  'jersey': 'JERSEY_LOCAL',
  'cb': 'CB_LOCAL',
  'sahiwal': 'SAHIWAL_LOCAL',

  // Gir Semen
  'gir': 'GIR',
  'gir2': 'GIR_2',

  // ETT/Imported
  'hfETT': 'HF_ETT',
  'jerseyETT': 'JERSEY_ETT',
  'hfImp': 'HF_IMPORTED',
  'jerseyImp': 'JERSEY_IMPORTED',

  // Sexed Semen
  'hfSexed': 'HF_SEXED',
  'jerseySexed': 'JERSEY_SEXED',
  'cbSexed': 'CB_SEXED',
  'sahiwalSexed': 'SAHIWAL_SEXED',

  // Buffaloes
  'murrah': 'MURRAH',
  'niliRavi': 'NILI_RAVI',
  'surti': 'SURTI',
  'jaffarabadi': 'JAFFARABADI',
}

/**
 * Get database semen code from frontend breed ID
 * @param {string} breedId - Frontend breed identifier (e.g., 'hf', 'murrah')
 * @returns {string|null} Database semen code or null if not found
 */
export function getSemenCode(breedId) {
  return SEMEN_TYPE_MAPPING[breedId] || null
}

/**
 * Validate if a breed ID is recognized
 * @param {string} breedId - Frontend breed identifier
 * @returns {boolean}
 */
export function isValidBreedId(breedId) {
  return breedId in SEMEN_TYPE_MAPPING
}

/**
 * Get all valid breed IDs
 * @returns {string[]}
 */
export function getValidBreedIds() {
  return Object.keys(SEMEN_TYPE_MAPPING)
}

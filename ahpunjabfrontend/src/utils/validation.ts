/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates Indian mobile phone number
 * @param phone - Phone number to validate (accepts formats with spaces or hyphens)
 * @returns true if phone number is valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\s|-/g, ''))
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @param minLength - Minimum length (default: 8)
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePassword(password: string, minLength: number = 8): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` }
  }

  return { isValid: true }
}

/**
 * Validates if two passwords match
 * @param password1 - First password
 * @param password2 - Second password
 * @returns true if passwords match, false otherwise
 */
export function validatePasswordsMatch(password1: string, password2: string): boolean {
  return password1 === password2
}

/**
 * Validates if a field is not empty
 * @param value - Value to validate
 * @returns true if not empty, false otherwise
 */
export function validateRequired(value: string): boolean {
  return value.trim().length > 0
}

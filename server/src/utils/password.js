import argon2 from 'argon2'

/**
 * Hash password using Argon2
 */
export async function hashPassword(password) {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    })
  } catch (error) {
    throw new Error('Password hashing failed')
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password)
  } catch (error) {
    return false
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password) {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const errors = []

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`)
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number')
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

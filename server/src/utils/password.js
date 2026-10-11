import bcrypt from 'bcryptjs';

/**
 * Password complexity validation
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  if (!hasUpperCase) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowerCase) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumbers) {
    throw new Error('Password must contain at least one number');
  }
  
  if (!hasSpecialChar) {
    throw new Error('Password must contain at least one special character');
  }

  return true;
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password) => {
  // Validate password complexity first
  validatePassword(password);
  
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash using bcrypt
 */
export async function verifyPassword(hash, password) {
  try {
    return await bcrypt.compare(password, hash);
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

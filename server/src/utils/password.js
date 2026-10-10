import argon2 from 'argon2';

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
 * Hash password using Argon2
 */
export const hashPassword = async (password) => {
  // Validate password complexity first
  validatePassword(password);
  
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
};

/**
 * Compare password with hash using Argon2
 */
export const comparePassword = async (password, hash) => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
};

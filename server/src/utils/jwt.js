import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate JWT token for user with enhanced security
 */
export const generateToken = (user, options = {}) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(), // JWT ID for tracking/revocation
  };

  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'everest-textile-erp',
    audience: process.env.JWT_AUDIENCE || 'everest-textile-users',
    algorithm: 'HS256',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'everest-textile-erp',
    audience: process.env.JWT_AUDIENCE || 'everest-textile-users',
  });
};

/**
 * Verify JWT token with enhanced validation
 */
export const verifyToken = (token, options = {}) => {
  try {
    const defaultOptions = {
      issuer: process.env.JWT_ISSUER || 'everest-textile-erp',
      audience: process.env.JWT_AUDIENCE || 'everest-textile-users',
      algorithms: ['HS256'],
    };

    return jwt.verify(token, process.env.JWT_SECRET, { ...defaultOptions, ...options });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active yet');
    }
    
    throw new Error('Token verification failed');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'everest-textile-erp',
      audience: process.env.JWT_AUDIENCE || 'everest-textile-users',
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Extract token payload without verification (for debugging)
 */
export const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

/**
 * Generate secure API key for external integrations
 */
export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash API key for storage
 */
export const hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

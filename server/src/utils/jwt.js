import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * Generate JWT token for user
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token) {
  return jwt.decode(token)
}

/**
 * Calculate token expiration date
 */
export function getTokenExpiration() {
  // Parse JWT_EXPIRES_IN (e.g., '7d' -> 7 days)
  const match = JWT_EXPIRES_IN.match(/^(\d+)([dhms])$/)
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // default 7 days

  const value = parseInt(match[1])
  const unit = match[2]

  const milliseconds = {
    d: value * 24 * 60 * 60 * 1000,
    h: value * 60 * 60 * 1000,
    m: value * 60 * 1000,
    s: value * 1000,
  }[unit]

  return new Date(Date.now() + milliseconds)
}

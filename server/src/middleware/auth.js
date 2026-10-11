import { verifyToken } from '../utils/jwt.js'
import prisma from '../config/database.js'

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token)

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      })
    }

    // Check if session exists and is active
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionId: decoded.sessionId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    })

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid',
      })
    }

    // Attach user to request
    req.user = user
    req.sessionId = decoded.sessionId

    next()
  } catch (error) {
    console.error('Auth middleware error:', error.message)
    return res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed',
    })
  }
}

/**
 * Middleware to check if user has specific role(s)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      })
    }

    next()
  }
}

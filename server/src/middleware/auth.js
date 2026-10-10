import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';
import { sessionManager } from '../utils/sessionManager.js';
import { audit, AUDIT_ACTIONS } from '../utils/audit.js';

/**
 * Enhanced middleware to verify JWT token with session validation
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json(errorResponse('Authentication required'));
    }

    // Check if token is blacklisted
    if (sessionManager.isTokenBlacklisted(token)) {
      return res.status(401).json(errorResponse('Token has been revoked'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate session if session ID is provided
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      const session = await sessionManager.validateSession(sessionId);
      if (!session || session.userId !== decoded.id) {
        return res.status(401).json(errorResponse('Invalid session'));
      }
      req.session = session;
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    // Log authentication failure
    await audit({
      action: AUDIT_ACTIONS.AUTH_FAILED,
      entity: 'Authentication',
      notes: `Authentication failed: ${error.message}`,
      ipAddress: req.ip,
      correlationId: req.correlationId,
    }).catch(console.error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('Token has expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(errorResponse('Invalid token'));
    }
    
    return res.status(401).json(errorResponse('Authentication failed'));
  }
};

/**
 * Enhanced middleware to check if user has required role(s) with additional security checks
 */
export const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Authentication required'));
    }

    // Check if user account is still active (additional security layer)
    try {
      const { prisma } = await import('../config/database.js');
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { isActive: true, role: true }
      });

      if (!user || !user.isActive) {
        // Log deactivated user access attempt
        await audit({
          userId: req.user.id,
          userEmail: req.user.email,
          action: AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
          entity: 'Authorization',
          notes: 'Access attempt with deactivated account',
          ipAddress: req.ip,
          correlationId: req.correlationId,
        }).catch(console.error);

        return res.status(403).json(errorResponse('Account is deactivated'));
      }

      // Verify role hasn't changed
      if (user.role !== req.user.role) {
        await audit({
          userId: req.user.id,
          userEmail: req.user.email,
          action: AUDIT_ACTIONS.ROLE_MISMATCH,
          entity: 'Authorization',
          notes: `Token role (${req.user.role}) doesn't match current role (${user.role})`,
          ipAddress: req.ip,
          correlationId: req.correlationId,
        }).catch(console.error);

        return res.status(403).json(errorResponse('Role has changed, please login again'));
      }
    } catch (error) {
      console.error('Authorization check failed:', error);
      return res.status(500).json(errorResponse('Authorization check failed'));
    }

    // Check role permissions
    if (!allowedRoles.includes(req.user.role)) {
      await audit({
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        entity: 'Authorization',
        notes: `Insufficient permissions. Required: ${allowedRoles.join(', ')}, Has: ${req.user.role}`,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      }).catch(console.error);

      return res.status(403).json(errorResponse(`Access denied: Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`));
    }

    next();
  };
};

/**
 * Optional authentication with session validation
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && !sessionManager.isTokenBlacklisted(token)) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Validate session if provided
      const sessionId = req.headers['x-session-id'];
      if (sessionId) {
        const session = await sessionManager.validateSession(sessionId);
        if (session && session.userId === decoded.id) {
          req.session = session;
        }
      }
      
      req.user = decoded;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Token is invalid, but we continue without user for optional auth
    next();
  }
};

/**
 * Middleware to require fresh authentication (for sensitive operations)
 */
export const requireFreshAuth = (maxAgeMinutes = 30) => {
  return async (req, res, next) => {
    if (!req.session) {
      return res.status(401).json(errorResponse('Fresh authentication required'));
    }

    const sessionAge = Date.now() - new Date(req.session.createdAt).getTime();
    const maxAge = maxAgeMinutes * 60 * 1000;

    if (sessionAge > maxAge) {
      await audit({
        userId: req.user.id,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.STALE_SESSION,
        entity: 'Authentication',
        notes: `Session too old for sensitive operation (${Math.round(sessionAge / 60000)} minutes)`,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      }).catch(console.error);

      return res.status(401).json(errorResponse('Session too old, fresh authentication required'));
    }

    next();
  };
};

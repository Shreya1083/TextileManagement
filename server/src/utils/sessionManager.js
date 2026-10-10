import { prisma } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * JWT Token Blacklist and Session Management
 */
class SessionManager {
  constructor() {
    this.blacklistedTokens = new Set();
    this.activeSessions = new Map();
    
    // Clean up expired tokens every hour
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
  }

  /**
   * Create new session
   */
  async createSession(userId, token, userAgent, ipAddress) {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = {
      sessionId,
      userId,
      token,
      userAgent: userAgent || 'Unknown',
      ipAddress: ipAddress || 'Unknown',
      createdAt: new Date(),
      expiresAt,
      isActive: true,
    };

    this.activeSessions.set(sessionId, session);

    // Store in database for persistence
    await prisma.userSession.create({
      data: session,
    }).catch(() => {
      // If table doesn't exist, we'll create it in schema update
      console.warn('UserSession table not found, session stored in memory only');
    });

    return sessionId;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId) {
    let session = this.activeSessions.get(sessionId);
    
    if (!session) {
      // Try to load from database
      try {
        session = await prisma.userSession.findUnique({
          where: { sessionId },
        });
        
        if (session && session.isActive) {
          this.activeSessions.set(sessionId, session);
        }
      } catch {
        // Database error or table doesn't exist
        return null;
      }
    }

    if (!session || !session.isActive || new Date() > session.expiresAt) {
      return null;
    }

    return session;
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    
    if (session) {
      this.blacklistedTokens.add(session.token);
      this.activeSessions.delete(sessionId);
      
      // Update in database
      await prisma.userSession.update({
        where: { sessionId },
        data: { isActive: false },
      }).catch(() => {
        // Ignore database errors for now
      });
    }
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId) {
    // Invalidate memory sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.blacklistedTokens.add(session.token);
        this.activeSessions.delete(sessionId);
      }
    }

    // Update database sessions
    await prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }).catch(() => {
      // Ignore database errors for now
    });
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token) {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId) {
    const sessions = [];
    
    // Get from memory
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.isActive) {
        sessions.push({
          sessionId: session.sessionId,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        });
      }
    }

    // Get from database
    try {
      const dbSessions = await prisma.userSession.findMany({
        where: { userId, isActive: true },
        select: {
          sessionId: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      // Merge and deduplicate
      const allSessions = [...sessions];
      for (const dbSession of dbSessions) {
        if (!sessions.find(s => s.sessionId === dbSession.sessionId)) {
          allSessions.push(dbSession);
        }
      }

      return allSessions;
    } catch {
      return sessions;
    }
  }

  /**
   * Clean up expired tokens and sessions
   */
  cleanupExpiredTokens() {
    const now = new Date();
    
    // Clean up memory sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt) {
        this.blacklistedTokens.add(session.token);
        this.activeSessions.delete(sessionId);
      }
    }

    // Clean up blacklisted tokens (remove very old ones to prevent memory bloat)
    // In production, you might want to store blacklist in Redis with TTL
    if (this.blacklistedTokens.size > 10000) {
      this.blacklistedTokens.clear();
      console.warn('Cleared token blacklist due to size limit');
    }

    // Clean up database sessions
    prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { isActive: false }
        ]
      }
    }).catch(() => {
      // Ignore cleanup errors
    });
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

/**
 * Middleware to validate session
 */
export const validateSession = async (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  
  if (sessionId) {
    const session = await sessionManager.validateSession(sessionId);
    if (session) {
      req.session = session;
    }
  }
  
  next();
};
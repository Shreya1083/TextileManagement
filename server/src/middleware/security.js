import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { v4 as uuidv4 } from 'uuid';
import { audit, AUDIT_ACTIONS } from '../utils/audit.js';

// Rate limiting configurations
export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Log rate limit violations
      audit({
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        action: AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED,
        entity: 'Security',
        notes: `Rate limit exceeded for ${req.method} ${req.originalUrl}`,
        ipAddress: req.ip,
      }).catch(console.error);

      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// Specific rate limiters
export const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many login attempts, please try again later'
);

export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes  
  100, // 100 requests per window
  'Too many API requests, please slow down'
);

export const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per window
  'Too many requests to sensitive endpoint'
);

// Speed limiter for suspicious activity
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window at full speed
  delayMs: () => 500, // Fixed 500ms delay per request after delayAfter  
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false }, // Disable warning
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow for development
});

// Request correlation ID middleware
export const correlationId = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.set('X-Correlation-ID', correlationId);
  next();
};

// Input sanitization middleware
export const sanitizeInput = [
  mongoSanitize({
    replaceWith: '_', // Replace prohibited characters with underscore
  }),
  hpp({
    whitelist: ['page', 'limit', 'sort', 'status', 'role'], // Allow these parameters to be arrays
  }),
];

// Brute force protection for specific IPs
const failedAttempts = new Map();
const blockedIPs = new Map();

export const bruteForceProtection = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  
  // Check if IP is currently blocked
  if (blockedIPs.has(ip)) {
    const blockInfo = blockedIPs.get(ip);
    if (now < blockInfo.blockedUntil) {
      return res.status(429).json({
        success: false,
        error: 'IP temporarily blocked due to suspicious activity',
        blockedUntil: new Date(blockInfo.blockedUntil).toISOString(),
      });
    } else {
      // Block period expired, remove from blocked list
      blockedIPs.delete(ip);
      failedAttempts.delete(ip);
    }
  }
  
  next();
};

// Track failed attempts
export const trackFailedAttempt = (req) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  let attempts = failedAttempts.get(ip) || [];
  
  // Remove old attempts outside the window
  attempts = attempts.filter(time => now - time < windowMs);
  attempts.push(now);
  
  failedAttempts.set(ip, attempts);
  
  // Block IP if too many failed attempts
  if (attempts.length >= 10) {
    const blockDuration = 30 * 60 * 1000; // 30 minutes
    blockedIPs.set(ip, {
      blockedUntil: now + blockDuration,
      reason: 'Too many failed login attempts',
    });
    
    // Audit the IP block
    audit({
      action: AUDIT_ACTIONS.IP_BLOCKED,
      entity: 'Security',
      notes: `IP ${ip} blocked for excessive failed attempts`,
      ipAddress: ip,
    }).catch(console.error);
  }
};

// Clear failed attempts on successful login
export const clearFailedAttempts = (req) => {
  const ip = req.ip;
  if (failedAttempts.has(ip)) {
    failedAttempts.delete(ip);
  }
};

// Enhanced request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${req.correlationId}] ${req.method} ${req.originalUrl} - ${req.ip}`);
  }
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${req.correlationId}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
    
    // Log suspicious activity
    if (res.statusCode >= 400) {
      audit({
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        action: res.statusCode >= 500 ? AUDIT_ACTIONS.SERVER_ERROR : AUDIT_ACTIONS.CLIENT_ERROR,
        entity: 'Request',
        notes: `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      }).catch(console.error);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Sensitive data filter for logs
export const filterSensitiveData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
  const filtered = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in filtered) {
      filtered[field] = '[FILTERED]';
    }
  }
  
  return filtered;
};
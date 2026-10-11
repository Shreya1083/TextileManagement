import { prisma } from '../config/database.js';

/**
 * Enhanced append-only audit logger for critical business operations with security focus.
 * Never throws — audit failures should not break the main operation.
 */
export const audit = async ({
  userId,
  userEmail,
  userRole,
  action,
  entity,
  entityId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  correlationId = null,
  notes = null,
  metadata = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        userEmail: userEmail ?? null,
        userRole: userRole ?? null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: ipAddress ?? null,
        correlationId: correlationId ?? null,
        notes: notes ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    // Log to console only — do not propagate audit failures
    console.error('[AUDIT ERROR]', {
      error: err.message,
      action,
      entity,
      entityId,
      userId,
      correlationId,
    });
  }
};

export const AUDIT_ACTIONS = {
  // Basic operations
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  
  // Authentication & Security
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_INVALIDATED: 'SESSION_INVALIDATED',
  AUTH_FAILED: 'AUTH_FAILED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  ROLE_MISMATCH: 'ROLE_MISMATCH',
  STALE_SESSION: 'STALE_SESSION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  IP_BLOCKED: 'IP_BLOCKED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  CLIENT_ERROR: 'CLIENT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // User Management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  
  // Business Operations  
  DISPATCH: 'DISPATCH',
  INVOICE_ISSUED: 'INVOICE_ISSUED',
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',
  QC_DECISION: 'QC_DECISION',
  WAGE_LOCK: 'WAGE_LOCK',
  WAGE_UNLOCK: 'WAGE_UNLOCK',
  ATTENDANCE_CORRECTION: 'ATTENDANCE_CORRECTION',
  STOCK_ADJUST: 'STOCK_ADJUST',
  GRN_CREATE: 'GRN_CREATE',
  BULK_OPERATION: 'BULK_OPERATION',
  WAGE_SHEET_GENERATED: 'WAGE_SHEET_GENERATED',
  WAGE_SHEET_LOCKED: 'WAGE_SHEET_LOCKED',
  WAGE_SHEET_UNLOCKED: 'WAGE_SHEET_UNLOCKED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  
  // System & Configuration
  BACKUP_CREATED: 'BACKUP_CREATED',
  MAINTENANCE_STARTED: 'MAINTENANCE_STARTED',
  MAINTENANCE_COMPLETED: 'MAINTENANCE_COMPLETED',
  CONFIG_CHANGED: 'CONFIG_CHANGED',
};

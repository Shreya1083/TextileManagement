import { prisma } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import { audit, AUDIT_ACTIONS } from '../utils/audit.js';
import { sessionManager } from '../utils/sessionManager.js';
import { clearFailedAttempts, trackFailedAttempt } from '../middleware/security.js';

/**
 * Enhanced user login service with comprehensive security
 */
export const loginUser = async (email, password, ipAddress = null, userAgent = null) => {
  let user = null;
  
  try {
    // Find user by email
    user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await audit({ 
        action: AUDIT_ACTIONS.LOGIN_FAILED, 
        entity: 'User', 
        notes: `Failed login for ${email} - user not found`, 
        ipAddress 
      });
      
      // Generic error to prevent email enumeration
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      await audit({ 
        userId: user.id, 
        userEmail: user.email, 
        action: AUDIT_ACTIONS.LOGIN_FAILED, 
        entity: 'User', 
        entityId: user.id, 
        notes: 'Account deactivated', 
        ipAddress 
      });
      throw new Error('Account is deactivated. Please contact administrator.');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      // Track failed attempt for brute force protection
      if (ipAddress) {
        trackFailedAttempt({ ip: ipAddress });
      }
      
      await audit({ 
        userId: user.id, 
        userEmail: user.email, 
        action: AUDIT_ACTIONS.LOGIN_FAILED, 
        entity: 'User', 
        entityId: user.id, 
        notes: 'Wrong password', 
        ipAddress 
      });
      
      throw new Error('Invalid credentials');
    }

    // Clear failed attempts on successful login
    if (ipAddress) {
      clearFailedAttempts({ ip: ipAddress });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session
    const sessionId = await sessionManager.createSession(
      user.id, 
      token, 
      userAgent, 
      ipAddress
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    await audit({ 
      userId: user.id, 
      userEmail: user.email, 
      userRole: user.role, 
      action: AUDIT_ACTIONS.LOGIN, 
      entity: 'User', 
      entityId: user.id, 
      ipAddress,
      metadata: { userAgent, sessionId }
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        lastLoginAt: new Date(),
      },
      token,
      refreshToken,
      sessionId,
    };
  } catch (error) {
    // Track failed attempt for any authentication error
    if (ipAddress && error.message !== 'Account is deactivated. Please contact administrator.') {
      trackFailedAttempt({ ip: ipAddress });
    }
    throw error;
  }
};

/**
 * Enhanced logout service with session cleanup
 */
export const logoutUser = async (userId, sessionId, ipAddress = null) => {
  try {
    // Invalidate session
    if (sessionId) {
      await sessionManager.invalidateSession(sessionId);
    }

    await audit({
      userId,
      action: AUDIT_ACTIONS.LOGOUT,
      entity: 'User',
      entityId: userId,
      ipAddress,
      metadata: { sessionId }
    });

    return { message: 'Logged out successfully' };
  } catch (error) {
    throw new Error('Logout failed');
  }
};

/**
 * Logout from all devices
 */
export const logoutAllDevices = async (userId, ipAddress = null) => {
  try {
    await sessionManager.invalidateAllUserSessions(userId);

    await audit({
      userId,
      action: AUDIT_ACTIONS.SESSION_INVALIDATED,
      entity: 'User', 
      entityId: userId,
      notes: 'All sessions invalidated',
      ipAddress
    });

    return { message: 'Logged out from all devices successfully' };
  } catch (error) {
    throw new Error('Failed to logout from all devices');
  }
};

/**
 * Refresh token endpoint
 */
export const refreshToken = async (refreshTokenValue, ipAddress = null) => {
  try {
    const { verifyRefreshToken, generateToken: newToken } = await import('../utils/jwt.js');
    const decoded = verifyRefreshToken(refreshTokenValue);

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or deactivated');
    }

    // Generate new access token
    const token = newToken(user);

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.TOKEN_REFRESH,
      entity: 'User',
      entityId: user.id,
      ipAddress
    });

    return { token };
  } catch (error) {
    throw new Error('Token refresh failed');
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Enhanced change user password with security audit
 */
export const changePassword = async (userId, currentPassword, newPassword, ipAddress = null) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  
  if (!isPasswordValid) {
    await audit({
      userId,
      userEmail: user.email,
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      entity: 'User',
      entityId: userId,
      notes: 'Failed password change - invalid current password',
      ipAddress
    });
    throw new Error('Current password is incorrect');
  }

  // Hash new password (validatePassword is called inside hashPassword)
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { 
      password: hashedPassword,
      passwordChangedAt: new Date(),
    },
  });

  // Invalidate all sessions to force re-login
  await sessionManager.invalidateAllUserSessions(userId);

  await audit({
    userId,
    userEmail: user.email,
    action: AUDIT_ACTIONS.PASSWORD_CHANGE,
    entity: 'User',
    entityId: userId,
    notes: 'Password changed successfully - all sessions invalidated',
    ipAddress
  });

  return { message: 'Password changed successfully. Please login again.' };
};

/**
 * Create new user (Admin only)
 */
export const createUser = async (userData) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (userId, updateData) => {
  // If password is being updated, hash it
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (filters = {}) => {
  const { role, isActive, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (userId) => {
  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: 'User deleted successfully' };
};

import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, errorResponse } from '../utils/response.js';
import * as authService from '../services/auth.service.js';
import { sessionManager } from '../utils/sessionManager.js';

/**
 * @route   POST /api/auth/login
 * @desc    Enhanced login with session management
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(
    email, 
    password, 
    req.ip,
    req.get('User-Agent')
  );

  // Set secure cookie with session ID
  res.cookie('sessionId', result.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json(successResponse(result, 'Login successful'));
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  
  const result = await authService.logoutUser(
    req.user.id,
    sessionId,
    req.ip
  );

  res.clearCookie('sessionId');
  res.json(successResponse(result, result.message));
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
export const logoutAll = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllDevices(req.user.id, req.ip);

  res.clearCookie('sessionId');
  res.json(successResponse(result, result.message));
});

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user's active sessions
 * @access  Private
 */
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionManager.getUserSessions(req.user.id);

  res.json(successResponse(sessions, 'Sessions retrieved successfully'));
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshToken(refreshToken, req.ip);

  res.json(successResponse(result, 'Token refreshed successfully'));
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);

  res.json(successResponse(user));
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password with enhanced security
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await authService.changePassword(
    req.user.id,
    currentPassword,
    newPassword,
    req.ip
  );

  // Clear all sessions on password change
  res.clearCookie('sessionId');

  res.json(successResponse(result, result.message));
});

/**
 * @route   POST /api/auth/users
 * @desc    Create new user
 * @access  Private (Owner only)
 */
export const createUser = asyncHandler(async (req, res) => {
  const user = await authService.createUser(req.body);

  res.status(201).json(successResponse(user, 'User created successfully'));
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users
 * @access  Private (Owner only)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await authService.getAllUsers(req.query);

  res.json(successResponse(result.users, 'Users retrieved successfully', result.pagination));
});

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Update user
 * @access  Private (Owner only)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await authService.updateUser(req.params.id, req.body);

  res.json(successResponse(user, 'User updated successfully'));
});

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete user
 * @access  Private (Owner only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await authService.deleteUser(req.params.id);

  res.json(successResponse(null, result.message));
});
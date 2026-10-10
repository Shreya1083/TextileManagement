import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize, requireFreshAuth } from '../middleware/auth.js';
import { loginLimiter, strictLimiter } from '../middleware/security.js';
import {
  loginValidator,
  changePasswordValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  refreshTokenValidator,
} from '../validators/auth.validator.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/login', loginLimiter, loginValidator, authController.login);
router.post('/refresh', refreshTokenValidator, authController.refreshToken);

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, strictLimiter, authController.logoutAll);
router.get('/sessions', authenticate, authController.getSessions);
router.post('/change-password', authenticate, strictLimiter, changePasswordValidator, authController.changePassword);

// User management routes (Owner only with fresh authentication for sensitive operations)
router.post('/users', authenticate, authorize('OWNER'), createUserValidator, authController.createUser);
router.get('/users', authenticate, authorize('OWNER'), authController.getAllUsers);
router.put('/users/:id', authenticate, authorize('OWNER'), requireFreshAuth(15), updateUserValidator, authController.updateUser);
router.delete('/users/:id', authenticate, authorize('OWNER'), requireFreshAuth(5), deleteUserValidator, authController.deleteUser);

export default router;

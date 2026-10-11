import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

/**
 * Enhanced change password validation with stronger requirements
 */
export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  validate,
];

/**
 * Enhanced create user validation
 */
export const createUserValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom(value => {
      // Prevent obvious test/fake emails in production
      if (process.env.NODE_ENV === 'production') {
        const blockedDomains = ['test.com', 'example.com', 'fake.com'];
        const domain = value.split('@')[1];
        if (blockedDomains.includes(domain)) {
          throw new Error('Invalid email domain');
        }
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and periods'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['OWNER', 'STOREKEEPER', 'SUPERVISOR', 'INSPECTOR', 'ACCOUNTS', 'BUYER'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  validate,
];

/**
 * Refresh token validation
 */
export const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format'),
  validate,
];

/**
 * Enhanced login validation
 */
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 320 }) // RFC 5321 limit
    .withMessage('Email address too long'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 }) // Reasonable limits
    .withMessage('Password length invalid'),
  validate,
];

/**
 * Enhanced update user validation  
 */
export const updateUserValidator = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid user ID format'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 320 })
    .withMessage('Email address too long'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and periods'),
  body('role')
    .optional()
    .isIn(['OWNER', 'STOREKEEPER', 'SUPERVISOR', 'INSPECTOR', 'ACCOUNTS', 'BUYER'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  validate,
];

/**
 * Enhanced delete user validation
 */
export const deleteUserValidator = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid user ID format')
    .custom((value, { req }) => {
      // Prevent self-deletion
      if (value === req.user?.id) {
        throw new Error('Cannot delete your own account');
      }
      return true;
    }),
  validate,
];

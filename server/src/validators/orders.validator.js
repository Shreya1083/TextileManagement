import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';

// ============================================
// BUYERS
// ============================================

export const createBuyerValidator = [
  body('name').notEmpty().withMessage('Buyer name is required').trim(),
  body('contactName').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().trim(),
  body('gstin').optional().trim().isLength({ min: 15, max: 15 }).withMessage('GSTIN must be 15 characters'),
  validate,
];

export const updateBuyerValidator = [
  param('id').notEmpty().withMessage('Buyer ID is required'),
  body('name').optional().trim(),
  body('contactName').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().trim(),
  body('gstin').optional().trim().isLength({ min: 15, max: 15 }).withMessage('GSTIN must be 15 characters'),
  body('isActive').optional().isBoolean(),
  validate,
];

// ============================================
// FABRIC TYPES
// ============================================

export const createFabricTypeValidator = [
  body('name').notEmpty().withMessage('Fabric type name is required').trim(),
  body('description').optional().trim(),
  body('gsm').optional().isInt({ min: 1 }).withMessage('GSM must be a positive number'),
  body('width').optional().isInt({ min: 1 }).withMessage('Width must be a positive number'),
  body('yarnPerMetre').isInt({ min: 1 }).withMessage('Yarn per metre is required and must be positive'),
  validate,
];

export const updateFabricTypeValidator = [
  param('id').notEmpty().withMessage('Fabric type ID is required'),
  body('name').optional().trim(),
  body('description').optional().trim(),
  body('gsm').optional().isInt({ min: 1 }).withMessage('GSM must be a positive number'),
  body('width').optional().isInt({ min: 1 }).withMessage('Width must be a positive number'),
  body('yarnPerMetre').optional().isInt({ min: 1 }).withMessage('Yarn per metre must be positive'),
  validate,
];

// ============================================
// ORDERS
// ============================================

export const createOrderValidator = [
  body('buyerId').notEmpty().withMessage('Buyer is required'),
  body('fabricTypeId').notEmpty().withMessage('Fabric type is required'),
  body('color').notEmpty().withMessage('Color is required').trim(),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1 metre'),
  body('ratePerMetre').isInt({ min: 0 }).withMessage('Rate per metre must be a positive number'),
  body('deadline').isISO8601().withMessage('Valid deadline is required'),
  body('notes').optional().trim(),
  validate,
];

export const updateOrderValidator = [
  param('id').notEmpty().withMessage('Order ID is required'),
  body('buyerId').optional(),
  body('fabricTypeId').optional(),
  body('color').optional().trim(),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1 metre'),
  body('ratePerMetre').optional().isInt({ min: 0 }).withMessage('Rate per metre must be positive'),
  body('deadline').optional().isISO8601(),
  body('notes').optional().trim(),
  validate,
];

export const updateOrderStatusValidator = [
  param('id').notEmpty().withMessage('Order ID is required'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'DRAFT',
      'CONFIRMED',
      'YARN_PENDING',
      'IN_PRODUCTION',
      'QUALITY_CHECK',
      'READY_TO_SHIP',
      'DISPATCHED',
      'CLOSED',
    ])
    .withMessage('Invalid order status'),
  body('notes').optional().trim(),
  validate,
];

export const trackOrderValidator = [
  query('orderNumber').notEmpty().withMessage('Order number is required'),
  query('token').notEmpty().withMessage('Tracking token is required'),
  validate,
];

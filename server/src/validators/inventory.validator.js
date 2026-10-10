import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';

// ============================================
// SUPPLIERS
// ============================================

export const createSupplierValidator = [
  body('name').notEmpty().withMessage('Supplier name is required').trim(),
  body('contactName').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('address').optional().trim(),
  body('gstin').optional().trim().isLength({ min: 15, max: 15 }).withMessage('GSTIN must be 15 characters'),
  validate,
];

export const updateSupplierValidator = [
  param('id').notEmpty().withMessage('Supplier ID is required'),
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
// YARN TYPES
// ============================================

export const createYarnTypeValidator = [
  body('name').notEmpty().withMessage('Yarn name is required').trim(),
  body('count').notEmpty().withMessage('Yarn count is required').trim(),
  body('color').notEmpty().withMessage('Color is required').trim(),
  body('unit').optional().isIn(['kg', 'g', 'cone', 'bag']).withMessage('Invalid unit'),
  body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a positive number'),
  validate,
];

export const updateYarnTypeValidator = [
  param('id').notEmpty().withMessage('Yarn type ID is required'),
  body('name').optional().trim(),
  body('count').optional().trim(),
  body('color').optional().trim(),
  body('unit').optional().isIn(['kg', 'g', 'cone', 'bag']).withMessage('Invalid unit'),
  body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be a positive number'),
  validate,
];

// ============================================
// GATE ENTRIES
// ============================================

export const createGateEntryValidator = [
  body('grnNumber').notEmpty().withMessage('GRN number is required').trim(),
  body('supplierId').notEmpty().withMessage('Supplier is required'),
  body('yarnTypeId').notEmpty().withMessage('Yarn type is required'),
  body('lotNumber').notEmpty().withMessage('Lot number is required').trim(),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('bags').optional().isInt({ min: 0 }),
  body('cones').optional().isInt({ min: 0 }),
  body('unitPrice').optional().isInt({ min: 1 }).withMessage('Unit price must be at least 1 paise'),
  body('vehicleNumber').optional().trim(),
  body('challanNumber').optional().trim(),
  body('receivedBy').optional(),
  validate,
];

// ============================================
// PURCHASE ORDERS
// ============================================

export const createPurchaseOrderValidator = [
  body('poNumber').notEmpty().withMessage('PO number is required').trim(),
  body('supplierId').notEmpty().withMessage('Supplier is required'),
  body('expectedDate').isISO8601().withMessage('Valid expected date is required'),
  body('notes').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.yarnTypeId').notEmpty().withMessage('Yarn type is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isInt({ min: 0 }).withMessage('Unit price must be a positive number'),
  validate,
];

export const updatePurchaseOrderValidator = [
  param('id').notEmpty().withMessage('Purchase order ID is required'),
  body('status').optional().isIn(['RAISED', 'PARTIALLY_RECEIVED', 'RECEIVED']),
  body('expectedDate').optional().isISO8601(),
  body('notes').optional().trim(),
  validate,
];

export const receivePurchaseOrderValidator = [
  param('id').notEmpty().withMessage('Purchase order ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.itemId').notEmpty().withMessage('Item ID is required'),
  body('items.*.quantityReceived').isInt({ min: 1 }).withMessage('Quantity received must be at least 1'),
  validate,
];

// ============================================
// STOCK RESERVATIONS & ISSUANCE
// ============================================

export const reserveStockValidator = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('yarnRequirements').isArray({ min: 1 }).withMessage('At least one yarn requirement is needed'),
  body('yarnRequirements.*.yarnTypeId').notEmpty().withMessage('Yarn type ID is required'),
  body('yarnRequirements.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  validate,
];

export const issueStockValidator = [
  body('productionLogId').notEmpty().withMessage('Production log ID is required'),
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('yarnRequirements').isArray({ min: 1 }).withMessage('At least one yarn requirement is needed'),
  body('yarnRequirements.*.yarnTypeId').notEmpty().withMessage('Yarn type ID is required'),
  body('yarnRequirements.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  validate,
];

export const adjustStockValidator = [
  param('stockBatchId').notEmpty().withMessage('Stock batch ID is required'),
  body('quantity').isFloat().withMessage('Quantity is required'),
  body('reason').notEmpty().withMessage('Reason for adjustment is required').trim(),
  body('adjustmentType')
    .notEmpty()
    .isIn(['DAMAGE', 'LOSS', 'FOUND', 'CORRECTION', 'WRITE_OFF', 'OTHER'])
    .withMessage('Invalid adjustment type'),
  validate,
];

export const checkAvailabilityValidator = [
  query('yarnTypeId').notEmpty().withMessage('Yarn type ID is required'),
  query('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  validate,
];

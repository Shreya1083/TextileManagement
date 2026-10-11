import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

// ============================================
// DISPATCHES
// ============================================

export const createDispatchValidator = [
  body('buyerId').optional(),
  body('orderId').optional(),
  body('rollIds')
    .isArray({ min: 1 })
    .withMessage('At least one roll must be selected'),
  body('vehicleNumber').optional().trim(),
  body('driverName').optional().trim(),
  body('driverPhone').optional().trim(),
  body('dispatchDate')
    .isISO8601()
    .withMessage('Valid dispatch date is required'),
  validate,
];

// ============================================
// INVOICES
// ============================================

export const createInvoiceValidator = [
  body('buyerId').optional(),
  body('orderId').optional(),
  body('dispatchId').notEmpty().withMessage('Dispatch is required'),
  body('totalAmount')
    .isInt({ min: 1 })
    .withMessage('Total amount must be a positive integer paise value'),
  body('totalQuantity').optional().isInt({ min: 1 }),
  body('invoiceDate')
    .isISO8601()
    .withMessage('Valid invoice date is required'),
  body('dueDate').optional().isISO8601(),
  body('notes').optional().trim(),
  validate,
];

export const updateInvoiceValidator = [
  param('id').notEmpty().withMessage('Invoice ID is required'),
  body('status')
    .optional()
    .isIn(['PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'])
    .withMessage('Invalid invoice status'),
  body('notes').optional().trim(),
  validate,
];

// ============================================
// PAYMENTS
// ============================================

export const createPaymentValidator = [
  body('invoiceId').notEmpty().withMessage('Invoice is required'),
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Payment amount must be greater than 0'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .trim(),
  body('transactionId').optional().trim(),
  body('paymentDate')
    .isISO8601()
    .withMessage('Valid payment date is required'),
  body('notes').optional().trim(),
  validate,
];

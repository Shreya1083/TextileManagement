import { body, query, param } from 'express-validator';

// Expense Categories
const EXPENSE_CATEGORIES = [
  'RAW_MATERIAL',
  'MAINTENANCE',
  'UTILITIES',
  'SALARY',
  'TRANSPORT',
  'MISCELLANEOUS'
];

export const createExpenseValidator = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(EXPENSE_CATEGORIES).withMessage('Invalid expense category'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isInt({ min: 1 }).withMessage('Amount must be an integer paise value greater than 0'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 3, max: 500 }).withMessage('Description must be 3-500 characters'),
  body('reference')
    .optional()
    .isLength({ max: 100 }).withMessage('Reference must not exceed 100 characters'),
  body('paymentMode')
    .optional()
    .isIn(['CASH', 'BANK', 'UPI', 'CHEQUE', 'CARD']).withMessage('Invalid payment mode')
];

export const updateExpenseValidator = [
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('category')
    .optional()
    .isIn(EXPENSE_CATEGORIES).withMessage('Invalid expense category'),
  body('amount')
    .optional()
    .isInt({ min: 1 }).withMessage('Amount must be an integer paise value greater than 0'),
  body('description')
    .optional()
    .isLength({ min: 3, max: 500 }).withMessage('Description must be 3-500 characters'),
  body('reference')
    .optional()
    .isLength({ max: 100 }).withMessage('Reference must not exceed 100 characters'),
  body('paymentMode')
    .optional()
    .isIn(['CASH', 'BANK', 'UPI', 'CHEQUE', 'CARD']).withMessage('Invalid payment mode')
];

export const getExpensesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('category')
    .optional()
    .isIn(EXPENSE_CATEGORIES).withMessage('Invalid expense category')
];

export const expenseIdValidator = [
  param('id')
    .notEmpty().withMessage('Expense ID is required')
    .isString().withMessage('Invalid expense ID')
];

export const expenseSummaryValidator = [
  query('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date format'),
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'category']).withMessage('Invalid groupBy value')
];

export const orderCostingValidator = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isString().withMessage('Invalid order ID')
];

export const machineOutputValidator = [
  query('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date format'),
  query('machineId')
    .optional()
    .isString().withMessage('Invalid machine ID')
];

export const profitLossValidator = [
  query('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
  query('month')
    .notEmpty().withMessage('Month is required')
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12')
];

export const ownerDashboardValidator = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];

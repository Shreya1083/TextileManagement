import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

// ============================================
// MACHINES
// ============================================

export const createMachineValidator = [
  body('name').notEmpty().withMessage('Machine name is required').trim(),
  body('machineCode').notEmpty().withMessage('Machine code is required').trim(),
  body('stage')
    .notEmpty()
    .isIn(['SPINNING', 'WEAVING', 'DYEING', 'FINISHING'])
    .withMessage('Invalid machine stage'),
  body('location').optional().trim(),
  validate,
];

export const updateMachineValidator = [
  param('id').notEmpty().withMessage('Machine ID is required'),
  body('name').optional().trim(),
  body('machineCode').optional().trim(),
  body('stage').optional().isIn(['SPINNING', 'WEAVING', 'DYEING', 'FINISHING']),
  body('status').optional().isIn(['IDLE', 'RUNNING', 'BREAKDOWN', 'MAINTENANCE']),
  body('location').optional().trim(),
  validate,
];

export const updateMachineStatusValidator = [
  param('id').notEmpty().withMessage('Machine ID is required'),
  body('status')
    .notEmpty()
    .isIn(['IDLE', 'RUNNING', 'BREAKDOWN', 'MAINTENANCE'])
    .withMessage('Invalid machine status'),
  validate,
];

// ============================================
// WORK ASSIGNMENTS
// ============================================

export const createWorkAssignmentValidator = [
  body('orderId').notEmpty().withMessage('Order is required'),
  body('machineId').notEmpty().withMessage('Machine is required'),
  body('stage')
    .notEmpty()
    .isIn(['SPINNING', 'WEAVING', 'DYEING', 'FINISHING'])
    .withMessage('Invalid stage'),
  body('plannedQuantity').isInt({ min: 1 }).withMessage('Planned quantity must be at least 1'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('shift').optional().trim(),
  body('assignedBy').notEmpty().withMessage('Assigned by user is required'),
  validate,
];

export const updateWorkAssignmentValidator = [
  param('id').notEmpty().withMessage('Work assignment ID is required'),
  body('plannedQuantity').optional().isInt({ min: 1 }),
  body('endDate').optional().isISO8601(),
  body('shift').optional().trim(),
  body('status').optional().trim(),
  validate,
];

// ============================================
// PRODUCTION LOGS
// ============================================

export const createProductionLogValidator = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('shift').notEmpty().withMessage('Shift is required').trim(),
  body('machineId').notEmpty().withMessage('Machine is required'),
  body('orderId').notEmpty().withMessage('Order is required'),
  body('workAssignmentId').optional(),
  body('outputQuantity').optional().isInt({ min: 0 }).withMessage('Output must be a non-negative number'),
  body('output').optional().isInt({ min: 0 }).withMessage('Output must be a non-negative number'),
  body('wasteQuantity').optional().isInt({ min: 0 }).withMessage('Waste must be a non-negative number'),
  body('waste').optional().isInt({ min: 0 }).withMessage('Waste must be a non-negative number'),
  body('operatorId').notEmpty().withMessage('Operator is required'),
  body('notes').optional().trim(),
  validate,
];

// ============================================
// DOWNTIME LOGS
// ============================================

export const createDowntimeLogValidator = [
  body('machineId').notEmpty().withMessage('Machine is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('reason').notEmpty().withMessage('Reason is required').trim(),
  body('notes').optional().trim(),
  validate,
];

export const updateDowntimeLogValidator = [
  param('id').notEmpty().withMessage('Downtime log ID is required'),
  body('endTime').optional().isISO8601(),
  body('reason').optional().trim(),
  body('notes').optional().trim(),
  validate,
];

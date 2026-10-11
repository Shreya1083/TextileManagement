import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

const ATTENDANCE_METHODS = ['QR', 'MANUAL', 'BULK_UPLOAD'];

// ============================================
// WORKERS
// ============================================

export const createWorkerValidator = [
  body('employeeId').notEmpty().withMessage('Employee ID is required').trim(),
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
  body('role').notEmpty().withMessage('Role is required').trim(),
  body('department').optional().trim(),
  body('shift').optional().trim(),
  body('wageBasis')
    .notEmpty()
    .withMessage('Wage basis is required')
    .customSanitizer(v => typeof v === 'string' ? v.toUpperCase().replace('-', '_') : v)
    .isIn(['DAILY', 'PIECE_RATE'])
    .withMessage('Invalid wage basis: must be DAILY or PIECE_RATE'),
  body('dailyWage').optional().isInt({ min: 0 }),
  body('pieceRate').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('joinDate')
    .notEmpty()
    .withMessage('Valid join date is required')
    .isISO8601()
    .withMessage('Valid join date (YYYY-MM-DD) is required'),
  validate,
];

export const updateWorkerValidator = [
  param('id').notEmpty().withMessage('Worker ID is required'),
  body('name').optional().trim(),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('role').optional().trim(),
  body('department').optional().trim(),
  body('shift').optional().trim(),
  body('wageBasis')
    .optional()
    .customSanitizer(v => typeof v === 'string' ? v.toUpperCase().replace('-', '_') : v)
    .isIn(['DAILY', 'PIECE_RATE']),
  body('dailyWage').optional().isInt({ min: 0 }),
  body('pieceRate').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  validate,
];

// ============================================
// SHIFTS
// ============================================

export const createShiftValidator = [
  body('name').notEmpty().withMessage('Shift name is required').trim(),
  body('startTime').notEmpty().withMessage('Start time is required').trim(),
  body('endTime').notEmpty().withMessage('End time is required').trim(),
  validate,
];

export const updateShiftValidator = [
  param('id').notEmpty().withMessage('Shift ID is required'),
  body('name').optional().trim(),
  body('startTime').optional().trim(),
  body('endTime').optional().trim(),
  body('isActive').optional().isBoolean(),
  validate,
];

// ============================================
// ATTENDANCE
// ============================================

export const markAttendanceValidator = [
  body('workerId').notEmpty().withMessage('Worker is required'),
  body('shiftId').notEmpty().withMessage('Shift is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status')
    .notEmpty()
    .isIn(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'])
    .withMessage('Invalid attendance status'),
  body('checkInTime').optional().isISO8601(),
  body('checkOutTime').optional().isISO8601(),
  body('overtimeHours').optional().isInt({ min: 0 }),
  body('attendanceMethod')
    .optional()
    .isIn(ATTENDANCE_METHODS)
    .withMessage('Attendance method must be QR, MANUAL or BULK_UPLOAD'),
  validate,
];

export const bulkMarkAttendanceValidator = [
  body('records')
    .isArray({ min: 1 })
    .withMessage('Records array is required'),
  body('records.*.workerId').notEmpty().withMessage('Worker is required'),
  body('records.*.shiftId').notEmpty().withMessage('Shift is required'),
  body('records.*.date').isISO8601().withMessage('Valid date is required'),
  body('records.*.status')
    .notEmpty()
    .isIn(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'])
    .withMessage('Invalid status'),
  body('records.*.attendanceMethod')
    .optional()
    .isIn(ATTENDANCE_METHODS)
    .withMessage('Attendance method must be QR, MANUAL or BULK_UPLOAD'),
  validate,
];

export const updateAttendanceValidator = [
  param('id').notEmpty().withMessage('Attendance ID is required'),
  body('status')
    .optional()
    .isIn(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']),
  body('overtimeHours').optional().isInt({ min: 0 }),
  body('correctionReason').optional().trim(),
  validate,
];

// ============================================
// WAGE RECORDS
// ============================================

export const generateWageSheetValidator = [
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Invalid year'),
  validate,
];

export const updateWageRecordValidator = [
  param('id').notEmpty().withMessage('Wage record ID is required'),
  body('daysPresent').optional().isInt({ min: 0 }),
  body('overtime').optional().isInt({ min: 0 }),
  body('grossWage').optional().isInt({ min: 0 }),
  body('deductions').optional().isInt({ min: 0 }),
  body('netWage').optional().isInt({ min: 0 }),
  validate,
];

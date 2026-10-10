import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';

// ============================================
// FABRIC ROLLS
// ============================================

export const updateFabricRollValidator = [
  param('id').notEmpty().withMessage('Fabric roll ID is required'),
  body('status')
    .optional()
    .isIn(['PRODUCED', 'AWAITING_QC', 'PASSED', 'REWORK', 'REJECTED', 'FINISHED_STOCK', 'DISPATCHED'])
    .withMessage('Invalid roll status'),
  body('location').optional().trim(),
  validate,
];

// ============================================
// INSPECTIONS
// ============================================

export const createInspectionValidator = [
  body('rollId').notEmpty().withMessage('Fabric roll is required'),
  body('inspectorId').notEmpty().withMessage('Inspector is required'),
  body('result')
    .notEmpty()
    .isIn(['PASS', 'REWORK', 'REJECT'])
    .withMessage('Invalid inspection result'),
  body('grade').optional().trim(),
  body('remarks').optional().trim(),
  body('photoUrl').optional().isURL().withMessage('Invalid photo URL'),
  body('defects')
    .optional()
    .isArray()
    .withMessage('Defects must be an array'),
  body('defects.*.defectType')
    .notEmpty()
    .withMessage('Defect type is required'),
  body('defects.*.count')
    .isInt({ min: 1 })
    .withMessage('Defect count must be at least 1'),
  body('defects.*.location')
    .optional()
    .trim(),
  body('defects.*.severity')
    .optional()
    .isIn(['MINOR', 'MAJOR', 'CRITICAL'])
    .withMessage('Invalid defect severity'),
  validate,
];

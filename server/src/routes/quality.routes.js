import express from 'express';
import * as qualityController from '../controllers/quality.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  updateFabricRollValidator,
  createInspectionValidator,
} from '../validators/quality.validator.js';

const router = express.Router();

// All quality routes require authentication
router.use(authenticate);

// ============================================
// FABRIC ROLLS
// ============================================

router.get(
  '/rolls',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR', 'STOREKEEPER'),
  qualityController.getAllFabricRolls
);

router.get(
  '/rolls/:id',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR', 'STOREKEEPER'),
  qualityController.getFabricRollById
);

router.get(
  '/rolls/number/:rollNumber',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR', 'STOREKEEPER'),
  qualityController.getFabricRollByNumber
);

router.put(
  '/rolls/:id',
  authorize('OWNER', 'INSPECTOR'),
  updateFabricRollValidator,
  qualityController.updateFabricRoll
);

router.post(
  '/rolls/:id/qrcode',
  authorize('OWNER', 'SUPERVISOR'),
  qualityController.generateRollQRCode
);

// ============================================
// INSPECTIONS
// ============================================

router.post(
  '/inspections',
  authorize('INSPECTOR'),
  createInspectionValidator,
  qualityController.createInspection
);

router.get(
  '/inspections',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR'),
  qualityController.getAllInspections
);

router.get(
  '/inspections/queue',
  authorize('OWNER', 'INSPECTOR'),
  qualityController.getInspectionQueue
);

router.get(
  '/inspections/:id',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR'),
  qualityController.getInspectionById
);

router.post(
  '/inspections/:id/override',
  authorize('OWNER', 'SUPERVISOR'),
  qualityController.overrideInspection
);

// ============================================
// ROLL TRACEABILITY & WORKFLOW
// ============================================

router.get(
  '/traceability/:rollNumber',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR', 'ACCOUNTS'),
  qualityController.getRollTraceability
);

router.post(
  '/rolls/:id/finished-stock',
  authorize('OWNER', 'INSPECTOR', 'STOREKEEPER'),
  qualityController.moveToFinishedStock
);

router.post(
  '/rolls/:id/send-rework',
  authorize('OWNER', 'SUPERVISOR'),
  qualityController.sendForRework
);

// ============================================
// REPORTS
// ============================================

router.get(
  '/reports/defects',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR'),
  qualityController.getDefectReport
);

router.get(
  '/reports/statistics',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR'),
  qualityController.getQualityStatistics
);

export default router;

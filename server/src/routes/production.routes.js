import express from 'express';
import * as productionController from '../controllers/production.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createMachineValidator,
  updateMachineValidator,
  updateMachineStatusValidator,
  createWorkAssignmentValidator,
  updateWorkAssignmentValidator,
  createProductionLogValidator,
  createDowntimeLogValidator,
  updateDowntimeLogValidator,
} from '../validators/production.validator.js';

const router = express.Router();

// All production routes require authentication
router.use(authenticate);

// ============================================
// MACHINES - Owner, Supervisor
// ============================================

router.post(
  '/machines',
  authorize('OWNER'),
  createMachineValidator,
  productionController.createMachine
);

router.get(
  '/machines',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR'),
  productionController.getAllMachines
);

router.get(
  '/machines/board',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR'),
  productionController.getMachineBoard
);

router.get(
  '/machines/:id',
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR'),
  productionController.getMachineById
);

router.put(
  '/machines/:id',
  authorize('OWNER', 'SUPERVISOR'),
  updateMachineValidator,
  productionController.updateMachine
);

router.patch(
  '/machines/:id/status',
  authorize('OWNER', 'SUPERVISOR'),
  updateMachineStatusValidator,
  productionController.updateMachineStatus
);

router.delete(
  '/machines/:id',
  authorize('OWNER'),
  productionController.deleteMachine
);

// ============================================
// WORK ASSIGNMENTS - Supervisor
// ============================================

router.post(
  '/assignments',
  authorize('SUPERVISOR'),
  createWorkAssignmentValidator,
  productionController.createWorkAssignment
);

router.get(
  '/assignments',
  authorize('OWNER', 'SUPERVISOR'),
  productionController.getAllWorkAssignments
);

router.get(
  '/assignments/:id',
  authorize('OWNER', 'SUPERVISOR'),
  productionController.getWorkAssignmentById
);

router.put(
  '/assignments/:id',
  authorize('SUPERVISOR'),
  updateWorkAssignmentValidator,
  productionController.updateWorkAssignment
);

router.post(
  '/assignments/:id/complete',
  authorize('SUPERVISOR'),
  productionController.completeWorkAssignment
);

// ============================================
// PRODUCTION LOGS - Supervisor
// ============================================

router.post(
  '/production-logs',
  authorize('SUPERVISOR'),
  createProductionLogValidator,
  productionController.createProductionLog
);

router.get(
  '/production-logs',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  productionController.getAllProductionLogs
);

router.get(
  '/production-logs/:id',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  productionController.getProductionLogById
);

// ============================================
// DOWNTIME LOGS - Supervisor
// ============================================

router.post(
  '/downtime',
  authorize('SUPERVISOR'),
  createDowntimeLogValidator,
  productionController.createDowntimeLog
);

router.get(
  '/downtime',
  authorize('OWNER', 'SUPERVISOR'),
  productionController.getAllDowntimeLogs
);

router.get(
  '/downtime/:id',
  authorize('OWNER', 'SUPERVISOR'),
  productionController.getDowntimeLogById
);

router.put(
  '/downtime/:id',
  authorize('SUPERVISOR'),
  updateDowntimeLogValidator,
  productionController.updateDowntimeLog
);

export default router;

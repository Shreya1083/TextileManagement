import express from 'express';
import * as hrController from '../controllers/hr.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createWorkerValidator,
  updateWorkerValidator,
  createShiftValidator,
  updateShiftValidator,
  markAttendanceValidator,
  bulkMarkAttendanceValidator,
  updateAttendanceValidator,
  generateWageSheetValidator,
  updateWageRecordValidator,
} from '../validators/hr.validator.js';

const router = express.Router();

// All HR routes require authentication
router.use(authenticate);

// ============================================
// WORKERS - Owner, Accounts
// ============================================

router.post(
  '/workers',
  authorize('OWNER', 'ACCOUNTS'),
  createWorkerValidator,
  hrController.createWorker
);

router.get(
  '/workers',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getAllWorkers
);

router.get(
  '/workers/employee/:employeeId',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getWorkerByEmployeeId
);

router.get(
  '/workers/:id',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getWorkerById
);

router.put(
  '/workers/:id',
  authorize('OWNER', 'ACCOUNTS'),
  updateWorkerValidator,
  hrController.updateWorker
);

router.delete(
  '/workers/:id',
  authorize('OWNER'),
  hrController.deleteWorker
);

// ============================================
// SHIFTS - Owner
// ============================================

router.post(
  '/shifts',
  authorize('OWNER'),
  createShiftValidator,
  hrController.createShift
);

router.get(
  '/shifts',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getAllShifts
);

router.get(
  '/shifts/:id',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getShiftById
);

router.put(
  '/shifts/:id',
  authorize('OWNER'),
  updateShiftValidator,
  hrController.updateShift
);

router.delete(
  '/shifts/:id',
  authorize('OWNER'),
  hrController.deleteShift
);

// ============================================
// ATTENDANCE - Owner, Supervisor, Accounts
// ============================================

router.post(
  '/attendance',
  authorize('OWNER', 'SUPERVISOR'),
  markAttendanceValidator,
  hrController.markAttendance
);

router.post(
  '/attendance/bulk',
  authorize('OWNER', 'SUPERVISOR'),
  bulkMarkAttendanceValidator,
  hrController.bulkMarkAttendance
);

router.get(
  '/attendance',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getAllAttendance
);

router.get(
  '/attendance/summary',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getAttendanceSummary
);

router.get(
  '/attendance/:id',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getAttendanceById
);

router.put(
  '/attendance/:id',
  authorize('OWNER', 'SUPERVISOR'),
  updateAttendanceValidator,
  hrController.updateAttendance
);

// ============================================
// WAGE RECORDS - Owner, Accounts
// ============================================

router.post(
  '/wages/generate',
  authorize('OWNER', 'ACCOUNTS'),
  generateWageSheetValidator,
  hrController.generateWageSheet
);

router.get(
  '/wages',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getAllWageRecords
);

router.get(
  '/wages/:id',
  authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'),
  hrController.getWageRecordById
);

router.put(
  '/wages/:id',
  authorize('OWNER', 'ACCOUNTS'),
  updateWageRecordValidator,
  hrController.updateWageRecord
);

router.post(
  '/wages/:id/lock',
  authorize('OWNER'),
  hrController.lockWageRecord
);

router.post(
  '/wages/:id/unlock',
  authorize('OWNER'),
  hrController.unlockWageRecord
);

export default router;

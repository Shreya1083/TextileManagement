import express from 'express';
import * as qrController from '../controllers/qr.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// ─── Roll QR (all authenticated roles) ───────────────────────────────────────

router.get(
  '/rolls/:rollId',
  authenticate,
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR', 'INSPECTOR', 'ACCOUNTS'),
  asyncHandler(qrController.getRollQR)
);

// Scan / lookup by roll number  (can be called from QR scanner UI)
router.get(
  '/scan/roll',
  authenticate,
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR', 'INSPECTOR', 'ACCOUNTS'),
  asyncHandler(qrController.scanRoll)
);

// Full traceability timeline (owner / supervisor / inspector)
router.get(
  '/trace/:rollNumber',
  authenticate,
  authorize('OWNER', 'SUPERVISOR', 'INSPECTOR', 'ACCOUNTS'),
  asyncHandler(qrController.traceRoll)
);

// ─── Attendance Session QR ────────────────────────────────────────────────────

// Supervisor / Owner creates a session for a shift
router.post(
  '/attendance-sessions',
  authenticate,
  authorize('OWNER', 'SUPERVISOR'),
  asyncHandler(qrController.createAttendanceSession)
);

// Get active session QR image (supervisor shows it on screen/tablet)
router.get(
  '/attendance-sessions/active',
  authenticate,
  authorize('OWNER', 'SUPERVISOR'),
  asyncHandler(qrController.getActiveSession)
);

// Worker scans attendance QR (authenticated as worker user, or by supervisor on behalf)
router.post(
  '/attendance-sessions/scan',
  authenticate,
  asyncHandler(qrController.scanAttendanceQR)
);

export default router;

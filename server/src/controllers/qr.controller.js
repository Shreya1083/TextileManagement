import * as qrService from '../services/qr.service.js';
import { successResponse } from '../utils/response.js';

// GET /api/qr/rolls/:rollId  — generate/return QR for a roll
export const getRollQR = async (req, res, next) => {
  try {
    const result = await qrService.getOrGenerateRollQR(req.params.rollId);
    return successResponse(res, result, 'Roll QR code retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /api/qr/scan/roll?rollNumber=EVR-xxx  — scan a roll QR (lookup)
export const scanRoll = async (req, res, next) => {
  try {
    const { rollNumber } = req.query;
    if (!rollNumber) return res.status(400).json({ success: false, message: 'rollNumber is required' });
    const roll = await qrService.scanRollQR(rollNumber);
    return successResponse(res, roll, 'Roll found');
  } catch (err) {
    next(err);
  }
};

// POST /api/qr/attendance-sessions  — supervisor creates attendance session QR
export const createAttendanceSession = async (req, res, next) => {
  try {
    const { shiftId, validMinutes } = req.body;
    if (!shiftId) return res.status(400).json({ success: false, message: 'shiftId is required' });
    const result = await qrService.createAttendanceSession(shiftId, req.user.id, validMinutes || 60);
    return successResponse(res, result, 'Attendance session created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/qr/attendance-sessions/active?shiftId=xxx  — get current session QR
export const getActiveSession = async (req, res, next) => {
  try {
    const { shiftId } = req.query;
    if (!shiftId) return res.status(400).json({ success: false, message: 'shiftId is required' });
    const result = await qrService.getActiveAttendanceSession(shiftId);
    return successResponse(res, result, 'Active session retrieved');
  } catch (err) {
    next(err);
  }
};

// POST /api/qr/attendance-sessions/scan  — worker scans attendance QR
export const scanAttendanceQR = async (req, res, next) => {
  try {
    const { sessionCode, workerId } = req.body;
    if (!sessionCode || !workerId) {
      return res.status(400).json({ success: false, message: 'sessionCode and workerId are required' });
    }
    const result = await qrService.processQRAttendanceScan(sessionCode, workerId);
    return successResponse(res, result, result.message, result.isDuplicate ? 200 : 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/qr/trace/:rollNumber  — full traceability history for a roll
export const traceRoll = async (req, res, next) => {
  try {
    const result = await qrService.getRollTraceability(req.params.rollNumber);
    return successResponse(res, result, 'Roll traceability retrieved');
  } catch (err) {
    next(err);
  }
};

import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import * as hrService from '../services/hr.service.js';

// ============================================
// WORKERS
// ============================================

export const createWorker = asyncHandler(async (req, res) => {
  const worker = await hrService.createWorker(req.body);
  res.status(201).json(successResponse(worker, 'Worker created successfully'));
});

export const getAllWorkers = asyncHandler(async (req, res) => {
  const result = await hrService.getAllWorkers(req.query);
  res.json(successResponse(result.workers, 'Workers retrieved successfully', result.pagination));
});

export const getWorkerById = asyncHandler(async (req, res) => {
  const worker = await hrService.getWorkerById(req.params.id);
  res.json(successResponse(worker));
});

export const getWorkerByEmployeeId = asyncHandler(async (req, res) => {
  const worker = await hrService.getWorkerByEmployeeId(req.params.employeeId);
  res.json(successResponse(worker));
});

export const updateWorker = asyncHandler(async (req, res) => {
  const worker = await hrService.updateWorker(req.params.id, req.body);
  res.json(successResponse(worker, 'Worker updated successfully'));
});

export const deleteWorker = asyncHandler(async (req, res) => {
  const result = await hrService.deleteWorker(req.params.id);
  res.json(successResponse(null, result.message));
});

// ============================================
// SHIFTS
// ============================================

export const createShift = asyncHandler(async (req, res) => {
  const shift = await hrService.createShift(req.body);
  res.status(201).json(successResponse(shift, 'Shift created successfully'));
});

export const getAllShifts = asyncHandler(async (req, res) => {
  const shifts = await hrService.getAllShifts(req.query);
  res.json(successResponse(shifts, 'Shifts retrieved successfully'));
});

export const getShiftById = asyncHandler(async (req, res) => {
  const shift = await hrService.getShiftById(req.params.id);
  res.json(successResponse(shift));
});

export const updateShift = asyncHandler(async (req, res) => {
  const shift = await hrService.updateShift(req.params.id, req.body);
  res.json(successResponse(shift, 'Shift updated successfully'));
});

export const deleteShift = asyncHandler(async (req, res) => {
  const result = await hrService.deleteShift(req.params.id);
  res.json(successResponse(null, result.message));
});

// ============================================
// ATTENDANCE
// ============================================

export const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await hrService.markAttendance(req.body, req.user.id);
  res.status(201).json(successResponse(attendance, 'Attendance marked successfully'));
});

export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const results = await hrService.bulkMarkAttendance(req.body.records, req.user.id);
  res.json(successResponse(results, 'Bulk attendance marked'));
});

export const getAllAttendance = asyncHandler(async (req, res) => {
  const result = await hrService.getAllAttendance(req.query);
  res.json(successResponse(result.attendance, 'Attendance retrieved successfully', result.pagination));
});

export const getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await hrService.getAttendanceById(req.params.id);
  res.json(successResponse(attendance));
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await hrService.updateAttendance(req.params.id, req.body, req.user.id, req.user.id);
  res.json(successResponse(attendance, 'Attendance updated successfully'));
});

export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const summary = await hrService.getAttendanceSummary(req.query);
  res.json(successResponse(summary, 'Attendance summary retrieved successfully'));
});

// ============================================
// WAGE RECORDS
// ============================================

export const generateWageSheet = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  const records = await hrService.generateWageSheet(month, year, req.user.id);
  res.status(201).json(successResponse(records, 'Wage sheet generated successfully'));
});

export const getAllWageRecords = asyncHandler(async (req, res) => {
  const result = await hrService.getAllWageRecords(req.query);
  res.json(successResponse(result.records, 'Wage records retrieved successfully', result.pagination));
});

export const getWageRecordById = asyncHandler(async (req, res) => {
  const record = await hrService.getWageRecordById(req.params.id);
  res.json(successResponse(record));
});

export const updateWageRecord = asyncHandler(async (req, res) => {
  const record = await hrService.updateWageRecord(req.params.id, req.body, req.user.id);
  res.json(successResponse(record, 'Wage record updated successfully'));
});

export const lockWageRecord = asyncHandler(async (req, res) => {
  const record = await hrService.lockWageRecord(req.params.id, req.user.id);
  res.json(successResponse(record, 'Wage record locked successfully'));
});

export const unlockWageRecord = asyncHandler(async (req, res) => {
  const record = await hrService.unlockWageRecord(req.params.id, req.body.reason, req.user.id);
  res.json(successResponse(record, 'Wage record unlocked successfully'));
});

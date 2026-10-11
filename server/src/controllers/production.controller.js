import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import * as productionService from '../services/production.service.js';

// ============================================
// MACHINES
// ============================================

export const createMachine = asyncHandler(async (req, res) => {
  const machine = await productionService.createMachine(req.body);
  res.status(201).json(successResponse(machine, 'Machine created successfully'));
});

export const getAllMachines = asyncHandler(async (req, res) => {
  const result = await productionService.getAllMachines(req.query);
  res.json(successResponse(result.machines, 'Machines retrieved successfully', result.pagination));
});

export const getMachineById = asyncHandler(async (req, res) => {
  const machine = await productionService.getMachineById(req.params.id);
  res.json(successResponse(machine));
});

export const updateMachine = asyncHandler(async (req, res) => {
  const machine = await productionService.updateMachine(req.params.id, req.body);
  res.json(successResponse(machine, 'Machine updated successfully'));
});

export const updateMachineStatus = asyncHandler(async (req, res) => {
  const machine = await productionService.updateMachineStatus(req.params.id, req.body.status);
  res.json(successResponse(machine, 'Machine status updated successfully'));
});

export const deleteMachine = asyncHandler(async (req, res) => {
  const result = await productionService.deleteMachine(req.params.id);
  res.json(successResponse(null, result.message));
});

export const getMachineBoard = asyncHandler(async (req, res) => {
  const machines = await productionService.getMachineBoard(req.query);
  res.json(successResponse(machines, 'Machine board retrieved successfully'));
});

// ============================================
// WORK ASSIGNMENTS
// ============================================

export const createWorkAssignment = asyncHandler(async (req, res) => {
  const assignment = await productionService.createWorkAssignment(req.body);
  res.status(201).json(successResponse(assignment, 'Work assignment created successfully'));
});

export const getAllWorkAssignments = asyncHandler(async (req, res) => {
  const result = await productionService.getAllWorkAssignments(req.query);
  res.json(successResponse(result.assignments, 'Work assignments retrieved successfully', result.pagination));
});

export const getWorkAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await productionService.getWorkAssignmentById(req.params.id);
  res.json(successResponse(assignment));
});

export const updateWorkAssignment = asyncHandler(async (req, res) => {
  const assignment = await productionService.updateWorkAssignment(req.params.id, req.body);
  res.json(successResponse(assignment, 'Work assignment updated successfully'));
});

export const completeWorkAssignment = asyncHandler(async (req, res) => {
  const assignment = await productionService.completeWorkAssignment(req.params.id);
  res.json(successResponse(assignment, 'Work assignment completed successfully'));
});

// ============================================
// PRODUCTION LOGS
// ============================================

export const createProductionLog = asyncHandler(async (req, res) => {
  const log = await productionService.createProductionLog(req.body);
  res.status(201).json(successResponse(log, 'Production log created successfully'));
});

export const getAllProductionLogs = asyncHandler(async (req, res) => {
  const result = await productionService.getAllProductionLogs(req.query);
  res.json(successResponse(result.logs, 'Production logs retrieved successfully', result.pagination));
});

export const getProductionLogById = asyncHandler(async (req, res) => {
  const log = await productionService.getProductionLogById(req.params.id);
  res.json(successResponse(log));
});

// ============================================
// DOWNTIME LOGS
// ============================================

export const createDowntimeLog = asyncHandler(async (req, res) => {
  const log = await productionService.createDowntimeLog(req.body);
  res.status(201).json(successResponse(log, 'Downtime log created successfully'));
});

export const getAllDowntimeLogs = asyncHandler(async (req, res) => {
  const result = await productionService.getAllDowntimeLogs(req.query);
  res.json(successResponse(result.logs, 'Downtime logs retrieved successfully', result.pagination));
});

export const getDowntimeLogById = asyncHandler(async (req, res) => {
  const log = await productionService.getDowntimeLogById(req.params.id);
  res.json(successResponse(log));
});

export const updateDowntimeLog = asyncHandler(async (req, res) => {
  const log = await productionService.updateDowntimeLog(req.params.id, req.body);
  res.json(successResponse(log, 'Downtime log updated successfully'));
});

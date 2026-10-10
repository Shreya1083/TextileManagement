import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import * as qualityService from '../services/quality.service.js';

// ============================================
// FABRIC ROLLS
// ============================================

export const getAllFabricRolls = asyncHandler(async (req, res) => {
  const result = await qualityService.getAllFabricRolls(req.query);
  res.json(successResponse(result.rolls, 'Fabric rolls retrieved successfully', result.pagination));
});

export const getFabricRollById = asyncHandler(async (req, res) => {
  const roll = await qualityService.getFabricRollById(req.params.id);
  res.json(successResponse(roll));
});

export const getFabricRollByNumber = asyncHandler(async (req, res) => {
  const roll = await qualityService.getFabricRollByNumber(req.params.rollNumber);
  res.json(successResponse(roll));
});

export const updateFabricRoll = asyncHandler(async (req, res) => {
  const roll = await qualityService.updateFabricRoll(req.params.id, req.body);
  res.json(successResponse(roll, 'Fabric roll updated successfully'));
});

export const generateRollQRCode = asyncHandler(async (req, res) => {
  const result = await qualityService.generateRollQRCode(req.params.id);
  res.json(successResponse(result, 'QR code generated successfully'));
});

// ============================================
// INSPECTIONS
// ============================================

export const createInspection = asyncHandler(async (req, res) => {
  const inspection = await qualityService.createInspection(req.body, req.user.id);
  res.status(201).json(successResponse(inspection, 'Inspection created successfully'));
});

export const getAllInspections = asyncHandler(async (req, res) => {
  const result = await qualityService.getAllInspections(req.query);
  res.json(successResponse(result.inspections, 'Inspections retrieved successfully', result.pagination));
});

export const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await qualityService.getInspectionById(req.params.id);
  res.json(successResponse(inspection));
});

export const getInspectionQueue = asyncHandler(async (req, res) => {
  const result = await qualityService.getInspectionQueue(req.query);
  res.json(successResponse(result.rolls, 'Inspection queue retrieved successfully', result.pagination));
});

export const overrideInspection = asyncHandler(async (req, res) => {
  const { newResult, reason } = req.body;
  const inspection = await qualityService.overrideInspection(
    req.params.id,
    newResult,
    reason,
    req.user.id
  );
  res.json(successResponse(inspection, 'Inspection overridden successfully'));
});

// ============================================
// DEFECT REPORTS
// ============================================

export const getDefectReport = asyncHandler(async (req, res) => {
  const report = await qualityService.getDefectReport(req.query);
  res.json(successResponse(report, 'Defect report generated successfully'));
});

export const getQualityStatistics = asyncHandler(async (req, res) => {
  const stats = await qualityService.getQualityStatistics(req.query);
  res.json(successResponse(stats, 'Quality statistics retrieved successfully'));
});

// ============================================
// ROLL TRACEABILITY
// ============================================

export const getRollTraceability = asyncHandler(async (req, res) => {
  const traceability = await qualityService.getRollTraceability(req.params.rollNumber);
  res.json(successResponse(traceability, 'Roll traceability retrieved successfully'));
});

export const moveToFinishedStock = asyncHandler(async (req, res) => {
  const { location } = req.body;
  const roll = await qualityService.moveToFinishedStock(req.params.id, req.user.id, location);
  res.json(successResponse(roll, 'Roll moved to finished stock successfully'));
});

export const sendForRework = asyncHandler(async (req, res) => {
  const { reworkInstructions } = req.body;
  const roll = await qualityService.sendForRework(req.params.id, req.user.id, reworkInstructions);
  res.json(successResponse(roll, 'Roll sent for rework successfully'));
});

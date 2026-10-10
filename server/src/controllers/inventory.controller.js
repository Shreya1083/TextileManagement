import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import * as inventoryService from '../services/inventory.service.js';

// ============================================
// SUPPLIERS
// ============================================

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await inventoryService.createSupplier(req.body);
  res.status(201).json(successResponse(supplier, 'Supplier created successfully'));
});

export const getAllSuppliers = asyncHandler(async (req, res) => {
  const result = await inventoryService.getAllSuppliers(req.query);
  res.json(successResponse(result.suppliers, 'Suppliers retrieved successfully', result.pagination));
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await inventoryService.getSupplierById(req.params.id);
  res.json(successResponse(supplier));
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await inventoryService.updateSupplier(req.params.id, req.body);
  res.json(successResponse(supplier, 'Supplier updated successfully'));
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const result = await inventoryService.deleteSupplier(req.params.id);
  res.json(successResponse(null, result.message));
});

// ============================================
// YARN TYPES
// ============================================

export const createYarnType = asyncHandler(async (req, res) => {
  const yarnType = await inventoryService.createYarnType(req.body);
  res.status(201).json(successResponse(yarnType, 'Yarn type created successfully'));
});

export const getAllYarnTypes = asyncHandler(async (req, res) => {
  const result = await inventoryService.getAllYarnTypes(req.query);
  res.json(successResponse(result.yarnTypes, 'Yarn types retrieved successfully', result.pagination));
});

export const getYarnTypeById = asyncHandler(async (req, res) => {
  const yarnType = await inventoryService.getYarnTypeById(req.params.id);
  res.json(successResponse(yarnType));
});

export const updateYarnType = asyncHandler(async (req, res) => {
  const yarnType = await inventoryService.updateYarnType(req.params.id, req.body);
  res.json(successResponse(yarnType, 'Yarn type updated successfully'));
});

export const deleteYarnType = asyncHandler(async (req, res) => {
  const result = await inventoryService.deleteYarnType(req.params.id);
  res.json(successResponse(null, result.message));
});

// ============================================
// GATE ENTRIES
// ============================================

export const createGateEntry = asyncHandler(async (req, res) => {
  const entry = await inventoryService.createGateEntry({
    ...req.body,
    receivedBy: req.user.id,
    userId: req.user.id,
  });
  res.status(201).json(successResponse(entry, 'Gate entry created successfully'));
});

export const getAllGateEntries = asyncHandler(async (req, res) => {
  const result = await inventoryService.getAllGateEntries(req.query);
  res.json(successResponse(result.entries, 'Gate entries retrieved successfully', result.pagination));
});

export const getGateEntryById = asyncHandler(async (req, res) => {
  const entry = await inventoryService.getGateEntryById(req.params.id);
  res.json(successResponse(entry));
});

// ============================================
// STOCK MANAGEMENT
// ============================================

export const getStockLevels = asyncHandler(async (req, res) => {
  const stockLevels = await inventoryService.getStockLevels(req.query);
  res.json(successResponse(stockLevels, 'Stock levels retrieved successfully'));
});

export const getStockLedger = asyncHandler(async (req, res) => {
  const result = await inventoryService.getStockLedger(req.query);
  res.json(successResponse(result.movements, 'Stock ledger retrieved successfully', result.pagination));
});

export const reserveStock = asyncHandler(async (req, res) => {
  const { orderId, yarnRequirements } = req.body;
  const reservations = await inventoryService.reserveStockForOrder(
    orderId,
    yarnRequirements,
    req.user.id
  );
  res.status(201).json(successResponse(reservations, 'Stock reserved successfully'));
});

export const releaseStockReservation = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const released = await inventoryService.releaseStockReservation(orderId, req.user.id);
  res.json(successResponse(released, 'Stock reservation released successfully'));
});

export const issueStockForProduction = asyncHandler(async (req, res) => {
  const { productionLogId, orderId, yarnRequirements } = req.body;
  const issues = await inventoryService.issueStockForProduction(
    productionLogId,
    orderId,
    yarnRequirements,
    req.user.id
  );
  res.status(201).json(successResponse(issues, 'Stock issued for production successfully'));
});

export const getLowStockAlerts = asyncHandler(async (req, res) => {
  const alerts = await inventoryService.getLowStockAlerts();
  res.json(successResponse(alerts, 'Low stock alerts retrieved successfully'));
});

export const checkStockAvailability = asyncHandler(async (req, res) => {
  const { yarnTypeId, quantity } = req.query;
  const availability = await inventoryService.checkStockAvailability(
    yarnTypeId,
    parseFloat(quantity)
  );
  res.json(successResponse(availability));
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { stockBatchId } = req.params;
  const batch = await inventoryService.adjustStock(stockBatchId, req.body, req.user.id);
  res.json(successResponse(batch, 'Stock adjusted successfully'));
});

// ============================================
// PURCHASE ORDERS
// ============================================

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const order = await inventoryService.createPurchaseOrder(req.body);
  res.status(201).json(successResponse(order, 'Purchase order created successfully'));
});

export const getAllPurchaseOrders = asyncHandler(async (req, res) => {
  const result = await inventoryService.getAllPurchaseOrders(req.query);
  res.json(successResponse(result.orders, 'Purchase orders retrieved successfully', result.pagination));
});

export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const order = await inventoryService.getPurchaseOrderById(req.params.id);
  res.json(successResponse(order));
});

export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await inventoryService.updatePurchaseOrder(req.params.id, req.body);
  res.json(successResponse(order, 'Purchase order updated successfully'));
});

export const receivePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await inventoryService.receivePurchaseOrder(req.params.id, req.body.items, req.user.id);
  res.json(successResponse(order, 'Purchase order received successfully'));
});

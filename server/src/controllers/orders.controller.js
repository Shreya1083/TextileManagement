import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import * as ordersService from '../services/orders.service.js';

// ============================================
// BUYERS
// ============================================

export const createBuyer = asyncHandler(async (req, res) => {
  const buyer = await ordersService.createBuyer(req.body);
  res.status(201).json(successResponse(buyer, 'Buyer created successfully'));
});

export const getAllBuyers = asyncHandler(async (req, res) => {
  const result = await ordersService.getAllBuyers(req.query);
  res.json(successResponse(result.buyers, 'Buyers retrieved successfully', result.pagination));
});

export const getBuyerById = asyncHandler(async (req, res) => {
  const buyer = await ordersService.getBuyerById(req.params.id);
  res.json(successResponse(buyer));
});

export const updateBuyer = asyncHandler(async (req, res) => {
  const buyer = await ordersService.updateBuyer(req.params.id, req.body);
  res.json(successResponse(buyer, 'Buyer updated successfully'));
});

export const deleteBuyer = asyncHandler(async (req, res) => {
  const result = await ordersService.deleteBuyer(req.params.id);
  res.json(successResponse(null, result.message));
});

// ============================================
// FABRIC TYPES
// ============================================

export const createFabricType = asyncHandler(async (req, res) => {
  const fabricType = await ordersService.createFabricType(req.body);
  res.status(201).json(successResponse(fabricType, 'Fabric type created successfully'));
});

export const getAllFabricTypes = asyncHandler(async (req, res) => {
  const result = await ordersService.getAllFabricTypes(req.query);
  res.json(successResponse(result.fabricTypes, 'Fabric types retrieved successfully', result.pagination));
});

export const getFabricTypeById = asyncHandler(async (req, res) => {
  const fabricType = await ordersService.getFabricTypeById(req.params.id);
  res.json(successResponse(fabricType));
});

export const updateFabricType = asyncHandler(async (req, res) => {
  const fabricType = await ordersService.updateFabricType(req.params.id, req.body);
  res.json(successResponse(fabricType, 'Fabric type updated successfully'));
});

export const deleteFabricType = asyncHandler(async (req, res) => {
  const result = await ordersService.deleteFabricType(req.params.id);
  res.json(successResponse(null, result.message));
});

// ============================================
// ORDERS
// ============================================

export const createOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.createOrder(req.body, req.user.id);
  res.status(201).json(successResponse(order, 'Order created successfully'));
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const result = await ordersService.getAllOrders(req.query);
  res.json(successResponse(result.orders, 'Orders retrieved successfully', result.pagination));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await ordersService.getOrderById(req.params.id);
  res.json(successResponse(order));
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.updateOrder(req.params.id, req.body);
  res.json(successResponse(order, 'Order updated successfully'));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const order = await ordersService.updateOrderStatus(req.params.id, status, notes);
  res.json(successResponse(order, 'Order status updated successfully'));
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const result = await ordersService.deleteOrder(req.params.id);
  res.json(successResponse(null, result.message));
});

export const checkYarnAvailability = asyncHandler(async (req, res) => {
  const result = await ordersService.checkYarnAvailability(req.params.id);
  res.json(successResponse(result, 'Yarn availability checked'));
});

export const confirmOrder = asyncHandler(async (req, res) => {
  const result = await ordersService.confirmOrder(req.params.id, req.user.id);
  res.json(successResponse(result, 'Order confirmed and yarn reserved successfully'));
});

export const startProduction = asyncHandler(async (req, res) => {
  const order = await ordersService.startProduction(req.params.id, req.user.id);
  res.json(successResponse(order, 'Order moved to production'));
});

export const moveToQualityCheck = asyncHandler(async (req, res) => {
  const order = await ordersService.moveToQualityCheck(req.params.id, req.user.id);
  res.json(successResponse(order, 'Order moved to quality check'));
});

export const markReadyToShip = asyncHandler(async (req, res) => {
  const order = await ordersService.markReadyToShip(req.params.id, req.user.id);
  res.json(successResponse(order, 'Order marked as ready to ship'));
});

export const markDispatched = asyncHandler(async (req, res) => {
  const order = await ordersService.markDispatched(req.params.id, req.user.id);
  res.json(successResponse(order, 'Order marked as dispatched'));
});

export const closeOrder = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const order = await ordersService.closeOrder(req.params.id, req.user.id, notes);
  res.json(successResponse(order, 'Order closed successfully'));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await ordersService.cancelOrder(req.params.id, req.user.id, reason);
  res.json(successResponse(order, 'Order cancelled successfully'));
});

// ============================================
// PUBLIC ORDER TRACKING
// ============================================

export const trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber, token } = req.query;
  const order = await ordersService.trackOrderByToken(orderNumber, token);
  res.json(successResponse(order, 'Order tracking information'));
});

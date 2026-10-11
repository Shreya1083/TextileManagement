import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import * as dispatchService from '../services/dispatch.service.js';

// ============================================
// FINISHED STOCK
// ============================================

export const getFinishedStock = asyncHandler(async (req, res) => {
  const result = await dispatchService.getFinishedStock(req.query);
  res.json(successResponse(result.rolls, 'Finished stock retrieved successfully', result.pagination));
});

// ============================================
// DISPATCHES
// ============================================

export const createDispatch = asyncHandler(async (req, res) => {
  const dispatch = await dispatchService.createDispatch(req.body, req.user.id);
  res.status(201).json(successResponse(dispatch, 'Dispatch created successfully'));
});

export const getAllDispatches = asyncHandler(async (req, res) => {
  const result = await dispatchService.getAllDispatches(req.query);
  res.json(successResponse(result.dispatches, 'Dispatches retrieved successfully', result.pagination));
});

export const getDispatchById = asyncHandler(async (req, res) => {
  const dispatch = await dispatchService.getDispatchById(req.params.id);
  res.json(successResponse(dispatch));
});

// ============================================
// INVOICES
// ============================================

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await dispatchService.createInvoice(req.body, req.user.id);
  res.status(201).json(successResponse(invoice, 'Invoice created successfully'));
});

export const getAllInvoices = asyncHandler(async (req, res) => {
  const result = await dispatchService.getAllInvoices(req.query);
  res.json(successResponse(result.invoices, 'Invoices retrieved successfully', result.pagination));
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await dispatchService.getInvoiceById(req.params.id);
  res.json(successResponse(invoice));
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await dispatchService.updateInvoice(req.params.id, req.body);
  res.json(successResponse(invoice, 'Invoice updated successfully'));
});

// ============================================
// PAYMENTS
// ============================================

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await dispatchService.createPayment(req.body, req.user.id);
  res.status(201).json(successResponse(payment, 'Payment recorded successfully'));
});

export const getAllPayments = asyncHandler(async (req, res) => {
  const result = await dispatchService.getAllPayments(req.query);
  res.json(successResponse(result.payments, 'Payments retrieved successfully', result.pagination));
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await dispatchService.getPaymentById(req.params.id);
  res.json(successResponse(payment));
});

// ============================================
// DISPATCH CANCELLATION
// ============================================

export const cancelDispatch = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const result = await dispatchService.cancelDispatch(req.params.id, reason, req.user.id);
  res.json(successResponse(result, 'Dispatch cancelled successfully'));
});

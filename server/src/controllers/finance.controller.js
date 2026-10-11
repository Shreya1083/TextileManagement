import * as financeService from '../services/finance.service.js';
import { createPayment as dispatchCreatePayment } from '../services/dispatch.service.js';
import { prisma } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

const normalizeExpensePayload = (payload) => ({
  category: payload.category,
  description: payload.description,
  amount: payload.amount,
  expenseDate: payload.expenseDate || payload.date,
  notes: payload.notes || payload.reference || payload.paymentMode,
});

// Expenses CRUD
export const createExpense = async (req, res, next) => {
  try {
    const expense = await financeService.createExpense(normalizeExpensePayload(req.body), req.user.id);
    return successResponse(res, expense, 'Expense created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getAllExpenses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { startDate, endDate, category } = req.query;

    const result = await financeService.getAllExpenses({ startDate, endDate, category, page, limit });
    return res.json(successResponse(result.expenses, 'Expenses retrieved successfully', result.pagination));
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await financeService.getExpenseById(req.params.id);
    return successResponse(res, expense, 'Expense retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const expense = await financeService.updateExpense(
      req.params.id,
      normalizeExpensePayload(req.body),
      req.user.id
    );
    return successResponse(res, expense, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    await financeService.deleteExpense(req.params.id);
    return successResponse(res, null, 'Expense deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Expense Summary
export const getExpenseSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const summary = await financeService.getExpenseSummary({ startDate, endDate, groupBy });
    return successResponse(res, summary, 'Expense summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Order Costing
export const getOrderCosting = async (req, res, next) => {
  try {
    const costing = await financeService.calculateOrderCost(req.params.orderId);
    return successResponse(res, costing, 'Order costing calculated successfully');
  } catch (error) {
    next(error);
  }
};

// Machine Output Report
export const getMachineOutputReport = async (req, res, next) => {
  try {
    const { startDate, endDate, machineId } = req.query;
    const report = await financeService.getMachineOutputReport({ startDate, endDate, machineId });
    return successResponse(res, report, 'Machine output report generated successfully');
  } catch (error) {
    next(error);
  }
};

// Profit & Loss
export const getProfitLoss = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const pl = await financeService.getMonthlyPnL(parseInt(month), parseInt(year));
    return successResponse(res, pl, 'Profit & Loss statement generated successfully');
  } catch (error) {
    next(error);
  }
};

// Owner Dashboard
export const getOwnerDashboard = async (req, res, next) => {
  try {
    // Accept both ?from=&to= (new spec) and legacy ?startDate=&endDate=
    const from = req.query.from || req.query.startDate;
    const to   = req.query.to   || req.query.endDate;
    const dashboard = await financeService.getOwnerDashboard({ from, to });
    return successResponse(res, dashboard, 'Owner dashboard data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

export const getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { invoiceId } = req.query;

    const where = {};
    if (invoiceId) where.invoiceId = invoiceId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              buyer: { select: { name: true } },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return res.json(successResponse(payments, 'Payments retrieved successfully', { page, limit, total }));
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const result = await dispatchCreatePayment(req.body);
    return successResponse(res, result, 'Payment recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ─── REPORTS (alternative routes) ────────────────────────────────────────────

export const getOrderCostingByQuery = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return res.status(400).json(errorResponse('orderId query parameter is required'));
    }
    const costing = await financeService.calculateOrderCost(orderId);
    return successResponse(res, costing, 'Order costing calculated successfully');
  } catch (error) {
    next(error);
  }
};

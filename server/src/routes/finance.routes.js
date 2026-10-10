import express from 'express';
import * as financeController from '../controllers/finance.controller.js';
import * as financeValidator from '../validators/finance.validator.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

// ─── EXPENSES ────────────────────────────────────────────────────────────────

router.post('/expenses',
  authorize('OWNER', 'ACCOUNTS'),
  financeValidator.createExpenseValidator, validate,
  asyncHandler(financeController.createExpense));

router.get('/expenses',
  authorize('OWNER', 'ACCOUNTS'),
  financeValidator.getExpensesValidator, validate,
  asyncHandler(financeController.getAllExpenses));

// Must be before /:id
router.get('/expenses/reports/summary',
  authorize('OWNER', 'ACCOUNTS'),
  financeValidator.expenseSummaryValidator, validate,
  asyncHandler(financeController.getExpenseSummary));

router.get('/expenses/:id',
  authorize('OWNER', 'ACCOUNTS'),
  financeValidator.expenseIdValidator, validate,
  asyncHandler(financeController.getExpenseById));

router.put('/expenses/:id',
  authorize('OWNER', 'ACCOUNTS'),
  financeValidator.expenseIdValidator, financeValidator.updateExpenseValidator, validate,
  asyncHandler(financeController.updateExpense));

router.delete('/expenses/:id',
  authorize('OWNER'),
  financeValidator.expenseIdValidator, validate,
  asyncHandler(financeController.deleteExpense));

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

router.get('/payments', authorize('OWNER', 'ACCOUNTS'), asyncHandler(financeController.getAllPayments));
router.post('/payments', authorize('OWNER', 'ACCOUNTS'), asyncHandler(financeController.createPayment));

// ─── REPORTS ─────────────────────────────────────────────────────────────────

// Order costing (README: /reports/order-costing + /orders/:orderId/costing)
router.get('/reports/order-costing', authorize('OWNER', 'ACCOUNTS', 'SUPERVISOR'), asyncHandler(financeController.getOrderCostingByQuery));
router.get('/orders/:orderId/costing', authorize('OWNER', 'ACCOUNTS', 'SUPERVISOR'), financeValidator.orderCostingValidator, validate, asyncHandler(financeController.getOrderCosting));

router.get('/reports/machine-output', authorize('OWNER', 'ACCOUNTS', 'SUPERVISOR'), financeValidator.machineOutputValidator, validate, asyncHandler(financeController.getMachineOutputReport));

// P&L — both naming conventions per README spec
router.get('/reports/monthly-pnl',  authorize('OWNER', 'ACCOUNTS'), financeValidator.profitLossValidator, validate, asyncHandler(financeController.getProfitLoss));
router.get('/reports/profit-loss',  authorize('OWNER', 'ACCOUNTS'), financeValidator.profitLossValidator, validate, asyncHandler(financeController.getProfitLoss));

// Owner Dashboard
router.get('/dashboard/owner', authorize('OWNER'), financeValidator.ownerDashboardValidator, validate, asyncHandler(financeController.getOwnerDashboard));

export default router;

import express from 'express';
import * as ctrl from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

// Overview — Owner + Accounts
router.get('/overview', authorize('OWNER', 'ACCOUNTS'), asyncHandler(ctrl.getOverview));

// Production — Owner, Supervisor, Accounts
router.get('/production', authorize('OWNER', 'SUPERVISOR', 'ACCOUNTS'), asyncHandler(ctrl.getProductionAnalytics));

// Quality — Owner, Inspector, Supervisor
router.get('/quality', authorize('OWNER', 'INSPECTOR', 'SUPERVISOR'), asyncHandler(ctrl.getQualityAnalytics));

// Inventory — Owner, Storekeeper, Accounts
router.get('/inventory', authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'), asyncHandler(ctrl.getInventoryAnalytics));

// Finance — Owner, Accounts only
router.get('/finance', authorize('OWNER', 'ACCOUNTS'), asyncHandler(ctrl.getFinanceAnalytics));

// Risk predictions (rule-based, labelled as estimates)
router.get('/predictions/delay-risk',   authorize('OWNER', 'ACCOUNTS', 'SUPERVISOR'), asyncHandler(ctrl.getDelayRisk));
router.get('/predictions/stockout-risk', authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'), asyncHandler(ctrl.getStockoutRisk));

export default router;

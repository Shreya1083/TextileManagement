import express from 'express';
import * as dispatchController from '../controllers/dispatch.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createDispatchValidator,
  createInvoiceValidator,
  updateInvoiceValidator,
  createPaymentValidator,
} from '../validators/dispatch.validator.js';

const router = express.Router();

// All dispatch routes require authentication
router.use(authenticate);

// ============================================
// FINISHED STOCK - Owner, Store
// ============================================

router.get(
  '/finished-stock',
  authorize('OWNER', 'STOREKEEPER'),
  dispatchController.getFinishedStock
);

// ============================================
// DISPATCHES - Owner, Store, Accounts
// ============================================

router.post(
  '/dispatches',
  authorize('STOREKEEPER'),
  createDispatchValidator,
  dispatchController.createDispatch
);

router.get(
  '/dispatches',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  dispatchController.getAllDispatches
);

router.get(
  '/dispatches/:id',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  dispatchController.getDispatchById
);

router.delete(
  '/dispatches/:id/cancel',
  authorize('OWNER'),
  dispatchController.cancelDispatch
);

// ============================================
// INVOICES - Owner, Accounts
// ============================================

router.post(
  '/invoices',
  authorize('OWNER', 'ACCOUNTS'),
  createInvoiceValidator,
  dispatchController.createInvoice
);

router.get(
  '/invoices',
  authorize('OWNER', 'ACCOUNTS'),
  dispatchController.getAllInvoices
);

router.get(
  '/invoices/:id',
  authorize('OWNER', 'ACCOUNTS'),
  dispatchController.getInvoiceById
);

router.put(
  '/invoices/:id',
  authorize('OWNER', 'ACCOUNTS'),
  updateInvoiceValidator,
  dispatchController.updateInvoice
);

// ============================================
// PAYMENTS - Owner, Accounts
// ============================================

router.post(
  '/payments',
  authorize('OWNER', 'ACCOUNTS'),
  createPaymentValidator,
  dispatchController.createPayment
);

router.get(
  '/payments',
  authorize('OWNER', 'ACCOUNTS'),
  dispatchController.getAllPayments
);

router.get(
  '/payments/:id',
  authorize('OWNER', 'ACCOUNTS'),
  dispatchController.getPaymentById
);

export default router;

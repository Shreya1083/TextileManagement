import express from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createSupplierValidator,
  updateSupplierValidator,
  createYarnTypeValidator,
  updateYarnTypeValidator,
  createGateEntryValidator,
  createPurchaseOrderValidator,
  updatePurchaseOrderValidator,
  receivePurchaseOrderValidator,
  reserveStockValidator,
  issueStockValidator,
  adjustStockValidator,
  checkAvailabilityValidator,
} from '../validators/inventory.validator.js';

const router = express.Router();

// All inventory routes require authentication
router.use(authenticate);

// ============================================
// SUPPLIERS - Owner, Store, Accounts
// ============================================

router.post(
  '/suppliers',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  createSupplierValidator,
  inventoryController.createSupplier
);

router.get(
  '/suppliers',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  inventoryController.getAllSuppliers
);

router.get(
  '/suppliers/:id',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  inventoryController.getSupplierById
);

router.put(
  '/suppliers/:id',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  updateSupplierValidator,
  inventoryController.updateSupplier
);

router.delete(
  '/suppliers/:id',
  authorize('OWNER'),
  inventoryController.deleteSupplier
);

// ============================================
// YARN TYPES - Owner, Store
// ============================================

router.post(
  '/yarn-types',
  authorize('OWNER', 'STOREKEEPER'),
  createYarnTypeValidator,
  inventoryController.createYarnType
);

router.get(
  '/yarn-types',
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR', 'ACCOUNTS'),
  inventoryController.getAllYarnTypes
);

router.get(
  '/yarn-types/:id',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  inventoryController.getYarnTypeById
);

router.put(
  '/yarn-types/:id',
  authorize('OWNER', 'STOREKEEPER'),
  updateYarnTypeValidator,
  inventoryController.updateYarnType
);

router.delete(
  '/yarn-types/:id',
  authorize('OWNER'),
  inventoryController.deleteYarnType
);

// ============================================
// GATE ENTRIES (GRN) - Store
// ============================================

router.post(
  '/gate-entries',
  authorize('OWNER', 'STOREKEEPER'),
  createGateEntryValidator,
  inventoryController.createGateEntry
);

router.get(
  '/gate-entries',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  inventoryController.getAllGateEntries
);

router.get(
  '/gate-entries/:id',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  inventoryController.getGateEntryById
);

// ============================================
// STOCK MANAGEMENT - Multiple roles
// ============================================

router.get(
  '/stock',
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR', 'ACCOUNTS'),
  inventoryController.getStockLevels
);

router.get(
  '/stock/ledger',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  inventoryController.getStockLedger
);

router.get(
  '/stock/low-stock-alerts',
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR'),
  inventoryController.getLowStockAlerts
);

router.get(
  '/stock/check-availability',
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR'),
  checkAvailabilityValidator,
  inventoryController.checkStockAvailability
);

router.post(
  '/stock/reserve',
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR'),
  reserveStockValidator,
  inventoryController.reserveStock
);

router.delete(
  '/stock/reserve/:orderId',
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR'),
  inventoryController.releaseStockReservation
);

router.post(
  '/stock/issue',
  authorize('STOREKEEPER', 'SUPERVISOR'),
  issueStockValidator,
  inventoryController.issueStockForProduction
);

router.post(
  '/stock/adjust/:stockBatchId',
  authorize('OWNER', 'STOREKEEPER'),
  adjustStockValidator,
  inventoryController.adjustStock
);

// ============================================
// PURCHASE ORDERS - Owner, Store, Accounts
// ============================================

router.post(
  '/purchase-orders',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  createPurchaseOrderValidator,
  inventoryController.createPurchaseOrder
);

router.get(
  '/purchase-orders',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  inventoryController.getAllPurchaseOrders
);

router.get(
  '/purchase-orders/:id',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  inventoryController.getPurchaseOrderById
);

router.put(
  '/purchase-orders/:id',
  authorize('OWNER', 'STOREKEEPER', 'ACCOUNTS'),
  updatePurchaseOrderValidator,
  inventoryController.updatePurchaseOrder
);

router.post(
  '/purchase-orders/:id/receive',
  authorize('STOREKEEPER'),
  receivePurchaseOrderValidator,
  inventoryController.receivePurchaseOrder
);

export default router;

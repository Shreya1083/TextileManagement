import express from 'express';
import * as ordersController from '../controllers/orders.controller.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import {
  createBuyerValidator,
  updateBuyerValidator,
  createFabricTypeValidator,
  updateFabricTypeValidator,
  createOrderValidator,
  updateOrderValidator,
  updateOrderStatusValidator,
  trackOrderValidator,
} from '../validators/orders.validator.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES - Order Tracking
// ============================================

router.get('/track', trackOrderValidator, ordersController.trackOrder);

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================

router.use(authenticate);

// ============================================
// BUYERS - Owner, Accounts
// ============================================

router.post(
  '/buyers',
  authorize('OWNER', 'ACCOUNTS'),
  createBuyerValidator,
  ordersController.createBuyer
);

router.get(
  '/buyers',
  authorize('OWNER', 'ACCOUNTS'),
  ordersController.getAllBuyers
);

router.get(
  '/buyers/:id',
  authorize('OWNER', 'ACCOUNTS'),
  ordersController.getBuyerById
);

router.put(
  '/buyers/:id',
  authorize('OWNER', 'ACCOUNTS'),
  updateBuyerValidator,
  ordersController.updateBuyer
);

router.delete(
  '/buyers/:id',
  authorize('OWNER'),
  ordersController.deleteBuyer
);

// ============================================
// FABRIC TYPES - Owner, Accounts
// ============================================

router.post(
  '/fabric-types',
  authorize('OWNER', 'ACCOUNTS'),
  createFabricTypeValidator,
  ordersController.createFabricType
);

router.get(
  '/fabric-types',
  authorize('OWNER', 'ACCOUNTS', 'STOREKEEPER'),
  ordersController.getAllFabricTypes
);

router.get(
  '/fabric-types/:id',
  authorize('OWNER', 'ACCOUNTS'),
  ordersController.getFabricTypeById
);

router.put(
  '/fabric-types/:id',
  authorize('OWNER', 'ACCOUNTS'),
  updateFabricTypeValidator,
  ordersController.updateFabricType
);

router.delete(
  '/fabric-types/:id',
  authorize('OWNER'),
  ordersController.deleteFabricType
);

// ============================================
// ORDERS - Multiple roles
// ============================================

router.post(
  '/orders',
  authorize('OWNER', 'ACCOUNTS'),
  createOrderValidator,
  ordersController.createOrder
);

router.get(
  '/orders',
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR', 'INSPECTOR', 'ACCOUNTS'),
  ordersController.getAllOrders
);

router.get(
  '/orders/:id',
  authorize('OWNER', 'STOREKEEPER', 'SUPERVISOR', 'INSPECTOR', 'ACCOUNTS'),
  ordersController.getOrderById
);

router.put(
  '/orders/:id',
  authorize('OWNER', 'ACCOUNTS'),
  updateOrderValidator,
  ordersController.updateOrder
);

router.patch(
  '/orders/:id/status',
  authorize('OWNER', 'ACCOUNTS', 'SUPERVISOR'),
  updateOrderStatusValidator,
  ordersController.updateOrderStatus
);

router.delete(
  '/orders/:id',
  authorize('OWNER'),
  ordersController.deleteOrder
);

router.get(
  '/orders/:id/check-yarn',
  authorize('OWNER', 'ACCOUNTS', 'STOREKEEPER'),
  ordersController.checkYarnAvailability
);

router.post(
  '/orders/:id/confirm',
  authorize('OWNER', 'ACCOUNTS'),
  ordersController.confirmOrder
);

router.post(
  '/orders/:id/start-production',
  authorize('OWNER', 'SUPERVISOR'),
  ordersController.startProduction
);

router.post(
  '/orders/:id/move-to-qc',
  authorize('OWNER', 'SUPERVISOR'),
  ordersController.moveToQualityCheck
);

router.post(
  '/orders/:id/ready-to-ship',
  authorize('OWNER', 'ACCOUNTS', 'INSPECTOR'),
  ordersController.markReadyToShip
);

router.post(
  '/orders/:id/dispatched',
  authorize('OWNER', 'ACCOUNTS'),
  ordersController.markDispatched
);

router.post(
  '/orders/:id/close',
  authorize('OWNER', 'ACCOUNTS'),
  ordersController.closeOrder
);

router.post(
  '/orders/:id/cancel',
  authorize('OWNER', 'ACCOUNTS'),
  ordersController.cancelOrder
);

export default router;

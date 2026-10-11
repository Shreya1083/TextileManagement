import express from 'express';
import * as notifService from '../services/notifications.service.js';
import { successResponse } from '../utils/response.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

// GET /api/notifications — all active alerts for the logged-in user's role
router.get('/', asyncHandler(async (req, res, next) => {
  const data = await notifService.getActiveAlerts();
  return successResponse(res, data, 'Notifications retrieved');
}));

// GET /api/notifications/:type — filtered by alert type
router.get('/:type', asyncHandler(async (req, res, next) => {
  const data = await notifService.getAlertsByType(req.params.type.toUpperCase());
  return successResponse(res, data, `${req.params.type} alerts retrieved`);
}));

export default router;

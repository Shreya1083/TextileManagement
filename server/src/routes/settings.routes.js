import express from 'express';
import * as ctrl from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(authenticate);

// All authenticated users can read mill info (for header display etc.)
router.get('/mill', asyncHandler(ctrl.getMillInfo));

// Owner only: update mill info
router.put('/mill', authorize('OWNER'), asyncHandler(ctrl.updateMillInfo));

// Owner only: full settings access
router.get('/', authorize('OWNER'), asyncHandler(ctrl.getAllSettings));

// Master data — defect types (owner manages, all authenticated can read)
router.get('/master/defect-types', asyncHandler(ctrl.getDefectTypes));
router.put('/master/defect-types', authorize('OWNER'), asyncHandler(ctrl.updateDefectTypes));

// Production stages
router.get('/master/production-stages', asyncHandler(ctrl.getProductionStages));

// Reorder defaults
router.get('/master/reorder-defaults', asyncHandler(ctrl.getReorderDefaults));
router.put('/master/reorder-defaults', authorize('OWNER'), asyncHandler(ctrl.updateReorderDefaults));

export default router;

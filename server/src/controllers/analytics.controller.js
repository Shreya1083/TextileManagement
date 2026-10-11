import * as analyticsService from '../services/analytics.service.js';
import { successResponse } from '../utils/response.js';

export const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview(req.query);
    return successResponse(res, data, 'Analytics overview retrieved');
  } catch (err) { next(err); }
};

export const getProductionAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getProductionAnalytics(req.query);
    return successResponse(res, data, 'Production analytics retrieved');
  } catch (err) { next(err); }
};

export const getQualityAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getQualityAnalytics(req.query);
    return successResponse(res, data, 'Quality analytics retrieved');
  } catch (err) { next(err); }
};

export const getInventoryAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getInventoryAnalytics(req.query);
    return successResponse(res, data, 'Inventory analytics retrieved');
  } catch (err) { next(err); }
};

export const getFinanceAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getFinanceAnalytics(req.query);
    return successResponse(res, data, 'Finance analytics retrieved');
  } catch (err) { next(err); }
};

export const getDelayRisk = async (req, res, next) => {
  try {
    const data = await analyticsService.getDelayRiskOrders();
    return successResponse(res, data, 'Delay risk orders retrieved');
  } catch (err) { next(err); }
};

export const getStockoutRisk = async (req, res, next) => {
  try {
    const data = await analyticsService.getStockoutRisk();
    return successResponse(res, data, 'Stockout risk retrieved');
  } catch (err) { next(err); }
};

import * as settingsService from '../services/settings.service.js';
import { successResponse } from '../utils/response.js';

export const getAllSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getAllSettings();
    return successResponse(res, data, 'Settings retrieved');
  } catch (err) { next(err); }
};

export const getMillInfo = async (req, res, next) => {
  try {
    const data = await settingsService.getMillInfo();
    return successResponse(res, data, 'Mill info retrieved');
  } catch (err) { next(err); }
};

export const updateMillInfo = async (req, res, next) => {
  try {
    const data = await settingsService.updateMillInfo(req.body);
    return successResponse(res, data, 'Mill info updated');
  } catch (err) { next(err); }
};

export const getDefectTypes = async (req, res, next) => {
  try {
    const data = await settingsService.getDefectTypes();
    return successResponse(res, data, 'Defect types retrieved');
  } catch (err) { next(err); }
};

export const updateDefectTypes = async (req, res, next) => {
  try {
    const { types } = req.body;
    await settingsService.updateDefectTypes(types);
    const data = await settingsService.getDefectTypes();
    return successResponse(res, data, 'Defect types updated');
  } catch (err) { next(err); }
};

export const getProductionStages = async (req, res, next) => {
  try {
    const data = await settingsService.getProductionStages();
    return successResponse(res, data, 'Production stages retrieved');
  } catch (err) { next(err); }
};

export const getReorderDefaults = async (req, res, next) => {
  try {
    const data = await settingsService.getReorderDefaults();
    return successResponse(res, data, 'Reorder defaults retrieved');
  } catch (err) { next(err); }
};

export const updateReorderDefaults = async (req, res, next) => {
  try {
    await settingsService.updateReorderDefaults(req.body);
    const data = await settingsService.getReorderDefaults();
    return successResponse(res, data, 'Reorder defaults updated');
  } catch (err) { next(err); }
};

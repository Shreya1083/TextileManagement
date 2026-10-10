import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware to handle validation errors from express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      acc[error.path] = error.msg;
      return acc;
    }, {});

    return res.status(400).json(
      errorResponse('Validation failed', formattedErrors)
    );
  }

  next();
};

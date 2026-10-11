import { errorResponse } from '../utils/response.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json(
      errorResponse('Duplicate entry: This record already exists', {
        field: err.meta?.target?.[0],
      })
    );
  }

  if (err.code === 'P2025') {
    return res.status(404).json(errorResponse('Record not found'));
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json(errorResponse('Validation failed', err.errors));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Invalid token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token expired'));
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json(
    errorResponse(message, process.env.NODE_ENV === 'development' ? { stack: err.stack } : null)
  );
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json(errorResponse(`Route not found: ${req.method} ${req.path}`));
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

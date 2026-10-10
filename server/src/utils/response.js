/**
 * Standardized API response formats
 */

const isExpressResponse = (value) => (
  value &&
  typeof value.status === 'function' &&
  typeof value.json === 'function'
);

export function successResponse(data, message = 'Success', pagination = null, statusCode = 200) {
  if (isExpressResponse(data)) {
    const res = data;
    const payload = message;
    const responseMessage = pagination || 'Success';

    return res.status(statusCode).json(successResponse(payload, responseMessage));
  }

  const response = {
    success: true,
    message,
    data,
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
}

export const errorResponse = (message = 'Error occurred', errors = null) => {
  return {
    success: false,
    message,
    ...(errors && { errors }),
  };
};

export function paginatedResponse(data, pagination) {
  if (isExpressResponse(data)) {
    const res = data;
    const payload = pagination;
    const page = arguments[2];
    const limit = arguments[3];
    const total = arguments[4];

    return res.json(paginatedResponse(payload, { page, limit, total }));
  }

  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  };
}

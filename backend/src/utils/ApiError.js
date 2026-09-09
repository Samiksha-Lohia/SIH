/**
 * Operational error with an HTTP status code and optional machine-readable code.
 * Thrown anywhere in the request lifecycle; caught by the global error handler.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || httpCodeName(statusCode);
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', opts) {
    return new ApiError(400, msg, opts);
  }
  static unauthorized(msg = 'Unauthorized', opts) {
    return new ApiError(401, msg, opts);
  }
  static forbidden(msg = 'Forbidden', opts) {
    return new ApiError(403, msg, opts);
  }
  static notFound(msg = 'Resource not found', opts) {
    return new ApiError(404, msg, opts);
  }
  static conflict(msg = 'Conflict', opts) {
    return new ApiError(409, msg, opts);
  }
  static unprocessable(msg = 'Validation failed', opts) {
    return new ApiError(422, msg, opts);
  }
  static serviceUnavailable(msg = 'Service unavailable', opts) {
    return new ApiError(503, msg, opts);
  }
}

function httpCodeName(status) {
  const map = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[status] || 'ERROR';
}

export default ApiError;

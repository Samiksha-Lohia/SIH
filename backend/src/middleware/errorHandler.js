import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Global error handler. Normalizes known error types (ApiError, Mongoose,
 * JWT, Zod) into the standard error envelope.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Operational errors we intentionally threw
  if (err instanceof ApiError) {
    return sendError(res, {
      status: err.statusCode,
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // Mongoose: bad ObjectId
  if (err.name === 'CastError') {
    return sendError(res, { status: 400, message: `Invalid ${err.path}`, code: 'INVALID_ID' });
  }

  // Mongoose: validation
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return sendError(res, { status: 422, message: 'Validation failed', code: 'VALIDATION_ERROR', details });
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, {
      status: 409,
      message: `${field} already exists`,
      code: 'DUPLICATE_KEY',
      details: err.keyValue,
    });
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, { status: 401, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, { status: 401, message: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return sendError(res, { status: 400, message: err.message, code: 'UPLOAD_ERROR' });
  }

  // Unknown / programming error
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  return sendError(res, {
    status: 500,
    message: env.isProd ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
    ...(env.isProd ? {} : { details: { stack: err.stack } }),
  });
}

export default errorHandler;

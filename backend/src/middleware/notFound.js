import { sendError } from '../utils/apiResponse.js';

/**
 * 404 handler for unmatched routes.
 */
export function notFound(req, res) {
  return sendError(res, {
    status: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

export default notFound;

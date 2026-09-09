/**
 * Standard response envelope so any frontend consumes a predictable shape:
 *   { success, data, error, meta }
 * Always the same top-level keys regardless of success/failure.
 */
export function sendSuccess(res, data = null, { status = 200, meta } = {}) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
    meta: meta ?? null,
  });
}

export function sendError(res, { status = 500, message = 'Internal server error', code = 'INTERNAL_ERROR', details } = {}) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: null,
  });
}

/**
 * Build pagination meta for list endpoints.
 */
export function paginationMeta({ page, limit, total }) {
  const safeLimit = Math.max(1, limit);
  return {
    page,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit) || 0,
    hasNextPage: page * safeLimit < total,
    hasPrevPage: page > 1,
  };
}

/**
 * Parse common list query params (?page=&limit=&sort=) into safe values.
 */
export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Convert a ?sort=field,-other string into a Mongoose sort object.
 */
export function parseSort(sort, fallback = { createdAt: -1 }) {
  if (!sort) return fallback;
  const out = {};
  for (const part of String(sort).split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('-')) out[trimmed.slice(1)] = -1;
    else out[trimmed] = 1;
  }
  return Object.keys(out).length ? out : fallback;
}

/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error pipeline instead of crashing the process. Keeps controllers clean.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

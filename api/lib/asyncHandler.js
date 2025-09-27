/**
 * Express async handler wrapper
 * Wraps async route handlers to properly catch errors
 * and pass them to the error handling middleware
 */
export const asyncHandler = (_fn) => {
  return (_req, _res, _next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
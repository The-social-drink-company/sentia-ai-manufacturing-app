import { ZodError } from 'zod';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  // Log error for debugging
  logError('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      field: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (_fn) => {
  return (req, res, _next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Not found error handler
 */
const notFound = (req, res, _next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

export {
  errorHandler,
  asyncHandler,
  AppError,
  notFound
};
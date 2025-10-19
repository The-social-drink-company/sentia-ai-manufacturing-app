/**
 * Global Error Handling Middleware
 *
 * @module server/middleware/error.middleware
 */

import { Request, Response, NextFunction } from 'express'
import { AppError, ValidationError } from '../errors/AppError.js'
import { ZodError } from 'zod'

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[ErrorHandler] Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    organizationId: req.organizationId,
    tenantSchema: req.tenantSchema
  })

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError(
      'Validation failed',
      err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    )

    res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: validationError.message,
      errors: validationError.errors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
    return
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: err.name,
      message: err.message
    }

    if (err instanceof ValidationError) {
      response.errors = err.errors
    }

    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack
    }

    res.status(err.statusCode).json(response)
    return
  }

  // Handle unknown errors
  const statusCode = 500
  res.status(statusCode).json({
    success: false,
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

/**
 * Async route handler wrapper
 * Catches errors from async route handlers and passes to error middleware
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 404 Not Found handler
 * Should be registered after all routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`
  })
}

/**
 * Custom Application Error Classes
 *
 * @module server/errors/AppError
 */

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class TenantNotFoundError extends AppError {
  constructor(message: string = 'Tenant not found') {
    super(message, 404)
    this.name = 'TenantNotFoundError'
  }
}

export class SubscriptionInactiveError extends AppError {
  constructor(message: string = 'Subscription is inactive') {
    super(message, 403)
    this.name = 'SubscriptionInactiveError'
  }
}

export class FeatureNotAvailableError extends AppError {
  constructor(message: string = 'Feature not available on current plan') {
    super(message, 403)
    this.name = 'FeatureNotAvailableError'
  }
}

export class EntityLimitExceededError extends AppError {
  constructor(message: string = 'Entity limit exceeded for current subscription tier') {
    super(message, 403)
    this.name = 'EntityLimitExceededError'
  }
}

export class ValidationError extends AppError {
  errors: any[]

  constructor(message: string = 'Validation failed', errors: any[] = []) {
    super(message, 400)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

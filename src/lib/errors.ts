export class ApplicationError extends Error {
  code: string | null
  statusCode: number
  metadata: Record<string, unknown>
  timestamp: string
  correlationId: string | null
  cause?: Error

  constructor(message: string, options: {
    code?: string
    statusCode?: number
    metadata?: Record<string, unknown>
    correlationId?: string
    cause?: Error
  } = {}) {
    super(message)

    this.name = new.target.name
    this.code = options.code ?? null
    this.statusCode = options.statusCode ?? 500
    this.metadata = options.metadata ?? {}
    this.timestamp = new Date().toISOString()
    this.correlationId = options.correlationId ?? null

    if (options.cause) {
      this.cause = options.cause
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      ...(this.cause && {
        cause: {
          name: this.cause.name,
          message: this.cause.message,
          stack: this.cause.stack
        }
      })
    }
  }
}

export class ValidationError extends ApplicationError {
  field: string | null
  value: unknown

  constructor(message: string, field: string | null = null, value: unknown = null, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      metadata: {
        field,
        value,
        ...(options.metadata as Record<string, unknown> | undefined)
      }
    })

    this.field = field
    this.value = value
  }
}

export class NetworkError extends ApplicationError {
  endpoint: string | null
  method: string
  responseStatus: number | null

  constructor(message: string, endpoint: string | null = null, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'NETWORK_ERROR',
      statusCode: (options.statusCode as number | undefined) ?? 502,
      metadata: {
        endpoint,
        method: options.method,
        responseStatus: options.responseStatus,
        ...(options.metadata as Record<string, unknown> | undefined)
      }
    })

    this.endpoint = endpoint
    this.method = (options.method as string | undefined) ?? 'GET'
    this.responseStatus = (options.responseStatus as number | undefined) ?? null
  }
}

export class DatabaseError extends ApplicationError {
  operation: string | null
  query: string | null
  table: string | null

  constructor(message: string, operation: string | null = null, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'DATABASE_ERROR',
      statusCode: (options.statusCode as number | undefined) ?? 500,
      metadata: {
        operation,
        query: options.query,
        table: options.table,
        ...(options.metadata as Record<string, unknown> | undefined)
      }
    })

    this.operation = operation
    this.query = (options.query as string | undefined) ?? null
    this.table = (options.table as string | undefined) ?? null
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'AUTH_ERROR',
      statusCode: 401
    })
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'FORBIDDEN',
      statusCode: 403
    })
  }
}

export class BusinessRuleError extends ApplicationError {
  constructor(message: string, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'BUSINESS_RULE_ERROR',
      statusCode: (options.statusCode as number | undefined) ?? 422
    })
  }
}
export class ServiceError extends ApplicationError {
  service: string

  constructor(message: string, service: string, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'SERVICE_ERROR',
      metadata: {
        service,
        operation: options.operation,
        ...(options.metadata as Record<string, unknown> | undefined)
      }
    })

    this.service = service
  }
}
export class ConfigurationError extends ApplicationError {
  constructor(message: string, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'CONFIGURATION_ERROR',
      statusCode: 500
    })
  }
}
export class NotFoundError extends ApplicationError {
  constructor(message: string, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'NOT_FOUND',
      statusCode: 404
    })
  }
}
export class RateLimitError extends ApplicationError {
  limit: number
  resetTime: string | null

  constructor(message: string, limit: number, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'RATE_LIMIT',
      statusCode: 429,
      metadata: {
        limit,
        resetTime: options.resetTime,
        ...(options.metadata as Record<string, unknown> | undefined)
      }
    })

    this.limit = limit
    this.resetTime = (options.resetTime as string | undefined) ?? null
  }
}
export class TimeoutError extends ApplicationError {
  timeout: number

  constructor(message: string, timeout: number, options: Record<string, unknown> = {}) {
    super(message, {
      ...options,
      code: 'TIMEOUT',
      statusCode: 408,
      metadata: {
        timeout,
        operation: options.operation,
        ...(options.metadata as Record<string, unknown> | undefined)
      }
    })

    this.timeout = timeout
  }
}
export const createValidationError = (field: string, value: unknown, message?: string) =>
  new ValidationError(message ?? `Invalid value for ${field}`, field, value)

export const createNetworkError = (endpoint: string, statusCode: number, message?: string) =>
  new NetworkError(message ?? `Request failed for ${endpoint}`, endpoint, { responseStatus: statusCode })

export const createDatabaseError = (operation: string, message?: string, cause?: Error) =>
  new DatabaseError(message ?? `Database error during ${operation}`, operation, { cause })

export const createServiceError = (service: string, operation: string, message?: string, cause?: Error) =>
  new ServiceError(message ?? `Service error in ${service}`, service, { operation, cause })

export const withErrorHandling = async <T>(operation: () => Promise<T>, errorContext: Record<string, unknown> = {}) => {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error
    }

    const fallback = error instanceof Error ? error : new Error('Unknown error')

    throw new ApplicationError(fallback.message, {
      cause: fallback,
      metadata: errorContext
    })
  }
}

export const errorHandlerMiddleware = (error: unknown, req: any, res: any, _next: any) => {
  if (error instanceof ApplicationError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        correlationId: error.correlationId ?? req.correlationId,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          metadata: error.metadata
        })
      }
    })
  }

  const fallback = error as { statusCode?: number; status?: number; message?: string; stack?: string }
  const statusCode = fallback?.statusCode ?? fallback?.status ?? 500

  return res.status(statusCode).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: fallback?.message ?? 'Unexpected failure',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      ...(process.env.NODE_ENV === 'development' && { stack: fallback?.stack })
    }
  })
}

const exported = {
  ApplicationError,
  ValidationError,
  NetworkError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  BusinessRuleError,
  ServiceError,
  ConfigurationError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  createValidationError,
  createNetworkError,
  createDatabaseError,
  createServiceError,
  withErrorHandling,
  errorHandlerMiddleware
}

export default exported

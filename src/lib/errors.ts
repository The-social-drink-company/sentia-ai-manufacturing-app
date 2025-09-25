
export class ApplicationError extends Error {
  constructor(
    message,
    options = {}
  ) {
    super(message)

    this.name = new.target.name
    this.code = options.code ?? null
    this.statusCode = options.statusCode ?? 500
    this.metadata = options.metadata ?? {}
    this.timestamp = new Date().toISOString()
    this.correlationId = options.correlationId ?? null

    if (options.cause instanceof Error) {
      this.cause = options.cause
    }

    if (typeof Error.captureStackTrace === 'function') {
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
  constructor(message, field = null, value = null, options = {}) {
    super(message, {
      ...options,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      metadata: {
        field,
        value,
        ...(options.metadata || {})
      }
    })

    this.field = field
    this.value = value
  }
}

export class NetworkError extends ApplicationError {
  constructor(message, endpoint = null, options = {}) {
    super(message, {
      ...options,
      code: 'NETWORK_ERROR',
      statusCode: options.statusCode ?? 502,
      metadata: {
        endpoint,
        method: options.method,
        responseStatus: options.responseStatus,
        ...(options.metadata || {})
      }
    })

    this.endpoint = endpoint
    this.method = options.method ?? 'GET'
    this.responseStatus = options.responseStatus ?? null
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message, operation = null, options = {}) {
    super(message, {
      ...options,
      code: 'DATABASE_ERROR',
      statusCode: options.statusCode ?? 500,
      metadata: {
        operation,
        query: options.query,
        table: options.table,
        ...(options.metadata || {})
      }
    })

    this.operation = operation
    this.query = options.query ?? null
    this.table = options.table ?? null
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: 'AUTH_ERROR',
      statusCode: 401
    })
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: 'FORBIDDEN',
      statusCode: 403
    })
  }
}

export class BusinessRuleError extends ApplicationError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: 'BUSINESS_RULE_ERROR',
      statusCode: options.statusCode ?? 422
    })
  }
}

export class ServiceError extends ApplicationError {
  constructor(message, service, options = {}) {
    super(message, {
      ...options,
      code: 'SERVICE_ERROR',
      metadata: {
        service,
        operation: options.operation,
        ...(options.metadata || {})
      }
    })

    this.service = service
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: 'CONFIGURATION_ERROR',
      statusCode: 500
    })
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: 'NOT_FOUND',
      statusCode: 404
    })
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message, limit, options = {}) {
    super(message, {
      ...options,
      code: 'RATE_LIMIT',
      statusCode: 429,
      metadata: {
        limit,
        resetTime: options.resetTime,
        ...(options.metadata || {})
      }
    })

    this.limit = limit
    this.resetTime = options.resetTime ?? null
  }
}

export default {
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
  RateLimitError
}

/**
 * Enterprise Error Handling Utilities
 *
 * Comprehensive error handling, classification, and recovery mechanisms
 * for the MCP server and manufacturing applications.
 */

import { createLogger } from './logger.js'

/**
 * Error classifications for proper handling and reporting
 */
export const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  AUTHENTICATION: 'AuthenticationError',
  AUTHORIZATION: 'AuthorizationError',
  NOT_FOUND: 'NotFoundError',
  CONFLICT: 'ConflictError',
  RATE_LIMIT: 'RateLimitError',
  DATABASE: 'DatabaseError',
  EXTERNAL_API: 'ExternalAPIError',
  TOOL_EXECUTION: 'ToolExecutionError',
  CONFIGURATION: 'ConfigurationError',
  TIMEOUT: 'TimeoutError',
  NETWORK: 'NetworkError',
  INTERNAL: 'InternalError',
}

/**
 * Error severity levels for monitoring and alerting
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

/**
 * Base error class with enhanced metadata
 */
export class MCPError extends Error {
  constructor(message, type = ERROR_TYPES.INTERNAL, options = {}) {
    super(message)

    this.name = this.constructor.name
    this.type = type
    this.severity = options.severity || ERROR_SEVERITY.MEDIUM
    this.correlationId = options.correlationId
    this.code = options.code
    this.details = options.details || {}
    this.timestamp = new Date().toISOString()
    this.retryable = options.retryable || false
    this.statusCode = options.statusCode || 500

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON for logging and API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      correlationId: this.correlationId,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      retryable: this.retryable,
      statusCode: this.statusCode,
      stack: this.stack,
    }
  }

  /**
   * Get sanitized error for client responses (removes sensitive data)
   */
  toClientError() {
    return {
      message: this.message,
      type: this.type,
      code: this.code,
      correlationId: this.correlationId,
      retryable: this.retryable,
      timestamp: this.timestamp,
    }
  }
}

/**
 * Specific error classes for different scenarios
 */
export class ValidationError extends MCPError {
  constructor(message, options = {}) {
    super(message, ERROR_TYPES.VALIDATION, {
      ...options,
      statusCode: 400,
      severity: ERROR_SEVERITY.LOW,
    })
  }
}

export class AuthenticationError extends MCPError {
  constructor(message = 'Authentication required', options = {}) {
    super(message, ERROR_TYPES.AUTHENTICATION, {
      ...options,
      statusCode: 401,
      severity: ERROR_SEVERITY.MEDIUM,
    })
  }
}

export class AuthorizationError extends MCPError {
  constructor(message = 'Insufficient permissions', options = {}) {
    super(message, ERROR_TYPES.AUTHORIZATION, {
      ...options,
      statusCode: 403,
      severity: ERROR_SEVERITY.MEDIUM,
    })
  }
}

export class NotFoundError extends MCPError {
  constructor(resource, options = {}) {
    super(`${resource} not found`, ERROR_TYPES.NOT_FOUND, {
      ...options,
      statusCode: 404,
      severity: ERROR_SEVERITY.LOW,
    })
  }
}

export class ConflictError extends MCPError {
  constructor(message, options = {}) {
    super(message, ERROR_TYPES.CONFLICT, {
      ...options,
      statusCode: 409,
      severity: ERROR_SEVERITY.MEDIUM,
    })
  }
}

export class RateLimitError extends MCPError {
  constructor(message = 'Rate limit exceeded', options = {}) {
    super(message, ERROR_TYPES.RATE_LIMIT, {
      ...options,
      statusCode: 429,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
    })
  }
}

export class DatabaseError extends MCPError {
  constructor(message, options = {}) {
    super(message, ERROR_TYPES.DATABASE, {
      ...options,
      statusCode: 500,
      severity: ERROR_SEVERITY.HIGH,
      retryable: options.retryable || false,
    })
  }
}

export class ExternalAPIError extends MCPError {
  constructor(service, message, options = {}) {
    super(`${service} API error: ${message}`, ERROR_TYPES.EXTERNAL_API, {
      ...options,
      statusCode: options.statusCode || 503,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      details: { service, ...options.details },
    })
  }
}

export class ToolExecutionError extends MCPError {
  constructor(toolName, message, options = {}) {
    super(`Tool execution failed: ${toolName} - ${message}`, ERROR_TYPES.TOOL_EXECUTION, {
      ...options,
      statusCode: 500,
      severity: ERROR_SEVERITY.MEDIUM,
      details: { toolName, ...options.details },
    })
  }
}

export class TimeoutError extends MCPError {
  constructor(operation, timeout, options = {}) {
    super(`Operation timed out: ${operation} (${timeout}ms)`, ERROR_TYPES.TIMEOUT, {
      ...options,
      statusCode: 408,
      severity: ERROR_SEVERITY.MEDIUM,
      retryable: true,
      details: { operation, timeout, ...options.details },
    })
  }
}

/**
 * Error Handler Class
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.logger = createLogger()
    this.enableStackTrace = options.enableStackTrace !== false
    this.enableErrorMetrics = options.enableErrorMetrics !== false
    this.errorMetrics = new Map()
  }

  /**
   * Handle and log errors with proper classification
   */
  handle(error, context = {}) {
    const correlationId = context.correlationId || error.correlationId
    const logger = createLogger(correlationId)

    // Convert to MCPError if it's a regular Error
    const mcpError = error instanceof MCPError ? error : this.classifyError(error, context)

    // Log the error with appropriate level
    const logLevel = this.getLogLevel(mcpError.severity)
    logger[logLevel]('Error handled', {
      error: mcpError.toJSON(),
      context,
    })

    // Update error metrics
    if (this.enableErrorMetrics) {
      this.updateErrorMetrics(mcpError)
    }

    return mcpError
  }

  /**
   * Classify generic errors into MCPError types
   */
  classifyError(error, context = {}) {
    const message = error.message || 'Unknown error'
    const correlationId = context.correlationId

    // Database-related errors
    if (this.isDatabaseError(error)) {
      return new DatabaseError(message, { correlationId, details: { originalError: error.name } })
    }

    // Network/timeout errors
    if (this.isTimeoutError(error)) {
      return new TimeoutError(context.operation || 'unknown', context.timeout || 0, {
        correlationId,
      })
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return new ValidationError(message, { correlationId })
    }

    // Authentication errors
    if (this.isAuthenticationError(error)) {
      return new AuthenticationError(message, { correlationId })
    }

    // Default to internal error
    return new MCPError(message, ERROR_TYPES.INTERNAL, {
      correlationId,
      severity: ERROR_SEVERITY.HIGH,
      details: { originalError: error.name, stack: error.stack },
    })
  }

  /**
   * Error classification helpers
   */
  isDatabaseError(error) {
    const dbErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT']
    const dbErrorNames = ['PostgresError', 'SequelizeError', 'MongoError']

    return (
      dbErrorCodes.includes(error.code) ||
      dbErrorNames.some(name => error.name.includes(name)) ||
      (error.message && error.message.toLowerCase().includes('database'))
    )
  }

  isTimeoutError(error) {
    return (
      error.code === 'ETIMEDOUT' ||
      error.name === 'TimeoutError' ||
      (error.message && error.message.toLowerCase().includes('timeout'))
    )
  }

  isValidationError(error) {
    return (
      error.name === 'ValidationError' ||
      error.name === 'CastError' ||
      (error.message && error.message.toLowerCase().includes('validation'))
    )
  }

  isAuthenticationError(error) {
    return (
      error.name === 'UnauthorizedError' ||
      error.name === 'JsonWebTokenError' ||
      (error.message && error.message.toLowerCase().includes('unauthorized'))
    )
  }

  /**
   * Get appropriate log level based on error severity
   */
  getLogLevel(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        return 'error'
      case ERROR_SEVERITY.MEDIUM:
        return 'warn'
      case ERROR_SEVERITY.LOW:
      default:
        return 'info'
    }
  }

  /**
   * Update error metrics for monitoring
   */
  updateErrorMetrics(error) {
    const key = `${error.type}:${error.severity}`
    const current = this.errorMetrics.get(key) || { count: 0, lastOccurrence: null }

    this.errorMetrics.set(key, {
      count: current.count + 1,
      lastOccurrence: error.timestamp,
      type: error.type,
      severity: error.severity,
    })
  }

  /**
   * Get error metrics for monitoring dashboards
   */
  getErrorMetrics() {
    const metrics = {}

    for (const [key, data] of this.errorMetrics) {
      metrics[key] = data
    }

    return {
      errors: metrics,
      summary: {
        totalErrors: Array.from(this.errorMetrics.values()).reduce(
          (sum, data) => sum + data.count,
          0
        ),
        errorTypes: new Set(Array.from(this.errorMetrics.values()).map(data => data.type)).size,
        criticalErrors: Array.from(this.errorMetrics.values())
          .filter(data => data.severity === ERROR_SEVERITY.CRITICAL)
          .reduce((sum, data) => sum + data.count, 0),
      },
    }
  }

  /**
   * Express middleware for error handling
   */
  expressMiddleware() {
    // TODO: Implement next parameter when middleware chain is needed
    // eslint-disable-next-line no-unused-vars
    return (error, req, res, next) => {
      const mcpError = this.handle(error, {
        correlationId: req.correlationId,
        operation: `${req.method} ${req.path}`,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      })

      // Set appropriate status code
      res.status(mcpError.statusCode)

      // Send client-safe error response
      res.json({
        error: mcpError.toClientError(),
        success: false,
      })
    }
  }

  /**
   * Async function wrapper with error handling
   */
  wrapAsync(fn) {
    return async (...args) => {
      try {
        return await fn(...args)
      } catch (error) {
        throw this.handle(error, { operation: fn.name })
      }
    }
  }

  /**
   * Promise wrapper with timeout and error handling
   */
  wrapPromise(promise, timeout = 30000, operation = 'unknown') {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(operation, timeout))
        }, timeout)
      }),
    ]).catch(error => {
      throw this.handle(error, { operation, timeout })
    })
  }

  /**
   * Circuit breaker pattern implementation
   */
  createCircuitBreaker(operation, options = {}) {
    const { failureThreshold = 5, resetTimeout = 60000 } = options

    let failures = 0
    let lastFailureTime = null
    let state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN

    return async (...args) => {
      // Check if circuit should be reset
      if (state === 'OPEN' && Date.now() - lastFailureTime > resetTimeout) {
        state = 'HALF_OPEN'
      }

      // Reject if circuit is open
      if (state === 'OPEN') {
        throw new MCPError('Circuit breaker is OPEN', ERROR_TYPES.INTERNAL, {
          severity: ERROR_SEVERITY.MEDIUM,
          retryable: true,
          details: { circuitState: state, failures },
        })
      }

      try {
        const result = await operation(...args)

        // Reset on success
        if (state === 'HALF_OPEN') {
          state = 'CLOSED'
          failures = 0
        }

        return result
      } catch (error) {
        failures++
        lastFailureTime = Date.now()

        // Open circuit if threshold reached
        if (failures >= failureThreshold) {
          state = 'OPEN'
        }

        throw this.handle(error, {
          operation: operation.name,
          circuitState: state,
          failures,
        })
      }
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async withRetry(operation, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryCondition = error => error.retryable,
    } = options

    let lastError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.handle(error, { attempt, maxRetries })

        // Don't retry if not retryable or max attempts reached
        if (!retryCondition(lastError) || attempt === maxRetries) {
          throw lastError
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)

        this.logger.warn('Retrying operation', {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: lastError.message,
        })

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler()

// Convenience functions
export const handleError = (error, context) => globalErrorHandler.handle(error, context)
export const wrapAsync = fn => globalErrorHandler.wrapAsync(fn)
export const withRetry = (operation, options) => globalErrorHandler.withRetry(operation, options)
export const createCircuitBreaker = (operation, options) =>
  globalErrorHandler.createCircuitBreaker(operation, options)

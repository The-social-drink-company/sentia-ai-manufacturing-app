/**
 * Enterprise-grade error classes for standardized error handling
 * Provides consistent error structure across the application
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class ApplicationError extends Error {
  constructor(message, options = {}) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = options.code || 'GENERIC_ERROR';
    this.statusCode = options.statusCode || 500;
    this.metadata = options.metadata || {};
    this.timestamp = new Date().toISOString();
    this.correlationId = options.correlationId;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Preserve original error if provided
    if (options.cause) {
      this.cause = options.cause;
      this.originalStack = options.cause.stack;
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      stack: this.stack,
      ...(this.cause && {
        cause: {
          name: this.cause.name,
          message: this.cause.message,
          stack: this.cause.stack
        }
      })
    };
  }
}

/**
 * Validation error for input/data validation failures
 */
export class ValidationError extends ApplicationError {
  constructor(message, field = null, value = null, options = {}) {
    super(message, {
      ...options,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      metadata: {
        field,
        value,
        ...options.metadata
      }
    });
    
    this.field = field;
    this.value = value;
  }
}

/**
 * Network/API related errors
 */
export class NetworkError extends ApplicationError {
  constructor(message, endpoint = null, options = {}) {
    super(message, {
      ...options,
      code: 'NETWORK_ERROR',
      statusCode: options.statusCode || 502,
      metadata: {
        endpoint,
        method: options.method,
        responseStatus: options.responseStatus,
        ...options.metadata
      }
    });
    
    this.endpoint = endpoint;
    this.method = options.method;
    this.responseStatus = options.responseStatus;
  }
}

/**
 * Database operation errors
 */
export class DatabaseError extends ApplicationError {
  constructor(message, operation = null, options = {}) {
    super(message, {
      ...options,
      code: 'DATABASE_ERROR',
      statusCode: 500,
      metadata: {
        operation,
        query: options.query,
        table: options.table,
        ...options.metadata
      }
    });
    
    this.operation = operation;
    this.query = options.query;
    this.table = options.table;
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends ApplicationError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: 'AUTHENTICATION_ERROR',
      statusCode: 401,
      metadata: {
        userId: options.userId,
        action: options.action,
        resource: options.resource,
        ...options.metadata
      }
    });
  }
}

/**
 * Authorization/permission errors
 */
export class AuthorizationError extends ApplicationError {
  constructor(message, options = {}) {
    super(message, {
      ...options,
      code: 'AUTHORIZATION_ERROR',
      statusCode: 403,
      metadata: {
        userId: options.userId,
        role: options.role,
        requiredPermission: options.requiredPermission,
        resource: options.resource,
        ...options.metadata
      }
    });
  }
}

/**
 * Business logic rule violations
 */
export class BusinessRuleError extends ApplicationError {
  constructor(message, rule = null, options = {}) {
    super(message, {
      ...options,
      code: 'BUSINESS_RULE_ERROR',
      statusCode: 422,
      metadata: {
        rule,
        context: options.context,
        ...options.metadata
      }
    });
    
    this.rule = rule;
  }
}

/**
 * External service integration errors
 */
export class ServiceError extends ApplicationError {
  constructor(message, service = null, options = {}) {
    super(message, {
      ...options,
      code: 'SERVICE_ERROR',
      statusCode: options.statusCode || 502,
      metadata: {
        service,
        operation: options.operation,
        endpoint: options.endpoint,
        ...options.metadata
      }
    });
    
    this.service = service;
    this.operation = options.operation;
  }
}

/**
 * Configuration or setup errors
 */
export class ConfigurationError extends ApplicationError {
  constructor(message, configKey = null, options = {}) {
    super(message, {
      ...options,
      code: 'CONFIGURATION_ERROR',
      statusCode: 500,
      metadata: {
        configKey,
        environment: process.env.NODE_ENV,
        ...options.metadata
      }
    });
    
    this.configKey = configKey;
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends ApplicationError {
  constructor(message, resource = null, id = null, options = {}) {
    super(message, {
      ...options,
      code: 'NOT_FOUND_ERROR',
      statusCode: 404,
      metadata: {
        resource,
        id,
        ...options.metadata
      }
    });
    
    this.resource = resource;
    this.id = id;
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends ApplicationError {
  constructor(message, limit = null, options = {}) {
    super(message, {
      ...options,
      code: 'RATE_LIMIT_ERROR',
      statusCode: 429,
      metadata: {
        limit,
        resetTime: options.resetTime,
        ...options.metadata
      }
    });
    
    this.limit = limit;
    this.resetTime = options.resetTime;
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends ApplicationError {
  constructor(message, timeout = null, options = {}) {
    super(message, {
      ...options,
      code: 'TIMEOUT_ERROR',
      statusCode: 408,
      metadata: {
        timeout,
        operation: options.operation,
        ...options.metadata
      }
    });
    
    this.timeout = timeout;
  }
}

/**
 * Error factory functions for common scenarios
 */
export const createValidationError = (field, value, message) => {
  return new ValidationError(message || `Invalid value for field '${field}'`, field, value);
};

export const createNetworkError = (endpoint, statusCode, message) => {
  return new NetworkError(message || `Network request failed`, endpoint, { responseStatus: statusCode });
};

export const createDatabaseError = (operation, message, cause = null) => {
  return new DatabaseError(message || `Database operation failed`, operation, { cause });
};

export const createServiceError = (service, operation, message, cause = null) => {
  return new ServiceError(message || `Service operation failed`, service, { operation, cause });
};

/**
 * Error handler utility for wrapping async operations
 */
export const withErrorHandling = async (operation, errorContext = {}) => {
  try {
    return await operation();
  } catch (error) {
    // If it's already an ApplicationError, preserve it
    if (error instanceof ApplicationError) {
      throw error;
    }
    
    // Otherwise, wrap in generic ApplicationError
    throw new ApplicationError(error.message, {
      cause: error,
      metadata: errorContext
    });
  }
};

/**
 * Express error handler middleware
 */
export const errorHandlerMiddleware = (error, req, res, next) => {
  // If it's an ApplicationError, use its properties
  if (error instanceof ApplicationError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        correlationId: error.correlationId || req.correlationId,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          metadata: error.metadata
        })
      }
    });
  }
  
  // Generic error handling
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: {
      code: 'INTERNAL_ERROR',
      message,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack
      })
    }
  });
};

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
  RateLimitError,
  TimeoutError,
  createValidationError,
  createNetworkError,
  createDatabaseError,
  createServiceError,
  withErrorHandling,
  errorHandlerMiddleware
};
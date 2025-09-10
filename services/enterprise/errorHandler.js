/**
 * Enterprise-Grade Error Handling System
 * Provides comprehensive error handling, logging, and recovery mechanisms
 */

import { logError, logWarn, logInfo } from '../observability/structuredLogger.js';

export class EnterpriseErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.lastErrors = new Map();
    this.circuitBreakers = new Map();
    
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logError('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      });
      
      // Attempt graceful shutdown
      this.gracefulShutdown(error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logError('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        promise: promise.toString(),
        timestamp: new Date().toISOString(),
        severity: 'high'
      });
      
      // Don't exit for promise rejections, just log them
      this.handlePromiseRejection(reason, promise);
    });

    // Handle warnings
    process.on('warning', (warning) => {
      // Filter out known safe warnings
      if (this.isKnownSafeWarning(warning)) {
        return;
      }
      
      logWarn('Process Warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', () => {
      logInfo('Received SIGTERM, initiating graceful shutdown');
      this.gracefulShutdown(null, 'SIGTERM');
    });

    // Handle SIGINT for graceful shutdown
    process.on('SIGINT', () => {
      logInfo('Received SIGINT, initiating graceful shutdown');
      this.gracefulShutdown(null, 'SIGINT');
    });
  }

  isKnownSafeWarning(warning) {
    const safeWarnings = [
      'punycode',
      'ExperimentalWarning',
      'DEP0040' // Node.js deprecation warnings
    ];
    
    return safeWarnings.some(safe => 
      warning.message?.includes(safe) || warning.name?.includes(safe)
    );
  }

  // Express error handling middleware
  expressErrorHandler() {
    return (error, req, res, next) => {
      const correlationId = req.headers['x-correlation-id'] || `error_${Date.now()}`;
      
      logError('Express Error Handler', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        correlationId,
        timestamp: new Date().toISOString()
      });

      // Determine error type and response
      const errorResponse = this.categorizeError(error);
      
      // Track error frequency
      this.trackError(error.message || error.toString());
      
      // Send appropriate response
      if (!res.headersSent) {
        res.status(errorResponse.status).json({
          error: errorResponse.message,
          code: errorResponse.code,
          correlationId,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  categorizeError(error) {
    // Database errors
    if (error.code === 'ECONNREFUSED' || error.message?.includes('database')) {
      return {
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database service temporarily unavailable. Please try again later.'
      };
    }

    // Authentication errors
    if (error.message?.includes('auth') || error.message?.includes('token')) {
      return {
        status: 401,
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication required. Please log in and try again.'
      };
    }

    // Authorization errors
    if (error.message?.includes('permission') || error.message?.includes('access')) {
      return {
        status: 403,
        code: 'ACCESS_DENIED',
        message: 'Insufficient permissions to access this resource.'
      };
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data. Please check your request and try again.'
      };
    }

    // Rate limiting
    if (error.message?.includes('rate') || error.message?.includes('limit')) {
      return {
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down and try again later.'
      };
    }

    // Port binding errors
    if (error.code === 'EADDRINUSE') {
      return {
        status: 500,
        code: 'PORT_IN_USE',
        message: 'Server port is already in use. Please contact system administrator.'
      };
    }

    // Generic server error
    return {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.'
    };
  }

  trackError(errorMessage) {
    const current = this.errorCounts.get(errorMessage) || 0;
    this.errorCounts.set(errorMessage, current + 1);
    this.lastErrors.set(errorMessage, new Date());

    // Check if this error is happening too frequently
    if (current + 1 >= 5) {
      logWarn('High Error Frequency Detected', {
        error: errorMessage,
        count: current + 1,
        lastOccurrence: new Date().toISOString()
      });
    }
  }

  // Circuit breaker pattern for external services
  createCircuitBreaker(serviceName, options = {}) {
    const defaults = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 120000 // 2 minutes
    };
    
    const config = { ...defaults, ...options };
    
    this.circuitBreakers.set(serviceName, {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      lastFailureTime: null,
      config
    });
    
    return {
      call: async (fn) => this.executeWithCircuitBreaker(serviceName, fn),
      getState: () => this.circuitBreakers.get(serviceName)?.state
    };
  }

  async executeWithCircuitBreaker(serviceName, fn) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      throw new Error(`Circuit breaker not found for service: ${serviceName}`);
    }

    // Check circuit breaker state
    if (breaker.state === 'OPEN') {
      if (Date.now() - breaker.lastFailureTime < breaker.config.recoveryTimeout) {
        throw new Error(`Service ${serviceName} is temporarily unavailable (circuit breaker open)`);
      } else {
        // Try half-open state
        breaker.state = 'HALF_OPEN';
        logInfo(`Circuit breaker for ${serviceName} moving to HALF_OPEN state`);
      }
    }

    try {
      const result = await fn();
      
      // Success - reset failure count
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        breaker.failureCount = 0;
        logInfo(`Circuit breaker for ${serviceName} reset to CLOSED state`);
      }
      
      return result;
    } catch (error) {
      // Failure - increment count
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();
      
      if (breaker.failureCount >= breaker.config.failureThreshold) {
        breaker.state = 'OPEN';
        logError(`Circuit breaker for ${serviceName} opened`, {
          failureCount: breaker.failureCount,
          threshold: breaker.config.failureThreshold
        });
      }
      
      throw error;
    }
  }

  // Graceful shutdown handler
  async gracefulShutdown(error = null, signal = null) {
    logInfo('Initiating graceful shutdown', {
      reason: error ? 'error' : signal,
      error: error?.message,
      signal
    });

    try {
      // Give existing requests time to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Close database connections
      if (global.prisma) {
        await global.prisma.$disconnect();
        logInfo('Database connections closed');
      }
      
      // Close any other resources
      // Add your cleanup logic here
      
      logInfo('Graceful shutdown completed');
      process.exit(error ? 1 : 0);
    } catch (shutdownError) {
      logError('Error during graceful shutdown', {
        error: shutdownError.message,
        stack: shutdownError.stack
      });
      process.exit(1);
    }
  }

  handlePromiseRejection(reason, promise) {
    // Log the rejection but don't crash the process
    logError('Promise Rejection Handled', {
      reason: reason?.message || reason,
      promise: promise.toString(),
      handled: true
    });
    
    // You might want to send this to a monitoring service
    this.notifyMonitoringService('promise_rejection', { reason, promise });
  }

  async notifyMonitoringService(type, data) {
    // Implement your monitoring service notification here
    // This could be Sentry, DataDog, New Relic, etc.
    try {
      // Example implementation
      logInfo('Monitoring notification sent', { type, data });
    } catch (error) {
      // Don't let monitoring failures crash the app
      logWarn('Failed to send monitoring notification', { error: error.message });
    }
  }

  // Health check endpoint helper
  getHealthStatus() {
    const now = Date.now();
    const recentErrors = Array.from(this.lastErrors.entries())
      .filter(([_, timestamp]) => now - timestamp.getTime() < 300000) // Last 5 minutes
      .length;

    const circuitBreakerStatus = Array.from(this.circuitBreakers.entries())
      .reduce((acc, [service, breaker]) => {
        acc[service] = breaker.state;
        return acc;
      }, {});

    return {
      status: recentErrors < 10 ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      recentErrors,
      circuitBreakers: circuitBreakerStatus,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  // Async error wrapper for better error boundaries
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Create singleton instance
export const errorHandler = new EnterpriseErrorHandler();

// Export middleware functions
export const expressErrorMiddleware = errorHandler.expressErrorHandler();
export const asyncHandler = errorHandler.asyncHandler.bind(errorHandler);
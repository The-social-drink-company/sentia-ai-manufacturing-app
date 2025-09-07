// Production Error Handler - Enterprise Grade Error Management
import { logError, logWarn, logInfo } from './structuredLogger.js';

class ProductionErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
    this.alertThresholds = {
      critical: 5,    // Alert after 5 critical errors in 5 minutes
      warning: 10,    // Alert after 10 warnings in 10 minutes
      info: 50        // Alert after 50 info messages in 30 minutes
    };
  }

  // Global error handler for unhandled errors
  setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logError('Unhandled Promise Rejection', reason, {
        promise: promise.toString(),
        stack: reason?.stack,
        severity: 'critical'
      });
      
      // Prevent process crash in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unhandled Promise Rejection handled gracefully');
      }
    });

    // Handle uncaught exceptions  
    process.on('uncaughtException', (error) => {
      logError('Uncaught Exception', error, {
        severity: 'critical',
        requiresRestart: true
      });
      
      // Graceful shutdown for production
      if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
          process.exit(1);
        }, 1000);
      }
    });

    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', () => {
      logInfo('SIGTERM received, performing graceful shutdown');
      this.gracefulShutdown();
    });

    // Handle SIGINT (Ctrl+C) for graceful shutdown
    process.on('SIGINT', () => {
      logInfo('SIGINT received, performing graceful shutdown');
      this.gracefulShutdown();
    });
  }

  // Express error middleware
  expressErrorHandler() {
    return (err, req, res, next) => {
      const errorId = this.generateErrorId();
      
      // Log the error with full context
      logError('Express Route Error', err, {
        errorId,
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        body: this.sanitizeRequestBody(req.body),
        headers: this.sanitizeHeaders(req.headers),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });

      // Increment error count for monitoring
      this.incrementErrorCount(err.name || 'Unknown');

      // Determine response based on error type and environment
      if (process.env.NODE_ENV === 'production') {
        // Production: Generic error message
        res.status(err.status || 500).json({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred. Please try again later.',
          errorId,
          timestamp: new Date().toISOString()
        });
      } else {
        // Development: Detailed error information
        res.status(err.status || 500).json({
          error: err.name || 'Error',
          message: err.message,
          stack: err.stack,
          errorId,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // API error wrapper for consistent error handling
  wrapAsyncRoute(fn) {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  // Circuit breaker for external services
  circuitBreaker(serviceName, fn, options = {}) {
    const {
      threshold = 5,
      timeout = 60000,
      resetTimeout = 30000
    } = options;

    return async (...args) => {
      const breaker = this.getOrCreateCircuitBreaker(serviceName, threshold, timeout, resetTimeout);
      
      if (breaker.state === 'open') {
        const error = new Error(`Circuit breaker is open for ${serviceName}`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }

      try {
        const result = await Promise.race([
          fn(...args),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Service timeout')), timeout)
          )
        ]);
        
        breaker.failures = 0;
        breaker.state = 'closed';
        return result;
      } catch (error) {
        breaker.failures++;
        
        if (breaker.failures >= threshold) {
          breaker.state = 'open';
          logWarn(`Circuit breaker opened for ${serviceName}`, {
            serviceName,
            failures: breaker.failures,
            threshold
          });
          
          // Auto-reset after resetTimeout
          setTimeout(() => {
            breaker.state = 'half-open';
            breaker.failures = 0;
            logInfo(`Circuit breaker reset to half-open for ${serviceName}`);
          }, resetTimeout);
        }
        
        throw error;
      }
    };
  }

  // Database error handling
  handleDatabaseError(error, operation, table) {
    const errorContext = {
      operation,
      table,
      errorCode: error.code,
      severity: this.classifyDatabaseError(error)
    };

    logError(`Database Error: ${operation}`, error, errorContext);

    // Return user-friendly error
    if (error.code === 'P2002') {
      return new Error('Duplicate entry: This record already exists');
    }
    
    if (error.code === 'P2025') {
      return new Error('Record not found');
    }
    
    if (error.code === 'P2003') {
      return new Error('Cannot delete: Record is referenced by other data');
    }

    return new Error('Database operation failed');
  }

  // API rate limiting error
  handleRateLimitError(req, res, next) {
    const clientId = req.ip || req.user?.id || 'unknown';
    
    logWarn('Rate limit exceeded', {
      clientId,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: '60'
    });
  }

  // Security error handling
  handleSecurityError(error, req, res, next) {
    logError('Security Violation', error, {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      severity: 'critical',
      securityEvent: true
    });

    res.status(403).json({
      error: 'Access Denied',
      message: 'Security violation detected'
    });
  }

  // Helper methods
  generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'auth'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  incrementErrorCount(errorType) {
    const key = `${errorType}_${Math.floor(Date.now() / 60000)}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    
    // Clean up old entries
    this.cleanupErrorCounts();
  }

  cleanupErrorCounts() {
    const cutoff = Math.floor(Date.now() / 60000) - 30; // Keep 30 minutes of data
    for (const [key] of this.errorCounts) {
      const timestamp = key.split('_').pop();
      if (parseInt(timestamp) < cutoff) {
        this.errorCounts.delete(key);
      }
    }
  }

  getOrCreateCircuitBreaker(serviceName, threshold, timeout, resetTimeout) {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, {
        state: 'closed',
        failures: 0,
        threshold,
        timeout,
        resetTimeout
      });
    }
    return this.circuitBreakers.get(serviceName);
  }

  classifyDatabaseError(error) {
    if (error.code?.startsWith('P2')) return 'warning';
    if (error.message?.includes('connection')) return 'critical';
    if (error.message?.includes('timeout')) return 'warning';
    return 'error';
  }

  gracefulShutdown() {
    logInfo('Starting graceful shutdown...');
    
    // Close database connections, stop intervals, etc.
    setTimeout(() => {
      logInfo('Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  }

  // Health check for error handler
  getHealthStatus() {
    return {
      status: 'healthy',
      errorCounts: Object.fromEntries(this.errorCounts),
      circuitBreakers: Object.fromEntries(
        [...this.circuitBreakers.entries()].map(([name, breaker]) => [
          name,
          { state: breaker.state, failures: breaker.failures }
        ])
      ),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const errorHandler = new ProductionErrorHandler();

// Setup global error handling immediately
errorHandler.setupGlobalErrorHandling();

export default errorHandler;
export { ProductionErrorHandler };
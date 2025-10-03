/**
 * Xero Error Handler
 * 
 * Comprehensive error handling for Xero API operations with retry logic,
 * rate limiting management, and user-friendly error messages.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Xero Error Handler Class
 */
export class XeroErrorHandler {
  constructor(options = {}) {
    this.options = {
      // Retry configuration
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000, // 1 second
      maxDelay: options.maxDelay || 30000, // 30 seconds
      
      // Circuit breaker configuration
      circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: options.circuitBreakerTimeout || 60000, // 1 minute
      
      ...options
    };

    // Track error patterns for circuit breaker
    this.errorCounts = new Map();
    this.circuitState = new Map(); // 'closed', 'open', 'half-open'
    
    logger.info('Xero Error Handler initialized', {
      maxRetries: this.options.maxRetries,
      circuitBreakerThreshold: this.options.circuitBreakerThreshold
    });
  }

  /**
   * Handle and categorize Xero API errors
   */
  handleError(error, context = '', metadata = {}) {
    const errorInfo = this.analyzeError(error);
    const enhancedError = this.createEnhancedError(errorInfo, context, metadata);

    // Log error with appropriate level
    this.logError(enhancedError, errorInfo);

    // Update circuit breaker state
    this.updateCircuitBreaker(context, errorInfo);

    return enhancedError;
  }

  /**
   * Analyze error to determine type, severity, and retry strategy
   */
  analyzeError(error) {
    let errorType = 'UNKNOWN';
    let severity = 'ERROR';
    let isRetryable = false;
    let userMessage = 'An unexpected error occurred';
    let statusCode = null;
    let xeroErrorCode = null;

    // Handle Xero-specific errors
    if (error.response) {
      statusCode = error.response.status;
      
      // Parse Xero error response
      if (error.response.data) {
        const errorData = error.response.data;
        
        if (errorData.Elements && errorData.Elements.length > 0) {
          const firstError = errorData.Elements[0];
          if (firstError.ValidationErrors && firstError.ValidationErrors.length > 0) {
            xeroErrorCode = firstError.ValidationErrors[0].Message;
          }
        }
        
        if (errorData.Message) {
          xeroErrorCode = errorData.Message;
        }
      }

      // Categorize by HTTP status code
      switch (statusCode) {
        case 400:
          errorType = 'BAD_REQUEST';
          severity = 'WARNING';
          userMessage = 'Invalid request parameters';
          break;
          
        case 401:
          errorType = 'UNAUTHORIZED';
          severity = 'ERROR';
          userMessage = 'Authentication failed. Please check your credentials';
          break;
          
        case 403:
          errorType = 'FORBIDDEN';
          severity = 'ERROR';
          userMessage = 'Access denied. Check your permissions';
          break;
          
        case 404:
          errorType = 'NOT_FOUND';
          severity = 'WARNING';
          userMessage = 'Requested resource not found';
          break;
          
        case 429:
          errorType = 'RATE_LIMITED';
          severity = 'WARNING';
          isRetryable = true;
          userMessage = 'Rate limit exceeded. Please try again later';
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = 'SERVER_ERROR';
          severity = 'ERROR';
          isRetryable = true;
          userMessage = 'Xero server error. Please try again';
          break;
          
        default:
          errorType = 'HTTP_ERROR';
          severity = 'ERROR';
          userMessage = `HTTP error ${statusCode}`;
      }
    } else if (error.code) {
      // Handle network and other errors
      switch (error.code) {
        case 'ECONNRESET':
        case 'ENOTFOUND':
        case 'ETIMEDOUT':
          errorType = 'NETWORK_ERROR';
          severity = 'WARNING';
          isRetryable = true;
          userMessage = 'Network connection error. Please check your internet connection';
          break;
          
        case 'ECONNREFUSED':
          errorType = 'CONNECTION_REFUSED';
          severity = 'ERROR';
          isRetryable = true;
          userMessage = 'Unable to connect to Xero services';
          break;
          
        default:
          errorType = 'SYSTEM_ERROR';
          severity = 'ERROR';
          userMessage = 'System error occurred';
      }
    } else if (error.message) {
      // Handle application-level errors
      if (error.message.includes('token')) {
        errorType = 'TOKEN_ERROR';
        severity = 'ERROR';
        userMessage = 'Authentication token error';
      } else if (error.message.includes('validation')) {
        errorType = 'VALIDATION_ERROR';
        severity = 'WARNING';
        userMessage = 'Data validation failed';
      }
    }

    return {
      errorType,
      severity,
      isRetryable,
      userMessage,
      statusCode,
      xeroErrorCode,
      originalMessage: error.message,
      stack: error.stack
    };
  }

  /**
   * Create enhanced error object with additional context
   */
  createEnhancedError(errorInfo, context, metadata) {
    const enhancedError = new Error(errorInfo.userMessage);
    
    enhancedError.type = errorInfo.errorType;
    enhancedError.severity = errorInfo.severity;
    enhancedError.isRetryable = errorInfo.isRetryable;
    enhancedError.context = context;
    enhancedError.statusCode = errorInfo.statusCode;
    enhancedError.xeroErrorCode = errorInfo.xeroErrorCode;
    enhancedError.originalMessage = errorInfo.originalMessage;
    enhancedError.metadata = metadata;
    enhancedError.timestamp = new Date().toISOString();
    
    return enhancedError;
  }

  /**
   * Log error with appropriate level and details
   */
  logError(error, errorInfo) {
    const logData = {
      type: error.type,
      context: error.context,
      statusCode: error.statusCode,
      xeroErrorCode: error.xeroErrorCode,
      metadata: error.metadata,
      originalMessage: errorInfo.originalMessage
    };

    switch (errorInfo.severity) {
      case 'WARNING':
        logger.warn('Xero API warning', logData);
        break;
      case 'ERROR':
        logger.error('Xero API error', logData);
        break;
      default:
        logger.error('Xero API error', logData);
    }
  }

  /**
   * Execute operation with retry logic
   */
  async withRetry(operation, context = '', options = {}) {
    const maxRetries = options.maxRetries || this.options.maxRetries;
    const baseDelay = options.baseDelay || this.options.baseDelay;
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.isCircuitOpen(context)) {
          throw new Error('Circuit breaker is open for this operation');
        }

        const result = await operation();
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker(context);
        
        if (attempt > 0) {
          logger.info('Operation succeeded after retry', {
            context,
            attempt,
            totalAttempts: attempt + 1
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        const errorInfo = this.analyzeError(error);
        
        // Don't retry if error is not retryable
        if (!errorInfo.isRetryable || attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          this.options.maxDelay
        );
        
        logger.warn('Operation failed, retrying', {
          context,
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: errorInfo.errorType
        });
        
        await this.sleep(delay);
      }
    }
    
    // All retries exhausted, throw the last error
    throw this.handleError(lastError, context, { 
      attemptsExhausted: true,
      totalAttempts: maxRetries + 1
    });
  }

  /**
   * Update circuit breaker state based on error patterns
   */
  updateCircuitBreaker(context, errorInfo) {
    if (!errorInfo.isRetryable && errorInfo.severity === 'ERROR') {
      const key = `circuit:${context}`;
      const currentCount = this.errorCounts.get(key) || 0;
      const newCount = currentCount + 1;
      
      this.errorCounts.set(key, newCount);
      
      if (newCount >= this.options.circuitBreakerThreshold) {
        this.circuitState.set(key, {
          state: 'open',
          openedAt: Date.now()
        });
        
        logger.warn('Circuit breaker opened', {
          context,
          errorCount: newCount,
          threshold: this.options.circuitBreakerThreshold
        });
        
        // Schedule automatic reset
        setTimeout(() => {
          this.circuitState.set(key, { state: 'half-open' });
          logger.info('Circuit breaker set to half-open', { context });
        }, this.options.circuitBreakerTimeout);
      }
    }
  }

  /**
   * Check if circuit breaker is open for a context
   */
  isCircuitOpen(context) {
    const key = `circuit:${context}`;
    const circuitInfo = this.circuitState.get(key);
    
    if (!circuitInfo) {
      return false;
    }
    
    return circuitInfo.state === 'open';
  }

  /**
   * Reset circuit breaker on successful operation
   */
  resetCircuitBreaker(context) {
    const key = `circuit:${context}`;
    
    if (this.errorCounts.has(key)) {
      this.errorCounts.delete(key);
    }
    
    if (this.circuitState.has(key)) {
      this.circuitState.delete(key);
      logger.info('Circuit breaker reset', { context });
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      activeCircuits: this.circuitState.size,
      errorCounts: Object.fromEntries(this.errorCounts),
      circuitStates: Object.fromEntries(
        Array.from(this.circuitState.entries()).map(([key, value]) => [
          key, 
          value.state
        ])
      )
    };
    
    return stats;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear error history (useful for testing or manual reset)
   */
  clearErrorHistory() {
    this.errorCounts.clear();
    this.circuitState.clear();
    
    logger.info('Error handler history cleared');
    
    return {
      success: true,
      message: 'Error history cleared'
    };
  }
}
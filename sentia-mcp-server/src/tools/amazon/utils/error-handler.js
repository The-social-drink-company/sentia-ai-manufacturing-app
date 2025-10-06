/**
 * Amazon Error Handler
 * 
 * Comprehensive error handling for Amazon SP-API operations with retry logic,
 * rate limiting management, circuit breaker pattern, and user-friendly error messages.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Error Handler Class
 */
export class AmazonErrorHandler {
  constructor(options = {}) {
    this.options = {
      // Retry configuration
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 2000, // 2 seconds
      maxDelay: options.maxDelay || 30000, // 30 seconds
      
      // Circuit breaker configuration
      circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: options.circuitBreakerTimeout || 60000, // 1 minute
      
      // Rate limiting configuration
      rateLimitBackoff: options.rateLimitBackoff || 5000, // 5 seconds
      rateLimitMaxRetries: options.rateLimitMaxRetries || 5,
      
      ...options
    };

    // Track error patterns for circuit breaker
    this.errorCounts = new Map();
    this.circuitState = new Map(); // 'closed', 'open', 'half-open'
    this.rateLimitState = new Map();
    
    logger.info('Amazon Error Handler initialized', {
      maxRetries: this.options.maxRetries,
      circuitBreakerThreshold: this.options.circuitBreakerThreshold,
      rateLimitBackoff: this.options.rateLimitBackoff
    });
  }

  /**
   * Handle and categorize Amazon SP-API errors
   */
  handleError(error, context = '', metadata = {}) {
    const errorInfo = this.analyzeError(error);
    const enhancedError = this.createEnhancedError(errorInfo, context, metadata);

    // Log error with appropriate level
    this.logError(enhancedError, errorInfo);

    // Update circuit breaker state
    this.updateCircuitBreaker(context, errorInfo);

    // Update rate limit state if applicable
    if (errorInfo.errorType === 'RATE_LIMITED') {
      this.updateRateLimitState(context, error);
    }

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
    let amazonErrorCode = null;
    let retryAfter = null;

    // Handle Amazon SP-API specific errors
    if (error.response) {
      statusCode = error.response.status;
      
      // Parse Amazon error response
      if (error.response.data) {
        const errorData = error.response.data;
        
        // Amazon errors format
        if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            amazonErrorCode = errorData.errors[0]?.code;
            userMessage = errorData.errors[0]?.message || userMessage;
          } else if (typeof errorData.errors === 'object') {
            amazonErrorCode = errorData.errors.code;
            userMessage = errorData.errors.message || userMessage;
          }
        }
      }

      // Extract rate limit headers
      if (error.response.headers) {
        const rateLimitRemaining = error.response.headers['x-amzn-ratelimit-limit'];
        const retryAfterHeader = error.response.headers['retry-after'];
        
        if (retryAfterHeader) {
          retryAfter = parseInt(retryAfterHeader, 10);
        }
      }

      // Categorize by HTTP status code
      switch (statusCode) {
        case 400:
          errorType = 'BAD_REQUEST';
          severity = 'WARNING';
          userMessage = 'Invalid request parameters. Please check your input data.';
          break;
          
        case 401:
          errorType = 'UNAUTHORIZED';
          severity = 'ERROR';
          userMessage = 'Authentication failed. Please check your SP-API credentials.';
          break;
          
        case 403:
          errorType = 'FORBIDDEN';
          severity = 'ERROR';
          userMessage = 'Access denied. Check your SP-API permissions and scopes.';
          break;
          
        case 404:
          errorType = 'NOT_FOUND';
          severity = 'WARNING';
          userMessage = 'Requested resource not found. It may have been deleted or moved.';
          break;
          
        case 413:
          errorType = 'REQUEST_TOO_LARGE';
          severity = 'WARNING';
          userMessage = 'Request payload too large. Try reducing the request size.';
          break;
          
        case 415:
          errorType = 'UNSUPPORTED_MEDIA_TYPE';
          severity = 'WARNING';
          userMessage = 'Unsupported content type. Check request headers.';
          break;
          
        case 429:
          errorType = 'RATE_LIMITED';
          severity = 'WARNING';
          isRetryable = true;
          userMessage = 'Rate limit exceeded. Please wait before making more requests.';
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = 'SERVER_ERROR';
          severity = 'ERROR';
          isRetryable = true;
          userMessage = 'Amazon server error. Please try again in a few moments.';
          break;
          
        default:
          errorType = 'HTTP_ERROR';
          severity = 'ERROR';
          userMessage = `HTTP error ${statusCode}: ${amazonErrorCode || 'Unknown error'}`;
      }
      
    } else if (error.code) {
      // Handle network and other errors
      switch (error.code) {
        case 'ECONNRESET':
        case 'ENOTFOUND':
        case 'ETIMEDOUT':
        case 'ECONNREFUSED':
          errorType = 'NETWORK_ERROR';
          severity = 'WARNING';
          isRetryable = true;
          userMessage = 'Network connection error. Please check your internet connection.';
          break;
          
        case 'CERT_HAS_EXPIRED':
        case 'CERT_UNTRUSTED':
          errorType = 'SSL_ERROR';
          severity = 'ERROR';
          userMessage = 'SSL certificate error. Please check your connection security.';
          break;
          
        default:
          errorType = 'SYSTEM_ERROR';
          severity = 'ERROR';
          userMessage = 'System error occurred. Please try again.';
      }
      
    } else if (error.message) {
      // Handle application-level errors
      if (error.message.includes('timeout')) {
        errorType = 'TIMEOUT_ERROR';
        severity = 'WARNING';
        isRetryable = true;
        userMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('token') || error.message.includes('auth')) {
        errorType = 'AUTH_ERROR';
        severity = 'ERROR';
        userMessage = 'Authentication error. Please check your credentials.';
      } else if (error.message.includes('validation')) {
        errorType = 'VALIDATION_ERROR';
        severity = 'WARNING';
        userMessage = 'Data validation failed. Please check your input.';
      }
    }

    return {
      errorType,
      severity,
      isRetryable,
      userMessage,
      statusCode,
      amazonErrorCode,
      retryAfter,
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
    enhancedError.amazonErrorCode = errorInfo.amazonErrorCode;
    enhancedError.retryAfter = errorInfo.retryAfter;
    enhancedError.originalMessage = errorInfo.originalMessage;
    enhancedError.metadata = metadata;
    enhancedError.timestamp = new Date().toISOString();
    
    return enhancedError;
  }

  /**
   * Execute operation with retry logic and rate limiting
   */
  async withRetry(operation, context = '', options = {}) {
    const maxRetries = options.maxRetries || this.options.maxRetries;
    const baseDelay = options.baseDelay || this.options.baseDelay;
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.isCircuitOpen(context)) {
          throw new Error(`Circuit breaker is open for operation: ${context}`);
        }

        // Check rate limiting
        const rateLimitDelay = this.getRateLimitDelay(context);
        if (rateLimitDelay > 0) {
          logger.info('Rate limit backoff', { context, delay: rateLimitDelay });
          await this.sleep(rateLimitDelay);
        }

        const result = await operation();
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker(context);
        
        // Reset rate limit state on success
        this.resetRateLimitState(context);
        
        if (attempt > 0) {
          logger.info('Amazon operation succeeded after retry', {
            context,
            attempt,
            totalAttempts: attempt + 1
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        const errorInfo = this.analyzeError(error);
        
        // Handle rate limiting specifically
        if (errorInfo.errorType === 'RATE_LIMITED') {
          const rateLimitDelay = errorInfo.retryAfter 
            ? errorInfo.retryAfter * 1000 
            : this.options.rateLimitBackoff * Math.pow(2, attempt);
            
          if (attempt < this.options.rateLimitMaxRetries) {
            logger.warn('Rate limited, retrying with backoff', {
              context,
              attempt: attempt + 1,
              delay: rateLimitDelay,
              retryAfter: errorInfo.retryAfter
            });
            
            await this.sleep(rateLimitDelay);
            continue;
          }
        }
        
        // Don't retry if error is not retryable or max retries reached
        if (!errorInfo.isRetryable || attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          this.options.maxDelay
        );
        
        logger.warn('Amazon operation failed, retrying', {
          context,
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: errorInfo.errorType,
          message: errorInfo.userMessage
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
   * Log error with appropriate level and details
   */
  logError(error, errorInfo) {
    const logData = {
      type: error.type,
      context: error.context,
      statusCode: error.statusCode,
      amazonErrorCode: error.amazonErrorCode,
      metadata: error.metadata,
      originalMessage: errorInfo.originalMessage
    };

    switch (errorInfo.severity) {
      case 'WARNING':
        logger.warn('Amazon SP-API warning', logData);
        break;
      case 'ERROR':
        logger.error('Amazon SP-API error', logData);
        break;
      default:
        logger.error('Amazon SP-API error', logData);
    }
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
        
        logger.warn('Amazon circuit breaker opened', {
          context,
          errorCount: newCount,
          threshold: this.options.circuitBreakerThreshold
        });
        
        // Schedule automatic reset
        setTimeout(() => {
          this.circuitState.set(key, { state: 'half-open' });
          logger.info('Amazon circuit breaker set to half-open', { context });
        }, this.options.circuitBreakerTimeout);
      }
    }
  }

  /**
   * Update rate limit state
   */
  updateRateLimitState(context, error) {
    const key = `rate_limit:${context}`;
    const now = Date.now();
    
    // Extract rate limit info from headers if available
    let rateLimitInfo = { lastHit: now, hitCount: 1 };
    
    if (error.response?.headers) {
      const rateLimitRemaining = error.response.headers['x-amzn-ratelimit-limit'];
      const retryAfter = error.response.headers['retry-after'];
      
      rateLimitInfo.rateLimitRemaining = rateLimitRemaining;
      rateLimitInfo.retryAfter = retryAfter ? parseInt(retryAfter, 10) : null;
    }
    
    this.rateLimitState.set(key, rateLimitInfo);
  }

  /**
   * Get rate limit delay for context
   */
  getRateLimitDelay(context) {
    const key = `rate_limit:${context}`;
    const rateLimitInfo = this.rateLimitState.get(key);
    
    if (!rateLimitInfo) {
      return 0;
    }
    
    const now = Date.now();
    const timeSinceLastHit = now - rateLimitInfo.lastHit;
    
    // If we have a specific retry-after value, use it
    if (rateLimitInfo.retryAfter) {
      const retryAfterMs = rateLimitInfo.retryAfter * 1000;
      return Math.max(0, retryAfterMs - timeSinceLastHit);
    }
    
    // Otherwise use standard backoff
    const backoffPeriod = this.options.rateLimitBackoff;
    return Math.max(0, backoffPeriod - timeSinceLastHit);
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
      logger.info('Amazon circuit breaker reset', { context });
    }
  }

  /**
   * Reset rate limit state on successful operation
   */
  resetRateLimitState(context) {
    const key = `rate_limit:${context}`;
    
    if (this.rateLimitState.has(key)) {
      this.rateLimitState.delete(key);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      activeCircuits: this.circuitState.size,
      activateRateLimits: this.rateLimitState.size,
      errorCounts: Object.fromEntries(this.errorCounts),
      circuitStates: Object.fromEntries(
        Array.from(this.circuitState.entries()).map(([key, value]) => [
          key, 
          value.state
        ])
      ),
      rateLimitStates: Object.fromEntries(this.rateLimitState)
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
    this.rateLimitState.clear();
    
    logger.info('Amazon error handler history cleared');
    
    return {
      success: true,
      message: 'Error history cleared'
    };
  }

  /**
   * Get recommended action for error type
   */
  getRecommendedAction(errorType) {
    const recommendations = {
      'BAD_REQUEST': 'Review and correct the request parameters',
      'UNAUTHORIZED': 'Check SP-API credentials and refresh tokens if needed',
      'FORBIDDEN': 'Verify SP-API permissions and scopes',
      'NOT_FOUND': 'Ensure the resource exists and the ID is correct',
      'REQUEST_TOO_LARGE': 'Reduce request payload size',
      'RATE_LIMITED': 'Implement request throttling and respect rate limits',
      'SERVER_ERROR': 'Retry the request after a short delay',
      'NETWORK_ERROR': 'Check network connectivity and DNS resolution',
      'TIMEOUT_ERROR': 'Increase timeout values or retry with backoff'
    };

    return recommendations[errorType] || 'Contact support if the issue persists';
  }

  /**
   * Format error for user display
   */
  formatUserError(error) {
    return {
      message: error.message,
      type: error.type,
      recommendation: this.getRecommendedAction(error.type),
      timestamp: error.timestamp,
      canRetry: error.isRetryable,
      statusCode: error.statusCode
    };
  }
}
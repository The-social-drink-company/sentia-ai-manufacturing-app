/**
 * Unleashed Error Handler Utility
 * 
 * Comprehensive error handling and recovery for Unleashed API operations.
 * Provides error classification, retry strategies, and graceful degradation.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class UnleashedErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.errorCounts = new Map();
    this.errorClassifications = new Map();
    this.recoveryStrategies = new Map();
    
    logger.info('Unleashed Error Handler initialized');
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Error Handler...');
      
      this.setupErrorClassifications();
      this.setupRecoveryStrategies();
      this.initializeErrorTracking();
      
      this.isInitialized = true;
      logger.info('Error Handler initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Error Handler', { error: error.message });
      throw error;
    }
  }

  setupErrorClassifications() {
    // HTTP Error Classifications
    this.errorClassifications.set('400', {
      type: 'client_error',
      severity: 'medium',
      retryable: false,
      description: 'Bad Request - Invalid parameters'
    });
    
    this.errorClassifications.set('401', {
      type: 'authentication_error',
      severity: 'high',
      retryable: false,
      description: 'Unauthorized - Invalid credentials'
    });
    
    this.errorClassifications.set('403', {
      type: 'authorization_error',
      severity: 'high',
      retryable: false,
      description: 'Forbidden - Insufficient permissions'
    });
    
    this.errorClassifications.set('404', {
      type: 'not_found_error',
      severity: 'medium',
      retryable: false,
      description: 'Resource not found'
    });
    
    this.errorClassifications.set('422', {
      type: 'validation_error',
      severity: 'medium',
      retryable: false,
      description: 'Unprocessable Entity - Validation failed'
    });
    
    this.errorClassifications.set('429', {
      type: 'rate_limit_error',
      severity: 'medium',
      retryable: true,
      description: 'Rate limit exceeded'
    });
    
    this.errorClassifications.set('500', {
      type: 'server_error',
      severity: 'high',
      retryable: true,
      description: 'Internal server error'
    });
    
    this.errorClassifications.set('502', {
      type: 'server_error',
      severity: 'high',
      retryable: true,
      description: 'Bad Gateway'
    });
    
    this.errorClassifications.set('503', {
      type: 'server_error',
      severity: 'high',
      retryable: true,
      description: 'Service Unavailable'
    });
    
    this.errorClassifications.set('504', {
      type: 'timeout_error',
      severity: 'medium',
      retryable: true,
      description: 'Gateway Timeout'
    });
    
    // Network Error Classifications
    this.errorClassifications.set('ECONNABORTED', {
      type: 'timeout_error',
      severity: 'medium',
      retryable: true,
      description: 'Request timeout'
    });
    
    this.errorClassifications.set('ENOTFOUND', {
      type: 'network_error',
      severity: 'high',
      retryable: true,
      description: 'DNS resolution failed'
    });
    
    this.errorClassifications.set('ECONNREFUSED', {
      type: 'network_error',
      severity: 'high',
      retryable: true,
      description: 'Connection refused'
    });
    
    logger.info('Error classifications loaded', {
      classificationsCount: this.errorClassifications.size
    });
  }

  setupRecoveryStrategies() {
    this.recoveryStrategies.set('rate_limit_error', {
      strategy: 'backoff_retry',
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 10000,
      action: 'Wait and retry with exponential backoff'
    });
    
    this.recoveryStrategies.set('server_error', {
      strategy: 'retry_with_fallback',
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      action: 'Retry with fallback to cached data'
    });
    
    this.recoveryStrategies.set('timeout_error', {
      strategy: 'retry_with_timeout',
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 3000,
      action: 'Retry with increased timeout'
    });
    
    this.recoveryStrategies.set('network_error', {
      strategy: 'retry_with_circuit_breaker',
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      action: 'Retry with circuit breaker protection'
    });
    
    this.recoveryStrategies.set('authentication_error', {
      strategy: 'refresh_credentials',
      maxRetries: 1,
      baseDelay: 0,
      maxDelay: 0,
      action: 'Refresh authentication credentials'
    });
    
    logger.info('Recovery strategies loaded', {
      strategiesCount: this.recoveryStrategies.size
    });
  }

  initializeErrorTracking() {
    this.errorCounts.set('total', 0);
    this.errorCounts.set('by_type', new Map());
    this.errorCounts.set('by_endpoint', new Map());
    this.errorCounts.set('by_hour', new Map());
    
    logger.info('Error tracking initialized');
  }

  handleError(error, context = {}) {
    try {
      const { endpoint, operation, attempt = 1 } = context;
      
      // Classify the error
      const classification = this.classifyError(error);
      
      // Track the error
      this.trackError(error, classification, endpoint);
      
      // Create standardized error response
      const standardError = this.createStandardError(error, classification, context);
      
      // Log the error with appropriate level
      this.logError(standardError, classification, context);
      
      // Determine recovery strategy
      const recoveryStrategy = this.getRecoveryStrategy(classification);
      
      logger.debug('Error handled', {
        type: classification.type,
        severity: classification.severity,
        retryable: classification.retryable,
        endpoint,
        attempt
      });
      
      return {
        error: standardError,
        classification,
        recoveryStrategy,
        shouldRetry: classification.retryable && attempt < (recoveryStrategy?.maxRetries || 0),
        nextRetryDelay: this.calculateRetryDelay(recoveryStrategy, attempt)
      };

    } catch (handlerError) {
      logger.error('Error handler failed', {
        originalError: error.message,
        handlerError: handlerError.message
      });
      
      // Return minimal error info if handler fails
      return {
        error: new Error('Error handling failed'),
        classification: { type: 'unknown', severity: 'high', retryable: false },
        recoveryStrategy: null,
        shouldRetry: false,
        nextRetryDelay: 0
      };
    }
  }

  classifyError(error) {
    let errorKey = 'unknown';
    
    // Determine error key for classification
    if (error.response && error.response.status) {
      errorKey = error.response.status.toString();
    } else if (error.code) {
      errorKey = error.code;
    } else if (error.message) {
      // Try to match common error patterns
      if (error.message.includes('timeout')) {
        errorKey = 'ECONNABORTED';
      } else if (error.message.includes('ENOTFOUND')) {
        errorKey = 'ENOTFOUND';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorKey = 'ECONNREFUSED';
      }
    }
    
    const classification = this.errorClassifications.get(errorKey) || {
      type: 'unknown_error',
      severity: 'medium',
      retryable: false,
      description: 'Unknown error type'
    };
    
    return {
      ...classification,
      errorKey,
      originalError: error
    };
  }

  trackError(error, classification, endpoint) {
    try {
      // Increment total error count
      const total = this.errorCounts.get('total') || 0;
      this.errorCounts.set('total', total + 1);
      
      // Track by error type
      const byType = this.errorCounts.get('by_type');
      const typeCount = byType.get(classification.type) || 0;
      byType.set(classification.type, typeCount + 1);
      
      // Track by endpoint
      if (endpoint) {
        const byEndpoint = this.errorCounts.get('by_endpoint');
        const endpointCount = byEndpoint.get(endpoint) || 0;
        byEndpoint.set(endpoint, endpointCount + 1);
      }
      
      // Track by hour for trend analysis
      const currentHour = new Date().getHours();
      const byHour = this.errorCounts.get('by_hour');
      const hourCount = byHour.get(currentHour) || 0;
      byHour.set(currentHour, hourCount + 1);
      
    } catch (trackingError) {
      logger.error('Error tracking failed', { error: trackingError.message });
    }
  }

  createStandardError(originalError, classification, context) {
    const standardError = new Error(classification.description);
    
    standardError.type = classification.type;
    standardError.severity = classification.severity;
    standardError.retryable = classification.retryable;
    standardError.code = classification.errorKey;
    standardError.context = context;
    standardError.timestamp = new Date().toISOString();
    standardError.originalError = originalError;
    
    // Preserve important properties from original error
    if (originalError.response) {
      standardError.status = originalError.response.status;
      standardError.statusText = originalError.response.statusText;
      standardError.data = originalError.response.data;
    }
    
    return standardError;
  }

  logError(error, classification, context) {
    const logData = {
      type: classification.type,
      severity: classification.severity,
      code: error.code,
      message: error.message,
      endpoint: context.endpoint,
      operation: context.operation,
      attempt: context.attempt,
      timestamp: error.timestamp
    };
    
    switch (classification.severity) {
      case 'high':
        logger.error('High severity error', logData);
        break;
      case 'medium':
        logger.warn('Medium severity error', logData);
        break;
      case 'low':
        logger.info('Low severity error', logData);
        break;
      default:
        logger.debug('Error logged', logData);
    }
  }

  getRecoveryStrategy(classification) {
    return this.recoveryStrategies.get(classification.type) || {
      strategy: 'no_retry',
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      action: 'No recovery action available'
    };
  }

  calculateRetryDelay(strategy, attempt) {
    if (!strategy || strategy.maxRetries === 0) {
      return 0;
    }
    
    const exponentialDelay = strategy.baseDelay * Math.pow(2, attempt - 1);
    const jitteredDelay = exponentialDelay + (Math.random() * 1000); // Add jitter
    
    return Math.min(jitteredDelay, strategy.maxDelay);
  }

  shouldUseCircuitBreaker(endpoint, errorType) {
    const endpointErrors = this.errorCounts.get('by_endpoint');
    const recentErrors = endpointErrors.get(endpoint) || 0;
    
    // Open circuit breaker if too many errors for this endpoint
    const errorThreshold = 10; // Configurable threshold
    return recentErrors >= errorThreshold;
  }

  createFallbackResponse(operation, error) {
    const fallbackResponse = {
      success: false,
      error: 'Service temporarily unavailable',
      fallback: true,
      data: null,
      message: `${operation} failed, using fallback response`,
      timestamp: new Date().toISOString()
    };
    
    // Provide operation-specific fallback data
    switch (operation) {
      case 'get-products':
        fallbackResponse.data = { products: [], summary: { totalProducts: 0 } };
        break;
      case 'get-inventory':
        fallbackResponse.data = { inventory: [], summary: { totalItems: 0 } };
        break;
      case 'get-orders':
        fallbackResponse.data = { orders: [], summary: { totalOrders: 0 } };
        break;
      default:
        fallbackResponse.data = { items: [], summary: { total: 0 } };
    }
    
    logger.info('Fallback response created', {
      operation,
      error: error.message
    });
    
    return fallbackResponse;
  }

  getErrorStats() {
    return {
      total: this.errorCounts.get('total') || 0,
      byType: Object.fromEntries(this.errorCounts.get('by_type')),
      byEndpoint: Object.fromEntries(this.errorCounts.get('by_endpoint')),
      byHour: Object.fromEntries(this.errorCounts.get('by_hour')),
      topErrors: this.getTopErrors(),
      errorRate: this.calculateErrorRate()
    };
  }

  getTopErrors() {
    const byType = this.errorCounts.get('by_type');
    return Array.from(byType.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  calculateErrorRate() {
    const total = this.errorCounts.get('total') || 0;
    const timeWindow = 3600; // 1 hour in seconds
    return total / timeWindow; // Errors per second
  }

  resetErrorCounts() {
    this.errorCounts.get('by_type').clear();
    this.errorCounts.get('by_endpoint').clear();
    this.errorCounts.get('by_hour').clear();
    this.errorCounts.set('total', 0);
    
    logger.info('Error counts reset');
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      totalErrors: this.errorCounts.get('total') || 0,
      errorTypes: this.errorCounts.get('by_type').size,
      trackedEndpoints: this.errorCounts.get('by_endpoint').size,
      classificationsLoaded: this.errorClassifications.size,
      strategiesLoaded: this.recoveryStrategies.size
    };
  }

  async cleanup() {
    try {
      logger.info('Cleaning up Error Handler...');
      
      this.errorCounts.clear();
      this.errorClassifications.clear();
      this.recoveryStrategies.clear();
      this.isInitialized = false;
      
      logger.info('Error Handler cleanup completed');
      
    } catch (error) {
      logger.error('Error during Error Handler cleanup', { error: error.message });
    }
  }
}
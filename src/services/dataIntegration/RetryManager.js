import { devLog } from '../lib/devLog.js';\n// Advanced Retry Management System with Exponential Backoff
// Handles transient failures with intelligent retry strategies

export class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.backoffFactor = options.backoffFactor || 2;
    this.jitter = options.jitter !== false; // Add randomness by default
    this.retryCondition = options.retryCondition || this.defaultRetryCondition;
    
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      maxRetriesReached: 0
    };
  }
  
  // Main retry execution method
  async execute(fn, context = {}) {
    const startTime = Date.now();
    let lastError = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      this.stats.totalAttempts++;
      
      try {
        const result = await fn();
        
        if (attempt > 0) {
          this.stats.successfulRetries++;
          this.logRetrySuccess(attempt, context, Date.now() - startTime);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (!this.retryCondition(error, attempt)) {
          this.logRetrySkipped(error, attempt, context);
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.maxRetries) {
          this.stats.maxRetriesReached++;
          this.stats.failedRetries++;
          this.logRetryExhausted(error, attempt, context);
          throw this.createRetryExhaustedError(error, attempt);
        }
        
        // Calculate delay and wait
        const delay = this.calculateDelay(attempt);
        this.logRetryAttempt(error, attempt, delay, context);
        
        await this.delay(delay);
      }
    }
    
    // This should never be reached, but just in case
    throw lastError;
  }
  
  // Default retry condition - retry on network/server errors
  defaultRetryCondition(error, attemptNumber) {
    // Don't retry on client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    
    // Don't retry on authentication/authorization errors
    if (error.status === 401 || error.status === 403) {
      return false;
    }
    
    // Retry on server errors (5xx)
    if (error.status >= 500) {
      return true;
    }
    
    // Retry on network errors
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
      return true;
    }
    
    // Retry on timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return true;
    }
    
    // Retry on connection errors
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('Network request failed')) {
      return true;
    }
    
    // Don't retry by default
    return false;
  }
  
  // Calculate retry delay with exponential backoff
  calculateDelay(attemptNumber) {
    let delay = this.baseDelay * Math.pow(this.backoffFactor, attemptNumber);
    
    // Cap the maximum delay
    delay = Math.min(delay, this.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (this.jitter) {
      delay = delay * (0.5 + 0 /* REAL DATA REQUIRED */ * 0.5);
    }
    
    return Math.round(delay);
  }
  
  // Promise-based delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Create retry exhausted error
  createRetryExhaustedError(originalError, attempts) {
    const error = new Error(
      `Request failed after ${attempts} attempts: ${originalError.message}`
    );
    error.name = 'RetryExhaustedError';
    error.originalError = originalError;
    error.attempts = attempts;
    return error;
  }
  
  // Logging methods
  logRetryAttempt(error, attempt, delay, context) {
    if (typeof console !== 'undefined') {
      devLog.warn(`[RetryManager] Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        error: error.message,
        context,
        status: error.status
      });
    }
  }
  
  logRetrySuccess(attempts, context, totalTime) {
    if (typeof console !== 'undefined') {
      devLog.log(`[RetryManager] Success after ${attempts} retries in ${totalTime}ms`, {
        context
      });
    }
  }
  
  logRetrySkipped(error, attempt, context) {
    if (typeof console !== 'undefined') {
      devLog.log(`[RetryManager] Not retrying error at attempt ${attempt + 1}`, {
        error: error.message,
        context,
        status: error.status
      });
    }
  }
  
  logRetryExhausted(error, attempts, context) {
    if (typeof console !== 'undefined') {
      devLog.error(`[RetryManager] All ${attempts + 1} attempts failed`, {
        error: error.message,
        context,
        status: error.status
      });
    }
  }
  
  // Conditional retry with custom condition
  async retryIf(fn, condition, options = {}) {
    const originalCondition = this.retryCondition;
    this.retryCondition = condition;
    
    try {
      return await this.execute(fn, options.context);
    } finally {
      this.retryCondition = originalCondition;
    }
  }
  
  // Retry with custom configuration
  async retryWith(fn, config = {}, context = {}) {
    const manager = new RetryManager({
      ...config,
      maxRetries: config.maxRetries ?? this.maxRetries,
      baseDelay: config.baseDelay ?? this.baseDelay,
      maxDelay: config.maxDelay ?? this.maxDelay,
      backoffFactor: config.backoffFactor ?? this.backoffFactor,
      jitter: config.jitter ?? this.jitter,
      retryCondition: config.retryCondition ?? this.retryCondition
    });
    
    return manager.execute(fn, context);
  }
  
  // Utility methods for common retry scenarios
  
  // Retry only network errors
  async retryNetworkErrors(fn, context = {}) {
    return this.retryIf(fn, (error) => {
      return error.name === 'TypeError' || 
             error.name === 'NetworkError' ||
             error.message?.includes('Failed to fetch') ||
             error.message?.includes('Network request failed');
    }, { context });
  }
  
  // Retry only server errors (5xx)
  async retryServerErrors(fn, context = {}) {
    return this.retryIf(fn, (error) => {
      return error.status >= 500;
    }, { context });
  }
  
  // Retry with linear backoff instead of exponential
  async retryLinear(fn, context = {}) {
    return this.retryWith(fn, {
      backoffFactor: 1 // Linear backoff
    }, context);
  }
  
  // Retry immediately (no delay)
  async retryImmediate(fn, context = {}) {
    return this.retryWith(fn, {
      baseDelay: 0,
      jitter: false
    }, context);
  }
  
  // Get retry statistics
  getStats() {
    const totalRetryAttempts = this.stats.successfulRetries + this.stats.failedRetries;
    
    return {
      ...this.stats,
      retryRate: this.stats.totalAttempts > 0 ? 
        (totalRetryAttempts / this.stats.totalAttempts * 100).toFixed(2) : 0,
      successRate: totalRetryAttempts > 0 ? 
        (this.stats.successfulRetries / totalRetryAttempts * 100).toFixed(2) : 0,
      configuration: {
        maxRetries: this.maxRetries,
        baseDelay: this.baseDelay,
        maxDelay: this.maxDelay,
        backoffFactor: this.backoffFactor,
        jitter: this.jitter
      }
    };
  }
  
  // Reset statistics
  resetStats() {
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      maxRetriesReached: 0
    };
  }
  
  // Create specialized retry managers for common scenarios
  static createNetworkRetryManager(options = {}) {
    return new RetryManager({
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 1.5,
      retryCondition: (error) => {
        return error.name === 'TypeError' || 
               error.name === 'NetworkError' ||
               error.message?.includes('Failed to fetch') ||
               error.message?.includes('Network request failed') ||
               error.message?.includes('timeout');
      },
      ...options
    });
  }
  
  static createServerErrorRetryManager(options = {}) {
    return new RetryManager({
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryCondition: (error) => {
        return error.status >= 500;
      },
      ...options
    });
  }
  
  static createAggressiveRetryManager(options = {}) {
    return new RetryManager({
      maxRetries: 10,
      baseDelay: 500,
      maxDelay: 5000,
      backoffFactor: 1.2,
      jitter: true,
      ...options
    });
  }
  
  static createConservativeRetryManager(options = {}) {
    return new RetryManager({
      maxRetries: 2,
      baseDelay: 5000,
      maxDelay: 60000,
      backoffFactor: 3,
      jitter: false,
      ...options
    });
  }
}

export default RetryManager;
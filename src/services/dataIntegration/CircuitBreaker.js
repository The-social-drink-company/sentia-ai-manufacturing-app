import { devLog } from '../lib/devLog.js';\n// Circuit Breaker Pattern Implementation for API Resilience
// Prevents cascade failures and provides fallback mechanisms

export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 30000; // 30 seconds
    this.monitoringPeriod = options.monitoringPeriod || 60000; // 1 minute
    this.fallbackFunction = options.fallback;
    
    // Circuit states: CLOSED, OPEN, HALF_OPEN
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttempt = null;
    
    // Request tracking
    this.requests = [];
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpenCount: 0,
      fallbackExecutions: 0
    };
    
    // Start monitoring
    this.monitoringInterval = setInterval(() => {
      this.cleanOldRequests();
      this.evaluateCircuit();
    }, this.monitoringPeriod / 4); // Check 4 times per monitoring period
  }
  
  // Execute function with circuit breaker protection
  async execute(fn, context = 'unknown') {
    this.stats.totalRequests++;
    
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        // Move to half-open state
        this.state = 'HALF_OPEN';
        this.logStateChange('HALF_OPEN', context);
      } else {
        // Circuit is still open, execute fallback
        return this.executeFallback(context, new Error('Circuit breaker is OPEN'));
      }
    }
    
    try {
      const startTime = Date.now();
      const result = await fn();
      const endTime = Date.now();
      
      this.recordSuccess(endTime - startTime);
      
      // If we're in half-open state and succeeded, close the circuit
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.logStateChange('CLOSED', context);
      }
      
      return result;
      
    } catch (error) {
      this.recordFailure(error);
      
      // Check if we should open the circuit
      if (this.shouldOpenCircuit()) {
        this.openCircuit();
        this.logStateChange('OPEN', context);
      }
      
      // In half-open state, single failure reopens circuit
      if (this.state === 'HALF_OPEN') {
        this.openCircuit();
        this.logStateChange('OPEN', context);
      }
      
      // Try fallback or rethrow error
      if (this.fallbackFunction) {
        return this.executeFallback(context, error);
      }
      
      throw error;
    }
  }
  
  // Record successful request
  recordSuccess(responseTime) {
    this.successCount++;
    this.lastSuccessTime = Date.now();
    this.stats.successfulRequests++;
    
    this.requests.push({
      timestamp: Date.now(),
      success: true,
      responseTime
    });
  }
  
  // Record failed request
  recordFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.stats.failedRequests++;
    
    this.requests.push({
      timestamp: Date.now(),
      success: false,
      error: error.message
    });
  }
  
  // Determine if circuit should be opened
  shouldOpenCircuit() {
    const recentRequests = this.getRecentRequests();
    const recentFailures = recentRequests.filter(req => !req.success);
    
    // Need minimum number of requests before opening
    if (recentRequests.length < this.failureThreshold) {
      return false;
    }
    
    // Open if failure rate exceeds threshold
    const failureRate = recentFailures.length / recentRequests.length;
    return failureRate >= 0.5 && recentFailures.length >= this.failureThreshold;
  }
  
  // Open the circuit
  openCircuit() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.recoveryTimeout;
    this.stats.circuitOpenCount++;
  }
  
  // Execute fallback function
  async executeFallback(context, error) {
    this.stats.fallbackExecutions++;
    
    if (this.fallbackFunction) {
      try {
        return await this.fallbackFunction(error, context);
      } catch (fallbackError) {
        throw new Error(`Both primary and fallback failed: ${error.message} | ${fallbackError.message}`);
      }
    }
    
    // Default fallback
    throw new Error(`Service unavailable (${context}): ${error.message}`);
  }
  
  // Get requests within monitoring period
  getRecentRequests() {
    const cutoff = Date.now() - this.monitoringPeriod;
    return this.requests.filter(req => req.timestamp >= cutoff);
  }
  
  // Clean up old request records
  cleanOldRequests() {
    const cutoff = Date.now() - this.monitoringPeriod * 2; // Keep double period for analysis
    this.requests = this.requests.filter(req => req.timestamp >= cutoff);
  }
  
  // Evaluate circuit health and state transitions
  evaluateCircuit() {
    const recentRequests = this.getRecentRequests();
    
    if (recentRequests.length === 0) {
      return; // No recent activity
    }
    
    const recentSuccesses = recentRequests.filter(req => req.success);
    const successRate = recentSuccesses.length / recentRequests.length;
    
    // Auto-recover from OPEN to HALF_OPEN if recovery timeout passed
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN';
      this.logStateChange('HALF_OPEN', 'auto-recovery');
    }
    
    // Auto-close circuit if recent success rate is good
    if (this.state === 'CLOSED' && recentRequests.length >= 10) {
      if (successRate < 0.3) { // Less than 30% success
        // Consider opening circuit on next failure
      }
    }
  }
  
  // Log state changes
  logStateChange(newState, context) {
    const timestamp = new Date().toISOString();
    
    if (typeof console !== 'undefined') {
      devLog.log(`[CircuitBreaker] ${timestamp} - State changed to ${newState} (context: ${context})`);
    }
  }
  
  // Get current circuit breaker status
  getStatus() {
    const recentRequests = this.getRecentRequests();
    const recentSuccesses = recentRequests.filter(req => req.success);
    const recentFailures = recentRequests.filter(req => !req.success);
    
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttempt: this.nextAttempt,
      recentRequestCount: recentRequests.length,
      recentSuccessCount: recentSuccesses.length,
      recentFailureCount: recentFailures.length,
      recentSuccessRate: recentRequests.length > 0 ? 
        (recentSuccesses.length / recentRequests.length * 100).toFixed(2) : 0,
      stats: this.stats,
      configuration: {
        failureThreshold: this.failureThreshold,
        recoveryTimeout: this.recoveryTimeout,
        monitoringPeriod: this.monitoringPeriod
      }
    };
  }
  
  // Get detailed metrics
  getMetrics() {
    const recentRequests = this.getRecentRequests();
    const successfulRequests = recentRequests.filter(req => req.success);
    
    const avgResponseTime = successfulRequests.length > 0 ?
      successfulRequests.reduce((sum, req) => sum + (req.responseTime || 0), 0) / successfulRequests.length : 0;
    
    return {
      ...this.getStatus(),
      averageResponseTime: Math.round(avgResponseTime),
      requestHistory: recentRequests.slice(-20), // Last 20 requests
      uptime: this.stats.totalRequests > 0 ? 
        (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 100
    };
  }
  
  // Force state change (for testing)
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    if (newState === 'OPEN') {
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    } else if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.nextAttempt = null;
    }
    
    this.logStateChange(newState, `manual change from ${oldState}`);
  }
  
  // Reset circuit breaker
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttempt = null;
    this.requests = [];
    
    // Reset stats but keep configuration
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpenCount: 0,
      fallbackExecutions: 0
    };
    
    this.logStateChange('CLOSED', 'manual reset');
  }
  
  // Cleanup and destroy
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export default CircuitBreaker;
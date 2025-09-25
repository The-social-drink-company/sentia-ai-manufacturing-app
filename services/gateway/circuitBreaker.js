import EventEmitter from 'events';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


/**
 * Circuit Breaker Pattern Implementation
 * 
 * Provides fault tolerance and resilience for microservices by preventing
 * cascading failures and allowing services to recover gracefully.
 */
export class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.name = options.name || 'CircuitBreaker';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    
    // Circuit breaker states
    this.states = {
      CLOSED: 'CLOSED',
      OPEN: 'OPEN',
      HALF_OPEN: 'HALF_OPEN'
    };
    
    this.state = this.states.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    this.halfOpenCalls = 0;
    
    // Statistics
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      timeouts: 0,
      circuitOpenedCount: 0,
      lastStateChange: Date.now(),
      stateHistory: []
    };
    
    // Sliding window for failure rate calculation
    this.callHistory = [];
    this.maxHistorySize = 100;
    
    this.startMonitoring();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute(fn, ...args) {
    return new Promise((resolve, reject) => {
      if (this.isOpen()) {
        const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        this.emit('callRejected', { name: this.name, reason: 'circuit_open' });
        return reject(error);
      }

      if (this.isHalfOpen() && this.halfOpenCalls >= this.halfOpenMaxCalls) {
        const error = new Error(`Circuit breaker is HALF_OPEN and max calls exceeded for ${this.name}`);
        error.code = 'CIRCUIT_BREAKER_HALF_OPEN_LIMIT';
        this.emit('callRejected', { name: this.name, reason: 'half_open_limit' });
        return reject(error);
      }

      this.stats.totalCalls++;
      
      if (this.isHalfOpen()) {
        this.halfOpenCalls++;
      }

      const startTime = Date.now();
      
      try {
        const result = fn(...args);
        
        // Handle both sync and async functions
        if (result && typeof result.then === 'function') {
          result
            .then((value) => {
              this.onSuccess(Date.now() - startTime);
              resolve(value);
            })
            .catch((error) => {
              this.onFailure(Date.now() - startTime, error);
              reject(error);
            });
        } else {
          this.onSuccess(Date.now() - startTime);
          resolve(result);
        }
      } catch (error) {
        this.onFailure(Date.now() - startTime, error);
        reject(error);
      }
    });
  }

  /**
   * Record a successful call
   */
  recordSuccess() {
    this.onSuccess();
  }

  /**
   * Record a failed call
   */
  recordFailure(error = null) {
    this.onFailure(0, error);
  }

  /**
   * Handle successful execution
   */
  onSuccess(responseTime = 0) {
    this.stats.successfulCalls++;
    this.successCount++;
    
    this.addToHistory(true, responseTime);
    
    if (this.isHalfOpen()) {
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.close();
      }
    } else if (this.isOpen()) {
      // Reset failure count on success when circuit is open
      this.failureCount = 0;
    }
    
    this.emit('success', {
      name: this.name,
      responseTime,
      state: this.state,
      successCount: this.successCount
    });
  }

  /**
   * Handle failed execution
   */
  onFailure(responseTime = 0, error = null) {
    this.stats.failedCalls++;
    this.failureCount++;
    this.successCount = 0; // Reset success count
    this.lastFailureTime = Date.now();
    
    this.addToHistory(false, responseTime, error);
    
    if (error && error.code === 'TIMEOUT') {
      this.stats.timeouts++;
    }
    
    if (this.shouldOpen()) {
      this.open();
    }
    
    this.emit('failure', {
      name: this.name,
      error: error?.message || 'Unknown error',
      responseTime,
      state: this.state,
      failureCount: this.failureCount
    });
  }

  /**
   * Add call result to history for sliding window analysis
   */
  addToHistory(success, responseTime, error = null) {
    const entry = {
      timestamp: Date.now(),
      success,
      responseTime,
      error: error?.message || null
    };
    
    this.callHistory.push(entry);
    
    // Maintain sliding window size
    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory.shift();
    }
  }

  /**
   * Check if circuit breaker should open
   */
  shouldOpen() {
    if (this.isOpen()) return false;
    
    // Check failure threshold
    if (this.failureCount >= this.failureThreshold) {
      return true;
    }
    
    // Check failure rate in sliding window
    const recentCalls = this.getRecentCalls();
    if (recentCalls.length >= this.failureThreshold) {
      const failureRate = recentCalls.filter(call => !call.success).length / recentCalls.length;
      return failureRate >= 0.5; // 50% failure rate
    }
    
    return false;
  }

  /**
   * Get recent calls within monitoring period
   */
  getRecentCalls() {
    const cutoff = Date.now() - this.monitoringPeriod;
    return this.callHistory.filter(call => call.timestamp >= cutoff);
  }

  /**
   * Open the circuit breaker
   */
  open() {
    if (this.state !== this.states.OPEN) {
      this.changeState(this.states.OPEN);
      this.stats.circuitOpenedCount++;
      this.nextAttempt = Date.now() + this.resetTimeout;
      
      logDebug(`🔴 Circuit breaker OPENED for ${this.name} (failures: ${this.failureCount})`);
      
      this.emit('circuitOpened', {
        name: this.name,
        failureCount: this.failureCount,
        resetTimeout: this.resetTimeout
      });
    }
  }

  /**
   * Close the circuit breaker
   */
  close() {
    if (this.state !== this.states.CLOSED) {
      this.changeState(this.states.CLOSED);
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenCalls = 0;
      this.nextAttempt = null;
      
      logDebug(`🟢 Circuit breaker CLOSED for ${this.name}`);
      
      this.emit('circuitClosed', {
        name: this.name
      });
    }
  }

  /**
   * Set circuit breaker to half-open state
   */
  halfOpen() {
    if (this.state !== this.states.HALF_OPEN) {
      this.changeState(this.states.HALF_OPEN);
      this.halfOpenCalls = 0;
      this.successCount = 0;
      
      logDebug(`🟡 Circuit breaker HALF-OPEN for ${this.name}`);
      
      this.emit('circuitHalfOpened', {
        name: this.name
      });
    }
  }

  /**
   * Change circuit breaker state
   */
  changeState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.stats.lastStateChange = Date.now();
    
    // Keep state history
    this.stats.stateHistory.push({
      from: oldState,
      to: newState,
      timestamp: Date.now(),
      failureCount: this.failureCount,
      successCount: this.successCount
    });
    
    // Limit history size
    if (this.stats.stateHistory.length > 50) {
      this.stats.stateHistory = this.stats.stateHistory.slice(-50);
    }
    
    this.emit('stateChanged', {
      name: this.name,
      from: oldState,
      to: newState,
      timestamp: Date.now()
    });
  }

  /**
   * Check if circuit breaker is closed
   */
  isClosed() {
    return this.state === this.states.CLOSED;
  }

  /**
   * Check if circuit breaker is open
   */
  isOpen() {
    if (this.state === this.states.OPEN) {
      // Check if reset timeout has passed
      if (this.nextAttempt && Date.now() >= this.nextAttempt) {
        this.halfOpen();
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Check if circuit breaker is half-open
   */
  isHalfOpen() {
    return this.state === this.states.HALF_OPEN;
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    const recentCalls = this.getRecentCalls();
    const recentFailureRate = recentCalls.length > 0 ? 
      recentCalls.filter(call => !call.success).length / recentCalls.length : 0;
    
    const avgResponseTime = this.callHistory.length > 0 ?
      this.callHistory.reduce((sum, call) => sum + call.responseTime, 0) / this.callHistory.length : 0;

    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      nextAttempt: this.nextAttempt,
      halfOpenCalls: this.halfOpenCalls,
      halfOpenMaxCalls: this.halfOpenMaxCalls,
      recentFailureRate: Math.round(recentFailureRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      stats: {
        ...this.stats,
        recentCalls: recentCalls.length,
        totalHistorySize: this.callHistory.length
      },
      config: {
        failureThreshold: this.failureThreshold,
        resetTimeout: this.resetTimeout,
        monitoringPeriod: this.monitoringPeriod,
        halfOpenMaxCalls: this.halfOpenMaxCalls
      }
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset() {
    this.state = this.states.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    this.halfOpenCalls = 0;
    this.callHistory = [];
    
    // Reset stats but keep configuration
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      timeouts: 0,
      circuitOpenedCount: 0,
      lastStateChange: Date.now(),
      stateHistory: []
    };
    
    logDebug(`🔄 Circuit breaker RESET for ${this.name}`);
    
    this.emit('circuitReset', {
      name: this.name
    });
  }

  /**
   * Start monitoring for automatic state transitions
   */
  startMonitoring() {
    setInterval(() => {
      // Check if we should transition from OPEN to HALF_OPEN
      if (this.isOpen() && this.nextAttempt && Date.now() >= this.nextAttempt) {
        this.halfOpen();
      }
      
      // Clean up old history entries
      const cutoff = Date.now() - (this.monitoringPeriod * 10); // Keep 10x monitoring period
      this.callHistory = this.callHistory.filter(call => call.timestamp >= cutoff);
      
    }, 1000); // Check every second
  }

  /**
   * Get health status
   */
  getHealth() {
    const recentCalls = this.getRecentCalls();
    const isHealthy = this.isClosed() && (recentCalls.length === 0 || 
      recentCalls.filter(call => call.success).length / recentCalls.length >= 0.8);
    
    return {
      name: this.name,
      healthy: isHealthy,
      state: this.state,
      failureCount: this.failureCount,
      recentCalls: recentCalls.length,
      lastFailure: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    };
  }
}

export default CircuitBreaker;


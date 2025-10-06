/**
 * Unleashed Rate Limiter Utility
 * 
 * Token bucket rate limiting for Unleashed API requests with intelligent
 * throttling, queue management, and adaptive rate adjustment.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class UnleashedRateLimiter {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      maxRequests: config.maxRequests || 40, // Unleashed typical limit
      timeWindow: config.timeWindow || 60000, // 1 minute
      retryAfter: config.retryAfter || 2000, // 2 seconds
      maxQueueSize: config.maxQueueSize || 100,
      adaptiveThrottling: config.adaptiveThrottling !== false
    };
    
    this.tokens = this.config.maxRequests;
    this.lastRefill = Date.now();
    this.requestQueue = [];
    this.isInitialized = false;
    
    this.stats = {
      requestsAllowed: 0,
      requestsThrottled: 0,
      requestsQueued: 0,
      averageWaitTime: 0,
      queueOverflows: 0
    };
    
    logger.info('Unleashed Rate Limiter initialized', {
      enabled: this.config.enabled,
      maxRequests: this.config.maxRequests,
      timeWindow: this.config.timeWindow
    });
  }

  async initialize() {
    try {
      logger.info('Initializing Unleashed Rate Limiter...');
      
      if (this.config.enabled) {
        // Start token refill timer
        this.refillTimer = setInterval(() => {
          this.refillTokens();
        }, 1000); // Refill every second
        
        // Start queue processor
        this.queueTimer = setInterval(() => {
          this.processQueue();
        }, 100); // Process queue every 100ms
      }
      
      this.isInitialized = true;
      logger.info('Rate Limiter initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Rate Limiter', { error: error.message });
      throw error;
    }
  }

  async checkRateLimit(identifier = 'default') {
    try {
      if (!this.config.enabled) {
        this.stats.requestsAllowed++;
        return {
          allowed: true,
          tokensRemaining: this.tokens,
          retryAfter: 0,
          waitTime: 0
        };
      }

      const now = Date.now();
      this.refillTokens();

      if (this.tokens > 0) {
        this.tokens--;
        this.stats.requestsAllowed++;
        
        logger.debug('Request allowed', {
          identifier,
          tokensRemaining: this.tokens,
          timestamp: now
        });
        
        return {
          allowed: true,
          tokensRemaining: this.tokens,
          retryAfter: 0,
          waitTime: 0
        };
      } else {
        this.stats.requestsThrottled++;
        const retryAfter = this.calculateRetryAfter();
        
        logger.debug('Request throttled', {
          identifier,
          tokensRemaining: this.tokens,
          retryAfter,
          timestamp: now
        });
        
        return {
          allowed: false,
          tokensRemaining: this.tokens,
          retryAfter,
          waitTime: retryAfter
        };
      }

    } catch (error) {
      logger.error('Rate limit check failed', {
        identifier,
        error: error.message
      });
      
      // Default to allowing request on error
      return {
        allowed: true,
        tokensRemaining: 0,
        retryAfter: 0,
        waitTime: 0,
        error: error.message
      };
    }
  }

  async waitForToken(identifier = 'default', maxWaitTime = 30000) {
    const startTime = Date.now();
    
    try {
      while (Date.now() - startTime < maxWaitTime) {
        const rateLimitResult = await this.checkRateLimit(identifier);
        
        if (rateLimitResult.allowed) {
          const waitTime = Date.now() - startTime;
          this.updateAverageWaitTime(waitTime);
          
          logger.debug('Token acquired after wait', {
            identifier,
            waitTime,
            tokensRemaining: rateLimitResult.tokensRemaining
          });
          
          return rateLimitResult;
        }
        
        // Wait before next check
        await this.sleep(Math.min(rateLimitResult.retryAfter, 1000));
      }
      
      // Timeout exceeded
      logger.warn('Token wait timeout exceeded', {
        identifier,
        maxWaitTime,
        actualWaitTime: Date.now() - startTime
      });
      
      return {
        allowed: false,
        tokensRemaining: this.tokens,
        retryAfter: this.calculateRetryAfter(),
        waitTime: Date.now() - startTime,
        timeout: true
      };

    } catch (error) {
      logger.error('Wait for token failed', {
        identifier,
        error: error.message
      });
      
      throw error;
    }
  }

  async queueRequest(requestFn, identifier = 'default', priority = 'normal') {
    try {
      if (!this.config.enabled) {
        return await requestFn();
      }

      if (this.requestQueue.length >= this.config.maxQueueSize) {
        this.stats.queueOverflows++;
        throw new Error('Request queue is full');
      }

      return new Promise((resolve, reject) => {
        const queueItem = {
          requestFn,
          identifier,
          priority,
          timestamp: Date.now(),
          resolve,
          reject
        };

        this.addToQueue(queueItem);
        this.stats.requestsQueued++;
        
        logger.debug('Request queued', {
          identifier,
          priority,
          queueSize: this.requestQueue.length
        });
      });

    } catch (error) {
      logger.error('Request queueing failed', {
        identifier,
        error: error.message
      });
      throw error;
    }
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed >= 1000) { // Refill every second
      const tokensToAdd = Math.floor(timePassed / 1000) * 
        (this.config.maxRequests / (this.config.timeWindow / 1000));
      
      this.tokens = Math.min(
        this.config.maxRequests,
        this.tokens + tokensToAdd
      );
      
      this.lastRefill = now;
      
      logger.debug('Tokens refilled', {
        tokensAdded: tokensToAdd,
        currentTokens: this.tokens,
        maxTokens: this.config.maxRequests
      });
    }
  }

  processQueue() {
    if (this.requestQueue.length === 0) {
      return;
    }

    // Sort queue by priority and timestamp
    this.requestQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return a.timestamp - b.timestamp; // Earlier timestamp first
    });

    // Process requests that can be handled immediately
    const processableRequests = [];
    let tokensNeeded = 0;

    for (const queueItem of this.requestQueue) {
      if (tokensNeeded < this.tokens) {
        processableRequests.push(queueItem);
        tokensNeeded++;
      } else {
        break;
      }
    }

    // Execute processable requests
    for (const queueItem of processableRequests) {
      this.executeQueuedRequest(queueItem);
    }

    // Remove processed requests from queue
    this.requestQueue = this.requestQueue.slice(processableRequests.length);
  }

  async executeQueuedRequest(queueItem) {
    try {
      // Check rate limit one more time
      const rateLimitResult = await this.checkRateLimit(queueItem.identifier);
      
      if (rateLimitResult.allowed) {
        const result = await queueItem.requestFn();
        queueItem.resolve(result);
        
        logger.debug('Queued request executed successfully', {
          identifier: queueItem.identifier,
          queueTime: Date.now() - queueItem.timestamp
        });
      } else {
        // Put back in queue if rate limit exceeded
        this.requestQueue.unshift(queueItem);
      }

    } catch (error) {
      logger.error('Queued request execution failed', {
        identifier: queueItem.identifier,
        error: error.message
      });
      queueItem.reject(error);
    }
  }

  addToQueue(queueItem) {
    // Simple priority-based insertion
    if (queueItem.priority === 'high') {
      // Add high priority items to the front
      const insertIndex = this.requestQueue.findIndex(item => item.priority !== 'high');
      if (insertIndex === -1) {
        this.requestQueue.push(queueItem);
      } else {
        this.requestQueue.splice(insertIndex, 0, queueItem);
      }
    } else {
      // Add normal and low priority items to the end
      this.requestQueue.push(queueItem);
    }
  }

  calculateRetryAfter() {
    const baseRetryAfter = this.config.retryAfter;
    
    if (this.config.adaptiveThrottling) {
      // Increase retry time based on queue size
      const queueFactor = Math.min(this.requestQueue.length / 10, 3);
      return Math.floor(baseRetryAfter * (1 + queueFactor));
    }
    
    return baseRetryAfter;
  }

  updateAverageWaitTime(waitTime) {
    if (this.stats.averageWaitTime === 0) {
      this.stats.averageWaitTime = waitTime;
    } else {
      // Rolling average
      this.stats.averageWaitTime = (this.stats.averageWaitTime * 0.9) + (waitTime * 0.1);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Configuration methods
  updateConfig(newConfig) {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    logger.info('Rate limiter configuration updated', {
      oldConfig,
      newConfig: this.config
    });
  }

  adjustLimits(newMaxRequests, newTimeWindow) {
    this.config.maxRequests = newMaxRequests;
    this.config.timeWindow = newTimeWindow;
    
    // Reset tokens to new limit
    this.tokens = Math.min(this.tokens, newMaxRequests);
    
    logger.info('Rate limits adjusted', {
      maxRequests: newMaxRequests,
      timeWindow: newTimeWindow,
      currentTokens: this.tokens
    });
  }

  // Monitoring methods
  getStats() {
    return {
      ...this.stats,
      currentTokens: this.tokens,
      queueSize: this.requestQueue.length,
      maxRequests: this.config.maxRequests,
      timeWindow: this.config.timeWindow,
      enabled: this.config.enabled,
      efficiency: this.calculateEfficiency()
    };
  }

  calculateEfficiency() {
    const totalRequests = this.stats.requestsAllowed + this.stats.requestsThrottled;
    return totalRequests > 0 ? 
      (this.stats.requestsAllowed / totalRequests) * 100 : 100;
  }

  getQueueInfo() {
    return {
      size: this.requestQueue.length,
      maxSize: this.config.maxQueueSize,
      byPriority: {
        high: this.requestQueue.filter(item => item.priority === 'high').length,
        normal: this.requestQueue.filter(item => item.priority === 'normal').length,
        low: this.requestQueue.filter(item => item.priority === 'low').length
      },
      oldestRequest: this.requestQueue.length > 0 ? 
        Date.now() - this.requestQueue[0].timestamp : 0
    };
  }

  resetStats() {
    this.stats = {
      requestsAllowed: 0,
      requestsThrottled: 0,
      requestsQueued: 0,
      averageWaitTime: 0,
      queueOverflows: 0
    };
    
    logger.info('Rate limiter stats reset');
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled,
      currentTokens: this.tokens,
      queueSize: this.requestQueue.length,
      stats: this.stats
    };
  }

  async cleanup() {
    try {
      logger.info('Cleaning up Rate Limiter...');
      
      if (this.refillTimer) {
        clearInterval(this.refillTimer);
        this.refillTimer = null;
      }
      
      if (this.queueTimer) {
        clearInterval(this.queueTimer);
        this.queueTimer = null;
      }
      
      // Reject all queued requests
      for (const queueItem of this.requestQueue) {
        queueItem.reject(new Error('Rate limiter shutting down'));
      }
      this.requestQueue = [];
      
      this.isInitialized = false;
      
      logger.info('Rate Limiter cleanup completed');
      
    } catch (error) {
      logger.error('Error during Rate Limiter cleanup', { error: error.message });
    }
  }
}
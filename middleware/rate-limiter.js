/**
 * Enterprise Rate Limiting Middleware
 * Advanced rate limiting with multiple strategies and Redis backing
 */

import rateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis'; // Optional - install if using Redis
import { createClient } from 'redis';
import crypto from 'crypto';

class RateLimiterService {
  constructor() {
    this.limiters = new Map();
    this.redisClient = null;
    this.strategies = {
      standard: this.createStandardLimiter,
      strict: this.createStrictLimiter,
      sliding: this.createSlidingWindowLimiter,
      token: this.createTokenBucketLimiter,
      adaptive: this.createAdaptiveLimiter
    };
  }

  /**
   * Initialize rate limiter with Redis
   */
  async initialize() {
    try {
      if (process.env.REDIS_URL) {
        this.redisClient = createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
          }
        });

        this.redisClient.on(_'error', _(err) => {
          console.error('Redis Client Error:', err);
        });

        await this.redisClient.connect();
        console.log('Rate limiter connected to Redis');
      } else {
        console.log('Rate limiter using memory store (Redis not configured)');
      }

      // Initialize default limiters
      this.setupDefaultLimiters();

    } catch (error) {
      console.error('Failed to initialize rate limiter:', error);
      // Fall back to memory store
      this.redisClient = null;
    }
  }

  /**
   * Setup default rate limiters
   */
  setupDefaultLimiters() {
    // API endpoints
    this.limiters.set('api', this.createStandardLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many API requests, please try again later.'
    }));

    // Authentication endpoints
    this.limiters.set('auth', this.createStrictLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      skipSuccessfulRequests: true,
      message: 'Too many authentication attempts, please try again later.'
    }));

    // File upload endpoints
    this.limiters.set('upload', this.createStrictLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10,
      message: 'Upload limit exceeded, please try again later.'
    }));

    // Search endpoints
    this.limiters.set('search', this.createSlidingWindowLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 30,
      message: 'Search rate limit exceeded.'
    }));

    // Export endpoints
    this.limiters.set('export', this.createStrictLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      message: 'Export limit exceeded.'
    }));

    // WebSocket connections
    this.limiters.set('websocket', this.createStandardLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 10,
      message: 'Too many WebSocket connection attempts.'
    }));

    // AI endpoints
    this.limiters.set('ai', this.createTokenBucketLimiter({
      tokens: 50,
      refillRate: 10, // 10 tokens per minute
      message: 'AI request limit exceeded. Tokens will refill over time.'
    }));
  }

  /**
   * Create standard rate limiter
   */
  createStandardLimiter(options) {
    const config = {
      windowMs: options.windowMs || 15 * 60 * 1000,
      max: options.max || 100,
      message: options.message || 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: this.generateKey.bind(this),
      handler: this.handleRateLimitExceeded.bind(this),
      skip: this.shouldSkip.bind(this),
      ...options
    };

    // Optional Redis store - uncomment if using Redis
    /*
    if (this.redisClient) {
      config.store = new RedisStore({
        client: this.redisClient,
        prefix: 'rl:standard:',
        sendCommand: (...args) => this.redisClient.sendCommand(args)
      });
    }
    */

    return rateLimit(config);
  }

  /**
   * Create strict rate limiter
   */
  createStrictLimiter(options) {
    const config = {
      ...options,
      skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
      skipFailedRequests: options.skipFailedRequests ?? false,
      requestPropertyName: 'rateLimit',
      validate: {
        trustProxy: false,
        xForwardedForHeader: false
      }
    };

    // Optional Redis store - uncomment if using Redis
    /*
    if (this.redisClient) {
      config.store = new RedisStore({
        client: this.redisClient,
        prefix: 'rl:strict:',
        sendCommand: (...args) => this.redisClient.sendCommand(args)
      });
    }
    */

    return rateLimit(config);
  }

  /**
   * Create sliding window rate limiter
   */
  createSlidingWindowLimiter(options) {
    return {
      middleware: async (req, res, _next) => {
        const key = this.generateKey(req);
        const windowMs = options.windowMs || 60000;
        const max = options.max || 100;
        const now = Date.now();

        try {
          // Get request timestamps within window
          const timestamps = await this.getTimestamps(key, now - windowMs);

          if (timestamps.length >= max) {
            return this.handleRateLimitExceeded(req, res, next, options);
          }

          // Add current request timestamp
          await this.addTimestamp(key, now);

          // Set headers
          res.setHeader('X-RateLimit-Limit', max);
          res.setHeader('X-RateLimit-Remaining', Math.max(0, max - timestamps.length - 1));
          res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

          next();
        } catch (error) {
          console.error('Sliding window rate limit error:', error);
          next(); // Don't block on errors
        }
      }
    };
  }

  /**
   * Create token bucket rate limiter
   */
  createTokenBucketLimiter(options) {
    const buckets = new Map();
    const tokens = options.tokens || 100;
    const refillRate = options.refillRate || 10;
    const refillInterval = options.refillInterval || 60000; // 1 minute

    // Refill tokens periodically
    setInterval(() => {
      for (const [key, bucket] of buckets) {
        bucket.tokens = Math.min(tokens, bucket.tokens + refillRate);
        if (bucket.tokens === tokens) {
          buckets.delete(key); // Remove full buckets to save memory
        }
      }
    }, refillInterval);

    return {
      middleware: (req, res, _next) => {
        const key = this.generateKey(req);

        if (!buckets.has(key)) {
          buckets.set(key, { tokens, lastRefill: Date.now() });
        }

        const bucket = buckets.get(key);
        const tokensRequired = options.getCost ? options.getCost(req) : 1;

        if (bucket.tokens >= tokensRequired) {
          bucket.tokens -= tokensRequired;

          res.setHeader('X-RateLimit-Tokens-Remaining', bucket.tokens);
          res.setHeader('X-RateLimit-Tokens-Limit', tokens);

          next();
        } else {
          this.handleRateLimitExceeded(req, res, next, options);
        }
      }
    };
  }

  /**
   * Create adaptive rate limiter
   */
  createAdaptiveLimiter(options) {
    const baseMax = options.max || 100;
    const metrics = {
      responseTime: [],
      errorRate: 0,
      load: 0
    };

    return {
      middleware: async (req, res, _next) => {
        const key = this.generateKey(req);

        // Calculate adaptive limit based on system metrics
        const adaptiveMax = this.calculateAdaptiveLimit(baseMax, metrics);

        // Use sliding window with adaptive limit
        const limiter = this.createSlidingWindowLimiter({
          ...options,
          max: adaptiveMax
        });

        await limiter.middleware(req, res, next);

        // Update metrics
        res.on(_'finish', () => {
          metrics.responseTime.push(Date.now() - req.startTime);
          if (metrics.responseTime.length > 100) {
            metrics.responseTime.shift();
          }

          if (res.statusCode >= 500) {
            metrics.errorRate = Math.min(1, metrics.errorRate + 0.01);
          } else {
            metrics.errorRate = Math.max(0, metrics.errorRate - 0.001);
          }
        });
      }
    };
  }

  /**
   * Calculate adaptive limit based on metrics
   */
  calculateAdaptiveLimit(baseMax, metrics) {
    let multiplier = 1;

    // Reduce limit if error rate is high
    if (metrics.errorRate > 0.05) {
      multiplier *= (1 - metrics.errorRate);
    }

    // Reduce limit if response time is high
    if (metrics.responseTime.length > 0) {
      const avgResponseTime = metrics.responseTime.reduce((a, _b) => a + b, 0) / metrics.responseTime.length;
      if (avgResponseTime > 1000) {
        multiplier *= Math.max(0.5, 1000 / avgResponseTime);
      }
    }

    // Reduce limit if system load is high
    if (metrics.load > 0.8) {
      multiplier *= (1 - metrics.load + 0.2);
    }

    return Math.max(10, Math.floor(baseMax * multiplier));
  }

  /**
   * Generate rate limit key
   */
  generateKey(req) {
    const parts = [];

    // IP address
    const ip = this.getClientIP(req);
    parts.push(ip);

    // User ID if authenticated
    if (req.user?.id) {
      parts.push(`user:${req.user.id}`);
    }

    // API key if provided
    if (req.headers['x-api-key']) {
      const hashedKey = crypto
        .createHash('sha256')
        .update(req.headers['x-api-key'])
        .digest('hex')
        .substring(0, 16);
      parts.push(`api:${hashedKey}`);
    }

    // Route pattern
    const route = req.route?.path || req.path;
    parts.push(`route:${route}`);

    return parts.join(':');
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.ip ||
           'unknown';
  }

  /**
   * Handle rate limit exceeded
   */
  handleRateLimitExceeded(req, res, next, options = {}) {
    const message = options.message || 'Too many requests, please try again later.';

    // Log rate limit violation
    console.warn('Rate limit exceeded:', {
      ip: this.getClientIP(req),
      user: req.user?.id,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Send response
    res.status(429).json({
      error: 'RATE_LIMITED',
      message,
      retryAfter: res.getHeader('X-RateLimit-Reset')
    });
  }

  /**
   * Check if request should skip rate limiting
   */
  shouldSkip(req) {
    // Skip for internal health checks
    if (req.path === '/health' || req.path === '/ready') {
      return true;
    }

    // Skip for whitelisted IPs
    const ip = this.getClientIP(req);
    const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    if (whitelist.includes(ip)) {
      return true;
    }

    // Skip for admin users
    if (req.user?.role === 'admin') {
      return true;
    }

    return false;
  }

  /**
   * Get timestamps for sliding window
   */
  async getTimestamps(key, since) {
    if (!this.redisClient) {
      // Memory fallback
      return this.memoryTimestamps.get(key)?.filter(t => t > since) || [];
    }

    try {
      const timestamps = await this.redisClient.zRangeByScore(
        `sl:${key}`,
        since,
        Date.now()
      );
      return timestamps.map(Number);
    } catch (error) {
      console.error('Failed to get timestamps:', error);
      return [];
    }
  }

  /**
   * Add timestamp for sliding window
   */
  async addTimestamp(key, timestamp) {
    if (!this.redisClient) {
      // Memory fallback
      if (!this.memoryTimestamps) {
        this.memoryTimestamps = new Map();
      }
      const timestamps = this.memoryTimestamps.get(key) || [];
      timestamps.push(timestamp);
      this.memoryTimestamps.set(key, timestamps);
      return;
    }

    try {
      await this.redisClient.zAdd(`sl:${key}`, {
        score: timestamp,
        value: timestamp.toString()
      });

      // Expire old entries
      await this.redisClient.expire(`sl:${key}`, 3600); // 1 hour
    } catch (error) {
      console.error('Failed to add timestamp:', error);
    }
  }

  /**
   * Get rate limiter middleware
   */
  getMiddleware(type = 'api', options = {}) {
    let limiter = this.limiters.get(type);

    if (!limiter) {
      // Create custom limiter
      const strategy = options.strategy || 'standard';
      const createLimiter = this.strategies[strategy];

      if (!createLimiter) {
        throw new Error(`Unknown rate limit strategy: ${strategy}`);
      }

      limiter = createLimiter.call(this, options);
      this.limiters.set(`custom:${type}`, limiter);
    }

    // Return middleware function
    if (limiter.middleware) {
      return limiter.middleware;
    }

    return limiter;
  }

  /**
   * Reset rate limit for key
   */
  async reset(key) {
    if (!this.redisClient) {
      if (this.memoryTimestamps) {
        this.memoryTimestamps.delete(key);
      }
      return;
    }

    try {
      await this.redisClient.del(`rl:standard:${key}`);
      await this.redisClient.del(`rl:strict:${key}`);
      await this.redisClient.del(`sl:${key}`);
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
    }
  }

  /**
   * Get current usage for key
   */
  async getUsage(key) {
    if (!this.redisClient) {
      const timestamps = this.memoryTimestamps?.get(key) || [];
      return {
        requests: timestamps.length,
        oldest: timestamps[0],
        newest: timestamps[timestamps.length - 1]
      };
    }

    try {
      const timestamps = await this.redisClient.zRange(`sl:${key}`, 0, -1);
      return {
        requests: timestamps.length,
        oldest: timestamps[0] ? Number(timestamps[0]) : null,
        newest: timestamps[timestamps.length - 1] ? Number(timestamps[timestamps.length - 1]) : null
      };
    } catch (error) {
      console.error('Failed to get usage:', error);
      return { requests: 0 };
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanup() {
    if (!this.redisClient) {
      // Clean memory storage
      if (this.memoryTimestamps) {
        const now = Date.now();
        for (const [key, timestamps] of this.memoryTimestamps) {
          const filtered = timestamps.filter(t => now - t < 3600000);
          if (filtered.length === 0) {
            this.memoryTimestamps.delete(key);
          } else {
            this.memoryTimestamps.set(key, filtered);
          }
        }
      }
      return;
    }

    try {
      // Clean Redis entries
      const keys = await this.redisClient.keys('sl:*');
      const now = Date.now();

      for (const key of keys) {
        await this.redisClient.zRemRangeByScore(key, 0, now - 3600000);
      }
    } catch (error) {
      console.error('Failed to cleanup rate limits:', error);
    }
  }

  /**
   * Shutdown rate limiter
   */
  async shutdown() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }

    this.limiters.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiterService();

// Export middleware factory
export function createRateLimiter(type = 'api', options = {}) {
  return rateLimiter.getMiddleware(type, options);
}

// Export specific middleware
export const apiLimiter = () => rateLimiter.getMiddleware('api');
export const authLimiter = () => rateLimiter.getMiddleware('auth');
export const uploadLimiter = () => rateLimiter.getMiddleware('upload');
export const searchLimiter = () => rateLimiter.getMiddleware('search');
export const exportLimiter = () => rateLimiter.getMiddleware('export');
export const aiLimiter = () => rateLimiter.getMiddleware('ai');

export default RateLimiterService;
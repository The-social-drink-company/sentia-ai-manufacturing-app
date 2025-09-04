/**
 * Agent Rate Limiter
 * Implements rate limiting for agent API endpoints
 */

import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { logWarn, logError } from '../observability/structuredLogger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgentRateLimiter {
  constructor() {
    this.limiters = new Map();
    this.redisClient = null;
    this.initializeLimiters();
  }

  /**
   * Initialize rate limiters
   */
  async initializeLimiters() {
    try {
      // Try to connect to Redis if available
      if (process.env.REDIS_URL) {
        this.redisClient = createClient({
          url: process.env.REDIS_URL
        });
        
        await this.redisClient.connect();
        
        // Redis-based limiters for distributed rate limiting
        this.createRedisLimiters();
      } else {
        // Fallback to memory-based limiters
        this.createMemoryLimiters();
      }
    } catch (error) {
      logWarn('Failed to connect to Redis, using memory limiters', error);
      this.createMemoryLimiters();
    }
  }

  /**
   * Create Redis-based rate limiters
   */
  createRedisLimiters() {
    // Per-IP limiter
    this.limiters.set('ip', new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'agent_rl_ip',
      points: parseInt(process.env.AGENT_RATE_LIMIT_BURST) || 10, // Burst limit
      duration: 60, // Per minute
      blockDuration: 60 // Block for 1 minute
    }));

    // Per-user limiter  
    this.limiters.set('user', new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'agent_rl_user',
      points: parseInt(process.env.AGENT_RATE_LIMIT_PER_MIN) || 30,
      duration: 60,
      blockDuration: 60
    }));

    // Per-endpoint limiter
    this.limiters.set('endpoint', new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'agent_rl_endpoint',
      points: 100, // Total endpoint limit
      duration: 60,
      blockDuration: 60
    }));

    // Execute mode special limiter (very restrictive)
    this.limiters.set('execute', new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'agent_rl_execute',
      points: 1, // 1 execute per 5 minutes
      duration: 300,
      blockDuration: 300
    }));
  }

  /**
   * Create memory-based rate limiters (fallback)
   */
  createMemoryLimiters() {
    // Per-IP limiter
    this.limiters.set('ip', new RateLimiterMemory({
      keyPrefix: 'agent_rl_ip',
      points: parseInt(process.env.AGENT_RATE_LIMIT_BURST) || 10,
      duration: 60,
      blockDuration: 60
    }));

    // Per-user limiter
    this.limiters.set('user', new RateLimiterMemory({
      keyPrefix: 'agent_rl_user',
      points: parseInt(process.env.AGENT_RATE_LIMIT_PER_MIN) || 30,
      duration: 60,
      blockDuration: 60
    }));

    // Per-endpoint limiter
    this.limiters.set('endpoint', new RateLimiterMemory({
      keyPrefix: 'agent_rl_endpoint',
      points: 100,
      duration: 60,
      blockDuration: 60
    }));

    // Execute mode special limiter
    this.limiters.set('execute', new RateLimiterMemory({
      keyPrefix: 'agent_rl_execute',
      points: 1,
      duration: 300,
      blockDuration: 300
    }));
  }

  /**
   * Check rate limit
   */
  async checkLimit(key, type = 'ip') {
    const limiter = this.limiters.get(type);
    if (!limiter) {
      return { allowed: true };
    }

    try {
      const result = await limiter.consume(key, 1);
      return {
        allowed: true,
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext
      };
    } catch (rateLimiterRes) {
      // Record rate limit hit
      await this.recordRateLimitHit(key, type);
      
      return {
        allowed: false,
        remainingPoints: rateLimiterRes.remainingPoints || 0,
        msBeforeNext: rateLimiterRes.msBeforeNext || 0,
        retryAfter: new Date(Date.now() + (rateLimiterRes.msBeforeNext || 0))
      };
    }
  }

  /**
   * Record rate limit hit in metrics
   */
  async recordRateLimitHit(key, type) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.agentSafetyMetrics.upsert({
        where: { period: today },
        create: {
          period: today,
          rateLimitHits: 1
        },
        update: {
          rateLimitHits: { increment: 1 }
        }
      });

      logWarn('Rate limit hit', { key, type });
    } catch (error) {
      logError('Failed to record rate limit hit', error);
    }
  }

  /**
   * Express middleware
   */
  middleware() {
    return async (req, res, next) => {
      // Skip rate limiting in development if configured
      if (process.env.NODE_ENV === 'development' && 
          process.env.DISABLE_RATE_LIMIT === 'true') {
        return next();
      }

      // Get client IP
      const ip = req.ip || req.connection.remoteAddress;
      
      // Check IP rate limit
      const ipCheck = await this.checkLimit(ip, 'ip');
      if (!ipCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests from this IP address',
          retryAfter: ipCheck.retryAfter
        });
      }

      // Check user rate limit if authenticated
      if (req.user?.id) {
        const userCheck = await this.checkLimit(req.user.id, 'user');
        if (!userCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Too many requests from this user',
            retryAfter: userCheck.retryAfter
          });
        }
      }

      // Check endpoint rate limit
      const endpoint = `${req.method}:${req.path}`;
      const endpointCheck = await this.checkLimit(endpoint, 'endpoint');
      if (!endpointCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'This endpoint is currently overloaded',
          retryAfter: endpointCheck.retryAfter
        });
      }

      // Special check for EXECUTE mode
      if (req.body?.mode === 'EXECUTE') {
        const executeKey = req.user?.id || ip;
        const executeCheck = await this.checkLimit(executeKey, 'execute');
        if (!executeCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: 'EXECUTE mode rate limit exceeded - please wait before trying again',
            retryAfter: executeCheck.retryAfter
          });
        }
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': ipCheck.remainingPoints + 1,
        'X-RateLimit-Remaining': ipCheck.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + ipCheck.msBeforeNext).toISOString()
      });

      next();
    };
  }

  /**
   * Reset limits for a key
   */
  async resetLimit(key, type = 'user') {
    const limiter = this.limiters.get(type);
    if (limiter) {
      await limiter.delete(key);
    }
  }

  /**
   * Get current usage for a key
   */
  async getUsage(key, type = 'user') {
    const limiter = this.limiters.get(type);
    if (!limiter) {
      return null;
    }

    try {
      const result = await limiter.get(key);
      return {
        consumedPoints: result?.consumedPoints || 0,
        remainingPoints: result?.remainingPoints || limiter.points,
        resetTime: result ? new Date(Date.now() + result.msBeforeNext) : null
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Cleanup and close connections
   */
  async cleanup() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Singleton instance
export const agentRateLimiter = new AgentRateLimiter();

export default {
  AgentRateLimiter,
  agentRateLimiter
};
/**
 * Unit Tests for Rate Limiting Middleware
 * Comprehensive testing of API rate limiting functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Redis client
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  expire: vi.fn(),
  incr: vi.fn(),
  ttl: vi.fn(),
  del: vi.fn(),
  zadd: vi.fn(),
  zcard: vi.fn(),
  zremrangebyscore: vi.fn(),
  zrange: vi.fn()
};

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => mockRedis)
}));

describe('Rate Limiting Middleware', () => {
  let rateLimitMiddleware;
  let req, res, next;
  let consoleRestore;

  beforeEach(async () => {
    consoleRestore = global.testUtils.mockConsole();
    vi.clearAllMocks();

    // Setup mock request and response objects
    req = global.testUtils.createMockRequest({
      ip: '192.168.1.100',
      method: 'GET',
      url: '/api/xero/invoices',
      headers: {
        'user-agent': 'Mozilla/5.0',
        'authorization': 'Bearer valid-token'
      }
    });

    res = global.testUtils.createMockResponse();
    res.set = vi.fn().mockReturnThis();
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();

    next = vi.fn();

    // Import rate limiting middleware
    rateLimitMiddleware = await import('../../../src/middleware/rate-limiting.js');
  });

  afterEach(() => {
    if (consoleRestore) consoleRestore();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within rate limits', async () => {
      mockRedis.get.mockResolvedValue('5'); // 5 previous requests
      mockRedis.incr.mockResolvedValue(6);
      mockRedis.ttl.mockResolvedValue(3500); // 3500 seconds remaining

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000, // 1 hour
        max: 100, // 100 requests per hour
        keyGenerator: (req) => req.ip
      });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Remaining': 94,
        'X-RateLimit-Reset': expect.any(Number)
      });
    });

    it('should block requests exceeding rate limits', async () => {
      mockRedis.get.mockResolvedValue('100'); // At limit
      mockRedis.ttl.mockResolvedValue(1800); // 30 minutes remaining

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        keyGenerator: (req) => req.ip
      });

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: 1800
      });
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        skipFailedRequests: true
      });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled(); // Should continue on Redis error
    });

    it('should reset window when TTL expires', async () => {
      mockRedis.get.mockResolvedValue(null); // No previous requests
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100
      });

      await middleware(req, res, next);

      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.100'),
        3600
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Sliding Window Rate Limiting', () => {
    it('should implement sliding window correctly', async () => {
      const now = Date.now();
      mockRedis.zcard.mockResolvedValue(50); // 50 requests in current window
      mockRedis.zadd.mockResolvedValue(1);
      mockRedis.zremrangebyscore.mockResolvedValue(10); // Removed 10 old requests

      const middleware = rateLimitMiddleware.createSlidingWindowRateLimit({
        windowMs: 3600000,
        max: 100,
        keyGenerator: (req) => req.ip
      });

      await middleware(req, res, next);

      expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.100'),
        0,
        now - 3600000
      );
      expect(mockRedis.zadd).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.100'),
        now,
        expect.any(String)
      );
      expect(next).toHaveBeenCalled();
    });

    it('should block requests in sliding window when limit exceeded', async () => {
      mockRedis.zcard.mockResolvedValue(100); // At limit

      const middleware = rateLimitMiddleware.createSlidingWindowRateLimit({
        windowMs: 3600000,
        max: 100
      });

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should calculate accurate remaining requests in sliding window', async () => {
      mockRedis.zcard.mockResolvedValue(75);
      mockRedis.zadd.mockResolvedValue(1);

      const middleware = rateLimitMiddleware.createSlidingWindowRateLimit({
        windowMs: 3600000,
        max: 100
      });

      await middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Remaining': 24, // 100 - 75 - 1
        'X-RateLimit-Reset': expect.any(Number)
      });
    });
  });

  describe('Custom Key Generators', () => {
    it('should use custom key generator for user-based limiting', async () => {
      req.user = { id: 'user-123', role: 'admin' };
      mockRedis.get.mockResolvedValue('10');
      mockRedis.incr.mockResolvedValue(11);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 1000, // Higher limit for authenticated users
        keyGenerator: (req) => req.user ? `user:${req.user.id}` : `ip:${req.ip}`
      });

      await middleware(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringContaining('user:user-123')
      );
      expect(next).toHaveBeenCalled();
    });

    it('should use API key based rate limiting', async () => {
      req.headers['x-api-key'] = 'sk_live_1234567890abcdef';
      mockRedis.get.mockResolvedValue('50');
      mockRedis.incr.mockResolvedValue(51);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 5000, // Higher limit for API keys
        keyGenerator: (req) => {
          const apiKey = req.headers['x-api-key'];
          return apiKey ? `apikey:${apiKey}` : `ip:${req.ip}`;
        }
      });

      await middleware(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringContaining('apikey:sk_live_1234567890abcdef')
      );
    });

    it('should use endpoint-specific rate limiting', async () => {
      req.url = '/api/xero/batch-upload';
      mockRedis.get.mockResolvedValue('2');
      mockRedis.incr.mockResolvedValue(3);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 10, // Lower limit for intensive operations
        keyGenerator: (req) => `${req.ip}:${req.url.split('?')[0]}`
      });

      await middleware(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.100:/api/xero/batch-upload')
      );
    });
  });

  describe('Rate Limit Headers', () => {
    it('should set correct rate limit headers', async () => {
      mockRedis.get.mockResolvedValue('25');
      mockRedis.incr.mockResolvedValue(26);
      mockRedis.ttl.mockResolvedValue(2700);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100
      });

      await middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Remaining': 74,
        'X-RateLimit-Reset': expect.any(Number)
      });
    });

    it('should include retry-after header when limit exceeded', async () => {
      mockRedis.get.mockResolvedValue('100');
      mockRedis.ttl.mockResolvedValue(1234);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100
      });

      await middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': expect.any(Number),
        'Retry-After': 1234
      });
    });

    it('should set custom headers when specified', async () => {
      mockRedis.get.mockResolvedValue('10');
      mockRedis.incr.mockResolvedValue(11);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        headers: {
          'X-Custom-Limit': '100',
          'X-Custom-Remaining': (remaining) => remaining.toString()
        }
      });

      await middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-Custom-Limit': '100',
          'X-Custom-Remaining': '89'
        })
      );
    });
  });

  describe('Skip Conditions', () => {
    it('should skip rate limiting for whitelisted IPs', async () => {
      req.ip = '127.0.0.1';

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        skip: (req) => req.ip === '127.0.0.1'
      });

      await middleware(req, res, next);

      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should skip rate limiting for admin users', async () => {
      req.user = { id: 'admin-123', role: 'admin' };

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        skip: (req) => req.user && req.user.role === 'admin'
      });

      await middleware(req, res, next);

      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should skip rate limiting for health check endpoints', async () => {
      req.url = '/health';

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        skip: (req) => req.url === '/health'
      });

      await middleware(req, res, next);

      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Advanced Rate Limiting Strategies', () => {
    it('should implement token bucket rate limiting', async () => {
      const bucketSize = 10;
      const refillRate = 1; // 1 token per second
      const lastRefill = Date.now() - 5000; // 5 seconds ago

      mockRedis.get.mockResolvedValueOnce('5'); // Current tokens
      mockRedis.get.mockResolvedValueOnce(lastRefill.toString()); // Last refill time
      mockRedis.set.mockResolvedValue('OK');

      const middleware = rateLimitMiddleware.createTokenBucketRateLimit({
        bucketSize,
        refillRate,
        keyGenerator: (req) => req.ip
      });

      await middleware(req, res, next);

      // Should refill 5 tokens (5 seconds * 1 token/second) = 10 tokens total
      // After consuming 1 token = 9 remaining
      expect(next).toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Remaining': 9
        })
      );
    });

    it('should implement adaptive rate limiting based on server load', async () => {
      const getServerLoad = vi.fn().mockReturnValue(0.8); // 80% load
      mockRedis.get.mockResolvedValue('50');
      mockRedis.incr.mockResolvedValue(51);

      const middleware = rateLimitMiddleware.createAdaptiveRateLimit({
        baseLimit: 100,
        getServerLoad,
        adaptiveFunction: (baseLimit, load) => Math.floor(baseLimit * (1 - load))
      });

      await middleware(req, res, next);

      // Base limit 100, but with 80% load = 20 effective limit
      expect(res.status).toHaveBeenCalledWith(429); // Should be blocked
    });

    it('should implement geo-based rate limiting', async () => {
      req.ip = '8.8.8.8'; // Google DNS (US)
      const getGeoLocation = vi.fn().mockReturnValue({ country: 'US' });
      mockRedis.get.mockResolvedValue('10');
      mockRedis.incr.mockResolvedValue(11);

      const middleware = rateLimitMiddleware.createGeoRateLimit({
        limits: {
          'US': { windowMs: 3600000, max: 1000 },
          'default': { windowMs: 3600000, max: 100 }
        },
        getGeoLocation
      });

      await middleware(req, res, next);

      expect(getGeoLocation).toHaveBeenCalledWith('8.8.8.8');
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': 1000
        })
      );
    });
  });

  describe('Rate Limiting Analytics', () => {
    it('should track rate limiting metrics', async () => {
      mockRedis.get.mockResolvedValue('95');
      mockRedis.incr.mockResolvedValue(96);

      const metrics = {
        requests: 0,
        blocked: 0,
        nearLimit: 0
      };

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        onRequest: () => metrics.requests++,
        onLimitReached: () => metrics.blocked++,
        onNearLimit: () => metrics.nearLimit++
      });

      await middleware(req, res, next);

      expect(metrics.requests).toBe(1);
      expect(metrics.nearLimit).toBe(1); // 96/100 > 90%
    });

    it('should generate rate limiting reports', async () => {
      const timeRange = {
        start: Date.now() - 86400000, // 24 hours ago
        end: Date.now()
      };

      mockRedis.zrange.mockResolvedValue([
        `${Date.now() - 3600000}:blocked`,
        `${Date.now() - 1800000}:allowed`,
        `${Date.now() - 900000}:blocked`
      ]);

      const report = await rateLimitMiddleware.generateRateLimitReport(timeRange);

      expect(report).toBeDefined();
      expect(report.totalRequests).toBe(3);
      expect(report.blockedRequests).toBe(2);
      expect(report.blockRate).toBe(0.67); // 2/3
      expect(report.topBlockedIps).toBeDefined();
    });

    it('should detect rate limiting abuse patterns', async () => {
      const requests = Array.from({ length: 1000 }, (_, i) => ({
        ip: '192.168.1.100',
        timestamp: Date.now() - (i * 1000),
        blocked: i % 10 === 0 // Every 10th request blocked
      }));

      const abuse = await rateLimitMiddleware.detectAbusePattern(requests);

      expect(abuse.detected).toBe(true);
      expect(abuse.pattern).toBe('high_frequency_requests');
      expect(abuse.riskLevel).toBe('high');
      expect(abuse.recommendation).toContain('Consider blocking IP');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle Redis connection failures gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection lost'));

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        skipFailedRequests: true,
        fallbackBehavior: 'allow'
      });

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should implement circuit breaker for Redis failures', async () => {
      // Simulate multiple Redis failures
      for (let i = 0; i < 5; i++) {
        mockRedis.get.mockRejectedValue(new Error('Redis error'));
      }

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        circuitBreaker: {
          threshold: 3,
          timeout: 60000
        }
      });

      // Should open circuit breaker after threshold failures
      await middleware(req, res, next);
      expect(next).toHaveBeenCalled(); // Should skip rate limiting
    });

    it('should retry failed Redis operations', async () => {
      mockRedis.get
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('10');
      mockRedis.incr.mockResolvedValue(11);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        retryPolicy: {
          attempts: 3,
          delay: 100
        }
      });

      await middleware(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should batch Redis operations for efficiency', async () => {
      const requests = [req, req, req]; // Simulate 3 concurrent requests

      mockRedis.get.mockResolvedValue('10');
      mockRedis.incr.mockResolvedValue(11);

      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        batchSize: 10
      });

      const promises = requests.map(r => middleware(r, res, next));
      await Promise.all(promises);

      // Should batch Redis operations
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
    });

    it('should use local cache for frequently accessed keys', async () => {
      const middleware = rateLimitMiddleware.createRateLimit({
        windowMs: 3600000,
        max: 100,
        localCache: {
          enabled: true,
          ttl: 1000,
          maxSize: 1000
        }
      });

      mockRedis.get.mockResolvedValue('10');

      // First request - should hit Redis
      await middleware(req, res, next);
      
      // Second request - should use local cache
      await middleware(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledTimes(1);
    });

    it('should implement memory-efficient sliding window', async () => {
      const middleware = rateLimitMiddleware.createMemoryEfficientSlidingWindow({
        windowMs: 3600000,
        max: 100,
        granularity: 60000 // 1-minute buckets
      });

      mockRedis.get.mockResolvedValue(JSON.stringify({
        buckets: { [Math.floor(Date.now() / 60000)]: 10 },
        total: 10
      }));

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
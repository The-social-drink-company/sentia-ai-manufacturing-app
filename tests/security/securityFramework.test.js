import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnterpriseSecurityFramework } from '../../services/security/securityFramework.js';

describe('EnterpriseSecurityFramework', () => {
  let securityFramework;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    securityFramework = new EnterpriseSecurityFramework();
    
    mockReq = {
      ip: '192.168.1.1',
      method: 'GET',
      path: '/api/test',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'authorization': 'Bearer test-token',
        'x-api-key': 'test-api-key'
      },
      get: vi.fn((header) => mockReq.headers[header.toLowerCase()]),
      session: {
        csrfToken: 'test-csrf-token'
      },
      body: {
        _csrf: 'test-csrf-token'
      }
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      removeHeader: vi.fn()
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Security Configuration', () => {
    it('should initialize with proper security configuration', () => {
      const config = securityFramework.getSecurityConfig();
      
      expect(config).toHaveProperty('rateLimit');
      expect(config).toHaveProperty('helmet');
      expect(config).toHaveProperty('cors');
      
      expect(config.rateLimit.windowMs).toBe(15 * 60 * 1000);
      expect(config.helmet.contentSecurityPolicy).toBeDefined();
      expect(config.cors.credentials).toBe(true);
    });

    it('should have different rate limits for production vs development', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test production limits
      process.env.NODE_ENV = 'production';
      const prodFramework = new EnterpriseSecurityFramework();
      const prodConfig = prodFramework.getSecurityConfig();
      expect(prodConfig.rateLimit.max).toBe(100);
      
      // Test development limits
      process.env.NODE_ENV = 'development';
      const devFramework = new EnterpriseSecurityFramework();
      const devConfig = devFramework.getSecurityConfig();
      expect(devConfig.rateLimit.max).toBe(1000);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Rate Limiting', () => {
    it('should create different rate limiters for different endpoints', () => {
      const limiters = securityFramework.createRateLimiters();
      
      expect(limiters).toHaveProperty('api');
      expect(limiters).toHaveProperty('auth');
      expect(limiters).toHaveProperty('upload');
      expect(limiters).toHaveProperty('admin');
    });

    it('should have stricter limits for authentication endpoints', () => {
      const limiters = securityFramework.createRateLimiters();
      
      // Auth limiter should be stricter than general API
      expect(limiters.auth.options.max).toBeLessThan(limiters.api.options.max);
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect SQL injection attempts', () => {
      const suspiciousReq = {
        ...mockReq,
        path: '/api/users?id=1; DROP TABLE users;--'
      };

      const context = {
        ip: suspiciousReq.ip,
        userAgent: suspiciousReq.headers['user-agent'],
        method: suspiciousReq.method,
        path: suspiciousReq.path,
        timestamp: new Date()
      };

      const spy = vi.spyOn(securityFramework, 'handleSuspiciousActivity');
      securityFramework.detectSuspiciousActivity(context);
      
      expect(spy).toHaveBeenCalledWith(context, 'suspicious_pattern');
    });

    it('should detect XSS attempts', () => {
      const suspiciousReq = {
        ...mockReq,
        path: '/api/search?q=<script>alert("xss")</script>'
      };

      const context = {
        ip: suspiciousReq.ip,
        userAgent: suspiciousReq.headers['user-agent'],
        method: suspiciousReq.method,
        path: suspiciousReq.path,
        timestamp: new Date()
      };

      const spy = vi.spyOn(securityFramework, 'handleSuspiciousActivity');
      securityFramework.detectSuspiciousActivity(context);
      
      expect(spy).toHaveBeenCalledWith(context, 'suspicious_pattern');
    });

    it('should detect unusual user agents', () => {
      const botReq = {
        ...mockReq,
        headers: {
          ...mockReq.headers,
          'user-agent': 'curl/7.68.0'
        }
      };

      const context = {
        ip: botReq.ip,
        userAgent: botReq.headers['user-agent'],
        method: botReq.method,
        path: botReq.path,
        timestamp: new Date()
      };

      const spy = vi.spyOn(securityFramework, 'handleSuspiciousActivity');
      securityFramework.detectSuspiciousActivity(context);
      
      expect(spy).toHaveBeenCalledWith(context, 'unusual_user_agent');
    });

    it('should block IP after multiple suspicious activities', () => {
      const context = {
        ip: '192.168.1.100',
        userAgent: 'curl/7.68.0',
        method: 'GET',
        path: '/api/test',
        timestamp: new Date()
      };

      // Simulate multiple suspicious activities
      for (let i = 0; i < 5; i++) {
        securityFramework.handleSuspiciousActivity(context, 'suspicious_pattern');
      }

      expect(securityFramework.blockedIPs.has('192.168.1.100')).toBe(true);
    });
  });

  describe('IP Blocking Middleware', () => {
    it('should block requests from blocked IPs', () => {
      securityFramework.blockedIPs.add('192.168.1.1');
      
      const middleware = securityFramework.ipBlockingMiddleware();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'Your IP has been temporarily blocked due to suspicious activity'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow requests from non-blocked IPs', () => {
      const middleware = securityFramework.ipBlockingMiddleware();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('CSRF Protection', () => {
    it('should validate CSRF tokens for state-changing requests', () => {
      mockReq.method = 'POST';
      mockReq.headers['x-csrf-token'] = 'test-csrf-token';
      
      const middleware = securityFramework.csrfProtection();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject requests with invalid CSRF tokens', () => {
      mockReq.method = 'POST';
      mockReq.headers['x-csrf-token'] = 'invalid-token';
      
      const middleware = securityFramework.csrfProtection();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'CSRF token validation failed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip CSRF validation for GET requests', () => {
      mockReq.method = 'GET';
      delete mockReq.headers['x-csrf-token'];
      
      const middleware = securityFramework.csrfProtection();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('API Key Authentication', () => {
    beforeEach(() => {
      vi.spyOn(securityFramework, 'validateApiKey').mockResolvedValue(true);
    });

    it('should validate API keys from headers', async () => {
      mockReq.headers['x-api-key'] = 'sk_test1234567890abcdef1234567890abcd';
      
      const middleware = securityFramework.apiKeyAuth();
      await middleware(mockReq, mockRes, mockNext);
      
      expect(securityFramework.validateApiKey).toHaveBeenCalledWith('sk_test1234567890abcdef1234567890abcd');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject requests without API keys', async () => {
      delete mockReq.headers['x-api-key'];
      
      const middleware = securityFramework.apiKeyAuth();
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'API key required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid API keys', async () => {
      mockReq.headers['x-api-key'] = 'invalid-key';
      securityFramework.validateApiKey.mockResolvedValue(false);
      
      const middleware = securityFramework.apiKeyAuth();
      await middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid API key'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Security Headers', () => {
    it('should set proper security headers', () => {
      const middleware = securityFramework.securityHeaders();
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Security Monitoring', () => {
    it('should log security-relevant requests', () => {
      mockReq.path = '/auth/login';
      
      const middleware = securityFramework.securityMonitoringMiddleware();
      const spy = vi.spyOn(securityFramework, 'logSecurityEvent');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(spy).toHaveBeenCalledWith('request', expect.objectContaining({
        ip: '192.168.1.1',
        method: 'GET',
        path: '/auth/login'
      }));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize sensitive headers in logs', () => {
      const sanitized = securityFramework.sanitizeHeaders(mockReq.headers);
      
      expect(sanitized).not.toHaveProperty('authorization');
      expect(sanitized).not.toHaveProperty('x-api-key');
      expect(sanitized).toHaveProperty('user-agent');
    });
  });

  describe('CSRF Token Generation', () => {
    it('should generate unique CSRF tokens', () => {
      const token1 = securityFramework.generateCSRFToken();
      const token2 = securityFramework.generateCSRFToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
    });
  });

  describe('Security Metrics', () => {
    it('should return comprehensive security metrics', () => {
      // Add some test data
      securityFramework.blockedIPs.add('192.168.1.100');
      securityFramework.suspiciousActivities.set('test_activity', 5);
      securityFramework.logSecurityEvent('test', { ip: '192.168.1.1' });
      
      const metrics = securityFramework.getSecurityMetrics();
      
      expect(metrics).toHaveProperty('blockedIPs');
      expect(metrics).toHaveProperty('suspiciousActivities');
      expect(metrics).toHaveProperty('recentEvents');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(metrics.blockedIPs).toContain('192.168.1.100');
      expect(metrics.suspiciousActivities).toHaveProperty('test_activity', 5);
      expect(metrics.recentEvents).toHaveLength(1);
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up old suspicious activities', () => {
      // Add old activity (simulate 2 hours ago)
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      securityFramework.suspiciousActivities.set('old_activity', twoHoursAgo);
      securityFramework.suspiciousActivities.set('recent_activity', Date.now());
      
      securityFramework.cleanup();
      
      expect(securityFramework.suspiciousActivities.has('old_activity')).toBe(false);
      expect(securityFramework.suspiciousActivities.has('recent_activity')).toBe(true);
    });

    it('should limit security events to prevent memory leaks', () => {
      // Add many events
      for (let i = 0; i < 600; i++) {
        securityFramework.logSecurityEvent('test', { ip: `192.168.1.${i}` });
      }
      
      securityFramework.cleanup();
      
      expect(securityFramework.securityEvents.length).toBeLessThanOrEqual(500);
    });
  });

  describe('API Key Validation', () => {
    it('should validate properly formatted API keys', async () => {
      const validKey = 'sk_1234567890abcdef1234567890abcdef';
      const result = await securityFramework.validateApiKey(validKey);
      expect(result).toBe(true);
    });

    it('should reject improperly formatted API keys', async () => {
      const invalidKeys = [
        'invalid-key',
        'sk_short',
        'wrong_prefix_1234567890abcdef1234567890abcdef',
        ''
      ];
      
      for (const key of invalidKeys) {
        const result = await securityFramework.validateApiKey(key);
        expect(result).toBe(false);
      }
    });
  });

  describe('Integration with Express Middleware', () => {
    it('should work as Express middleware', () => {
      const helmetMiddleware = securityFramework.getHelmetMiddleware();
      const rateLimiters = securityFramework.createRateLimiters();
      
      expect(typeof helmetMiddleware).toBe('function');
      expect(typeof rateLimiters.api).toBe('function');
      expect(typeof rateLimiters.auth).toBe('function');
    });
  });
});


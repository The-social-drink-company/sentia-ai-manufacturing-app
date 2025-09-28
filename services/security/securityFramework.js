import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { logInfo, logError, logWarn } from '../logger.js';

// Enhanced Security Framework for Enterprise Application
export class EnterpriseSecurityFramework {
  constructor() {
    this.rateLimiters = new Map();
    this.securityEvents = [];
    this.suspiciousActivities = new Map();
    this.blockedIPs = new Set();
    this.securityConfig = this.getSecurityConfig();
  }

  getSecurityConfig() {
    return {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === 'production' ? 100 : 1000,
        standardHeaders: true,
        legacyHeaders: false
      },
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://clerk.sentia.app",
              "https://*.clerk.accounts.dev",
              "https://js.stripe.com"
            ],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
              "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
              "'self'",
              "https://fonts.gstatic.com",
              "https://cdn.jsdelivr.net"
            ],
            imgSrc: [
              "'self'",
              "data:",
              "https:",
              "blob:"
            ],
            connectSrc: [
              "'self'",
              "https://api.clerk.dev",
              "https://*.clerk.accounts.dev",
              "https://api.openai.com",
              "https://api.anthropic.com",
              "https://api.unleashedsoftware.com",
              "https://*.myshopify.com",
              "https://api.xero.com",
              "wss://"
            ],
            frameSrc: [
              "'self'",
              "https://js.stripe.com"
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
          }
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        noSniff: true,
        frameguard: { action: 'deny' },
        xssFilter: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
      },
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'X-API-Key',
          'X-CSRF-Token'
        ]
      }
    };
  }

  // Enhanced Helmet configuration
  getHelmetMiddleware() {
    return helmet(this.securityConfig.helmet);
  }

  // Multi-tier rate limiting
  createRateLimiters() {
    const limiters = {
      // General API rate limiting
      api: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: {
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false
      }),

      // Authentication endpoints - stricter limits
      auth: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: {
          error: 'Too many authentication attempts, please try again later.',
          retryAfter: '15 minutes'
        },
        skipSuccessfulRequests: true
      }),

      // File upload endpoints
      upload: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20,
        message: {
          error: 'Upload limit exceeded, please try again later.',
          retryAfter: '1 hour'
        }
      }),

      // Admin endpoints - very strict
      admin: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: {
          error: 'Admin action limit exceeded.',
          retryAfter: '15 minutes'
        }
      })
    };

    return limiters;
  }

  // Advanced rate limiting with Redis (for production)
  createAdvancedRateLimiter() {
    if (process.env.REDIS_URL) {
      return new RateLimiterRedis({
        storeClient: redis, // Redis client
        keyPrefix: 'rl_sentia',
        points: 100, // Number of requests
        duration: 900, // Per 15 minutes
        blockDuration: 900, // Block for 15 minutes if limit exceeded
        execEvenly: true
      });
    }
    return null;
  }

  // Input validation middleware
  createValidationRules() {
    return {
      // User registration/update validation
      userValidation: [
        body('email').isEmail().normalizeEmail(),
        body('username').isLength({ min: 3, max: 50 }).isAlphanumeric(),
        body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
        body('firstName').optional().isLength({ max: 50 }).escape(),
        body('lastName').optional().isLength({ max: 50 }).escape()
      ],

      // Product validation
      productValidation: [
        body('name').isLength({ min: 1, max: 100 }).escape(),
        body('sku').matches(/^[A-Z0-9-]+$/),
        body('price').isFloat({ min: 0 }),
        body('category').isLength({ min: 1, max: 50 }).escape(),
        body('description').optional().isLength({ max: 1000 }).escape()
      ],

      // API key validation
      apiKeyValidation: [
        body('name').isLength({ min: 1, max: 100 }).escape(),
        body('permissions').isArray(),
        body('expiresAt').optional().isISO8601()
      ]
    };
  }

  // Validation error handler
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logWarn('Validation errors detected', {
        errors: errors.array(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }

  // Security monitoring middleware
  securityMonitoringMiddleware() {
    return (req, res, _next) => {
      const securityContext = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        timestamp: new Date(),
        headers: this.sanitizeHeaders(req.headers)
      };

      // Check for suspicious patterns
      this.detectSuspiciousActivity(securityContext);

      // Log security-relevant requests
      if (this.isSecurityRelevant(req)) {
        this.logSecurityEvent('request', securityContext);
      }

      next();
    };
  }

  // Detect suspicious activities
  detectSuspiciousActivity(context) {
    const suspiciousPatterns = [
      // SQL injection attempts
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE)\b)/i,
      // XSS attempts
      /<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>/gi,
      // Path traversal
      /..//g,
      // Command injection
      /[;&|`$()]/g
    ];

    const userAgent = context.userAgent || '';
    const path = context.path || '';

    // Check for suspicious patterns in path
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(path) || pattern.test(userAgent)) {
        this.handleSuspiciousActivity(context, 'suspicious_pattern');
        break;
      }
    }

    // Check for rapid requests from same IP
    this.checkRapidRequests(context.ip);

    // Check for unusual user agents
    if (this.isUnusualUserAgent(userAgent)) {
      this.handleSuspiciousActivity(context, 'unusual_user_agent');
    }
  }

  handleSuspiciousActivity(context, type) {
    const key = `${context.ip}_${type}`;
    const current = this.suspiciousActivities.get(key) || 0;
    this.suspiciousActivities.set(key, current + 1);

    logWarn('Suspicious activity detected', {
      type,
      context,
      count: current + 1
    });

    // Block IP if too many suspicious activities
    if (current + 1 >= 5) {
      this.blockedIPs.add(context.ip);
      logError('IP blocked due to suspicious activity', {
        ip: context.ip,
        type,
        count: current + 1
      });
    }
  }

  // IP blocking middleware
  ipBlockingMiddleware() {
    return (req, res, _next) => {
      if (this.blockedIPs.has(req.ip)) {
        logWarn('Blocked IP attempted access', { ip: req.ip });
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP has been temporarily blocked due to suspicious activity'
        });
      }
      next();
    };
  }

  // CSRF protection
  csrfProtection() {
    return (req, res, _next) => {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.headers['x-csrf-token'] || req.body._csrf;
        const sessionToken = req.session?.csrfToken;

        if (!token || !sessionToken || token !== sessionToken) {
          logWarn('CSRF token validation failed', {
            ip: req.ip,
            method: req.method,
            path: req.path
          });

          return res.status(403).json({
            error: 'CSRF token validation failed'
          });
        }
      }
      next();
    };
  }

  // Generate CSRF token
  generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // API key authentication
  apiKeyAuth() {
    return async (req, res, _next) => {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({
          error: 'API key required'
        });
      }

      try {
        // Validate API key (implement your validation logic)
        const isValid = await this.validateApiKey(apiKey);
        
        if (!isValid) {
          logWarn('Invalid API key used', {
            ip: req.ip,
            apiKey: apiKey.substring(0, 8) + '...'
          });

          return res.status(401).json({
            error: 'Invalid API key'
          });
        }

        next();
      } catch (error) {
        logError('API key validation error', { error: error.message });
        return res.status(500).json({
          error: 'Authentication error'
        });
      }
    };
  }

  // Validate API key (implement based on your storage)
  async validateApiKey(apiKey) {
    // This would typically check against a database
    // For now, return true for valid format
    return /^sk_[a-zA-Z0-9]{32}$/.test(apiKey);
  }

  // Security headers middleware
  securityHeaders() {
    return (req, res, _next) => {
      // Custom security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // Remove server information
      res.removeHeader('X-Powered-By');
      res.setHeader('Server', 'Sentia-Enterprise');

      next();
    };
  }

  // Utility methods
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  isSecurityRelevant(req) {
    const securityPaths = ['/auth', '/admin', '/api/users', '/api/settings'];
    return securityPaths.some(path => req.path.startsWith(path));
  }

  isUnusualUserAgent(userAgent) {
    const commonBots = ['curl', 'wget', 'python-requests', 'postman'];
    return commonBots.some(bot => userAgent.toLowerCase().includes(bot));
  }

  checkRapidRequests(ip) {
    // Implementation for rapid request detection
    // This would typically use a sliding window counter
  }

  logSecurityEvent(type, context) {
    this.securityEvents.push({
      type,
      context,
      timestamp: new Date()
    });

    // Keep only last 1000 events in memory
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    logInfo('Security event logged', { type, ip: context.ip });
  }

  // Get security metrics
  getSecurityMetrics() {
    return {
      blockedIPs: Array.from(this.blockedIPs),
      suspiciousActivities: Object.fromEntries(this.suspiciousActivities),
      recentEvents: this.securityEvents.slice(-100),
      timestamp: new Date()
    };
  }

  // Clean up old data
  cleanup() {
    // Clear old suspicious activities (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [key, timestamp] of this.suspiciousActivities.entries()) {
      if (timestamp < oneHourAgo) {
        this.suspiciousActivities.delete(key);
      }
    }

    // Clear old security events
    this.securityEvents = this.securityEvents.slice(-500);
  }
}

// Export singleton instance
let securityFramework = null;

export const getSecurityFramework = () => {
  if (!securityFramework) {
    securityFramework = new EnterpriseSecurityFramework();
  }
  return securityFramework;
};

export default {
  EnterpriseSecurityFramework,
  getSecurityFramework
};


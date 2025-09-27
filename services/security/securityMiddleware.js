/**
 * Enterprise-Grade Security Middleware
 * Implements OWASP compliance, rate limiting, and comprehensive protection
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import { body, validationResult, param, query } from 'express-validator';
import csrf from 'csrf';
import crypto from 'crypto';
import logger from '../logger.js';

// Initialize CSRF token generator
const csrfTokens = new csrf();

/**
 * Security Headers Configuration (OWASP Compliant)
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://js.sentry-cdn.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled components
        "https://fonts.googleapis.com"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://api.railway.app",
        "https://*.sentry.io",
        "wss://",
        "ws://localhost:*"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for some resources
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  originAgentCluster: true,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  ieNoOpen: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

/**
 * Rate Limiting Configurations
 */

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * _1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again _later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * _1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again _later.',
  handler: (req, res) => {
    logger.error(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiting for data uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: 'Upload limit exceeded, please try again later.'
});

// Rate limiting for AI/forecasting endpoints
export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 AI requests per 5 minutes
  message: 'AI request limit exceeded, please try again later.'
});

/**
 * MongoDB Injection Protection
 */
export const mongoSanitizer = mongoSanitize({
  replaceWith: _'_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Potential MongoDB injection attempt from IP: ${req.ip}, key: ${key}`);
  }
});

/**
 * XSS Protection Middleware
 */
export const xssProtection = (req, res, _next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    });
  }

  // Sanitize params
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = xss(req.params[key]);
      }
    });
  }

  next();
};

/**
 * CSRF Protection
 */
class CSRFProtection {
  constructor() {
    this.secret = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
    this.tokens = new Map(); // Store tokens with expiry
  }

  generateToken(sessionId) {
    const token = csrfTokens.create(this.secret);
    const expiry = Date.now() + 3600000; // 1 hour expiry
    
    this.tokens.set(`${sessionId}-${token}`, expiry);
    
    // Clean expired tokens
    this.cleanExpiredTokens();
    
    return token;
  }

  verifyToken(sessionId, token) {
    const key = `${sessionId}-${token}`;
    const expiry = this.tokens.get(key);
    
    if (!expiry || Date.now() > expiry) {
      return false;
    }
    
    const isValid = csrfTokens.verify(this.secret, token);
    
    if (isValid) {
      this.tokens.delete(key); // Single use token
    }
    
    return isValid;
  }

  cleanExpiredTokens() {
    const now = Date.now();
    for (const [key, expiry] of this.tokens.entries()) {
      if (now > expiry) {
        this.tokens.delete(key);
      }
    }
  }

  middleware() {
    return (req, res, _next) => {
      // Skip CSRF for GET requests and API endpoints that use JWT
      if (req.method === 'GET' || req.path.startsWith('/api/public')) {
        return next();
      }

      const token = req.headers['x-csrf-token'] || req.body._csrf;
      const sessionId = req.session?.id || req.ip;

      if (!token || !this.verifyToken(sessionId, token)) {
        logger.warn(`CSRF token validation failed for IP: ${req.ip}`);
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }

      next();
    };
  }

  getTokenEndpoint() {
    return (req, res) => {
      const sessionId = req.session?.id || req.ip;
      const token = this.generateToken(sessionId);
      res.json({ csrfToken: token });
    };
  }
}

export const csrfProtection = new CSRFProtection();

/**
 * Input Validation Rules
 */
export const validationRules = {
  // User input validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  password: body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  
  username: body('username')
    .isAlphanumeric()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 alphanumeric characters'),
  
  // Data validation
  market: body('market')
    .isIn(['UK', 'USA', 'EU', 'ASIA'])
    .withMessage('Invalid market selection'),
  
  product: body('product')
    .matches(/^[a-zA-Z0-9\s-]+$/)
    .isLength({ max: 100 })
    .withMessage('Invalid product name'),
  
  quantity: body('quantity')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Quantity must be between 0 and 1,000,000'),
  
  date: body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  // Query validation
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  // Param validation
  id: param('id')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Invalid ID format')
};

/**
 * Validation Error Handler
 */
export const handleValidationErrors = (req, res, _next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn(`Validation errors from IP ${req.ip}: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * SQL Injection Protection
 */
export const sqlInjectionProtection = (req, res, _next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
    /(--|\||;|/*|*/|xp_|sp_|0x)/gi,
    /(\bEXEC(\s|()|EXECUTE(\s|())/gi
  ];

  const checkForSQLInjection = (value) => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  // Check all inputs
  const inputs = { ...req.body, ...req.query, ...req.params };
  
  for (const [key, value] of Object.entries(inputs)) {
    if (checkForSQLInjection(value)) {
      logger.error(`SQL injection attempt from IP ${req.ip}, key: ${key}, value: ${value}`);
      return res.status(403).json({ error: 'Forbidden - Invalid input detected' });
    }
  }

  next();
};

/**
 * File Upload Security
 */
export const fileUploadSecurity = {
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  validateFile: (file) => {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    if (!fileUploadSecurity.allowedMimeTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    if (file.size > fileUploadSecurity.maxFileSize) {
      return { valid: false, error: 'File size exceeds limit' };
    }
    
    // Check file extension matches MIME type
    const ext = file.originalname.split('.').pop().toLowerCase();
    const validExtensions = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'application/pdf': ['pdf'],
      'text/csv': ['csv'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx']
    };
    
    const allowedExts = validExtensions[file.mimetype] || [];
    if (!allowedExts.includes(ext)) {
      return { valid: false, error: 'File extension does not match MIME type' };
    }
    
    return { valid: true };
  }
};

/**
 * IP Blocking Middleware
 */
class IPBlocker {
  constructor() {
    this.blockedIPs = new Set();
    this.attempts = new Map();
    this.maxAttempts = 10;
    this.blockDuration = 3600000; // 1 hour
  }

  recordAttempt(ip) {
    const current = this.attempts.get(ip) || { count: 0, firstAttempt: Date.now() };
    current.count++;
    this.attempts.set(ip, current);

    if (current.count >= this.maxAttempts) {
      this.blockIP(ip);
      return true;
    }
    return false;
  }

  blockIP(ip) {
    this.blockedIPs.add(ip);
    logger.error(`IP blocked due to suspicious activity: ${ip}`);
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      this.attempts.delete(ip);
      logger.info(`IP unblocked: ${ip}`);
    }, this.blockDuration);
  }

  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  middleware() {
    return (req, res, _next) => {
      const ip = req.ip;
      
      if (this.isBlocked(ip)) {
        logger.warn(`Blocked IP attempted access: ${ip}`);
        return res.status(403).json({ error: 'Access denied' });
      }
      
      next();
    };
  }
}

export const ipBlocker = new IPBlocker();

/**
 * Security Event Logger
 */
export const logSecurityEvent = (eventType, req, details = _{}) => {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ...details
  };

  logger.security(event);

  // Check for suspicious patterns
  if (eventType === 'FAILED_AUTH' || eventType === 'INVALID_TOKEN') {
    ipBlocker.recordAttempt(req.ip);
  }
};

/**
 * Combined Security Middleware
 */
export const enterpriseSecurityMiddleware = [
  securityHeaders,
  ipBlocker.middleware(),
  mongoSanitizer,
  xssProtection,
  sqlInjectionProtection
];

export default {
  securityHeaders,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter,
  mongoSanitizer,
  xssProtection,
  csrfProtection,
  validationRules,
  handleValidationErrors,
  sqlInjectionProtection,
  fileUploadSecurity,
  ipBlocker,
  logSecurityEvent,
  enterpriseSecurityMiddleware
};
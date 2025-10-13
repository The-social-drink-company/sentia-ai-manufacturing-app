// Security Configuration Module
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import crypto from 'crypto';
import { logger } from '../logging/logger.js';

// Environment-specific security settings
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// CORS Configuration
export const corsOptions = {
  origin: (origin, _callback) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);
    
    // Add default origins
    if (isDevelopment) {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000');
    }
    
    // Allow requests with no origin (mobile apps, Postman, etc.) in dev
    if (!origin && isDevelopment) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'Link'],
  maxAge: 86400 // 24 hours
};

// Helmet Configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some React features
        'https://cdn.clerk.io',
        'https://cdn.jsdelivr.net'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        'https://fonts.googleapis.com'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      connectSrc: [
        "'self'",
        'https://api.clerk.io',
        'https://*.railway.app',
        'wss://*.railway.app', // WebSocket connections
        process.env.API_BASE_URL
      ].filter(Boolean),
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
      blockAllMixedContent: []
    }
  } : false,
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  ieNoOpen: true,
  dnsPrefetchControl: { allow: false },
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Rate Limiting Configurations
export const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait before making another request',
        retryAfter: res.getHeader('Retry-After')
      });
    }
  };
  
  return rateLimit({ ...defaults, ...options });
};

// API-specific rate limiters
export const apiLimiter = createRateLimiter({
  max: isProduction ? 100 : 1000
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts'
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded'
});

export const exportLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 exports per 5 minutes
  message: 'Export limit exceeded'
});

// Webhook signature verification
export const verifyWebhookSignature = (_secret, body, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

// Request sanitization middleware
export const sanitizeRequest = (req, res, _next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Remove any script tags or potential XSS vectors
        req.query[key] = req.query[key]
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }
  
  // Sanitize body if it exists
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key]
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    sanitizeObject(req.body);
  }
  
  next();
};

// Session security configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  name: process.env.SESSION_NAME || 'sentia_session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true' || isProduction,
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'strict' : 'lax')
  },
  rolling: true, // Reset expiry on activity
  genid: () => {
    return crypto.randomBytes(32).toString('hex');
  }
};

// API Key validation middleware
export const validateApiKey = (req, res, _next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key format
  if (!/^[a-zA-Z0-9-_]{32,}$/.test(apiKey)) {
    logger.warn('Invalid API key format', { apiKey: apiKey.substring(0, 8) + '...' });
    return res.status(401).json({ error: 'Invalid API key format' });
  }
  
  // TODO: Validate against database
  req.apiKey = apiKey;
  next();
};

// IP allowlist middleware
export const ipAllowlist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0 || isDevelopment) {
      return next();
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP not in allowlist', { ip: clientIP });
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req, res, _next) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove fingerprinting headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

// Audit logging middleware
export const auditLog = (_action) => {
  return (req, res, _next) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      user: req.user?.id || 'anonymous',
      ip: req.ip,
      method: req.method,
      path: req.path,
      query: req.query,
      userAgent: req.get('user-agent')
    };
    
    logger.info('Audit log', auditEntry);
    
    // Store audit log in database (async, don't block request)
    process.nextTick(async () => {
      try {
        // TODO: Store in database
      } catch (error) {
        logger.error('Failed to store audit log', error);
      }
    });
    
    next();
  };
};

export default {
  corsOptions,
  helmetConfig,
  createRateLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  exportLimiter,
  verifyWebhookSignature,
  sanitizeRequest,
  sessionConfig,
  validateApiKey,
  ipAllowlist,
  securityHeaders,
  auditLog
};
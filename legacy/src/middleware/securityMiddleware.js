// Enterprise Security Middleware
// Advanced security features including CSP, rate limiting, and threat detection

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import mongoose from 'mongoose';
import { logInfo, logWarn, logError } from '../services/observability/structuredLogger.js';

// Content Security Policy configuration
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "'unsafe-eval'", // Required for some React features
      "https://cdnjs.cloudflare.com",
      "https://unpkg.com",
      "https://cdn.jsdelivr.net",
      "https://api.anthropic.com", // Claude API
      "https://api.openai.com", // OpenAI API
      process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : null
    ].filter(Boolean),
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS libraries
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com"
    ],
    imgSrc: [
      "'self'",
      "data:", // For base64 images
      "blob:", // For generated images
      "https:", // Allow all HTTPS images
      "https://via.placeholder.com", // Placeholder images
      "https://images.unsplash.com", // Stock photos
      "https://cdn.jsdelivr.net"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com",
      "data:"
    ],
    connectSrc: [
      "'self'",
      "https://api.anthropic.com", // Claude API
      "https://api.openai.com", // OpenAI API
      "https://api.xero.com", // Xero API
      "https://api.shopify.com", // Shopify API
      "https://sellingpartnerapi-na.amazon.com", // Amazon SP API
      "https://api.unleashed.com", // Unleashed API
      "https://api.railway.app", // Railway API
      process.env.NODE_ENV === 'development' ? "ws://localhost:*" : null,
      process.env.NODE_ENV === 'development' ? "http://localhost:*" : null
    ].filter(Boolean),
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    childSrc: ["'none'"],
    workerSrc: ["'self'", "blob:"],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
  },
  reportOnly: process.env.NODE_ENV === 'development'
};

// Rate limiting configurations
export const rateLimitConfigs = {
  // General API rate limiting
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests from rate limiting
    skip: (req, res) => res.statusCode < 400,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    }
  },
  
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 10, // Only 10 login attempts per 15 minutes
    message: {
      error: 'Authentication rate limit exceeded',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true
  },
  
  // Data import endpoints - moderate limits
  dataImport: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 imports per hour
    message: {
      error: 'Data import rate limit exceeded',
      message: 'Too many data import requests. Please try again later.',
      retryAfter: '1 hour'
    }
  },
  
  // Real-time endpoints - high limits
  realTime: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute for real-time data
    message: {
      error: 'Real-time data rate limit exceeded',
      message: 'Too many real-time requests. Please slow down.',
      retryAfter: '1 minute'
    }
  }
};

// Advanced rate limiter using Redis (fallback to memory)
let rateLimiter;
let authLimiter;
let dataImportLimiter;

export const initializeRateLimiters = async (redisClient) => {
  try {
    if (redisClient) {
      // Use Redis-based rate limiters for distributed systems
      rateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:api',
        points: 1000, // Number of requests
        duration: 900, // Per 15 minutes (900 seconds)
        blockDuration: 900, // Block for 15 minutes
        execEvenly: true // Execute requests evenly across duration
      });

      authLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:auth',
        points: 10,
        duration: 900,
        blockDuration: 900
      });

      dataImportLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:import',
        points: 50,
        duration: 3600, // 1 hour
        blockDuration: 3600
      });

      logInfo('Redis rate limiters initialized successfully');
    } else {
      throw new Error('Redis not available');
    }
  } catch (error) {
    logWarn('Redis unavailable, using memory-based rate limiters', { error: error.message });
    
    // Fallback to memory-based rate limiters
    rateLimiter = new RateLimiterMemory({
      keyPrefix: 'rl:api',
      points: 1000,
      duration: 900,
      blockDuration: 900,
      execEvenly: true
    });

    authLimiter = new RateLimiterMemory({
      keyPrefix: 'rl:auth',
      points: 10,
      duration: 900,
      blockDuration: 900
    });

    dataImportLimiter = new RateLimiterMemory({
      keyPrefix: 'rl:import',
      points: 50,
      duration: 3600,
      blockDuration: 3600
    });
  }
};

// Advanced rate limiting middleware
export const createAdvancedRateLimit = (limiterType = 'api') => {
  return async (req, res, next) => {
    try {
      let limiter;
      
      switch (limiterType) {
        case 'auth':
          limiter = authLimiter;
          break;
        case 'dataImport':
          limiter = dataImportLimiter;
          break;
        default:
          limiter = rateLimiter;
      }

      if (!limiter) {
        logError('Rate limiter not initialized', { limiterType });
        return next();
      }

      const key = req.user?.id || req.ip;
      
      try {
        await limiter.consume(key);
        
        // Add rate limit headers
        const resRateLimiter = await limiter.get(key);
        const remainingPoints = resRateLimiter ? resRateLimiter.remainingPoints : limiter.points;
        const msBeforeNext = resRateLimiter ? resRateLimiter.msBeforeNext : 0;
        
        res.set({
          'X-RateLimit-Limit': limiter.points,
          'X-RateLimit-Remaining': Math.max(0, remainingPoints),
          'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString()
        });
        
        next();
      } catch (rejRes) {
        // Rate limit exceeded
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        
        logWarn('Rate limit exceeded', {
          ip: req.ip,
          userId: req.user?.id,
          limiterType,
          remainingPoints: rejRes.remainingPoints || 0,
          msBeforeNext: rejRes.msBeforeNext || 0
        });
        
        res.set({
          'X-RateLimit-Limit': limiter.points,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
          'Retry-After': secs
        });
        
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${secs} seconds.`,
          retryAfter: secs
        });
      }
    } catch (error) {
      logError('Rate limiting error', { error: error.message, limiterType });
      next(); // Continue on error to avoid blocking legitimate requests
    }
  };
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false, // May interfere with some APIs
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

// Request sanitization middleware
export const sanitizeRequest = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          // Remove potential XSS and injection attempts
          req.query[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        }
      }
    }

    // Sanitize request body (for JSON requests)
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    next();
  } catch (error) {
    logError('Request sanitization error', { error: error.message });
    next();
  }
};

// Recursive object sanitization
const sanitizeObject = (obj) => {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      obj[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitizeObject(value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string') {
          value[index] = item
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        } else if (typeof item === 'object' && item !== null) {
          sanitizeObject(item);
        }
      });
    }
  }
};

// IP whitelisting middleware for admin endpoints
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development' && 
        (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.includes('localhost'))) {
      return next();
    }
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logWarn('IP access denied', { clientIP, allowedIPs });
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource'
      });
    }
    
    next();
  };
};

// Request logging middleware with threat detection
export const securityLogging = (req, res, next) => {
  const startTime = Date.now();
  
  // Detect potential threats
  const suspiciousPatterns = [
    /(\.\.|\/etc\/passwd|\/etc\/shadow)/i, // Path traversal
    /(union\s+select|drop\s+table|delete\s+from)/i, // SQL injection
    /(<script|javascript:|vbscript:|onload=|onerror=)/i, // XSS
    /(cmd=|exec\(|system\(|shell_exec)/i, // Command injection
    /(\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c)/i // Directory traversal
  ];
  
  const requestString = `${req.method} ${req.url} ${JSON.stringify(req.body || {})} ${JSON.stringify(req.query || {})}`;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));
  
  if (isSuspicious) {
    logWarn('Suspicious request detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      suspicious: true
    });
  }

  // Log security events
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (res.statusCode >= 400 || isSuspicious) {
      logInfo('Security event', {
        ip: req.ip,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        suspicious: isSuspicious
      });
    }
  });
  
  next();
};

// CORS configuration for manufacturing APIs
export const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://sentia-manufacturing-dashboard-development.up.railway.app',
      'https://sentiatest.financeflo.ai',
      'https://sentia-manufacturing-dashboard-production.up.railway.app',
      process.env.FRONTEND_URL,
      process.env.VITE_APP_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logWarn('CORS origin rejected', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key',
    'X-Client-Version'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

export default {
  securityHeaders,
  createAdvancedRateLimit,
  sanitizeRequest,
  ipWhitelist,
  securityLogging,
  corsConfig,
  initializeRateLimiters
};

// Enterprise Security Middleware for Manufacturing Dashboard
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Rate limiting configurations per endpoint
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit auth attempts
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true
});

export const amazonApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Conservative limit for Amazon SP-API
  message: 'Amazon API rate limit exceeded',
  keyGenerator: (req) => `amazon-${req.ip}-${req.user?.id || 'anonymous'}`
});

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration for enterprise deployment
export const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://sentia-manufacturing.railway.app',
      'https://test.sentia-manufacturing.railway.app', 
      'https://dev.sentia-manufacturing.railway.app',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ]
});

// IP allowlisting for sensitive operations
export const ipAllowlist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      next();
    } else {
      res.status(403).json({ 
        error: 'Access denied from this IP address',
        ip: clientIP
      });
    }
  };
};

// API key validation middleware
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // In production, validate against encrypted keys in database
  const validKeys = [
    process.env.INTERNAL_API_KEY,
    process.env.DASHBOARD_API_KEY
  ].filter(Boolean);
  
  if (validKeys.includes(apiKey)) {
    next();
  } else {
    res.status(403).json({ error: 'Invalid API key' });
  }
};

// Request logging middleware for security auditing
export const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = req.ip;
  
  console.log(`[${timestamp}] SECURITY: ${req.method} ${req.path} - IP: ${ip} - UA: ${userAgent}`);
  
  // Log failed authentication attempts
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.log(`[${timestamp}] SECURITY_ALERT: ${res.statusCode} - ${req.method} ${req.path} - IP: ${ip}`);
    }
  });
  
  next();
};

// Enterprise middleware stack
export const enterpriseSecurityStack = [
  securityLogger,
  securityHeaders,
  corsConfig,
  apiRateLimit
];
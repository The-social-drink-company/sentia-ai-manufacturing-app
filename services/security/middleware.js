import crypto from 'crypto';
import helmet from 'helmet';
import { logWarn, logError, logSecurityEvent } from '../observability/structuredLogger.js';

// Security configuration
const SECURITY_CONFIG = {
  ENABLE_HSTS: process.env.ENABLE_HSTS === 'true',
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [],
  CSP_NONCE_MODE: process.env.CSP_NONCE_MODE === 'true',
  WEBHOOK_IP_ALLOWLIST: process.env.WEBHOOK_IP_ALLOWLIST?.split(',') || [],
  ENABLE_CSRF: process.env.ENABLE_CSRF !== 'false',
  MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || '10mb',
  TRUSTED_PROXIES: process.env.TRUSTED_PROXIES?.split(',') || ['loopback', 'linklocal', 'uniquelocal']
};

// Generate CSP nonce
export const generateCSPNonce = () => {
  return crypto.randomBytes(16).toString('base64');
};

// Enhanced security headers middleware
export const securityHeaders = () => {
  return (req, res, _next) => {
    // Generate and attach CSP nonce if enabled
    if (SECURITY_CONFIG.CSP_NONCE_MODE) {
      res.locals.cspNonce = generateCSPNonce();
    }
    
    // Apply helmet with custom configuration
    const helmetConfig = {
      contentSecurityPolicy: SECURITY_CONFIG.CSP_NONCE_MODE ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for React
            SECURITY_CONFIG.CSP_NONCE_MODE ? `'nonce-${res.locals.cspNonce}'` : null,
            'https://cdn.clerk.io',
            'https://clerk.sentia-manufacturing.railway.app'
          ].filter(Boolean),
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for styled-components
            'https://fonts.googleapis.com'
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: [
            "'self'",
            'https://api.clerk.io',
            'https://*.clerk.accounts.dev',
            'https://api.unleashedsoftware.com',
            'wss://*.railway.app',
            ...SECURITY_CONFIG.CORS_ALLOWED_ORIGINS
          ],
          frameSrc: ["'self'", 'https://accounts.clerk.io'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
      } : false,
      hsts: SECURITY_CONFIG.ENABLE_HSTS ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false,
      crossOriginEmbedderPolicy: false, // Can break some integrations
      crossOriginResourcePolicy: { policy: "cross-origin" }
    };
    
    helmet(helmetConfig)(req, res, () => {
      // Additional security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      // Add security headers for production
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Expect-CT', 'max-age=86400, enforce');
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      }
      
      next();
    });
  };
};

// Webhook signature verification
export const verifyWebhookSignature = (secret, signatureHeader = 'x-webhook-signature') => {
  return (req, res, next) => {
    const signature = req.headers[signatureHeader];
    
    if (!signature) {
      logSecurityEvent('Webhook signature missing', 'medium', {
        path: req.path,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Webhook signature required' });
    }
    
    // Compute expected signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    // Timing-safe comparison
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      logSecurityEvent('Invalid webhook signature', 'high', {
        path: req.path,
        ip: req.ip,
        providedSignature: signature.substring(0, 10) + '...'
      });
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    next();
  };
};

// IP allowlist middleware for webhooks
export const webhookIPAllowlist = (allowlist = SECURITY_CONFIG.WEBHOOK_IP_ALLOWLIST) => {
  return (req, res, _next) => {
    if (!allowlist || allowlist.length === 0) {
      // No allowlist configured, allow all
      return next();
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check if IP is in allowlist
    const isAllowed = allowlist.some(allowedIP => {
      if (allowedIP.includes('*')) {
        // Support wildcard matching
        const pattern = allowedIP.replace(/./g, '\.').replace(/*/g, '.*');
        return new RegExp(`^${pattern}$`).test(clientIP);
      }
      return clientIP === allowedIP;
    });
    
    if (!isAllowed) {
      logSecurityEvent('Webhook from unauthorized IP', 'high', {
        path: req.path,
        ip: clientIP,
        allowlist: allowlist.join(', ')
      });
      return res.status(403).json({ error: 'Unauthorized IP address' });
    }
    
    next();
  };
};

// Request sanitization middleware
export const sanitizeRequest = () => {
  return (req, res, _next) => {
    // Sanitize headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite-url'
    ];
    
    suspiciousHeaders.forEach(header => {
      if (req.headers[header]) {
        logSecurityEvent('Suspicious header detected', 'medium', {
          header,
          value: req.headers[header],
          ip: req.ip
        });
        delete req.headers[header];
      }
    });
    
    // Check for path traversal attempts
    if (req.path.includes('../') || req.path.includes('..\\')) {
      logSecurityEvent('Path traversal attempt', 'high', {
        path: req.path,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    // Sanitize query parameters
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Remove null bytes
        req.query[key] = req.query[key].replace(/\0/g, '');
        
        // Check for SQL injection patterns
        const sqlPatterns = [
          /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
          /(\bOR\b\s*\d+\s*=\s*\d+|\bAND\b\s*\d+\s*=\s*\d+)/i,
          /(--|\#|/*|*/)/
        ];
        
        if (sqlPatterns.some(pattern => pattern.test(req.query[key]))) {
          logSecurityEvent('Potential SQL injection attempt', 'high', {
            parameter: key,
            value: req.query[key].substring(0, 50),
            ip: req.ip
          });
          return res.status(400).json({ error: 'Invalid parameter' });
        }
      }
    });
    
    next();
  };
};

// Anti-automation middleware
export const antiAutomation = () => {
  const requestCounts = new Map();
  const WINDOW_MS = 60000; // 1 minute
  const MAX_REQUESTS = 100;
  const SUSPICIOUS_PATTERNS = [
    /bot|crawler|spider|scraper/i,
    /python|java|ruby|perl|php|curl|wget/i
  ];
  
  return (req, res, _next) => {
    const userAgent = req.headers['user-agent'] || '';
    const clientId = `${req.ip}-${userAgent}`;
    const now = Date.now();
    
    // Check for suspicious user agents
    if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(userAgent))) {
      logSecurityEvent('Suspicious user agent detected', 'low', {
        userAgent,
        ip: req.ip
      });
      
      // Add rate limiting for suspicious agents
      res.setHeader('X-RateLimit-Limit', '10');
    }
    
    // Track request patterns
    if (!requestCounts.has(clientId)) {
      requestCounts.set(clientId, []);
    }
    
    const requests = requestCounts.get(clientId);
    const recentRequests = requests.filter(time => now - time < WINDOW_MS);
    recentRequests.push(now);
    
    requestCounts.set(clientId, recentRequests);
    
    // Check for automated behavior
    if (recentRequests.length > MAX_REQUESTS) {
      logSecurityEvent('Potential automation detected', 'medium', {
        requestCount: recentRequests.length,
        window: WINDOW_MS,
        ip: req.ip
      });
      
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil(WINDOW_MS / 1000)
      });
    }
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, times] of requestCounts.entries()) {
        const recent = times.filter(time => now - time < WINDOW_MS * 2);
        if (recent.length === 0) {
          requestCounts.delete(key);
        } else {
          requestCounts.set(key, recent);
        }
      }
    }
    
    next();
  };
};

// CSRF token generation and validation
export const csrfProtection = () => {
  const tokens = new Map();
  const TOKEN_EXPIRY = 3600000; // 1 hour
  
  return {
    generateToken: (req, res, _next) => {
      if (!SECURITY_CONFIG.ENABLE_CSRF) {
        return next();
      }
      
      const token = crypto.randomBytes(32).toString('hex');
      const sessionId = req.session?.id || req.ip;
      
      tokens.set(sessionId, {
        token,
        expires: Date.now() + TOKEN_EXPIRY
      });
      
      res.locals.csrfToken = token;
      next();
    },
    
    validateToken: (req, res, _next) => {
      if (!SECURITY_CONFIG.ENABLE_CSRF) {
        return next();
      }
      
      // Skip for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }
      
      const sessionId = req.session?.id || req.ip;
      const providedToken = req.headers['x-csrf-token'] || req.body._csrf;
      const storedData = tokens.get(sessionId);
      
      if (!storedData || !providedToken) {
        logSecurityEvent('CSRF token missing', 'medium', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(403).json({ error: 'CSRF token required' });
      }
      
      if (storedData.expires < Date.now()) {
        tokens.delete(sessionId);
        logSecurityEvent('CSRF token expired', 'low', {
          path: req.path,
          ip: req.ip
        });
        return res.status(403).json({ error: 'CSRF token expired' });
      }
      
      if (!crypto.timingSafeEqual(
        Buffer.from(providedToken),
        Buffer.from(storedData.token)
      )) {
        logSecurityEvent('Invalid CSRF token', 'high', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      
      next();
    }
  };
};

// Security audit logging
export const auditLog = () => {
  return (req, res, _next) => {
    // Log security-relevant actions
    const auditableActions = [
      '/api/admin',
      '/api/auth',
      '/api/users',
      '/api/settings'
    ];
    
    if (auditableActions.some(path => req.path.startsWith(path))) {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action: `${req.method} ${req.path}`,
        user: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        result: 'pending'
      };
      
      // Attach audit entry to response for logging after completion
      res.locals.auditEntry = auditEntry;
      
      // Log after response
      const originalSend = res.send;
      res.send = function(data) {
        res.send = originalSend;
        
        auditEntry.result = res.statusCode < 400 ? 'success' : 'failure';
        auditEntry.statusCode = res.statusCode;
        
        logSecurityEvent('Audit log', 'info', auditEntry);
        
        return res.send(data);
      };
    }
    
    next();
  };
};

// Compose all security middleware
export const setupSecurity = (app) => {
  // Apply security headers
  app.use(securityHeaders());
  
  // Request sanitization
  app.use(sanitizeRequest());
  
  // Anti-automation
  app.use(antiAutomation());
  
  // Audit logging
  app.use(auditLog());
  
  logInfo('Security middleware configured', {
    hsts: SECURITY_CONFIG.ENABLE_HSTS,
    csp: SECURITY_CONFIG.CSP_NONCE_MODE,
    csrf: SECURITY_CONFIG.ENABLE_CSRF,
    webhookIPAllowlist: SECURITY_CONFIG.WEBHOOK_IP_ALLOWLIST.length > 0
  });
};

export default {
  generateCSPNonce,
  securityHeaders,
  verifyWebhookSignature,
  webhookIPAllowlist,
  sanitizeRequest,
  antiAutomation,
  csrfProtection,
  auditLog,
  setupSecurity
};
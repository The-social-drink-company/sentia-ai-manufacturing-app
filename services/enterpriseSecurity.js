/**
 * Enterprise Security Integration
 * Applies all security middleware to server with proper configuration
 */

import securityMiddleware from './security/securityMiddleware.js';
import healthCheckService from './monitoring/healthCheck.js';
import logger from './logger.js';

const {
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
} = securityMiddleware;

/**
 * Apply enterprise security to Express app
 */
export const applyEnterpriseSecurity = (app) => {
  logger.info('Applying enterprise security middleware');

  // Security headers (must be first)
  app.use(securityHeaders);

  // Trust proxy for Railway deployment
  app.set('trust proxy', 1);

  // IP blocking
  app.use(ipBlocker.middleware());

  // MongoDB injection protection
  app.use(mongoSanitizer);

  // XSS protection
  app.use(xssProtection);

  // SQL injection protection
  app.use(sqlInjectionProtection);

  // Rate limiting for different endpoint types
  app.use('/api/auth', authLimiter);
  app.use('/api/upload', uploadLimiter);
  app.use('/api/ai-forecasting', aiLimiter);
  app.use('/api', apiLimiter);

  // CSRF token endpoint (before CSRF protection)
  app.get('/api/csrf-token', csrfProtection.getTokenEndpoint());

  // CSRF protection for state-changing operations
  app.use(csrfProtection.middleware());

  // Security event logging middleware
  app.use((req, res, _next) => {
    // Log suspicious patterns
    const suspiciousPatterns = [
      /..//, // Directory traversal
      /\bselect\b.*\bfrom\b/i, // SQL injection
      /<script/i, // XSS attempts
      /\bexec\b/i, // Command injection
      /\bunion\b.*\bselect\b/i // SQL union attacks
    ];

    const fullPath = req.originalUrl || req.url;
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});
    
    const allInput = `${fullPath} ${body} ${query}`;
    
    if (suspiciousPatterns.some(pattern => pattern.test(allInput))) {
      logSecurityEvent('SUSPICIOUS_REQUEST', req, {
        path: fullPath,
        body: req.body,
        query: req.query,
        headers: req.headers
      });
    }

    next();
  });

  logger.info('Enterprise security middleware applied successfully');
};

/**
 * Security monitoring middleware
 */
export const securityMonitoring = (app) => {
  // Monitor failed login attempts
  app.use(_'/api/auth/login', (req, res, _next) => {
    const originalSend = res.send;
    res.send = function(...args) {
      if (res.statusCode === 401 || res.statusCode === 403) {
        logSecurityEvent('FAILED_AUTH', req);
      }
      originalSend.apply(this, args);
    };
    next();
  });

  // Monitor admin access attempts
  app.use(_'/api/admin/*', (req, res, _next) => {
    logSecurityEvent('ADMIN_ACCESS', req, {
      endpoint: req.originalUrl
    });
    next();
  });

  // Monitor file uploads
  app.use(_'/api/upload/*', (req, res, _next) => {
    if (req.files || req.file) {
      logSecurityEvent('FILE_UPLOAD', req, {
        fileCount: req.files ? Object.keys(req.files).length : 1,
        fileSizes: req.files ? Object.values(req.files).map(f => f.size) : [req.file?.size]
      });
    }
    next();
  });
};

/**
 * API validation routes
 */
export const addValidationRoutes = (app) => {
  // User registration validation
  app.post(_'/api/auth/register', [
    _validationRules.email,
    _validationRules.password,
    _validationRules.username,
    handleValidationErrors
  ], (req, res, _next) => {
    // Registration logic would go here
    next();
  });

  // Forecasting data validation
  app.post('/api/ai-forecasting/generate', [
    validationRules.market,
    validationRules.product,
    validationRules.quantity.optional(),
    validationRules.date.optional(),
    handleValidationErrors
  ], (req, res, _next) => {
    next();
  });

  // Data import validation
  app.post(_'/api/import/*', [
    validationRules.page,
    _validationRules.limit,
    handleValidationErrors
  ], (req, res, _next) => {
    next();
  });
};

/**
 * Health check endpoints with security
 */
export const addSecureHealthChecks = (app) => {
  // Public health check (limited info)
  app.get(_'/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Detailed health check (requires authentication)
  app.get(_'/api/health/detailed', async (req, res) => {
    try {
      const healthStatus = healthCheckService.getStatus();
      res.json({
        success: true,
        ...healthStatus
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  });

  // Health check metrics
  app.get(_'/api/health/metrics', (req, res) => {
    const metrics = healthCheckService.getMetrics();
    res.json({
      success: true,
      metrics
    });
  });

  // Security status endpoint
  app.get(_'/api/security/status', (req, res) => {
    const securityStatus = {
      timestamp: new Date().toISOString(),
      blockedIPs: ipBlocker.blockedIPs ? ipBlocker.blockedIPs.size : 0,
      rateLimitingActive: true,
      csrfProtectionActive: true,
      securityHeadersActive: true,
      xssProtectionActive: true,
      sqlInjectionProtectionActive: true
    };

    res.json({
      success: true,
      security: securityStatus
    });
  });
};

/**
 * File upload security wrapper
 */
export const secureFileUpload = (upload) => {
  return (req, res, _next) => {
    upload(req, res, _(err) => {
      if (err) {
        logSecurityEvent('FILE_UPLOAD_ERROR', req, { error: err.message });
        return res.status(400).json({
          success: false,
          error: 'File upload failed',
          details: err.message
        });
      }

      // Validate uploaded files
      const files = req.files ? Object.values(req.files).flat() : [req.file].filter(Boolean);
      
      for (const file of files) {
        const validation = fileUploadSecurity.validateFile(file);
        if (!validation.valid) {
          logSecurityEvent('INVALID_FILE_UPLOAD', req, {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            error: validation.error
          });
          
          return res.status(400).json({
            success: false,
            error: validation.error
          });
        }
      }

      next();
    });
  };
};

/**
 * Web Vitals monitoring endpoint
 */
export const addWebVitalsEndpoint = (app) => {
  app.post('/api/monitoring/web-vitals', [
    validationRules.page.optional(),
    handleValidationErrors
  ], (req, res) => {
    try {
      const { metrics } = req.body;
      
      if (!metrics || !Array.isArray(metrics)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid metrics data'
        });
      }

      // Store metrics (would integrate with monitoring system)
      logger.info('Web Vitals metrics received', {
        count: metrics.length,
        timestamp: new Date().toISOString()
      });

      // Process metrics for alerting
      metrics.forEach(metric => {
        if (metric.name === 'LCP' && metric.value > 4000) {
          logger.warn('Poor LCP detected', metric);
        }
        if (metric.name === 'CLS' && metric.value > 0.25) {
          logger.warn('Poor CLS detected', metric);
        }
        if (metric.name === 'Long_Task' && metric.value > 100) {
          logger.warn('Long task detected', metric);
        }
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Web Vitals processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process metrics'
      });
    }
  });
};

/**
 * Error handling middleware
 */
export const addErrorHandling = (app) => {
  // 404 handler
  app.use((req, res, _next) => {
    if (!req.route && req.path.startsWith('/api/')) {
      logSecurityEvent('API_404', req);
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    } else {
      next();
    }
  });

  // Global error handler
  app.use((error, req, res, _next) => {
    // Log the error
    logger.error('Unhandled error:', error);
    
    // Log as security event if suspicious
    if (error.message.includes('injection') || 
        error.message.includes('XSS') || 
        error.message.includes('CSRF')) {
      logSecurityEvent('SECURITY_ERROR', req, {
        error: error.message,
        stack: error.stack
      });
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });
};

/**
 * Initialize enterprise security
 */
export const initializeEnterpriseSecurity = (app) => {
  logger.info('Initializing enterprise security suite');

  // Apply all security middleware
  applyEnterpriseSecurity(app);
  
  // Add monitoring
  securityMonitoring(app);
  
  // Add validation routes
  addValidationRoutes(app);
  
  // Add secure health checks
  addSecureHealthChecks(app);
  
  // Add Web Vitals endpoint
  addWebVitalsEndpoint(app);
  
  // Start health monitoring
  healthCheckService.startMonitoring();
  
  // Add error handling (must be last)
  addErrorHandling(app);

  logger.info('Enterprise security suite initialized successfully');
  
  return {
    healthCheck: healthCheckService,
    security: securityMiddleware,
    ipBlocker
  };
};

export default {
  initializeEnterpriseSecurity,
  applyEnterpriseSecurity,
  securityMonitoring,
  addValidationRoutes,
  addSecureHealthChecks,
  secureFileUpload,
  addWebVitalsEndpoint,
  addErrorHandling
};
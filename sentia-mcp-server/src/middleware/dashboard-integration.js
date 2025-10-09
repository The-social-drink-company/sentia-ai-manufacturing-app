/**
 * Dashboard Integration Middleware
 * 
 * Middleware for handling secure communication between the main dashboard
 * and the standalone MCP server.
 */

import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';
import { SERVER_CONFIG } from '../config/server-config.js';
import { AuthenticationError, AuthorizationError } from '../utils/error-handler.js';
import { auditLogger, AUDIT_EVENTS, AUDIT_SEVERITY } from '../utils/audit-logger.js';
import { isDevelopmentEnvironment } from '../config/auth-config.js';

const logger = createLogger();

/**
 * Dashboard authentication middleware
 * Validates JWT tokens from the main dashboard
 */
export async function authenticateDashboard(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const correlationId = req.correlationId;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // CRITICAL: Development bypass for dashboard integration
      if (isDevelopmentEnvironment()) {
        req.dashboardUser = {
          id: 'dev-dashboard-user',
          email: 'dashboard@sentia.com',
          role: 'admin',
          permissions: ['*'],
          source: 'development-dashboard',
          organization: 'development-org'
        };

        logger.debug('Dashboard authentication bypassed in development', {
          correlationId,
          userId: req.dashboardUser.id,
          source: req.dashboardUser.source
        });

        return next();
      }
      
      // Log failed authentication attempt
      await auditLogger.logEvent(AUDIT_EVENTS.AUTH_FAILURE, {
        source: 'dashboard',
        reason: 'missing_authorization_header',
        userAgent: req.headers['user-agent']
      }, {
        severity: AUDIT_SEVERITY.MEDIUM,
        correlationId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        outcome: 'failure'
      });

      throw new AuthenticationError('Dashboard authentication required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, SERVER_CONFIG.security.jwtSecret);
    
    // Validate token structure for dashboard requests
    if (!decoded.source || decoded.source !== 'dashboard') {
      await auditLogger.logEvent(AUDIT_EVENTS.AUTH_FAILURE, {
        source: 'dashboard',
        reason: 'invalid_token_source',
        tokenSource: decoded.source
      }, {
        severity: AUDIT_SEVERITY.HIGH,
        correlationId,
        ipAddress: req.ip,
        outcome: 'failure'
      });

      throw new AuthenticationError('Invalid token source');
    }
    
    req.dashboardUser = decoded;

    // Log successful authentication
    await auditLogger.logEvent(AUDIT_EVENTS.AUTH_SUCCESS, {
      source: 'dashboard',
      userId: decoded.id,
      role: decoded.role,
      organization: decoded.organization
    }, {
      severity: AUDIT_SEVERITY.LOW,
      userId: decoded.id,
      correlationId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      outcome: 'success'
    });

    logger.info('Dashboard authentication successful', {
      correlationId,
      userId: decoded.id,
      role: decoded.role,
      source: decoded.source
    });
    
    next();

  } catch (error) {
    logger.warn('Dashboard authentication failed', {
      correlationId: req.correlationId,
      error: error.message,
      userAgent: req.headers['user-agent']
    });

    // Additional audit logging for different error types
    if (error instanceof jwt.JsonWebTokenError) {
      await auditLogger.logEvent(AUDIT_EVENTS.AUTH_FAILURE, {
        source: 'dashboard',
        reason: 'invalid_jwt_token',
        errorType: error.constructor.name
      }, {
        severity: AUDIT_SEVERITY.MEDIUM,
        correlationId: req.correlationId,
        ipAddress: req.ip,
        outcome: 'failure'
      });

      return res.status(401).json({
        error: 'Invalid authentication token',
        correlationId: req.correlationId
      });
    }

    return res.status(401).json({
      error: error.message,
      correlationId: req.correlationId
    });
  }
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    try {
      const { dashboardUser } = req;
      
      if (!dashboardUser) {
        throw new AuthorizationError('User not authenticated');
      }
      
      // Admin users have all permissions
      if (dashboardUser.role === 'admin' || dashboardUser.permissions.includes('*')) {
        return next();
      }
      
      // Check specific permission
      if (!dashboardUser.permissions.includes(permission)) {
        throw new AuthorizationError(`Permission required: ${permission}`);
      }
      
      next();
      
    } catch (error) {
      logger.warn('Authorization failed', {
        correlationId: req.correlationId,
        userId: req.dashboardUser?.id,
        permission,
        error: error.message
      });
      
      return res.status(403).json({
        error: error.message,
        correlationId: req.correlationId
      });
    }
  };
}

/**
 * Request validation middleware for dashboard integration
 */
export function validateDashboardRequest(req, res, next) {
  const { headers, body } = req;
  
  // CRITICAL: Development mode should be more flexible with headers
  if (isDevelopmentEnvironment()) {
    // Provide default values for missing headers in development
    if (!headers['x-dashboard-version']) {
      headers['x-dashboard-version'] = '2.0.0';
    }
    if (!headers['x-correlation-id']) {
      headers['x-correlation-id'] = req.correlationId || `dev-${Date.now()}`;
    }
  } else {
    // Validate required headers in production
    const requiredHeaders = ['x-dashboard-version', 'x-correlation-id'];
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: 'Missing required headers',
        missingHeaders,
        correlationId: req.correlationId
      });
    }
  }
  
  // Validate dashboard version compatibility
  const dashboardVersion = headers['x-dashboard-version'];
  const serverVersion = SERVER_CONFIG.server.version;
  
  // Simple semantic version check (major version must match)
  const dashboardMajor = dashboardVersion.split('.')[0];
  const serverMajor = serverVersion.split('.')[0];
  
  if (dashboardMajor !== serverMajor) {
    logger.warn('Version compatibility warning', {
      correlationId: req.correlationId,
      dashboardVersion,
      serverVersion
    });
    
    // Don't fail the request, just warn
    res.setHeader('X-Version-Warning', `Dashboard v${dashboardVersion} may not be fully compatible with MCP Server v${serverVersion}`);
  }
  
  // Set dashboard context
  req.dashboardContext = {
    version: dashboardVersion,
    timestamp: new Date().toISOString()
  };
  
  next();
}

/**
 * Rate limiting specifically for dashboard requests
 */
export async function dashboardRateLimit() {
  const { rateLimit } = await import('express-rate-limit');
  
  return rateLimit({
    windowMs: SERVER_CONFIG.security.rateLimitWindow,
    max: SERVER_CONFIG.security.rateLimitMax * 2, // Double limit for dashboard
    message: {
      error: 'Dashboard rate limit exceeded',
      retryAfter: Math.ceil(SERVER_CONFIG.security.rateLimitWindow / 1000)
    },
    keyGenerator: (req) => {
      // Use dashboard user ID if available, otherwise IP
      return req.dashboardUser?.id || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Response enhancement middleware for dashboard integration
 */
export function enhanceDashboardResponse(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to add dashboard-specific metadata
  res.json = function(data) {
    const enhanced = {
      ...data,
      _metadata: {
        mcpServerVersion: SERVER_CONFIG.server.version,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        executionTime: Date.now() - req.startTime
      }
    };
    
    return originalJson(enhanced);
  };
  
  // Track request start time
  req.startTime = Date.now();
  
  next();
}

/**
 * Error handling middleware for dashboard integration
 */
export function handleDashboardErrors(error, req, res, next) {
  logger.error('Dashboard integration error', {
    correlationId: req.correlationId,
    userId: req.dashboardUser?.id,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  // Send dashboard-friendly error response
  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      type: error.constructor.name,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    }
  };
  
  // Add debug info in development
  if (SERVER_CONFIG.server.environment === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error.details || {};
  }
  
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json(errorResponse);
}

/**
 * Health check for dashboard integration
 */
export async function dashboardHealthCheck(req, res) {
  try {
    const health = {
      status: 'healthy',
      mcpServer: {
        version: SERVER_CONFIG.server.version,
        environment: SERVER_CONFIG.server.environment,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      integration: {
        authEnabled: SERVER_CONFIG.security.authRequired,
        corsOrigins: SERVER_CONFIG.cors.origins,
        rateLimit: {
          enabled: SERVER_CONFIG.security.rateLimiting.enabled,
          max: SERVER_CONFIG.security.rateLimitMax,
          window: SERVER_CONFIG.security.rateLimitWindow
        }
      }
    };
    
    res.json(health);
    
  } catch (error) {
    logger.error('Dashboard health check failed', {
      correlationId: req.correlationId,
      error: error.message
    });
    
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
/**
 * Fallback Authentication Middleware
 * Provides basic authentication when Clerk is not configured
 */

import { logInfo, logWarn } from '../../../services/observability/structuredLogger.js';

/**
 * Fallback authentication middleware
 * Used when Clerk keys are not available
 */
export const fallbackAuth = (req, res, next) => {
  try {
    // Allow health endpoints without authentication
    if (req.path.startsWith('/api/health') || 
        req.path.startsWith('/api/metrics') || 
        req.path.startsWith('/api/status')) {
      req.auth = { 
        userId: 'health-check',
        sessionClaims: {
          email: 'system@sentia.com',
          role: 'system'
        }
      };
      req.user = {
        id: 'health-check',
        email: 'system@sentia.com',
        role: 'system'
      };
      return next();
    }

    // For other API endpoints, check for basic auth or API key
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey && apiKey === process.env.API_KEY) {
      // Valid API key
      req.auth = {
        userId: 'api-user',
        sessionClaims: {
          email: 'api@sentia.com',
          role: 'api'
        }
      };
      req.user = {
        id: 'api-user',
        email: 'api@sentia.com',
        role: 'api'
      };
      return next();
    }

    if (authHeader && authHeader.startsWith('Basic ')) {
      // Basic auth fallback
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.auth = {
          userId: username,
          sessionClaims: {
            email: `${username}@sentia.com`,
            role: 'admin'
          }
        };
        req.user = {
          id: username,
          email: `${username}@sentia.com`,
          role: 'admin'
        };
        return next();
      }
    }

    // No valid authentication found
    logWarn('Unauthorized access attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide valid authentication credentials',
      code: 'AUTH_REQUIRED',
      availableMethods: [
        'API Key (X-API-Key header)',
        'Basic Authentication',
        'Clerk Authentication (if configured)'
      ]
    });
  } catch (error) {
    logWarn('Fallback auth error', {
      error: error.message,
      path: req.path
    });
    
    res.status(500).json({
      success: false,
      error: 'Authentication system error',
      code: 'AUTH_SYSTEM_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if authenticated, but doesn't require it
 */
export const optionalFallbackAuth = (req, res, next) => {
  try {
    // Try to authenticate, but don't fail if not authenticated
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey && apiKey === process.env.API_KEY) {
      req.auth = {
        userId: 'api-user',
        sessionClaims: {
          email: 'api@sentia.com',
          role: 'api'
        }
      };
      req.user = {
        id: 'api-user',
        email: 'api@sentia.com',
        role: 'api'
      };
    } else if (authHeader && authHeader.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.auth = {
          userId: username,
          sessionClaims: {
            email: `${username}@sentia.com`,
            role: 'admin'
          }
        };
        req.user = {
          id: username,
          email: `${username}@sentia.com`,
          role: 'admin'
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

/**
 * Health check bypass middleware
 * Allows health endpoints to work without authentication
 */
export const healthBypass = (req, res, next) => {
  if (req.path.startsWith('/api/health') || 
      req.path.startsWith('/api/metrics') || 
      req.path.startsWith('/api/status')) {
    req.auth = { 
      userId: 'health-check',
      sessionClaims: {
        email: 'system@sentia.com',
        role: 'system'
      }
    };
    req.user = {
      id: 'health-check',
      email: 'system@sentia.com',
      role: 'system'
    };
  }
  next();
};

export default fallbackAuth;

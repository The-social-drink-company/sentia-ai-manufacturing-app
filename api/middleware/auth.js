import { requireAuth } from '@clerk/express';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


/**
 * Authentication middleware for API routes
 * Uses Clerk's official Express middleware for authentication
 */
const authenticate = (req, res, _next) => {
  // DEVELOPMENT MODE: Bypass authentication for testing
  if ((process.env.NODE_ENV === 'development' && !process.env.CLERK_SECRET_KEY) || process.env.BYPASS_AUTH === 'true') {
    req.auth = {
      userId: 'dev-user-001',
      sessionId: 'dev-session',
      sessionClaims: {
        metadata: {
          role: 'admin',
          permissions: ['all']
        }
      }
    };
    req.userId = 'dev-user-001';
    req.userRole = 'admin';
    req.permissions = ['all'];
    return next();
  }

  // In production or when Clerk keys are available, use Clerk's requireAuth middleware
  return requireAuth()(req, res, (err) => {
    if (err) {
      logError('Clerk authentication error:', err);
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Set user context from Clerk auth data
    req.userId = req.auth.userId;
    req.userRole = req.auth.sessionClaims?.metadata?.role || 'viewer';
    req.permissions = req.auth.sessionClaims?.metadata?.permissions || [];

    next();
  });
};

/**
 * Role-based access control middleware
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the endpoint
 */
const requireRole = (allowedRoles) => {
  return (req, res, _next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Permission-based access control middleware
 * @param {string} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, _next) => {
    if (!req.permissions || !req.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Missing required permission: ${permission}`
      });
    }

    next();
  };
};

export {
  authenticate,
  requireRole,
  requirePermission
};
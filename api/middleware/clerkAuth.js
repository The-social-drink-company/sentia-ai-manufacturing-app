import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { logError, logInfo } from '../../services/observability/structuredLogger.js';

/**
 * Clerk Express Middleware Configuration
 * Replaces custom JWT verification with official Clerk middleware
 */

// Initialize Clerk middleware with comprehensive configuration
const clerkAuth = clerkMiddleware({
  // Configure publishable key with fallbacks
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || 
                  process.env.CLERK_PUBLISHABLE_KEY || 
                  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
                  'pk_live_REDACTED',
  
  // Configure secret key
  secretKey: process.env.CLERK_SECRET_KEY,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Advanced Clerk configuration
  afterSignInUrl: process.env.VITE_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  afterSignUpUrl: process.env.VITE_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
  
  // Enterprise features
  enableOrganizations: process.env.CLERK_ENABLE_ORGANIZATIONS === 'true',
  enableMultiDomain: process.env.CLERK_ENABLE_MULTI_DOMAIN === 'true',
  
  // Security settings
  enableWebhooks: process.env.CLERK_ENABLE_WEBHOOKS === 'true',
  enableAnalytics: process.env.CLERK_ENABLE_ANALYTICS === 'true',
  enableAuditLogs: process.env.CLERK_ENABLE_AUDIT_LOGS === 'true'
});

/**
 * Require authentication middleware
 * Ensures user is authenticated before accessing protected routes
 */
const requireAuthMiddleware = requireAuth({
  // Custom error handling
  onError: (error, req, res, _next) => {
    logError('Authentication required', {
      error: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please sign in to access this resource',
      code: 'AUTH_REQUIRED'
    });
  }
});

/**
 * Role-based access control middleware
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the endpoint
 */
const requireRole = (allowedRoles) => {
  return (req, res, _next) => {
    try {
      // Get auth from Clerk
      const auth = getAuth(req);
      
      // Check if user is authenticated
      if (!auth?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Get user role from session claims (simplified for now)
      const userRole = auth.sessionClaims?.metadata?.role || 
                      auth.sessionClaims?.publicMetadata?.role || 
                      'viewer';

      // Check if user has required role
      if (!allowedRoles.includes(userRole)) {
        logInfo('Access denied - insufficient role', {
          userId: auth.userId,
          userRole,
          requiredRoles: allowedRoles,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Required role: ${allowedRoles.join(' or ')}. Current role: ${userRole}`,
          code: 'INSUFFICIENT_ROLE'
        });
      }

      // Add role to request for downstream use
      req.userRole = userRole;
      req.auth = auth;
      next();
    } catch (error) {
      logError('Role check error', {
        error: error.message,
        path: req.path
      });

      res.status(500).json({
        success: false,
        error: 'Role verification failed',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Permission-based access control middleware
 * @param {string} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, _next) => {
    try {
      // Get auth from Clerk
      const auth = getAuth(req);
      
      // Check if user is authenticated
      if (!auth?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Get user permissions from session claims
      const userPermissions = auth.sessionClaims?.metadata?.permissions || 
                             auth.sessionClaims?.publicMetadata?.permissions || 
                             [];

      // Check if user has required permission
      if (!userPermissions.includes(permission)) {
        logInfo('Access denied - missing permission', {
          userId: auth.userId,
          userPermissions,
          requiredPermission: permission,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          error: 'Missing required permission',
          message: `Required permission: ${permission}`,
          code: 'MISSING_PERMISSION'
        });
      }

      // Add permissions to request for downstream use
      req.userPermissions = userPermissions;
      req.auth = auth;
      next();
    } catch (error) {
      logError('Permission check error', {
        error: error.message,
        path: req.path
      });

      res.status(500).json({
        success: false,
        error: 'Permission verification failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Adds user info to request if authenticated, but doesn't require authentication
 */
const optionalAuth = (req, res, _next) => {
  // User info will be available in req.auth if authenticated
  // No error thrown if not authenticated
  next();
};

/**
 * Admin role middleware
 * Shorthand for requiring admin role
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Manager role middleware
 * Shorthand for requiring manager or admin role
 */
const requireManager = requireRole(['manager', 'admin', 'super_admin']);

/**
 * User info extraction middleware
 * Extracts and formats user information for downstream use
 */
const extractUserInfo = (req, res, _next) => {
  try {
    // Get auth from Clerk
    const auth = getAuth(req);
    
    if (auth?.userId) {
      // Extract user information from Clerk session
      req.user = {
        id: auth.userId,
        email: auth.sessionClaims?.email,
        role: auth.sessionClaims?.metadata?.role || 
              auth.sessionClaims?.publicMetadata?.role || 
              'viewer',
        permissions: auth.sessionClaims?.metadata?.permissions || 
                    auth.sessionClaims?.publicMetadata?.permissions || 
                    [],
        firstName: auth.sessionClaims?.firstName,
        lastName: auth.sessionClaims?.lastName,
        imageUrl: auth.sessionClaims?.imageUrl,
        lastSignInAt: auth.sessionClaims?.lastSignInAt,
        createdAt: auth.sessionClaims?.createdAt
      };

      // Store auth on request
      req.auth = auth;

      logInfo('User authenticated', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        path: req.path,
        method: req.method
      });
    }
    
    next();
  } catch (error) {
    logError('User info extraction error', {
      error: error.message
    });
    
    // Continue without user info rather than failing
    next();
  }
};

export {
  clerkAuth as clerkMiddleware,
  requireAuthMiddleware as requireAuth,
  requireRole,
  requirePermission,
  optionalAuth,
  requireAdmin,
  requireManager,
  extractUserInfo
};

// Export default middleware for easy import
export default clerkAuth;

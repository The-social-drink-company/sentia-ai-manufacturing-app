import { verifyToken } from '@clerk/backend';

/**
 * Authentication middleware for API routes
 * Verifies JWT tokens from Clerk authentication
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify the token with Clerk
    try {
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

      // Add user info to request
      req.userId = session.sub;
      req.userRole = session.metadata?.role || 'viewer';
      req.permissions = session.metadata?.permissions || [];

      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Role-based access control middleware
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the endpoint
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
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
  return (req, res, next) => {
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
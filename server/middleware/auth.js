import { logWarn, logError } from '../../services/observability/structuredLogger.js'

// Mock authentication middleware (replace with Clerk JWT verification in production)
export function authMiddleware(req, res, next) {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 'dev-user', role: 'admin' }
    return next()
  }

  // In production, verify Clerk JWT token
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    logWarn('Authentication failed: No token provided')
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    // TODO: Implement Clerk JWT verification
    // const user = await verifyClerkToken(token);
    // req.user = user;

    // Mock for now
    req.user = { id: 'mock-user', role: 'admin' }
    next()
  } catch (error) {
    logError('Authentication error', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Role-based access control middleware
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      logWarn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      })
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// Export authenticateToken alias for compatibility
export const authenticateToken = authMiddleware

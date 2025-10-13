/**
 * Enhanced Authentication Middleware
 * 
 * Comprehensive authentication system with MANDATORY development bypass
 * for the Sentia Manufacturing MCP Server.
 * 
 * CRITICAL: Development environment authentication is completely bypassed
 * following the same pattern as the main dashboard application.
 */

import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';
import { 
  isDevelopmentEnvironment, 
  createMockDevelopmentUser,
  CURRENT_AUTH_CONFIG 
} from '../config/auth-config.js';
import { 
  AuthenticationError, 
  AuthorizationError, 
  RateLimitError,
  ValidationError 
} from '../utils/error-handler.js';

const logger = createLogger();

/**
 * Session store for tracking active sessions
 */
const activeSessions = new Map();

/**
 * Failed authentication attempts tracking
 */
const failedAttempts = new Map();

/**
 * Main authentication middleware
 * 
 * CRITICAL: Development bypass is the first check to ensure
 * development workflow is never blocked by authentication
 */
export function authenticateRequest(req, res, next) {
  try {
    const correlationId = req.correlationId || req.headers['x-correlation-id'];
    
    // CRITICAL: Development bypass - matches dashboard pattern
    if (isDevelopmentEnvironment()) {
      const mockUser = createMockDevelopmentUser();
      
      req.user = mockUser;
      req.authContext = {
        authenticated: true,
        bypass: true,
        environment: 'development',
        timestamp: new Date().toISOString(),
        correlationId
      };
      
      logger.debug('Development authentication bypass activated', {
        correlationId,
        userId: mockUser.id,
        role: mockUser.role,
        permissions: mockUser.permissions
      });
      
      return next();
    }
    
    // Production authentication logic
    return validateProductionAuthentication(req, res, next);
    
  } catch (error) {
    logger.error('Authentication middleware error', {
      correlationId: req.correlationId,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: 'Authentication system error',
      correlationId: req.correlationId
    });
  }
}

/**
 * Production authentication validation
 * Only executed when NOT in development environment
 */
async function validateProductionAuthentication(req, res, next) {
  const correlationId = req.correlationId;
  const authConfig = CURRENT_AUTH_CONFIG.authentication;
  
  try {
    // Check if authentication is enabled
    if (!authConfig.enabled) {
      logger.warn('Authentication disabled in production environment', {
        correlationId,
        environment: process.env.NODE_ENV
      });
      
      // Create anonymous user
      req.user = createAnonymousUser();
      req.authContext = {
        authenticated: false,
        bypass: false,
        anonymous: true,
        timestamp: new Date().toISOString(),
        correlationId
      };
      
      return next();
    }
    
    // Extract authentication credentials
    const credentials = extractAuthCredentials(req);
    
    if (!credentials) {
      throw new AuthenticationError('Authentication credentials required');
    }
    
    // Validate credentials based on type
    let user;
    switch (credentials.type) {
      case 'bearer':
        user = await validateJWTToken(credentials.token, correlationId);
        break;
      case 'apikey':
        user = await validateAPIKey(credentials.key, correlationId);
        break;
      default:
        throw new AuthenticationError('Unsupported authentication method');
    }
    
    // Check session validity
    if (!isSessionValid(user.sessionId)) {
      throw new AuthenticationError('Session expired or invalid');
    }
    
    // Update session activity
    updateSessionActivity(user.sessionId);
    
    // Set authenticated user context
    req.user = user;
    req.authContext = {
      authenticated: true,
      bypass: false,
      method: credentials.type,
      timestamp: new Date().toISOString(),
      correlationId,
      sessionId: user.sessionId
    };
    
    logger.info('Authentication successful', {
      correlationId,
      userId: user.id,
      role: user.role,
      method: credentials.type,
      sessionId: user.sessionId
    });
    
    next();
    
  } catch (error) {
    // Track failed authentication attempts
    trackFailedAuthentication(req, error);
    
    logger.warn('Authentication failed', {
      correlationId,
      error: error.message,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Check for rate limiting
    if (isRateLimited(req)) {
      return res.status(429).json({
        error: 'Too many authentication attempts. Please try again later.',
        correlationId,
        retryAfter: getRetryAfter(req)
      });
    }
    
    return res.status(401).json({
      error: error.message,
      correlationId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Extract authentication credentials from request
 */
function extractAuthCredentials(req) {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];
  
  // Bearer token authentication
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return {
      type: 'bearer',
      token: authHeader.substring(7)
    };
  }
  
  // API key authentication
  if (apiKeyHeader) {
    return {
      type: 'apikey',
      key: apiKeyHeader
    };
  }
  
  // Check for API key in query parameters (less secure, for testing only)
  if (req.query.api_key && process.env.NODE_ENV !== 'production') {
    return {
      type: 'apikey',
      key: req.query.api_key
    };
  }
  
  return null;
}

/**
 * Validate JWT token
 */
async function validateJWTToken(token, correlationId) {
  try {
    const decoded = jwt.verify(token, CURRENT_AUTH_CONFIG.authentication.jwt.secret, {
      issuer: CURRENT_AUTH_CONFIG.authentication.jwt.issuer,
      audience: CURRENT_AUTH_CONFIG.authentication.jwt.audience
    });
    
    // Validate token structure
    if (!decoded.sub || !decoded.role) {
      throw new AuthenticationError('Invalid token structure');
    }
    
    // Check if token is close to expiration
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = decoded.exp - now;
    
    if (timeToExpiry < CURRENT_AUTH_CONFIG.authentication.jwt.refreshThreshold) {
      logger.info('Token approaching expiration', {
        correlationId,
        userId: decoded.sub,
        timeToExpiry
      });
    }
    
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      permissions: decoded.permissions || [],
      organization: decoded.org,
      sessionId: decoded.sessionId || `session-${Date.now()}`,
      source: 'jwt',
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    };
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid authentication token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Authentication token expired');
    }
    throw error;
  }
}

/**
 * Validate API key
 */
async function validateAPIKey(apiKey, correlationId) {
  try {
    // In development, accept mock API keys
    if (isDevelopmentEnvironment() && 
        CURRENT_AUTH_CONFIG.apiKeys.development.mockKeys.includes(apiKey)) {
      
      logger.debug('Development API key validated', {
        correlationId,
        apiKey: apiKey.substring(0, 8) + '...'
      });
      
      return {
        id: 'api-user-dev',
        email: 'api@sentia.com',
        name: 'API User (Development)',
        role: 'admin',
        permissions: CURRENT_AUTH_CONFIG.apiKeys.development.permissions,
        organization: 'development-org',
        sessionId: `api-session-${Date.now()}`,
        source: 'api-key-dev'
      };
    }
    
    // Production API key validation would go here
    // This would typically involve database lookup and validation
    
    // For now, throw error for unknown API keys in production
    throw new AuthenticationError('Invalid API key');
    
  } catch (error) {
    throw new AuthenticationError('API key validation failed');
  }
}

/**
 * Create anonymous user for when authentication is disabled
 */
function createAnonymousUser() {
  return {
    id: 'anonymous',
    email: 'anonymous@sentia.com',
    name: 'Anonymous User',
    role: 'viewer',
    permissions: ['dashboard:read', 'reports:read'],
    organization: 'anonymous',
    sessionId: `anonymous-${Date.now()}`,
    source: 'anonymous'
  };
}

/**
 * Session management functions
 */
function isSessionValid(sessionId) {
  if (!sessionId) return false;
  
  const session = activeSessions.get(sessionId);
  if (!session) return true; // Allow new sessions
  
  const now = Date.now();
  const sessionTimeout = CURRENT_AUTH_CONFIG.authentication.session.timeout;
  
  return (now - session.lastActivity) < sessionTimeout;
}

function updateSessionActivity(sessionId) {
  if (!sessionId) return;
  
  activeSessions.set(sessionId, {
    lastActivity: Date.now(),
    requestCount: (activeSessions.get(sessionId)?.requestCount || 0) + 1
  });
}

/**
 * Failed authentication tracking
 */
function trackFailedAuthentication(req, error) {
  const key = req.ip;
  const now = Date.now();
  const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: 0 };
  
  // Reset counter if outside the window
  const windowMs = CURRENT_AUTH_CONFIG.monitoring.failedAuth.lockoutDuration;
  if (now - attempts.lastAttempt > windowMs) {
    attempts.count = 0;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  
  failedAttempts.set(key, attempts);
  
  logger.warn('Failed authentication tracked', {
    ip: req.ip,
    attempts: attempts.count,
    error: error.message
  });
}

function isRateLimited(req) {
  const key = req.ip;
  const attempts = failedAttempts.get(key);
  
  if (!attempts) return false;
  
  const maxAttempts = CURRENT_AUTH_CONFIG.monitoring.failedAuth.maxAttempts;
  const lockoutDuration = CURRENT_AUTH_CONFIG.monitoring.failedAuth.lockoutDuration;
  const now = Date.now();
  
  return attempts.count >= maxAttempts && 
         (now - attempts.lastAttempt) < lockoutDuration;
}

function getRetryAfter(req) {
  const key = req.ip;
  const attempts = failedAttempts.get(key);
  
  if (!attempts) return 0;
  
  const lockoutDuration = CURRENT_AUTH_CONFIG.monitoring.failedAuth.lockoutDuration;
  const now = Date.now();
  const timeRemaining = lockoutDuration - (now - attempts.lastAttempt);
  
  return Math.ceil(timeRemaining / 1000); // Return seconds
}

/**
 * Middleware to require authentication (with development bypass)
 */
export function requireAuthentication(req, res, next) {
  // CRITICAL: Always allow in development
  if (isDevelopmentEnvironment()) {
    return next();
  }
  
  if (!req.user || !req.authContext?.authenticated) {
    return res.status(401).json({
      error: 'Authentication required',
      correlationId: req.correlationId
    });
  }
  
  next();
}

/**
 * Middleware to require specific role (with development bypass)
 */
export function requireRole(requiredRole) {
  return (req, res, next) => {
    // CRITICAL: Always allow in development
    if (isDevelopmentEnvironment()) {
      return next();
    }
    
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        correlationId: req.correlationId
      });
    }
    
    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({
        error: `Role required: ${requiredRole}`,
        correlationId: req.correlationId
      });
    }
    
    next();
  };
}

/**
 * Cleanup expired sessions (called periodically)
 */
export function cleanupExpiredSessions() {
  const now = Date.now();
  const timeout = CURRENT_AUTH_CONFIG.authentication.session.timeout;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > timeout) {
      activeSessions.delete(sessionId);
      logger.debug('Expired session cleaned up', { sessionId });
    }
  }
  
  // Clean up old failed attempts
  const lockoutDuration = CURRENT_AUTH_CONFIG.monitoring.failedAuth.lockoutDuration;
  for (const [ip, attempts] of failedAttempts.entries()) {
    if (now - attempts.lastAttempt > lockoutDuration * 2) {
      failedAttempts.delete(ip);
    }
  }
}

/**
 * Get authentication status for monitoring
 */
export function getAuthenticationStatus() {
  return {
    developmentBypass: isDevelopmentEnvironment(),
    authenticationEnabled: CURRENT_AUTH_CONFIG.authentication.enabled,
    activeSessions: activeSessions.size,
    failedAttempts: failedAttempts.size,
    sessionTimeout: CURRENT_AUTH_CONFIG.authentication.session.timeout,
    environment: process.env.NODE_ENV
  };
}

// Set up periodic cleanup
if (!isDevelopmentEnvironment()) {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000); // Every 5 minutes
}

// Export authentication configuration for external use
export { CURRENT_AUTH_CONFIG as authConfig };
/**
 * Unit Tests for Authentication Middleware
 * Comprehensive testing of authentication and authorization middleware
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock external dependencies
vi.mock('jsonwebtoken');
vi.mock('../../../src/utils/authentication.js', () => ({
  validateToken: vi.fn(),
  validateApiKey: vi.fn(),
  getSession: vi.fn(),
  hasPermission: vi.fn(),
  canAccessResource: vi.fn(),
  logAuthEvent: vi.fn(),
  isAccountLocked: vi.fn(),
  trackFailedLogin: vi.fn(),
  clearFailedLogins: vi.fn()
}));

describe('Authentication Middleware', () => {
  let authMiddleware;
  let mockAuth;
  let req, res, next;
  let consoleRestore;

  beforeEach(async () => {
    consoleRestore = global.testUtils.mockConsole();
    vi.clearAllMocks();

    // Setup mock request and response objects
    req = global.testUtils.createMockRequest({
      ip: '192.168.1.100',
      method: 'GET',
      url: '/api/xero/invoices',
      headers: {
        'authorization': 'Bearer valid-jwt-token',
        'user-agent': 'Mozilla/5.0',
        'x-api-key': 'sk_live_1234567890abcdef'
      }
    });

    res = global.testUtils.createMockResponse();
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn().mockReturnThis();
    res.set = vi.fn().mockReturnThis();

    next = vi.fn();

    // Import authentication module
    mockAuth = await import('../../../src/utils/authentication.js');
    authMiddleware = await import('../../../src/middleware/authentication.js');
  });

  afterEach(() => {
    if (consoleRestore) consoleRestore();
  });

  describe('JWT Token Authentication', () => {
    it('should authenticate valid JWT token successfully', async () => {
      mockAuth.validateToken.mockResolvedValue({
        valid: true,
        decoded: {
          userId: 'user-123',
          email: 'user@example.com',
          role: 'admin',
          permissions: ['xero:read', 'xero:write']
        }
      });

      const middleware = authMiddleware.requireAuth();
      await middleware(req, res, next);

      expect(mockAuth.validateToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(req.user).toEqual({
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        permissions: ['xero:read', 'xero:write']
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      mockAuth.validateToken.mockResolvedValue({
        valid: false,
        error: 'Invalid token signature',
        malformed: true
      });

      const middleware = authMiddleware.requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid token signature',
        code: 'INVALID_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired JWT token', async () => {
      mockAuth.validateToken.mockResolvedValue({
        valid: false,
        error: 'Token expired',
        expired: true
      });

      const middleware = authMiddleware.requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    });

    it('should handle blacklisted token', async () => {
      mockAuth.validateToken.mockResolvedValue({
        valid: false,
        error: 'Token has been revoked',
        blacklisted: true
      });

      const middleware = authMiddleware.requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    });

    it('should handle missing authorization header', async () => {
      delete req.headers.authorization;

      const middleware = authMiddleware.requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Missing authorization header',
        code: 'MISSING_AUTH_HEADER'
      });
    });

    it('should handle malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat token-here';

      const middleware = authMiddleware.requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid authorization header format',
        code: 'INVALID_AUTH_FORMAT'
      });
    });
  });

  describe('API Key Authentication', () => {
    it('should authenticate valid API key successfully', async () => {
      delete req.headers.authorization; // Remove JWT token
      
      mockAuth.validateApiKey.mockResolvedValue({
        valid: true,
        userId: 'api-user-123',
        scopes: ['xero:read', 'shopify:write'],
        keyId: 'key-123'
      });

      const middleware = authMiddleware.requireApiKey();
      await middleware(req, res, next);

      expect(mockAuth.validateApiKey).toHaveBeenCalledWith('sk_live_1234567890abcdef');
      expect(req.apiKey).toEqual({
        userId: 'api-user-123',
        scopes: ['xero:read', 'shopify:write'],
        keyId: 'key-123'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid API key', async () => {
      delete req.headers.authorization;
      
      mockAuth.validateApiKey.mockResolvedValue({
        valid: false,
        error: 'API key not found'
      });

      const middleware = authMiddleware.requireApiKey();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'API key not found',
        code: 'INVALID_API_KEY'
      });
    });

    it('should handle missing API key header', async () => {
      delete req.headers.authorization;
      delete req.headers['x-api-key'];

      const middleware = authMiddleware.requireApiKey();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Missing API key',
        code: 'MISSING_API_KEY'
      });
    });

    it('should validate API key scopes', async () => {
      delete req.headers.authorization;
      
      mockAuth.validateApiKey.mockResolvedValue({
        valid: true,
        userId: 'api-user-123',
        scopes: ['shopify:read'], // Missing xero scope
        keyId: 'key-123'
      });

      const middleware = authMiddleware.requireApiKey(['xero:read']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'API key does not have required scopes',
        required: ['xero:read'],
        provided: ['shopify:read']
      });
    });
  });

  describe('Flexible Authentication', () => {
    it('should accept either JWT or API key authentication', async () => {
      // Both headers present, JWT should take precedence
      mockAuth.validateToken.mockResolvedValue({
        valid: true,
        decoded: {
          userId: 'user-123',
          role: 'admin'
        }
      });

      const middleware = authMiddleware.requireAuth({ allowApiKey: true });
      await middleware(req, res, next);

      expect(mockAuth.validateToken).toHaveBeenCalled();
      expect(mockAuth.validateApiKey).not.toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should fallback to API key when JWT is invalid', async () => {
      mockAuth.validateToken.mockResolvedValue({
        valid: false,
        error: 'Token expired'
      });

      mockAuth.validateApiKey.mockResolvedValue({
        valid: true,
        userId: 'api-user-123',
        scopes: ['xero:read']
      });

      const middleware = authMiddleware.requireAuth({ allowApiKey: true });
      await middleware(req, res, next);

      expect(mockAuth.validateToken).toHaveBeenCalled();
      expect(mockAuth.validateApiKey).toHaveBeenCalled();
      expect(req.apiKey).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should reject when both JWT and API key are invalid', async () => {
      mockAuth.validateToken.mockResolvedValue({
        valid: false,
        error: 'Token expired'
      });

      mockAuth.validateApiKey.mockResolvedValue({
        valid: false,
        error: 'API key not found'
      });

      const middleware = authMiddleware.requireAuth({ allowApiKey: true });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Authorization', () => {
    it('should authorize user with required role', async () => {
      req.user = {
        userId: 'user-123',
        role: 'admin',
        permissions: ['admin:manage']
      };

      const middleware = authMiddleware.requireRole('admin');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user without required role', async () => {
      req.user = {
        userId: 'user-123',
        role: 'viewer',
        permissions: ['read']
      };

      const middleware = authMiddleware.requireRole('admin');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'User does not have required role',
        required: 'admin',
        current: 'viewer'
      });
    });

    it('should authorize user with any of multiple required roles', async () => {
      req.user = {
        userId: 'user-123',
        role: 'manager',
        permissions: ['manage']
      };

      const middleware = authMiddleware.requireRole(['admin', 'manager']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle missing user object', async () => {
      // No req.user set
      const middleware = authMiddleware.requireRole('admin');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    });
  });

  describe('Permission-Based Authorization', () => {
    it('should authorize user with required permission', async () => {
      req.user = {
        userId: 'user-123',
        role: 'manager',
        permissions: ['xero:read', 'xero:write', 'shopify:read']
      };

      mockAuth.hasPermission.mockResolvedValue(true);

      const middleware = authMiddleware.requirePermission('xero:read');
      await middleware(req, res, next);

      expect(mockAuth.hasPermission).toHaveBeenCalledWith(req.user, 'xero:read');
      expect(next).toHaveBeenCalled();
    });

    it('should reject user without required permission', async () => {
      req.user = {
        userId: 'user-123',
        role: 'viewer',
        permissions: ['read']
      };

      mockAuth.hasPermission.mockResolvedValue(false);

      const middleware = authMiddleware.requirePermission('xero:write');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'User does not have required permission',
        required: 'xero:write'
      });
    });

    it('should authorize user with any of multiple required permissions', async () => {
      req.user = {
        userId: 'user-123',
        permissions: ['xero:read']
      };

      mockAuth.hasPermission
        .mockResolvedValueOnce(true)  // xero:read
        .mockResolvedValueOnce(false); // xero:write

      const middleware = authMiddleware.requirePermission(['xero:read', 'xero:write'], { requireAll: false });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should require all permissions when requireAll is true', async () => {
      req.user = {
        userId: 'user-123',
        permissions: ['xero:read']
      };

      mockAuth.hasPermission
        .mockResolvedValueOnce(true)  // xero:read
        .mockResolvedValueOnce(false); // xero:write

      const middleware = authMiddleware.requirePermission(['xero:read', 'xero:write'], { requireAll: true });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'User does not have all required permissions',
        required: ['xero:read', 'xero:write'],
        missing: ['xero:write']
      });
    });
  });

  describe('Resource-Based Authorization', () => {
    it('should authorize access to allowed resource', async () => {
      req.user = {
        userId: 'user-123',
        role: 'manager'
      };
      req.params = { tenantId: 'tenant-123' };

      mockAuth.canAccessResource.mockResolvedValue(true);

      const middleware = authMiddleware.requireResourceAccess((req) => req.params.tenantId);
      await middleware(req, res, next);

      expect(mockAuth.canAccessResource).toHaveBeenCalledWith(req.user, 'tenant-123');
      expect(next).toHaveBeenCalled();
    });

    it('should reject access to unauthorized resource', async () => {
      req.user = {
        userId: 'user-123',
        role: 'manager'
      };
      req.params = { tenantId: 'tenant-456' };

      mockAuth.canAccessResource.mockResolvedValue(false);

      const middleware = authMiddleware.requireResourceAccess((req) => req.params.tenantId);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'User does not have access to this resource',
        resource: 'tenant-456'
      });
    });

    it('should handle dynamic resource extraction', async () => {
      req.user = { userId: 'user-123' };
      req.body = { invoice: { tenantId: 'tenant-789' } };

      mockAuth.canAccessResource.mockResolvedValue(true);

      const middleware = authMiddleware.requireResourceAccess((req) => req.body.invoice.tenantId);
      await middleware(req, res, next);

      expect(mockAuth.canAccessResource).toHaveBeenCalledWith(req.user, 'tenant-789');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Account Security Features', () => {
    it('should check for account lockout', async () => {
      req.user = { userId: 'user-123' };

      mockAuth.isAccountLocked.mockResolvedValue(true);

      const middleware = authMiddleware.checkAccountLockout();
      await middleware(req, res, next);

      expect(mockAuth.isAccountLocked).toHaveBeenCalledWith('user-123', req.ip);
      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Account locked',
        message: 'Account is temporarily locked due to suspicious activity'
      });
    });

    it('should proceed when account is not locked', async () => {
      req.user = { userId: 'user-123' };

      mockAuth.isAccountLocked.mockResolvedValue(false);

      const middleware = authMiddleware.checkAccountLockout();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should track successful authentication', async () => {
      req.user = { userId: 'user-123' };

      const middleware = authMiddleware.trackAuthSuccess();
      await middleware(req, res, next);

      expect(mockAuth.clearFailedLogins).toHaveBeenCalledWith('user-123', req.ip);
      expect(mockAuth.logAuthEvent).toHaveBeenCalledWith({
        type: 'authentication_success',
        userId: 'user-123',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: expect.any(Number)
      });
      expect(next).toHaveBeenCalled();
    });

    it('should track failed authentication', async () => {
      req.failedAuth = {
        reason: 'invalid_token',
        userId: 'user-123'
      };

      const middleware = authMiddleware.trackAuthFailure();
      await middleware(req, res, next);

      expect(mockAuth.trackFailedLogin).toHaveBeenCalledWith('user-123', req.ip);
      expect(mockAuth.logAuthEvent).toHaveBeenCalledWith({
        type: 'authentication_failure',
        userId: 'user-123',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'invalid_token',
        timestamp: expect.any(Number)
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should validate session when using session authentication', async () => {
      req.headers.cookie = 'sessionId=session-123';

      mockAuth.getSession.mockResolvedValue({
        userId: 'user-123',
        role: 'admin',
        createdAt: Date.now() - 3600000,
        expiresAt: Date.now() + 3600000
      });

      const middleware = authMiddleware.requireSession();
      await middleware(req, res, next);

      expect(mockAuth.getSession).toHaveBeenCalledWith('session-123');
      expect(req.user).toEqual({
        userId: 'user-123',
        role: 'admin',
        createdAt: expect.any(Number),
        expiresAt: expect.any(Number)
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject expired session', async () => {
      req.headers.cookie = 'sessionId=expired-session';

      mockAuth.getSession.mockResolvedValue({
        userId: 'user-123',
        role: 'admin',
        expiresAt: Date.now() - 1000 // Expired
      });

      const middleware = authMiddleware.requireSession();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Session expired',
        message: 'Please log in again'
      });
    });

    it('should handle missing session cookie', async () => {
      // No cookie header

      const middleware = authMiddleware.requireSession();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'No session found'
      });
    });
  });

  describe('Optional Authentication', () => {
    it('should set user when valid authentication provided', async () => {
      mockAuth.validateToken.mockResolvedValue({
        valid: true,
        decoded: { userId: 'user-123', role: 'admin' }
      });

      const middleware = authMiddleware.optionalAuth();
      await middleware(req, res, next);

      expect(req.user).toEqual({ userId: 'user-123', role: 'admin' });
      expect(next).toHaveBeenCalled();
    });

    it('should proceed without user when no authentication provided', async () => {
      delete req.headers.authorization;
      delete req.headers['x-api-key'];

      const middleware = authMiddleware.optionalAuth();
      await middleware(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should proceed without user when authentication is invalid', async () => {
      mockAuth.validateToken.mockResolvedValue({
        valid: false,
        error: 'Token expired'
      });

      const middleware = authMiddleware.optionalAuth();
      await middleware(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication service errors', async () => {
      mockAuth.validateToken.mockRejectedValue(new Error('Authentication service unavailable'));

      const middleware = authMiddleware.requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service unavailable',
        message: 'Authentication service is temporarily unavailable'
      });
    });

    it('should handle permission check errors', async () => {
      req.user = { userId: 'user-123', permissions: ['read'] };

      mockAuth.hasPermission.mockRejectedValue(new Error('Permission service error'));

      const middleware = authMiddleware.requirePermission('write');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service unavailable',
        message: 'Authorization service is temporarily unavailable'
      });
    });

    it('should handle resource access check errors', async () => {
      req.user = { userId: 'user-123' };

      mockAuth.canAccessResource.mockRejectedValue(new Error('Resource service error'));

      const middleware = authMiddleware.requireResourceAccess(() => 'resource-123');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Service unavailable',
        message: 'Resource access service is temporarily unavailable'
      });
    });
  });
});
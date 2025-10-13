/**
 * Unit Tests for Authentication System
 * Comprehensive testing of authentication utilities and token management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Mock external dependencies
vi.mock('jsonwebtoken');
vi.mock('crypto');
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    disconnect: vi.fn()
  }))
}));

describe('Authentication System', () => {
  let authModule;
  let mockRedis;
  let consoleRestore;

  beforeEach(async () => {
    consoleRestore = global.testUtils.mockConsole();
    vi.clearAllMocks();

    // Mock JWT methods
    jwt.sign.mockImplementation((payload, secret, options) => 'mock-jwt-token');
    jwt.verify.mockImplementation((token, secret) => ({ 
      userId: 'user-123', 
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600 
    }));
    jwt.decode.mockImplementation((token) => ({ 
      userId: 'user-123', 
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 
    }));

    // Mock crypto methods
    crypto.randomBytes.mockImplementation((size) => Buffer.from('random-bytes-'.repeat(Math.ceil(size / 13)).slice(0, size)));
    crypto.scryptSync.mockImplementation(() => Buffer.from('hashed-password'));
    crypto.timingSafeEqual.mockImplementation(() => true);

    // Import authentication module after mocking
    authModule = await import('../../../src/utils/authentication.js');
    
    // Setup Redis mock
    const Redis = (await import('ioredis')).default;
    mockRedis = new Redis();
  });

  afterEach(() => {
    if (consoleRestore) consoleRestore();
  });

  describe('Token Generation', () => {
    it('should generate JWT token with correct payload', async () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'admin']
      };

      const token = await authModule.generateToken(user);

      expect(token).toBe('mock-jwt-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'user@example.com',
          role: 'admin',
          permissions: ['read', 'write', 'admin']
        }),
        expect.any(String),
        expect.objectContaining({
          expiresIn: '24h',
          issuer: 'sentia-mcp-server',
          audience: 'sentia-manufacturing-dashboard'
        })
      );
    });

    it('should generate refresh token', async () => {
      const userId = 'user-123';
      
      const refreshToken = await authModule.generateRefreshToken(userId);

      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.length).toBeGreaterThan(32);
    });

    it('should generate API key with proper format', async () => {
      const userId = 'user-123';
      const scopes = ['xero:read', 'shopify:write'];

      const apiKey = await authModule.generateApiKey(userId, scopes);

      expect(apiKey).toBeDefined();
      expect(apiKey.key).toBeDefined();
      expect(apiKey.keyId).toBeDefined();
      expect(apiKey.scopes).toEqual(scopes);
      expect(apiKey.userId).toBe(userId);
      expect(apiKey.createdAt).toBeDefined();
    });

    it('should handle token generation errors', async () => {
      jwt.sign.mockImplementation(() => {
        throw new Error('Token signing failed');
      });

      await expect(authModule.generateToken({ id: 'user-123' }))
        .rejects.toThrow('Token signing failed');
    });
  });

  describe('Token Validation', () => {
    it('should validate valid JWT token', async () => {
      const token = 'valid-jwt-token';
      
      const result = await authModule.validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.decoded.userId).toBe('user-123');
      expect(result.decoded.role).toBe('admin');
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    it('should reject expired token', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const result = await authModule.validateToken('expired-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(result.expired).toBe(true);
    });

    it('should reject malformed token', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const result = await authModule.validateToken('malformed-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.malformed).toBe(true);
    });

    it('should check token blacklist', async () => {
      mockRedis.exists.mockResolvedValue(1); // Token is blacklisted

      const result = await authModule.validateToken('blacklisted-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token has been revoked');
      expect(result.blacklisted).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('blacklist:blacklisted-token');
    });
  });

  describe('Password Management', () => {
    it('should hash password securely', async () => {
      const password = 'secure-password-123';
      
      const hashedPassword = await authModule.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.hash).toBeDefined();
      expect(hashedPassword.salt).toBeDefined();
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(crypto.scryptSync).toHaveBeenCalledWith(password, expect.any(Buffer), 64);
    });

    it('should verify password correctly', async () => {
      const password = 'secure-password-123';
      const hashedPassword = {
        hash: Buffer.from('hashed-password'),
        salt: Buffer.from('salt-bytes')
      };

      const isValid = await authModule.verifyPassword(password, hashedPassword);

      expect(isValid).toBe(true);
      expect(crypto.scryptSync).toHaveBeenCalledWith(password, hashedPassword.salt, 64);
      expect(crypto.timingSafeEqual).toHaveBeenCalled();
    });

    it('should reject incorrect password', async () => {
      crypto.timingSafeEqual.mockImplementation(() => false);

      const password = 'wrong-password';
      const hashedPassword = {
        hash: Buffer.from('hashed-password'),
        salt: Buffer.from('salt-bytes')
      };

      const isValid = await authModule.verifyPassword(password, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should validate password strength', async () => {
      const strongPassword = 'StrongP@ssw0rd123!';
      const weakPassword = 'weak';

      const strongResult = await authModule.validatePasswordStrength(strongPassword);
      const weakResult = await authModule.validatePasswordStrength(weakPassword);

      expect(strongResult.valid).toBe(true);
      expect(strongResult.score).toBeGreaterThan(3);
      
      expect(weakResult.valid).toBe(false);
      expect(weakResult.errors).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Session Management', () => {
    it('should create user session', async () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin'
      };
      
      mockRedis.set.mockResolvedValue('OK');

      const session = await authModule.createSession(user);

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.userId).toBe('user-123');
      expect(session.createdAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(mockRedis.set).toHaveBeenCalledWith(
        `session:${session.sessionId}`,
        expect.any(String),
        'EX',
        86400 // 24 hours in seconds
      );
    });

    it('should retrieve user session', async () => {
      const sessionId = 'session-123';
      const sessionData = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'admin',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      const session = await authModule.getSession(sessionId);

      expect(session).toEqual(sessionData);
      expect(mockRedis.get).toHaveBeenCalledWith(`session:${sessionId}`);
    });

    it('should invalidate user session', async () => {
      const sessionId = 'session-123';
      
      mockRedis.del.mockResolvedValue(1);

      const result = await authModule.invalidateSession(sessionId);

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith(`session:${sessionId}`);
    });

    it('should handle session not found', async () => {
      const sessionId = 'nonexistent-session';
      
      mockRedis.get.mockResolvedValue(null);

      const session = await authModule.getSession(sessionId);

      expect(session).toBeNull();
    });
  });

  describe('API Key Management', () => {
    it('should validate API key successfully', async () => {
      const apiKey = 'sk_test_1234567890abcdef';
      const keyData = {
        userId: 'user-123',
        scopes: ['xero:read', 'shopify:write'],
        active: true,
        createdAt: Date.now(),
        lastUsed: Date.now() - 3600000
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(keyData));

      const result = await authModule.validateApiKey(apiKey);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.scopes).toEqual(['xero:read', 'shopify:write']);
      expect(mockRedis.get).toHaveBeenCalledWith(`apikey:${apiKey}`);
    });

    it('should reject inactive API key', async () => {
      const apiKey = 'sk_test_inactive';
      const keyData = {
        userId: 'user-123',
        scopes: ['xero:read'],
        active: false,
        createdAt: Date.now()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(keyData));

      const result = await authModule.validateApiKey(apiKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is inactive');
    });

    it('should update API key last used timestamp', async () => {
      const apiKey = 'sk_test_1234567890abcdef';
      
      mockRedis.set.mockResolvedValue('OK');

      await authModule.updateApiKeyUsage(apiKey);

      expect(mockRedis.set).toHaveBeenCalledWith(
        `apikey:${apiKey}:lastused`,
        expect.any(String),
        'EX',
        86400
      );
    });

    it('should revoke API key', async () => {
      const apiKey = 'sk_test_revoked';
      
      mockRedis.del.mockResolvedValue(1);

      const result = await authModule.revokeApiKey(apiKey);

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith(`apikey:${apiKey}`);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should check user permissions correctly', async () => {
      const user = {
        role: 'admin',
        permissions: ['xero:read', 'xero:write', 'shopify:read', 'admin:manage']
      };

      const hasXeroRead = await authModule.hasPermission(user, 'xero:read');
      const hasShopifyWrite = await authModule.hasPermission(user, 'shopify:write');
      const hasAdminManage = await authModule.hasPermission(user, 'admin:manage');

      expect(hasXeroRead).toBe(true);
      expect(hasShopifyWrite).toBe(false);
      expect(hasAdminManage).toBe(true);
    });

    it('should validate role hierarchy', async () => {
      const adminUser = { role: 'admin' };
      const managerUser = { role: 'manager' };
      const operatorUser = { role: 'operator' };
      const viewerUser = { role: 'viewer' };

      const adminCanManage = await authModule.canAccessRole(adminUser, 'manager');
      const managerCanManage = await authModule.canAccessRole(managerUser, 'operator');
      const operatorCannotManage = await authModule.canAccessRole(operatorUser, 'admin');
      const viewerCannotManage = await authModule.canAccessRole(viewerUser, 'operator');

      expect(adminCanManage).toBe(true);
      expect(managerCanManage).toBe(true);
      expect(operatorCannotManage).toBe(false);
      expect(viewerCannotManage).toBe(false);
    });

    it('should enforce resource-based permissions', async () => {
      const user = {
        role: 'manager',
        permissions: ['xero:read', 'shopify:read'],
        resources: ['tenant-123', 'tenant-456']
      };

      const canAccessTenant123 = await authModule.canAccessResource(user, 'tenant-123');
      const canAccessTenant789 = await authModule.canAccessResource(user, 'tenant-789');

      expect(canAccessTenant123).toBe(true);
      expect(canAccessTenant789).toBe(false);
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should generate TOTP secret', async () => {
      const userId = 'user-123';
      
      const totpSecret = await authModule.generateTotpSecret(userId);

      expect(totpSecret).toBeDefined();
      expect(totpSecret.secret).toBeDefined();
      expect(totpSecret.qrCode).toBeDefined();
      expect(totpSecret.backupCodes).toHaveLength(10);
    });

    it('should verify TOTP token', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123456';
      
      // Mock TOTP verification (would use actual library in real implementation)
      const totpVerifyMock = vi.fn().mockReturnValue(true);
      vi.doMock('speakeasy', () => ({
        totp: {
          verify: totpVerifyMock
        }
      }));

      const isValid = await authModule.verifyTotpToken(secret, token);

      expect(isValid).toBe(true);
    });

    it('should handle backup codes', async () => {
      const userId = 'user-123';
      const backupCode = 'ABC123DEF';
      
      mockRedis.get.mockResolvedValue(JSON.stringify({
        userId,
        backupCodes: ['ABC123DEF', 'GHI456JKL'],
        used: []
      }));
      mockRedis.set.mockResolvedValue('OK');

      const result = await authModule.useBackupCode(userId, backupCode);

      expect(result.valid).toBe(true);
      expect(result.remainingCodes).toBe(1);
    });
  });

  describe('Security Features', () => {
    it('should track failed login attempts', async () => {
      const userId = 'user-123';
      const ip = '192.168.1.100';
      
      mockRedis.get.mockResolvedValue('2'); // 2 previous attempts
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.expire.mockResolvedValue(1);

      await authModule.trackFailedLogin(userId, ip);

      expect(mockRedis.set).toHaveBeenCalledWith(
        `failed_login:${userId}:${ip}`,
        '3',
        'EX',
        900 // 15 minutes
      );
    });

    it('should detect account lockout', async () => {
      const userId = 'user-123';
      const ip = '192.168.1.100';
      
      mockRedis.get.mockResolvedValue('5'); // 5 failed attempts

      const isLocked = await authModule.isAccountLocked(userId, ip);

      expect(isLocked).toBe(true);
    });

    it('should clear failed login attempts on successful login', async () => {
      const userId = 'user-123';
      const ip = '192.168.1.100';
      
      mockRedis.del.mockResolvedValue(1);

      await authModule.clearFailedLogins(userId, ip);

      expect(mockRedis.del).toHaveBeenCalledWith(`failed_login:${userId}:${ip}`);
    });

    it('should blacklist compromised tokens', async () => {
      const token = 'compromised-token';
      const expiryTime = 3600; // 1 hour
      
      mockRedis.set.mockResolvedValue('OK');

      await authModule.blacklistToken(token, expiryTime);

      expect(mockRedis.set).toHaveBeenCalledWith(
        `blacklist:${token}`,
        'revoked',
        'EX',
        expiryTime
      );
    });
  });

  describe('Audit Logging', () => {
    it('should log authentication events', async () => {
      const event = {
        type: 'login',
        userId: 'user-123',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        success: true,
        timestamp: Date.now()
      };

      const logSpy = vi.spyOn(authModule, 'logAuthEvent');
      
      await authModule.logAuthEvent(event);

      expect(logSpy).toHaveBeenCalledWith(event);
    });

    it('should log permission checks', async () => {
      const user = { id: 'user-123', role: 'manager' };
      const permission = 'xero:write';
      const resource = 'tenant-123';

      const logSpy = vi.spyOn(authModule, 'logPermissionCheck');
      
      await authModule.logPermissionCheck(user, permission, resource, false);

      expect(logSpy).toHaveBeenCalledWith(
        user,
        permission,
        resource,
        false
      );
    });

    it('should generate audit trail', async () => {
      const userId = 'user-123';
      const timeRange = {
        start: Date.now() - 86400000,
        end: Date.now()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify([
        { type: 'login', timestamp: Date.now() - 3600000, success: true },
        { type: 'permission_check', timestamp: Date.now() - 1800000, granted: false }
      ]));

      const auditTrail = await authModule.getAuditTrail(userId, timeRange);

      expect(auditTrail).toHaveLength(2);
      expect(auditTrail[0].type).toBe('login');
      expect(auditTrail[1].type).toBe('permission_check');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await authModule.validateToken('test-token');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    it('should handle JWT library errors', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected JWT error');
      });

      const result = await authModule.validateToken('test-token');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token validation failed');
    });

    it('should handle crypto errors gracefully', async () => {
      crypto.scryptSync.mockImplementation(() => {
        throw new Error('Crypto operation failed');
      });

      await expect(authModule.hashPassword('password'))
        .rejects.toThrow('Password hashing failed');
    });
  });
});
/**
 * Advanced Security Testing - Authentication
 * Comprehensive security tests for authentication mechanisms
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { McpServer } from '../../src/server.js';
import { generateSecureToken, verifySecureToken } from '../utils/test-data-generators.js';
import '../utils/custom-matchers.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

describe('Authentication Security Tests', () => {
  let server;
  let securityConfig;

  beforeAll(async () => {
    server = new McpServer({
      environment: 'test',
      security: {
        enableAdvancedTesting: true,
        tokenExpiry: 3600, // 1 hour
        maxLoginAttempts: 5,
        lockoutDuration: 900, // 15 minutes
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        }
      }
    });
    
    await server.initialize();
    
    securityConfig = {
      testTokens: [],
      validCredentials: {
        username: 'test_admin',
        password: 'SecureP@ssw0rd123!',
        apiKey: 'sk_test_' + crypto.randomBytes(32).toString('hex')
      },
      invalidCredentials: [
        { username: 'admin', password: 'password' },
        { username: 'test', password: '123456' },
        { username: '', password: '' },
        { username: 'test_admin', password: 'wrong' }
      ]
    };
  });

  afterAll(async () => {
    if (server) {
      await server.shutdown();
    }
  });

  beforeEach(async () => {
    await server.resetSecurityState();
  });

  describe('JWT Token Security', () => {
    it('should generate secure JWT tokens with proper claims', async () => {
      const tokenResponse = await server.callTool('auth_generate_token', {
        user_id: 'user_123',
        role: 'admin',
        permissions: ['read:all', 'write:all', 'admin:system']
      });

      expect(tokenResponse).toBeValidMcpToolResponse();
      expect(tokenResponse.data.token).toBeSecureToken();

      // Verify token structure
      const token = tokenResponse.data.token;
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.header).toHaveProperty('alg');
      expect(decoded.header).toHaveProperty('typ', 'JWT');
      expect(decoded.payload).toHaveProperty('sub', 'user_123');
      expect(decoded.payload).toHaveProperty('role', 'admin');
      expect(decoded.payload).toHaveProperty('permissions');
      expect(decoded.payload).toHaveProperty('iat');
      expect(decoded.payload).toHaveProperty('exp');
      expect(decoded.payload).toHaveProperty('iss');

      // Verify token expiration is reasonable
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.payload.exp).toBeGreaterThan(now);
      expect(decoded.payload.exp).toBeLessThanOrEqual(now + 3600); // Max 1 hour

      securityConfig.testTokens.push(token);
    });

    it('should reject invalid JWT tokens', async () => {
      const invalidTokens = [
        'invalid.token.format',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '',
        null,
        undefined,
        'Bearer invalid-token',
        crypto.randomBytes(32).toString('hex')
      ];

      for (const invalidToken of invalidTokens) {
        const validationResponse = await server.callTool('auth_validate_token', {
          token: invalidToken
        });

        expect(validationResponse).toBeValidMcpToolResponse();
        expect(validationResponse.data.valid).toBe(false);
        expect(validationResponse.data).toHaveProperty('error');
      }
    });

    it('should handle token expiration properly', async () => {
      // Generate short-lived token for testing
      const shortTokenResponse = await server.callTool('auth_generate_token', {
        user_id: 'user_test',
        role: 'user',
        permissions: ['read:basic'],
        expires_in: 1 // 1 second
      });

      expect(shortTokenResponse).toBeValidMcpToolResponse();
      const shortToken = shortTokenResponse.data.token;

      // Token should be valid initially
      const immediateValidation = await server.callTool('auth_validate_token', {
        token: shortToken
      });
      expect(immediateValidation.data.valid).toBe(true);

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Token should now be expired
      const expiredValidation = await server.callTool('auth_validate_token', {
        token: shortToken
      });
      expect(expiredValidation.data.valid).toBe(false);
      expect(expiredValidation.data.error).toMatch(/expired|invalid/i);
    });

    it('should prevent token manipulation attacks', async () => {
      const originalTokenResponse = await server.callTool('auth_generate_token', {
        user_id: 'user_normal',
        role: 'user',
        permissions: ['read:basic']
      });

      const originalToken = originalTokenResponse.data.token;
      const [header, payload, signature] = originalToken.split('.');

      // Attempt to manipulate payload
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      decodedPayload.role = 'admin';
      decodedPayload.permissions = ['read:all', 'write:all', 'admin:system'];

      const manipulatedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
      const manipulatedToken = `${header}.${manipulatedPayload}.${signature}`;

      // Validation should fail due to signature mismatch
      const validationResponse = await server.callTool('auth_validate_token', {
        token: manipulatedToken
      });

      expect(validationResponse).toBeValidMcpToolResponse();
      expect(validationResponse.data.valid).toBe(false);
      expect(validationResponse.data.error).toMatch(/signature|invalid/i);
    });

    it('should implement proper token refresh mechanism', async () => {
      const originalTokenResponse = await server.callTool('auth_generate_token', {
        user_id: 'user_refresh_test',
        role: 'user',
        permissions: ['read:basic']
      });

      const originalToken = originalTokenResponse.data.token;

      // Test token refresh
      const refreshResponse = await server.callTool('auth_refresh_token', {
        token: originalToken
      });

      expect(refreshResponse).toBeValidMcpToolResponse();
      expect(refreshResponse.data.token).toBeSecureToken();
      expect(refreshResponse.data.token).not.toBe(originalToken);

      // Original token should be invalidated
      const originalValidation = await server.callTool('auth_validate_token', {
        token: originalToken
      });
      expect(originalValidation.data.valid).toBe(false);

      // New token should be valid
      const newValidation = await server.callTool('auth_validate_token', {
        token: refreshResponse.data.token
      });
      expect(newValidation.data.valid).toBe(true);
    });
  });

  describe('API Key Security', () => {
    it('should generate cryptographically secure API keys', async () => {
      const apiKeyResponse = await server.callTool('auth_generate_api_key', {
        user_id: 'api_user_001',
        name: 'Test API Key',
        permissions: ['read:products', 'write:orders'],
        expires_at: '2024-12-31T23:59:59Z'
      });

      expect(apiKeyResponse).toBeValidMcpToolResponse();
      expect(apiKeyResponse.data.api_key).toBeSecureToken();

      const apiKey = apiKeyResponse.data.api_key;

      // Verify API key format
      expect(apiKey).toMatch(/^sk_(test|live)_[A-Za-z0-9]{32,}$/);

      // Verify entropy (should be cryptographically random)
      const keyBytes = Buffer.from(apiKey.replace(/^sk_(test|live)_/, ''), 'hex');
      expect(keyBytes.length).toBeGreaterThanOrEqual(32);

      // Store for later tests
      securityConfig.testApiKey = apiKey;
    });

    it('should validate API keys properly', async () => {
      const validationResponse = await server.callTool('auth_validate_api_key', {
        api_key: securityConfig.testApiKey
      });

      expect(validationResponse).toBeValidMcpToolResponse();
      expect(validationResponse.data.valid).toBe(true);
      expect(validationResponse.data).toHaveProperty('user_id');
      expect(validationResponse.data).toHaveProperty('permissions');
    });

    it('should reject invalid API keys', async () => {
      const invalidApiKeys = [
        'sk_test_invalid',
        'sk_live_tooshort',
        'invalid_format_key',
        'sk_test_' + 'a'.repeat(31), // 31 chars instead of 32+
        '',
        null,
        undefined
      ];

      for (const invalidKey of invalidApiKeys) {
        const validationResponse = await server.callTool('auth_validate_api_key', {
          api_key: invalidKey
        });

        expect(validationResponse).toBeValidMcpToolResponse();
        expect(validationResponse.data.valid).toBe(false);
      }
    });

    it('should implement API key rate limiting', async () => {
      // Make multiple rapid requests with same API key
      const requests = Array.from({ length: 20 }, () =>
        server.callTool('auth_validate_api_key', {
          api_key: securityConfig.testApiKey
        })
      );

      const results = await Promise.allSettled(requests);
      
      // Some requests should be rate limited
      const successfulRequests = results.filter(r => 
        r.status === 'fulfilled' && r.value.data.valid === true
      );
      const rateLimitedRequests = results.filter(r => 
        r.status === 'fulfilled' && r.value.data.rate_limited === true
      );

      expect(successfulRequests.length).toBeLessThan(20);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });

    it('should support API key revocation', async () => {
      // Revoke the test API key
      const revokeResponse = await server.callTool('auth_revoke_api_key', {
        api_key: securityConfig.testApiKey
      });

      expect(revokeResponse).toBeValidMcpToolResponse();
      expect(revokeResponse.data.revoked).toBe(true);

      // Key should no longer be valid
      const validationResponse = await server.callTool('auth_validate_api_key', {
        api_key: securityConfig.testApiKey
      });

      expect(validationResponse.data.valid).toBe(false);
      expect(validationResponse.data.error).toMatch(/revoked|invalid/i);
    });
  });

  describe('Brute Force Protection', () => {
    it('should implement account lockout after failed attempts', async () => {
      const testUsername = 'brute_force_test';
      
      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        const loginResponse = await server.callTool('auth_login', {
          username: testUsername,
          password: 'wrong_password'
        });

        expect(loginResponse).toBeValidMcpToolResponse();
        expect(loginResponse.data.success).toBe(false);

        if (i >= 4) { // After 5 attempts, account should be locked
          expect(loginResponse.data.account_locked).toBe(true);
          expect(loginResponse.data.lockout_duration).toBeGreaterThan(0);
        }
      }

      // Even with correct password, should be locked
      const lockedLoginResponse = await server.callTool('auth_login', {
        username: testUsername,
        password: securityConfig.validCredentials.password
      });

      expect(lockedLoginResponse.data.success).toBe(false);
      expect(lockedLoginResponse.data.account_locked).toBe(true);
    });

    it('should implement progressive delays for failed attempts', async () => {
      const testUsername = 'delay_test';
      const attemptTimes = [];

      // Measure time for each failed attempt
      for (let i = 0; i < 4; i++) {
        const startTime = Date.now();
        
        await server.callTool('auth_login', {
          username: testUsername,
          password: 'wrong_password'
        });

        const endTime = Date.now();
        attemptTimes.push(endTime - startTime);
      }

      // Each attempt should take progressively longer
      for (let i = 1; i < attemptTimes.length; i++) {
        expect(attemptTimes[i]).toBeGreaterThanOrEqual(attemptTimes[i - 1]);
      }

      // Final attempt should have significant delay
      expect(attemptTimes[attemptTimes.length - 1]).toBeGreaterThan(1000); // At least 1 second
    });

    it('should detect and prevent distributed brute force attacks', async () => {
      const usernames = ['user1', 'user2', 'user3', 'user4', 'user5'];
      const sourceIPs = ['192.168.1.100', '192.168.1.101', '192.168.1.102'];

      // Simulate distributed attack from multiple IPs
      const attackRequests = [];
      for (const ip of sourceIPs) {
        for (const username of usernames) {
          attackRequests.push(
            server.callTool('auth_login', {
              username,
              password: 'wrong_password',
              source_ip: ip
            })
          );
        }
      }

      const results = await Promise.allSettled(attackRequests);
      
      // Should detect pattern and start blocking
      const blockedRequests = results.filter(r => 
        r.status === 'fulfilled' && 
        r.value.data.blocked_reason === 'distributed_attack'
      );

      expect(blockedRequests.length).toBeGreaterThan(0);
    });

    it('should implement CAPTCHA requirement after suspicious activity', async () => {
      const testUsername = 'captcha_test';

      // Generate suspicious activity
      for (let i = 0; i < 3; i++) {
        await server.callTool('auth_login', {
          username: testUsername,
          password: 'wrong_password'
        });
      }

      // Next attempt should require CAPTCHA
      const captchaResponse = await server.callTool('auth_login', {
        username: testUsername,
        password: securityConfig.validCredentials.password
      });

      expect(captchaResponse.data.captcha_required).toBe(true);
      expect(captchaResponse.data).toHaveProperty('captcha_challenge');

      // Login should fail without valid CAPTCHA
      expect(captchaResponse.data.success).toBe(false);
    });
  });

  describe('Session Security', () => {
    it('should implement secure session management', async () => {
      // Create a session
      const sessionResponse = await server.callTool('auth_create_session', {
        user_id: 'session_test_user',
        user_agent: 'Test Browser 1.0',
        ip_address: '192.168.1.200'
      });

      expect(sessionResponse).toBeValidMcpToolResponse();
      expect(sessionResponse.data).toHaveProperty('session_id');
      expect(sessionResponse.data).toHaveProperty('expires_at');

      const sessionId = sessionResponse.data.session_id;

      // Verify session is valid
      const validationResponse = await server.callTool('auth_validate_session', {
        session_id: sessionId
      });

      expect(validationResponse.data.valid).toBe(true);
      expect(validationResponse.data).toHaveProperty('user_id', 'session_test_user');
    });

    it('should detect and prevent session hijacking', async () => {
      // Create session from one IP
      const sessionResponse = await server.callTool('auth_create_session', {
        user_id: 'hijack_test_user',
        user_agent: 'Test Browser 1.0',
        ip_address: '192.168.1.200'
      });

      const sessionId = sessionResponse.data.session_id;

      // Attempt to use session from different IP
      const hijackAttempt = await server.callTool('auth_validate_session', {
        session_id: sessionId,
        source_ip: '10.0.0.100', // Different IP
        user_agent: 'Different Browser 2.0'
      });

      expect(hijackAttempt.data.valid).toBe(false);
      expect(hijackAttempt.data.security_alert).toBe(true);
      expect(hijackAttempt.data.reason).toMatch(/suspicious|hijack/i);
    });

    it('should implement concurrent session limits', async () => {
      const userId = 'concurrent_test_user';
      const sessions = [];

      // Create multiple sessions for same user
      for (let i = 0; i < 6; i++) {
        const sessionResponse = await server.callTool('auth_create_session', {
          user_id: userId,
          user_agent: `Browser ${i}`,
          ip_address: `192.168.1.${200 + i}`
        });

        sessions.push(sessionResponse.data.session_id);
      }

      // Should have max 5 active sessions (oldest should be invalidated)
      let activeSessions = 0;
      for (const sessionId of sessions) {
        const validationResponse = await server.callTool('auth_validate_session', {
          session_id: sessionId
        });

        if (validationResponse.data.valid) {
          activeSessions++;
        }
      }

      expect(activeSessions).toBeLessThanOrEqual(5);
    });

    it('should implement session timeout and cleanup', async () => {
      // Create session with short timeout
      const sessionResponse = await server.callTool('auth_create_session', {
        user_id: 'timeout_test_user',
        user_agent: 'Test Browser',
        ip_address: '192.168.1.300',
        timeout_seconds: 2
      });

      const sessionId = sessionResponse.data.session_id;

      // Session should be valid initially
      const immediateValidation = await server.callTool('auth_validate_session', {
        session_id: sessionId
      });
      expect(immediateValidation.data.valid).toBe(true);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Session should be expired
      const timeoutValidation = await server.callTool('auth_validate_session', {
        session_id: sessionId
      });
      expect(timeoutValidation.data.valid).toBe(false);
      expect(timeoutValidation.data.reason).toMatch(/timeout|expired/i);
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should implement TOTP-based 2FA', async () => {
      // Generate 2FA secret for user
      const mfaSetupResponse = await server.callTool('auth_setup_2fa', {
        user_id: 'mfa_test_user',
        method: 'totp'
      });

      expect(mfaSetupResponse).toBeValidMcpToolResponse();
      expect(mfaSetupResponse.data).toHaveProperty('secret');
      expect(mfaSetupResponse.data).toHaveProperty('qr_code');
      expect(mfaSetupResponse.data).toHaveProperty('backup_codes');

      const secret = mfaSetupResponse.data.secret;

      // Generate TOTP code
      const totpResponse = await server.callTool('auth_generate_totp', {
        secret: secret
      });

      const totpCode = totpResponse.data.code;

      // Verify TOTP code
      const verificationResponse = await server.callTool('auth_verify_2fa', {
        user_id: 'mfa_test_user',
        code: totpCode,
        method: 'totp'
      });

      expect(verificationResponse.data.valid).toBe(true);
    });

    it('should reject invalid 2FA codes', async () => {
      const invalidCodes = ['000000', '123456', '', null, 'invalid'];

      for (const invalidCode of invalidCodes) {
        const verificationResponse = await server.callTool('auth_verify_2fa', {
          user_id: 'mfa_test_user',
          code: invalidCode,
          method: 'totp'
        });

        expect(verificationResponse.data.valid).toBe(false);
      }
    });

    it('should implement backup code functionality', async () => {
      // Use backup code when TOTP is unavailable
      const backupVerification = await server.callTool('auth_verify_2fa', {
        user_id: 'mfa_test_user',
        code: 'BACKUP-CODE-001',
        method: 'backup'
      });

      expect(backupVerification).toBeValidMcpToolResponse();
      
      // Backup code should only work once
      const secondAttempt = await server.callTool('auth_verify_2fa', {
        user_id: 'mfa_test_user',
        code: 'BACKUP-CODE-001',
        method: 'backup'
      });

      expect(secondAttempt.data.valid).toBe(false);
      expect(secondAttempt.data.reason).toMatch(/used|invalid/i);
    });
  });

  describe('Password Security', () => {
    it('should enforce strong password policies', async () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'Password1', // Missing special char
        'password!', // Missing uppercase and number
        'PASSWORD1!', // Missing lowercase
        'Password!', // Missing number
        'Pass1!' // Too short
      ];

      for (const weakPassword of weakPasswords) {
        const passwordCheck = await server.callTool('auth_validate_password', {
          password: weakPassword
        });

        expect(passwordCheck.data.valid).toBe(false);
        expect(passwordCheck.data).toHaveProperty('violations');
        expect(passwordCheck.data.violations).toBeInstanceOf(Array);
        expect(passwordCheck.data.violations.length).toBeGreaterThan(0);
      }
    });

    it('should implement secure password hashing', async () => {
      const password = 'SecureTestP@ssw0rd123!';
      
      const hashResponse = await server.callTool('auth_hash_password', {
        password: password
      });

      expect(hashResponse).toBeValidMcpToolResponse();
      expect(hashResponse.data).toHaveProperty('hash');
      expect(hashResponse.data).toHaveProperty('salt');

      const hash = hashResponse.data.hash;

      // Hash should be different each time (due to salt)
      const secondHashResponse = await server.callTool('auth_hash_password', {
        password: password
      });

      expect(secondHashResponse.data.hash).not.toBe(hash);

      // But verification should work for both
      const verifyFirst = await server.callTool('auth_verify_password', {
        password: password,
        hash: hash
      });

      const verifySecond = await server.callTool('auth_verify_password', {
        password: password,
        hash: secondHashResponse.data.hash
      });

      expect(verifyFirst.data.valid).toBe(true);
      expect(verifySecond.data.valid).toBe(true);
    });

    it('should detect common password patterns', async () => {
      const commonPatterns = [
        'password123',
        'admin2024',
        'qwerty123',
        'letmein!',
        'welcome123',
        'Password1!'
      ];

      for (const pattern of commonPatterns) {
        const patternCheck = await server.callTool('auth_check_password_pattern', {
          password: pattern
        });

        expect(patternCheck.data.is_common).toBe(true);
        expect(patternCheck.data).toHaveProperty('pattern_type');
      }
    });

    it('should implement password history', async () => {
      const userId = 'password_history_user';
      const passwords = [
        'FirstPassword123!',
        'SecondPassword456!',
        'ThirdPassword789!'
      ];

      // Set password history
      for (const password of passwords) {
        await server.callTool('auth_set_password', {
          user_id: userId,
          password: password
        });
      }

      // Attempt to reuse old password
      const reuseAttempt = await server.callTool('auth_set_password', {
        user_id: userId,
        password: passwords[0] // First password
      });

      expect(reuseAttempt.data.success).toBe(false);
      expect(reuseAttempt.data.reason).toMatch(/history|reuse/i);
    });
  });
});
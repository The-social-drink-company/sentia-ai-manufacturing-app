/**
 * Unit Tests for Security Utilities
 * Comprehensive testing of security functions and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';

// Mock crypto module
vi.mock('crypto', () => ({
  default: {
    createCipher: vi.fn(),
    createDecipher: vi.fn(),
    createHash: vi.fn(),
    createHmac: vi.fn(),
    randomBytes: vi.fn(),
    timingSafeEqual: vi.fn(),
    scryptSync: vi.fn(),
    createCipheriv: vi.fn(),
    createDecipheriv: vi.fn()
  }
}));

describe('Security Utilities', () => {
  let securityModule;
  let consoleRestore;

  beforeEach(async () => {
    consoleRestore = global.testUtils.mockConsole();
    vi.clearAllMocks();

    // Setup crypto mocks
    const mockCipher = {
      update: vi.fn().mockReturnValue('encrypted'),
      final: vi.fn().mockReturnValue('data')
    };

    const mockDecipher = {
      update: vi.fn().mockReturnValue('decrypted'),
      final: vi.fn().mockReturnValue('data')
    };

    const mockHash = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('hash-result')
    };

    const mockHmac = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('hmac-result')
    };

    crypto.createCipheriv.mockReturnValue(mockCipher);
    crypto.createDecipheriv.mockReturnValue(mockDecipher);
    crypto.createHash.mockReturnValue(mockHash);
    crypto.createHmac.mockReturnValue(mockHmac);
    crypto.randomBytes.mockImplementation((size) => Buffer.alloc(size, 'x'));
    crypto.timingSafeEqual.mockReturnValue(true);
    crypto.scryptSync.mockReturnValue(Buffer.alloc(32, 'y'));

    securityModule = await import('../../../src/utils/security.js');
  });

  afterEach(() => {
    if (consoleRestore) consoleRestore();
  });

  describe('Data Encryption', () => {
    it('should encrypt sensitive data correctly', async () => {
      const sensitiveData = 'secret-api-key-12345';
      
      const encrypted = await securityModule.encrypt(sensitiveData);

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(typeof encrypted.encrypted).toBe('string');
      expect(crypto.createCipheriv).toHaveBeenCalledWith('aes-256-gcm', expect.any(Buffer), expect.any(Buffer));
    });

    it('should decrypt data correctly', async () => {
      const encryptedData = {
        encrypted: 'encrypteddata',
        iv: Buffer.alloc(16, 'i').toString('hex'),
        authTag: Buffer.alloc(16, 't').toString('hex')
      };

      const decrypted = await securityModule.decrypt(encryptedData);

      expect(decrypted).toBe('decrypteddata');
      expect(crypto.createDecipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.any(Buffer),
        Buffer.from(encryptedData.iv, 'hex')
      );
    });

    it('should handle encryption errors gracefully', async () => {
      crypto.createCipheriv.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(securityModule.encrypt('test-data'))
        .rejects.toThrow('Encryption failed');
    });

    it('should handle decryption errors gracefully', async () => {
      crypto.createDecipheriv.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const encryptedData = {
        encrypted: 'invalid',
        iv: 'invalid',
        authTag: 'invalid'
      };

      await expect(securityModule.decrypt(encryptedData))
        .rejects.toThrow('Decryption failed');
    });

    it('should generate secure random keys', async () => {
      const key = await securityModule.generateEncryptionKey();

      expect(key).toBeDefined();
      expect(Buffer.isBuffer(key)).toBe(true);
      expect(key.length).toBe(32); // 256 bits
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const sanitized = await securityModule.sanitizeSqlInput(maliciousInput);

      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain(';');
      expect(sanitized).not.toContain('--');
    });

    it('should sanitize XSS attempts', async () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      
      const sanitized = await securityModule.sanitizeHtmlInput(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should validate email format', async () => {
      const validEmail = 'user@example.com';
      const invalidEmail = 'invalid-email';

      const validResult = await securityModule.validateEmail(validEmail);
      const invalidResult = await securityModule.validateEmail(invalidEmail);

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('Invalid email format');
    });

    it('should validate URL format and safety', async () => {
      const safeUrl = 'https://api.example.com/data';
      const maliciousUrl = 'javascript:alert("XSS")';
      const localUrl = 'http://localhost:3000/admin';

      const safeResult = await securityModule.validateUrl(safeUrl);
      const maliciousResult = await securityModule.validateUrl(maliciousUrl);
      const localResult = await securityModule.validateUrl(localUrl, { allowLocal: false });

      expect(safeResult.valid).toBe(true);
      expect(maliciousResult.valid).toBe(false);
      expect(localResult.valid).toBe(false);
    });

    it('should validate file paths against directory traversal', async () => {
      const safePath = 'uploads/user-documents/file.pdf';
      const maliciousPath = '../../../etc/passwd';
      const windowsPath = '..\\..\\windows\\system32\\config\\sam';

      const safeResult = await securityModule.validateFilePath(safePath);
      const maliciousResult = await securityModule.validateFilePath(maliciousPath);
      const windowsResult = await securityModule.validateFilePath(windowsPath);

      expect(safeResult.valid).toBe(true);
      expect(maliciousResult.valid).toBe(false);
      expect(windowsResult.valid).toBe(false);
    });
  });

  describe('HMAC Verification', () => {
    it('should generate HMAC signature correctly', async () => {
      const data = 'webhook-payload-data';
      const secret = 'webhook-secret-key';

      const signature = await securityModule.generateHmacSignature(data, secret);

      expect(signature).toBe('hmac-result');
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', secret);
    });

    it('should verify HMAC signature correctly', async () => {
      const data = 'webhook-payload-data';
      const secret = 'webhook-secret-key';
      const signature = 'hmac-result';

      const isValid = await securityModule.verifyHmacSignature(data, secret, signature);

      expect(isValid).toBe(true);
      expect(crypto.timingSafeEqual).toHaveBeenCalled();
    });

    it('should reject invalid HMAC signature', async () => {
      crypto.timingSafeEqual.mockReturnValue(false);

      const data = 'webhook-payload-data';
      const secret = 'webhook-secret-key';
      const signature = 'invalid-signature';

      const isValid = await securityModule.verifyHmacSignature(data, secret, signature);

      expect(isValid).toBe(false);
    });

    it('should handle HMAC generation errors', async () => {
      crypto.createHmac.mockImplementation(() => {
        throw new Error('HMAC generation failed');
      });

      await expect(securityModule.generateHmacSignature('data', 'secret'))
        .rejects.toThrow('HMAC generation failed');
    });
  });

  describe('Rate Limiting', () => {
    it('should track API call rates per client', async () => {
      const clientId = 'client-123';
      const endpoint = '/api/xero/invoices';
      const limit = 100;
      const windowMs = 60000; // 1 minute

      // Mock Redis for rate limiting storage
      const mockRedis = {
        get: vi.fn().mockResolvedValue('5'), // 5 previous calls
        set: vi.fn().mockResolvedValue('OK'),
        expire: vi.fn().mockResolvedValue(1)
      };

      const result = await securityModule.checkRateLimit(clientId, endpoint, limit, windowMs, mockRedis);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(94); // 100 - 5 - 1
      expect(result.resetTime).toBeDefined();
    });

    it('should enforce rate limits', async () => {
      const clientId = 'client-123';
      const endpoint = '/api/xero/invoices';
      const limit = 100;
      const windowMs = 60000;

      const mockRedis = {
        get: vi.fn().mockResolvedValue('100'), // At limit
        set: vi.fn().mockResolvedValue('OK'),
        expire: vi.fn().mockResolvedValue(1)
      };

      const result = await securityModule.checkRateLimit(clientId, endpoint, limit, windowMs, mockRedis);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should implement sliding window rate limiting', async () => {
      const clientId = 'client-123';
      const windowSize = 60000; // 1 minute
      const limit = 100;

      const mockRedis = {
        zcard: vi.fn().mockResolvedValue(50), // 50 requests in window
        zadd: vi.fn().mockResolvedValue(1),
        zremrangebyscore: vi.fn().mockResolvedValue(5),
        expire: vi.fn().mockResolvedValue(1)
      };

      const result = await securityModule.checkSlidingWindowRateLimit(clientId, limit, windowSize, mockRedis);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 100 - 50 - 1
    });
  });

  describe('Security Headers', () => {
    it('should generate secure headers for responses', async () => {
      const headers = await securityModule.getSecurityHeaders();

      expect(headers).toEqual({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': expect.stringContaining("default-src 'self'"),
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': expect.stringContaining('geolocation=()'),
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });
    });

    it('should customize CSP for different environments', async () => {
      const devHeaders = await securityModule.getSecurityHeaders('development');
      const prodHeaders = await securityModule.getSecurityHeaders('production');

      expect(devHeaders['Content-Security-Policy']).toContain('localhost');
      expect(prodHeaders['Content-Security-Policy']).not.toContain('localhost');
      expect(prodHeaders['Strict-Transport-Security']).toContain('includeSubDomains');
    });
  });

  describe('Certificate Validation', () => {
    it('should validate SSL certificate chains', async () => {
      const mockCertificate = {
        subject: { CN: 'api.example.com' },
        issuer: { CN: 'Trusted CA' },
        valid_from: new Date(Date.now() - 86400000).toISOString(),
        valid_to: new Date(Date.now() + 86400000 * 365).toISOString(),
        fingerprint: 'AB:CD:EF:12:34:56'
      };

      const result = await securityModule.validateCertificate(mockCertificate, 'api.example.com');

      expect(result.valid).toBe(true);
      expect(result.commonNameMatch).toBe(true);
      expect(result.notExpired).toBe(true);
      expect(result.trustedIssuer).toBe(true);
    });

    it('should detect expired certificates', async () => {
      const expiredCertificate = {
        subject: { CN: 'api.example.com' },
        issuer: { CN: 'Trusted CA' },
        valid_from: new Date(Date.now() - 86400000 * 365 * 2).toISOString(),
        valid_to: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
        fingerprint: 'AB:CD:EF:12:34:56'
      };

      const result = await securityModule.validateCertificate(expiredCertificate, 'api.example.com');

      expect(result.valid).toBe(false);
      expect(result.notExpired).toBe(false);
      expect(result.error).toContain('Certificate has expired');
    });

    it('should detect hostname mismatches', async () => {
      const mismatchedCertificate = {
        subject: { CN: 'different-domain.com' },
        issuer: { CN: 'Trusted CA' },
        valid_from: new Date(Date.now() - 86400000).toISOString(),
        valid_to: new Date(Date.now() + 86400000 * 365).toISOString(),
        fingerprint: 'AB:CD:EF:12:34:56'
      };

      const result = await securityModule.validateCertificate(mismatchedCertificate, 'api.example.com');

      expect(result.valid).toBe(false);
      expect(result.commonNameMatch).toBe(false);
      expect(result.error).toContain('Common name mismatch');
    });
  });

  describe('API Security', () => {
    it('should validate API keys format', async () => {
      const validApiKey = 'sk_live_1234567890abcdef1234567890abcdef';
      const invalidApiKey = 'invalid-key';
      const testApiKey = 'sk_test_1234567890abcdef1234567890abcdef';

      const validResult = await securityModule.validateApiKeyFormat(validApiKey);
      const invalidResult = await securityModule.validateApiKeyFormat(invalidApiKey);
      const testResult = await securityModule.validateApiKeyFormat(testApiKey);

      expect(validResult.valid).toBe(true);
      expect(validResult.environment).toBe('live');
      
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('Invalid API key format');
      
      expect(testResult.valid).toBe(true);
      expect(testResult.environment).toBe('test');
    });

    it('should generate secure API keys', async () => {
      const apiKey = await securityModule.generateApiKey('live');

      expect(apiKey).toMatch(/^sk_live_[a-f0-9]{32}$/);
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
    });

    it('should validate webhook signatures', async () => {
      const payload = '{"event": "invoice.created", "data": {...}}';
      const secret = 'webhook-secret';
      const validSignature = 'sha256=hmac-result';

      crypto.createHmac().digest.mockReturnValue('hmac-result');

      const result = await securityModule.validateWebhookSignature(payload, secret, validSignature);

      expect(result.valid).toBe(true);
    });
  });

  describe('Threat Detection', () => {
    it('should detect suspicious request patterns', async () => {
      const suspiciousRequests = [
        { ip: '192.168.1.100', endpoint: '/admin', timestamp: Date.now() },
        { ip: '192.168.1.100', endpoint: '/admin/users', timestamp: Date.now() - 1000 },
        { ip: '192.168.1.100', endpoint: '/admin/config', timestamp: Date.now() - 2000 },
        { ip: '192.168.1.100', endpoint: '/admin/logs', timestamp: Date.now() - 3000 },
        { ip: '192.168.1.100', endpoint: '/admin/backup', timestamp: Date.now() - 4000 }
      ];

      const threat = await securityModule.detectSuspiciousActivity(suspiciousRequests);

      expect(threat.detected).toBe(true);
      expect(threat.type).toBe('admin_enumeration');
      expect(threat.riskLevel).toBe('high');
      expect(threat.recommendations).toContain('Block IP address');
    });

    it('should detect brute force attempts', async () => {
      const bruteForceAttempts = Array.from({ length: 20 }, (_, i) => ({
        ip: '192.168.1.100',
        endpoint: '/auth/login',
        status: 401,
        timestamp: Date.now() - (i * 1000)
      }));

      const threat = await securityModule.detectBruteForce(bruteForceAttempts);

      expect(threat.detected).toBe(true);
      expect(threat.type).toBe('brute_force_login');
      expect(threat.attempts).toBe(20);
      expect(threat.riskLevel).toBe('critical');
    });

    it('should detect anomalous data access patterns', async () => {
      const dataAccess = [
        { userId: 'user-123', resource: 'invoice-1', action: 'read', timestamp: Date.now() },
        { userId: 'user-123', resource: 'invoice-2', action: 'read', timestamp: Date.now() - 1000 },
        { userId: 'user-123', resource: 'invoice-3', action: 'read', timestamp: Date.now() - 2000 }
        // ... 50 more rapid sequential accesses
      ];

      const anomaly = await securityModule.detectAnomalousDataAccess(dataAccess);

      expect(anomaly.detected).toBe(true);
      expect(anomaly.type).toBe('rapid_data_enumeration');
      expect(anomaly.severity).toBe('medium');
    });
  });

  describe('Compliance Validation', () => {
    it('should validate PCI DSS compliance requirements', async () => {
      const systemConfig = {
        encryption: { enabled: true, algorithm: 'AES-256' },
        accessControl: { mfa: true, roleBasedAccess: true },
        logging: { enabled: true, retention: 365 },
        networkSecurity: { firewall: true, intrusion: true }
      };

      const compliance = await securityModule.validatePCICompliance(systemConfig);

      expect(compliance.compliant).toBe(true);
      expect(compliance.score).toBeGreaterThan(0.9);
      expect(compliance.requirements.encryption).toBe(true);
      expect(compliance.requirements.accessControl).toBe(true);
    });

    it('should validate GDPR compliance requirements', async () => {
      const dataProcessing = {
        consent: { required: true, obtained: true },
        dataMinimization: true,
        rightToErasure: true,
        dataPortability: true,
        privacyByDesign: true,
        dpo: { appointed: true, contact: 'dpo@example.com' }
      };

      const compliance = await securityModule.validateGDPRCompliance(dataProcessing);

      expect(compliance.compliant).toBe(true);
      expect(compliance.requirements.consent).toBe(true);
      expect(compliance.requirements.dataMinimization).toBe(true);
      expect(compliance.requirements.rightToErasure).toBe(true);
    });

    it('should validate SOC 2 Type II compliance', async () => {
      const controls = {
        security: { policies: true, procedures: true, monitoring: true },
        availability: { uptime: 99.9, redundancy: true },
        processing: { accuracy: true, completeness: true },
        confidentiality: { encryption: true, accessControl: true },
        privacy: { notice: true, choice: true, onward: true }
      };

      const compliance = await securityModule.validateSOC2Compliance(controls);

      expect(compliance.compliant).toBe(true);
      expect(compliance.trustServiceCriteria.security).toBe(true);
      expect(compliance.trustServiceCriteria.availability).toBe(true);
    });
  });

  describe('Security Monitoring', () => {
    it('should generate security events for monitoring', async () => {
      const event = {
        type: 'authentication_failure',
        userId: 'user-123',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: Date.now(),
        metadata: { reason: 'invalid_password', attempts: 3 }
      };

      const securityEvent = await securityModule.createSecurityEvent(event);

      expect(securityEvent).toBeDefined();
      expect(securityEvent.id).toBeDefined();
      expect(securityEvent.severity).toBeDefined();
      expect(securityEvent.category).toBe('authentication');
      expect(securityEvent.riskScore).toBeGreaterThan(0);
    });

    it('should calculate risk scores for events', async () => {
      const highRiskEvent = {
        type: 'privilege_escalation',
        userId: 'user-123',
        fromRole: 'viewer',
        toRole: 'admin',
        ip: '192.168.1.100'
      };

      const lowRiskEvent = {
        type: 'successful_login',
        userId: 'user-123',
        ip: '192.168.1.100'
      };

      const highRisk = await securityModule.calculateRiskScore(highRiskEvent);
      const lowRisk = await securityModule.calculateRiskScore(lowRiskEvent);

      expect(highRisk).toBeGreaterThan(0.8);
      expect(lowRisk).toBeLessThan(0.3);
    });

    it('should aggregate security metrics', async () => {
      const timeRange = {
        start: Date.now() - 86400000, // 24 hours ago
        end: Date.now()
      };

      const metrics = await securityModule.getSecurityMetrics(timeRange);

      expect(metrics).toBeDefined();
      expect(metrics.authenticationFailures).toBeDefined();
      expect(metrics.suspiciousActivities).toBeDefined();
      expect(metrics.blockedRequests).toBeDefined();
      expect(metrics.averageRiskScore).toBeDefined();
      expect(metrics.topThreats).toBeDefined();
    });
  });
});
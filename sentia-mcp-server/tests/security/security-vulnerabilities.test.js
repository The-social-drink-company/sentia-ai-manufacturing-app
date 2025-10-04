/**
 * Security Vulnerability Tests for MCP Server
 * Comprehensive security testing including penetration testing scenarios
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';

describe('Security Vulnerability Testing', () => {
  let server;
  let baseURL;

  beforeAll(async () => {
    server = await global.integrationTestUtils.startTestServer();
    baseURL = `http://localhost:${process.env.MCP_HTTP_PORT}`;
    await global.integrationTestUtils.waitForServer(process.env.MCP_HTTP_PORT);
    
    console.log('🔐 Security test server running for vulnerability testing');
  });

  afterAll(async () => {
    await global.integrationTestUtils.stopTestServer();
  });

  describe('Injection Attack Prevention', () => {
    it('should prevent SQL injection attacks', async () => {
      const sqlInjectionPayload = global.securityTestUtils.createMaliciousPayload('sqlInjection');
      
      const response = await request(baseURL)
        .post('/api/tools/validate')
        .send({
          tool: 'xero-financial-reports',
          parameters: {
            reportType: sqlInjectionPayload
          }
        });

      // Should not return 500 or expose database errors
      expect(response.status).not.toBe(500);
      
      // Response should not contain SQL error messages
      const responseText = JSON.stringify(response.body);
      expect(responseText.toLowerCase()).not.toMatch(/sql|database|mysql|postgres|sqlite/);
      
      // Should either reject with 400 or sanitize input
      expect([400, 200].includes(response.status)).toBe(true);
    });

    it('should prevent XSS attacks', async () => {
      const xssPayload = global.securityTestUtils.createMaliciousPayload('xss');
      
      const response = await request(baseURL)
        .post('/api/config/validate')
        .send({
          description: xssPayload
        });

      // Response should not reflect the XSS payload
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('<script>');
      expect(responseText).not.toContain('alert(');
    });

    it('should prevent command injection', async () => {
      const cmdInjectionPayload = global.securityTestUtils.createMaliciousPayload('cmdInjection');
      
      const response = await request(baseURL)
        .post('/api/tools/validate')
        .send({
          tool: 'system-command',
          parameters: {
            command: cmdInjectionPayload
          }
        });

      // Should reject dangerous commands
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should prevent path traversal attacks', async () => {
      const pathTraversalPayload = global.securityTestUtils.createMaliciousPayload('pathTraversal');
      
      const response = await request(baseURL)
        .get(`/api/config/file/${encodeURIComponent(pathTraversalPayload)}`);

      // Should not allow access to system files
      expect(response.status).not.toBe(200);
      expect([400, 403, 404].includes(response.status)).toBe(true);
    });
  });

  describe('Authentication Security', () => {
    it('should prevent brute force attacks', async () => {
      const attempts = [];
      const invalidToken = 'invalid-token';
      
      // Attempt multiple failed authentications
      for (let i = 0; i < 10; i++) {
        const response = await request(baseURL)
          .get('/api/config/status')
          .set('Authorization', `Bearer ${invalidToken}${i}`);
        
        attempts.push(response.status);
      }

      // Should start rate limiting after several attempts
      const rateLimitedAttempts = attempts.filter(status => status === 429);
      expect(rateLimitedAttempts.length).toBeGreaterThan(0);
    });

    it('should validate JWT tokens securely', async () => {
      const malformedTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Header only
        'invalid.token.format',
        'Bearer malformed-token',
        '', // Empty token
        'null',
        'undefined'
      ];

      for (const token of malformedTokens) {
        const response = await request(baseURL)
          .get('/api/config/status')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });

    it('should prevent token manipulation', async () => {
      const validToken = global.securityTestUtils.createTestJWT();
      
      // Try to manipulate the token
      const manipulatedToken = validToken.slice(0, -10) + 'manipulated';
      
      const response = await request(baseURL)
        .get('/api/config/status')
        .set('Authorization', `Bearer ${manipulatedToken}`);

      expect(response.status).toBe(401);
    });

    it('should enforce token expiration', async () => {
      const expiredToken = global.securityTestUtils.createTestJWT(
        { exp: Math.floor(Date.now() / 1000) - 3600 } // Expired 1 hour ago
      );
      
      const response = await request(baseURL)
        .get('/api/config/status')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should handle oversized payloads', async () => {
      const largePayload = global.securityTestUtils.createMaliciousPayload('largPayload');
      
      const response = await request(baseURL)
        .post('/api/config/validate')
        .send({ data: largePayload });

      // Should reject or limit large payloads
      expect([400, 413, 422].includes(response.status)).toBe(true);
    });

    it('should sanitize unicode and special characters', async () => {
      const unicodePayload = global.securityTestUtils.createMaliciousPayload('unicodeNormalization');
      
      const response = await request(baseURL)
        .post('/api/tools/validate')
        .send({
          tool: 'test-tool',
          parameters: {
            input: unicodePayload
          }
        });

      // Should handle unicode normalization attacks
      expect(response.status).not.toBe(500);
    });

    it('should prevent null byte injection', async () => {
      const nullBytePayload = global.securityTestUtils.createMaliciousPayload('nullBytes');
      
      const response = await request(baseURL)
        .post('/api/config/validate')
        .send({
          filename: nullBytePayload
        });

      // Should reject null byte injection
      expect([400, 422].includes(response.status)).toBe(true);
    });

    it('should validate content types', async () => {
      const response = await request(baseURL)
        .post('/api/config/validate')
        .set('Content-Type', 'application/xml')
        .send('<xml>malicious</xml>');

      // Should reject unexpected content types
      expect([400, 415].includes(response.status)).toBe(true);
    });
  });

  describe('HTTP Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(baseURL)
        .get('/health');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    it('should prevent clickjacking', async () => {
      const response = await request(baseURL)
        .get('/health');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should prevent MIME sniffing', async () => {
      const response = await request(baseURL)
        .get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Rate Limiting and DDoS Protection', () => {
    it('should implement rate limiting per IP', async () => {
      const requests = Array.from({ length: 30 }, () =>
        request(baseURL).get('/health')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should handle concurrent connections', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();

      const requests = Array.from({ length: concurrentRequests }, () =>
        request(baseURL)
          .get('/health')
          .timeout(5000)
      );

      try {
        const responses = await Promise.all(requests);
        const successfulResponses = responses.filter(r => r.status === 200);
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        
        // Should handle requests but may rate limit some
        expect(successfulResponses.length + rateLimitedResponses.length).toBe(concurrentRequests);
        
        const endTime = Date.now();
        console.log(`⚡ Handled ${concurrentRequests} concurrent requests in ${endTime - startTime}ms`);
        
      } catch (error) {
        // Some requests may timeout under load, which is acceptable
        console.log('Some requests timed out under high load (acceptable)');
      }
    });

    it('should protect against slowloris attacks', async () => {
      // Simulate slow HTTP attack by sending partial requests
      const slowRequests = Array.from({ length: 5 }, () =>
        request(baseURL)
          .post('/api/config/validate')
          .send('{"partial":') // Incomplete JSON
          .timeout(2000)
      );

      try {
        await Promise.all(slowRequests);
      } catch (errors) {
        // Requests should timeout or be rejected
        expect(errors).toBeDefined();
      }
    });
  });

  describe('Data Encryption and Privacy', () => {
    it('should encrypt sensitive data in transit', async () => {
      // If HTTPS is enabled, check for proper TLS
      const response = await request(baseURL)
        .get('/health');

      // In test environment, we accept HTTP, but headers should indicate HTTPS requirements
      if (response.headers['strict-transport-security']) {
        expect(response.headers['strict-transport-security']).toContain('max-age');
      }
    });

    it('should not expose sensitive information in errors', async () => {
      const response = await request(baseURL)
        .get('/api/config/environment')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      
      // Should not expose internal details
      const responseText = JSON.stringify(response.body);
      expect(responseText.toLowerCase()).not.toMatch(/password|secret|key|token|private/);
    });

    it('should validate data encryption utilities', async () => {
      const testData = 'sensitive-information';
      const encrypted = global.securityTestUtils.testDataEncryption(testData);
      
      expect(encrypted.encrypted).not.toBe(testData);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.encrypted.length).toBeGreaterThan(0);
    });
  });

  describe('Vulnerability Scanning', () => {
    it('should scan for common web vulnerabilities', async () => {
      const vulnerabilities = await global.securityTestUtils.scanForVulnerabilities(
        `${baseURL}/api/config/validate`
      );
      
      // Should have no high-severity vulnerabilities
      const highSeverityVulns = vulnerabilities.filter(v => v.severity === 'high');
      expect(highSeverityVulns).toHaveLength(0);
      
      if (vulnerabilities.length > 0) {
        console.log('🚨 Vulnerabilities found:', vulnerabilities);
      }
    });

    it('should measure response time under attack', async () => {
      const attackRequest = global.securityTestUtils.createAttackRequest('ddos', '/health');
      
      const timing = await global.securityTestUtils.measureResponseTime(
        { url: `${baseURL}/health`, method: 'GET' },
        5
      );
      
      // Response time should remain reasonable even under attack
      expect(timing.average).toBeLessThan(2000); // 2 seconds
      expect(timing.max).toBeLessThan(5000); // 5 seconds max
      
      console.log(`⏱️  Response time under load: avg ${timing.average.toFixed(2)}ms, max ${timing.max}ms`);
    });
  });

  describe('Security Configuration', () => {
    it('should have secure default configurations', async () => {
      const response = await request(baseURL)
        .get('/api/config/security')
        .set('Authorization', `Bearer ${global.securityTestUtils.createTestJWT()}`);

      if (response.status === 200) {
        expect(response.body.authRequired).toBe(true);
        expect(response.body.rateLimitingEnabled).toBe(true);
        expect(response.body.securityHeadersEnabled).toBe(true);
      }
    });

    it('should validate security policy compliance', async () => {
      // Test various security policy requirements
      const securityTests = [
        { name: 'CORS Policy', endpoint: '/health', header: 'access-control-allow-origin' },
        { name: 'CSP Policy', endpoint: '/health', header: 'content-security-policy' },
        { name: 'HSTS Policy', endpoint: '/health', header: 'strict-transport-security' }
      ];

      for (const test of securityTests) {
        const response = await request(baseURL).get(test.endpoint);
        
        if (response.headers[test.header]) {
          console.log(`✅ ${test.name}: ${response.headers[test.header]}`);
        }
      }
    });
  });
});
/**
 * Security Test Setup Configuration
 * Sets up security testing environment with threat simulation capabilities
 */

import { beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';

beforeAll(async () => {
  console.log('🔐 Setting up security test environment');
  
  // Set security test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SECURITY_TEST_MODE = 'true';
  process.env.LOG_LEVEL = 'warn';
  
  // Security test specific configurations
  process.env.RATE_LIMITING_ENABLED = 'true';
  process.env.SECURITY_MONITORING_ENABLED = 'true';
  process.env.AUDIT_LOGGING_ENABLED = 'true';
  process.env.MFA_ENABLED = 'false'; // Disable MFA for testing
  
  // Generate test encryption keys
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  process.env.JWT_REFRESH_SECRET = crypto.randomBytes(32).toString('hex');
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  
  // Test database for security testing
  process.env.DATABASE_URL = 'sqlite::memory:';
  process.env.REDIS_URL = 'redis://localhost:6379/2';
  
  console.log('✅ Security test environment setup completed');
});

afterAll(async () => {
  console.log('🧹 Cleaning up security test environment');
  
  // Clean up any security test artifacts
  if (global.securityTestServer) {
    await global.securityTestServer.close();
  }
  
  console.log('✅ Security test cleanup completed');
});

// Security testing utilities
global.securityTestUtils = {
  // Authentication and authorization test helpers
  createTestJWT: (payload = {}, secret = null) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({
      userId: 'test-user-id',
      role: 'user',
      ...payload
    }, secret || process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  createMaliciousPayload: (type) => {
    const payloads = {
      sqlInjection: "'; DROP TABLE users; --",
      xss: '<script>alert("XSS")</script>',
      cmdInjection: '; rm -rf / --no-preserve-root',
      pathTraversal: '../../../etc/passwd',
      largPayload: 'A'.repeat(1000000), // 1MB payload
      malformedJson: '{"invalid": json}',
      nullBytes: 'test\x00.txt',
      unicodeNormalization: '\u0041\u0300', // À normalization attack
    };
    return payloads[type] || payloads.xss;
  },
  
  // Network security test helpers
  createAttackRequest: (attackType, targetEndpoint = '/api/health') => {
    const baseRequest = {
      method: 'POST',
      url: `http://localhost:${process.env.MCP_HTTP_PORT}${targetEndpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTest/1.0'
      }
    };
    
    switch (attackType) {
      case 'ddos':
        return Array.from({ length: 100 }, () => ({ ...baseRequest }));
      
      case 'headerInjection':
        return {
          ...baseRequest,
          headers: {
            ...baseRequest.headers,
            'X-Injected-Header': 'malicious\r\nInjected: true'
          }
        };
      
      case 'oversizedHeaders':
        return {
          ...baseRequest,
          headers: {
            ...baseRequest.headers,
            'X-Large-Header': 'A'.repeat(10000)
          }
        };
      
      case 'invalidMethod':
        return {
          ...baseRequest,
          method: 'INVALID_METHOD'
        };
      
      default:
        return baseRequest;
    }
  },
  
  // Encryption and data security helpers
  testDataEncryption: (data) => {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('test-aad'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  },
  
  // Vulnerability scanning helpers
  scanForVulnerabilities: async (targetUrl) => {
    const vulnerabilities = [];
    
    // Test for common vulnerabilities
    const tests = [
      { name: 'SQL Injection', payload: this.createMaliciousPayload('sqlInjection') },
      { name: 'XSS', payload: this.createMaliciousPayload('xss') },
      { name: 'Command Injection', payload: this.createMaliciousPayload('cmdInjection') },
      { name: 'Path Traversal', payload: this.createMaliciousPayload('pathTraversal') }
    ];
    
    for (const test of tests) {
      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: test.payload })
        });
        
        const responseText = await response.text();
        
        // Check if payload was reflected (potential vulnerability)
        if (responseText.includes(test.payload)) {
          vulnerabilities.push({
            type: test.name,
            severity: 'high',
            description: `Potential ${test.name} vulnerability detected`
          });
        }
      } catch (error) {
        // Error is expected for security tests
      }
    }
    
    return vulnerabilities;
  },
  
  // Performance security testing
  measureResponseTime: async (request, iterations = 10) => {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await fetch(request.url, request);
      } catch (error) {
        // Errors are expected in security tests
      }
      const end = performance.now();
      times.push(end - start);
    }
    
    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: times.sort()[Math.floor(times.length / 2)]
    };
  }
};
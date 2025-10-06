/**
 * Integration Tests for MCP Server API Endpoints
 * Tests complete request/response cycles with real server instance
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';

describe('MCP Server API Integration Tests', () => {
  let server;
  let app;
  let baseURL;

  beforeAll(async () => {
    // Start test server
    server = await global.integrationTestUtils.startTestServer();
    baseURL = `http://localhost:${process.env.MCP_HTTP_PORT}`;
    
    // Wait for server to be ready
    await global.integrationTestUtils.waitForServer(process.env.MCP_HTTP_PORT);
    
    console.log(`🧪 Integration test server running on ${baseURL}`);
  });

  afterAll(async () => {
    await global.integrationTestUtils.stopTestServer();
  });

  describe('Health and Status Endpoints', () => {
    it('should return healthy status', async () => {
      const response = await request(baseURL)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });

      expect(response.body.services).toBeDefined();
      expect(response.body.version).toBeDefined();
    });

    it('should return detailed system status', async () => {
      const response = await request(baseURL)
        .get('/api/metrics/system/status')
        .expect(200);

      expect(response.body).toMatchObject({
        system: {
          memory: expect.any(Object),
          cpu: expect.any(Object),
          uptime: expect.any(Number)
        },
        services: expect.any(Object),
        integrations: expect.any(Object)
      });
    });

    it('should handle health check during high load', async () => {
      // Simulate concurrent health checks
      const requests = Array.from({ length: 10 }, () =>
        request(baseURL).get('/health')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Metrics and Monitoring Endpoints', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(baseURL)
        .get('/api/metrics/prometheus')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.text).toContain('sentia_mcp');
    });

    it('should return business metrics', async () => {
      const response = await request(baseURL)
        .get('/api/metrics/business')
        .expect(200);

      expect(response.body).toMatchObject({
        toolExecutions: expect.any(Object),
        businessValue: expect.any(Object),
        costs: expect.any(Object),
        roi: expect.any(Object)
      });
    });

    it('should return performance metrics', async () => {
      const response = await request(baseURL)
        .get('/api/metrics/performance')
        .expect(200);

      expect(response.body).toMatchObject({
        responseTime: expect.any(Object),
        memory: expect.any(Object),
        cpu: expect.any(Object),
        errors: expect.any(Object)
      });

      expect(response.body.responseTime).toHaveProperty('p95');
      expect(response.body.responseTime).toHaveProperty('p99');
    });

    it('should stream real-time metrics via SSE', async () => {
      const response = await request(baseURL)
        .get('/api/metrics/stream/sse')
        .set('Accept', 'text/event-stream')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });
  });

  describe('Configuration Management Endpoints', () => {
    it('should return current configuration status', async () => {
      const response = await request(baseURL)
        .get('/api/config/status')
        .expect(200);

      expect(response.body).toMatchObject({
        environment: 'test',
        version: expect.any(String),
        lastUpdated: expect.any(String),
        configHash: expect.any(String)
      });
    });

    it('should return environment configuration', async () => {
      const response = await request(baseURL)
        .get('/api/config/environment')
        .expect(200);

      expect(response.body).toHaveProperty('server');
      expect(response.body).toHaveProperty('security');
      expect(response.body).toHaveProperty('monitoring');
      expect(response.body.environment).toBe('test');
    });

    it('should validate configuration changes', async () => {
      const configUpdate = {
        monitoring: {
          enabled: true,
          level: 'detailed'
        }
      };

      const response = await request(baseURL)
        .post('/api/config/validate')
        .send(configUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        valid: expect.any(Boolean),
        errors: expect.any(Array),
        warnings: expect.any(Array)
      });
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        server: {
          port: 'invalid-port' // Should be number
        }
      };

      const response = await request(baseURL)
        .post('/api/config/validate')
        .send(invalidConfig)
        .expect(400);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication and Security', () => {
    it('should require authentication for protected endpoints', async () => {
      await request(baseURL)
        .post('/api/tools/execute')
        .send({ tool: 'xero-financial-reports' })
        .expect(401);
    });

    it('should accept valid authentication tokens', async () => {
      const token = global.securityTestUtils?.createTestJWT() || 'test-token';
      
      const response = await request(baseURL)
        .get('/api/config/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should reject malformed tokens', async () => {
      await request(baseURL)
        .get('/api/config/status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should enforce rate limiting', async () => {
      const requests = Array.from({ length: 50 }, () =>
        request(baseURL).get('/health')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      // Should have at least some rate limiting
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(baseURL)
        .get('/api/non-existent-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(baseURL)
        .post('/api/config/validate')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle oversized requests', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB
      
      await request(baseURL)
        .post('/api/config/validate')
        .send({ data: largePayload })
        .expect(413);
    });

    it('should return proper error formats', async () => {
      const response = await request(baseURL)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        code: expect.any(String),
        timestamp: expect.any(String)
      });
    });
  });

  describe('Integration Tool Endpoints', () => {
    beforeEach(() => {
      // Mock external services for integration tests
      process.env.DISABLE_EXTERNAL_APIS = 'true';
    });

    it('should list available tools', async () => {
      const response = await request(baseURL)
        .get('/api/tools/list')
        .expect(200);

      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools.length).toBeGreaterThan(0);

      // Check for expected integration tools
      const toolNames = response.body.tools.map(tool => tool.name);
      expect(toolNames).toContain('xero-financial-reports');
      expect(toolNames).toContain('shopify-orders');
      expect(toolNames).toContain('unleashed-products');
    });

    it('should return tool schemas', async () => {
      const response = await request(baseURL)
        .get('/api/tools/schema/xero-financial-reports')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('inputSchema');
      expect(response.body).toHaveProperty('outputSchema');
    });

    it('should validate tool execution requests', async () => {
      const validRequest = {
        tool: 'xero-financial-reports',
        parameters: {
          reportType: 'profit-loss',
          dateRange: '2024-01-01,2024-12-31'
        }
      };

      const response = await request(baseURL)
        .post('/api/tools/validate')
        .send(validRequest)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });
  });

  describe('Performance and Load', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      const requests = Array.from({ length: concurrentRequests }, () =>
        request(baseURL).get('/health')
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete reasonably quickly
      expect(totalTime).toBeLessThan(5000); // 5 seconds
      
      console.log(`✅ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
    });

    it('should maintain response time under load', async () => {
      const responseTimes = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        await request(baseURL)
          .get('/api/metrics/system/status')
          .expect(200);
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(1000); // 1 second average
      expect(maxResponseTime).toBeLessThan(3000); // 3 seconds max
      
      console.log(`📊 Average response time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`📊 Max response time: ${maxResponseTime}ms`);
    });
  });
});
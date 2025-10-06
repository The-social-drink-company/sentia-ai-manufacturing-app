/**
 * Unleashed Integration Test Suite
 * 
 * Comprehensive testing for Unleashed ERP integration including all tools,
 * utilities, and error handling scenarios.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { jest } from '@jest/globals';
import { UnleashedIntegration, registerUnleashedTools } from '../src/tools/unleashed-integration.js';
import { UnleashedAuth } from '../src/tools/unleashed/auth/unleashed-auth.js';
import { UnleashedAPIClient } from '../src/tools/unleashed/auth/api-client.js';
import { UnleashedAnalytics } from '../src/tools/unleashed/utils/analytics.js';
import { UnleashedCache } from '../src/tools/unleashed/utils/cache.js';
import { UnleashedErrorHandler } from '../src/tools/unleashed/utils/error-handler.js';
import { UnleashedRateLimiter } from '../src/tools/unleashed/utils/rate-limiter.js';
import { UnleashedWebhookHandler } from '../src/tools/unleashed/webhooks/webhook-handler.js';

// Mock MCP Server
const mockMCPServer = {
  addTool: jest.fn(),
  requestTool: jest.fn(),
  tools: new Map()
};

// Mock environment variables
process.env.UNLEASHED_API_ID = 'test-api-id';
process.env.UNLEASHED_API_KEY = 'test-api-key';
process.env.UNLEASHED_BASE_URL = 'https://api.unleashedsoftware.com';

describe('Unleashed Integration', () => {
  let unleashedIntegration;

  beforeEach(() => {
    unleashedIntegration = new UnleashedIntegration();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (unleashedIntegration.isInitialized) {
      await unleashedIntegration.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully with valid configuration', async () => {
      const result = await unleashedIntegration.initialize();
      
      expect(result).toBe(true);
      expect(unleashedIntegration.isInitialized).toBe(true);
      expect(unleashedIntegration.auth).toBeInstanceOf(UnleashedAuth);
      expect(unleashedIntegration.client).toBeInstanceOf(UnleashedAPIClient);
      expect(unleashedIntegration.analytics).toBeInstanceOf(UnleashedAnalytics);
      expect(unleashedIntegration.cache).toBeInstanceOf(UnleashedCache);
      expect(unleashedIntegration.errorHandler).toBeInstanceOf(UnleashedErrorHandler);
      expect(unleashedIntegration.rateLimiter).toBeInstanceOf(UnleashedRateLimiter);
      expect(unleashedIntegration.webhookHandler).toBeInstanceOf(UnleashedWebhookHandler);
    });

    test('should fail initialization with missing credentials', async () => {
      delete process.env.UNLEASHED_API_ID;
      
      const newIntegration = new UnleashedIntegration();
      await expect(newIntegration.initialize()).rejects.toThrow();
      
      // Restore for other tests
      process.env.UNLEASHED_API_ID = 'test-api-id';
    });

    test('should report correct health status', async () => {
      await unleashedIntegration.initialize();
      
      const health = unleashedIntegration.getHealthStatus();
      
      expect(health.status).toBe('healthy');
      expect(health.components).toBeDefined();
      expect(health.components.auth).toBe('connected');
      expect(health.components.cache).toBe('active');
      expect(health.components.rateLimiter).toBe('active');
    });
  });

  describe('Tool Registration', () => {
    test('should register all Unleashed tools successfully', async () => {
      await unleashedIntegration.initialize();
      await registerUnleashedTools(mockMCPServer);
      
      expect(mockMCPServer.addTool).toHaveBeenCalledTimes(7);
      
      // Verify all tools were registered
      const toolCalls = mockMCPServer.addTool.mock.calls;
      const toolNames = toolCalls.map(call => call[0].name);
      
      expect(toolNames).toContain('unleashed-get-products');
      expect(toolNames).toContain('unleashed-get-inventory');
      expect(toolNames).toContain('unleashed-get-production-orders');
      expect(toolNames).toContain('unleashed-get-purchase-orders');
      expect(toolNames).toContain('unleashed-get-sales-orders');
      expect(toolNames).toContain('unleashed-get-suppliers');
      expect(toolNames).toContain('unleashed-get-customers');
    });

    test('should handle tool registration failures gracefully', async () => {
      mockMCPServer.addTool.mockRejectedValueOnce(new Error('Registration failed'));
      
      await unleashedIntegration.initialize();
      
      // Should not throw and should log error
      await expect(registerUnleashedTools(mockMCPServer)).resolves.not.toThrow();
    });
  });

  describe('Authentication Module', () => {
    let auth;

    beforeEach(() => {
      auth = new UnleashedAuth({
        apiId: 'test-api-id',
        apiKey: 'test-api-key'
      });
    });

    test('should initialize authentication correctly', async () => {
      const result = await auth.initialize();
      
      expect(result).toBe(true);
      expect(auth.isInitialized).toBe(true);
    });

    test('should generate valid HMAC signatures', () => {
      const queryString = 'param1=value1&param2=value2';
      const signature = auth.generateSignature(queryString);
      
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });

    test('should build authenticated URLs correctly', () => {
      const endpoint = '/products';
      const params = { page: 1, pageSize: 20 };
      
      const url = auth.buildAuthenticatedUrl(endpoint, params);
      
      expect(url).toContain('/products');
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=20');
      expect(url).toContain('signature=');
    });

    test('should validate credentials correctly', () => {
      expect(auth.validateCredentials()).toBe(true);
      
      const invalidAuth = new UnleashedAuth({ apiId: '', apiKey: '' });
      expect(invalidAuth.validateCredentials()).toBe(false);
    });
  });

  describe('API Client', () => {
    let client;
    let auth;

    beforeEach(async () => {
      auth = new UnleashedAuth({
        apiId: 'test-api-id',
        apiKey: 'test-api-key'
      });
      await auth.initialize();
      
      client = new UnleashedAPIClient({ auth });
    });

    test('should initialize client successfully', async () => {
      const result = await client.initialize();
      
      expect(result).toBe(true);
      expect(client.isInitialized).toBe(true);
    });

    test('should handle API errors correctly', async () => {
      // Mock a failed request
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Resource not found' })
      });

      await client.initialize();
      
      await expect(client.get('/nonexistent')).rejects.toThrow();
    });

    test('should retry failed requests with exponential backoff', async () => {
      // Mock consecutive failures then success
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        });

      await client.initialize();
      
      const result = await client.get('/test');
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Analytics Utility', () => {
    let analytics;

    beforeEach(async () => {
      analytics = new UnleashedAnalytics();
      await analytics.initialize();
    });

    afterEach(async () => {
      await analytics.cleanup();
    });

    test('should calculate inventory metrics correctly', () => {
      const inventoryData = [
        { ProductCode: 'PROD001', QtyOnHand: 100, UnitCost: 10 },
        { ProductCode: 'PROD002', QtyOnHand: 50, UnitCost: 20 },
        { ProductCode: 'PROD003', QtyOnHand: 0, UnitCost: 15 }
      ];

      const metrics = analytics.calculateInventoryMetrics(inventoryData);

      expect(metrics.totalItems).toBe(3);
      expect(metrics.totalValue).toBe(2000);
      expect(metrics.stockoutCount).toBe(1);
      expect(metrics.averageValue).toBeCloseTo(666.67, 2);
    });

    test('should perform ABC analysis correctly', () => {
      const products = [
        { ProductCode: 'A1', annualUsage: 1000, unitCost: 10 },
        { ProductCode: 'A2', annualUsage: 800, unitCost: 8 },
        { ProductCode: 'B1', annualUsage: 500, unitCost: 5 },
        { ProductCode: 'C1', annualUsage: 100, unitCost: 2 }
      ];

      const analysis = analytics.performABCAnalysis(products);

      expect(analysis.A.length).toBeGreaterThan(0);
      expect(analysis.B.length).toBeGreaterThan(0);
      expect(analysis.C.length).toBeGreaterThan(0);
      expect(analysis.A[0].ProductCode).toBe('A1');
    });

    test('should calculate production efficiency metrics', () => {
      const productionData = [
        { 
          OrderNumber: 'PO001',
          PlannedQuantity: 100,
          CompletedQuantity: 95,
          PlannedStartDate: '2024-01-01',
          ActualStartDate: '2024-01-02',
          PlannedEndDate: '2024-01-10',
          ActualEndDate: '2024-01-12'
        }
      ];

      const metrics = analytics.calculateProductionEfficiency(productionData);

      expect(metrics.averageEfficiency).toBe(95);
      expect(metrics.onTimeDelivery).toBe(0);
      expect(metrics.scheduleAdherence).toBe(0);
    });
  });

  describe('Cache Utility', () => {
    let cache;

    beforeEach(async () => {
      cache = new UnleashedCache();
      await cache.initialize();
    });

    afterEach(async () => {
      await cache.cleanup();
    });

    test('should store and retrieve cached data', async () => {
      const testData = { products: [{ id: 1, name: 'Test Product' }] };
      
      await cache.set('test-key', testData);
      const retrieved = await cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    test('should respect TTL settings', async () => {
      const testData = { test: 'data' };
      
      await cache.set('ttl-test', testData, 1); // 1 second TTL
      
      let retrieved = await cache.get('ttl-test');
      expect(retrieved).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      retrieved = await cache.get('ttl-test');
      expect(retrieved).toBeNull();
    });

    test('should invalidate cache patterns correctly', async () => {
      await cache.set('products-list', { data: 'products' });
      await cache.set('products-detail-1', { data: 'product1' });
      await cache.set('inventory-list', { data: 'inventory' });
      
      const deleted = cache.invalidatePattern('products');
      
      expect(deleted).toBe(2);
      expect(await cache.get('products-list')).toBeNull();
      expect(await cache.get('products-detail-1')).toBeNull();
      expect(await cache.get('inventory-list')).not.toBeNull();
    });

    test('should calculate hit rate correctly', async () => {
      // Populate cache
      await cache.set('hit-test', 'data');
      
      // Generate hits and misses
      await cache.get('hit-test'); // hit
      await cache.get('hit-test'); // hit
      await cache.get('miss-test'); // miss
      
      const hitRate = cache.getHitRate();
      expect(hitRate).toBeCloseTo(66.67, 2);
    });
  });

  describe('Error Handler', () => {
    let errorHandler;

    beforeEach(async () => {
      errorHandler = new UnleashedErrorHandler();
      await errorHandler.initialize();
    });

    afterEach(async () => {
      await errorHandler.cleanup();
    });

    test('should classify HTTP errors correctly', () => {
      const error404 = { response: { status: 404 } };
      const error500 = { response: { status: 500 } };
      const timeoutError = { code: 'ECONNABORTED' };

      const classification404 = errorHandler.classifyError(error404);
      const classification500 = errorHandler.classifyError(error500);
      const classificationTimeout = errorHandler.classifyError(timeoutError);

      expect(classification404.type).toBe('not_found_error');
      expect(classification404.retryable).toBe(false);
      
      expect(classification500.type).toBe('server_error');
      expect(classification500.retryable).toBe(true);
      
      expect(classificationTimeout.type).toBe('timeout_error');
      expect(classificationTimeout.retryable).toBe(true);
    });

    test('should create appropriate recovery strategies', () => {
      const serverError = { response: { status: 500 } };
      const result = errorHandler.handleError(serverError, { endpoint: '/test' });

      expect(result.classification.type).toBe('server_error');
      expect(result.recoveryStrategy.strategy).toBe('retry_with_fallback');
      expect(result.shouldRetry).toBe(true);
      expect(result.nextRetryDelay).toBeGreaterThan(0);
    });

    test('should create fallback responses correctly', () => {
      const error = new Error('Service unavailable');
      const fallback = errorHandler.createFallbackResponse('get-products', error);

      expect(fallback.fallback).toBe(true);
      expect(fallback.data.products).toEqual([]);
      expect(fallback.data.summary.totalProducts).toBe(0);
    });

    test('should track error statistics', () => {
      const error1 = { response: { status: 404 } };
      const error2 = { response: { status: 500 } };

      errorHandler.handleError(error1, { endpoint: '/products' });
      errorHandler.handleError(error2, { endpoint: '/products' });
      errorHandler.handleError(error1, { endpoint: '/inventory' });

      const stats = errorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byType['not_found_error']).toBe(2);
      expect(stats.byType['server_error']).toBe(1);
      expect(stats.byEndpoint['/products']).toBe(2);
    });
  });

  describe('Rate Limiter', () => {
    let rateLimiter;

    beforeEach(async () => {
      rateLimiter = new UnleashedRateLimiter({
        maxRequests: 5,
        timeWindow: 1000 // 1 second for testing
      });
      await rateLimiter.initialize();
    });

    afterEach(async () => {
      await rateLimiter.cleanup();
    });

    test('should allow requests within rate limit', async () => {
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkRateLimit('test');
        expect(result.allowed).toBe(true);
      }
    });

    test('should throttle requests exceeding rate limit', async () => {
      // Exhaust the token bucket
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkRateLimit('test');
      }

      const result = await rateLimiter.checkRateLimit('test');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test('should queue requests correctly', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      // Queue a request
      const promise = rateLimiter.queueRequest(mockRequest, 'test', 'high');
      
      // Allow time for processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = await promise;
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalled();
    });

    test('should calculate efficiency correctly', () => {
      // Simulate some requests
      rateLimiter.stats.requestsAllowed = 80;
      rateLimiter.stats.requestsThrottled = 20;
      
      const efficiency = rateLimiter.calculateEfficiency();
      expect(efficiency).toBe(80);
    });
  });

  describe('Webhook Handler', () => {
    let webhookHandler;

    beforeEach(async () => {
      webhookHandler = new UnleashedWebhookHandler({
        secret: 'test-secret',
        validateSignature: false // Disable for testing
      });
      await webhookHandler.initialize();
    });

    afterEach(async () => {
      await webhookHandler.cleanup();
    });

    test('should register default event handlers', () => {
      const handlers = webhookHandler.getEventHandlers();
      
      expect(handlers).toContain('product.created');
      expect(handlers).toContain('product.updated');
      expect(handlers).toContain('inventory.updated');
      expect(handlers).toContain('sales_order.created');
      expect(handlers).toContain('purchase_order.created');
    });

    test('should parse webhook payloads correctly', () => {
      const payload = {
        event_type: 'product.created',
        data: { ProductCode: 'PROD001', ProductDescription: 'Test Product' },
        timestamp: '2024-01-01T00:00:00Z'
      };

      const parsed = webhookHandler.parseWebhookPayload(payload);

      expect(parsed.eventType).toBe('product.created');
      expect(parsed.eventData.ProductCode).toBe('PROD001');
      expect(parsed.timestamp).toBe('2024-01-01T00:00:00Z');
    });

    test('should queue events for processing', () => {
      const webhookData = {
        eventType: 'product.created',
        eventData: { ProductCode: 'PROD001' },
        timestamp: new Date().toISOString()
      };

      const mockReq = { ip: '127.0.0.1', headers: {} };
      const eventId = webhookHandler.queueWebhookEvent(webhookData, mockReq);

      expect(eventId).toBeTruthy();
      expect(webhookHandler.eventQueue.length).toBe(1);
    });

    test('should provide queue status information', () => {
      // Add some test events
      const testEvent = {
        eventType: 'test',
        eventData: {},
        timestamp: new Date().toISOString()
      };
      
      webhookHandler.queueWebhookEvent(testEvent, { ip: '127.0.0.1', headers: {} });
      
      const status = webhookHandler.getQueueStatus();
      
      expect(status.queueSize).toBe(1);
      expect(status.processingStats).toBeDefined();
    });
  });

  describe('Integration Tools', () => {
    beforeEach(async () => {
      await unleashedIntegration.initialize();
    });

    test('should handle get-products tool correctly', async () => {
      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          Items: [
            {
              ProductCode: 'PROD001',
              ProductDescription: 'Test Product',
              UnitOfMeasure: 'EA',
              DefaultSellPrice: 100
            }
          ],
          Pagination: { NumberOfItems: 1 }
        })
      });

      const result = await unleashedIntegration.getProducts({
        pageSize: 10,
        includeObsolete: false
      });

      expect(result.success).toBe(true);
      expect(result.data.products).toHaveLength(1);
      expect(result.data.products[0].ProductCode).toBe('PROD001');
    });

    test('should handle API errors gracefully', async () => {
      // Mock API error
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid credentials' })
      });

      const result = await unleashedIntegration.getProducts({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.fallback).toBe(true);
    });
  });

  describe('Performance and Monitoring', () => {
    beforeEach(async () => {
      await unleashedIntegration.initialize();
    });

    test('should provide comprehensive status information', () => {
      const status = unleashedIntegration.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.components).toBeDefined();
      expect(status.components.auth).toBeDefined();
      expect(status.components.cache).toBeDefined();
      expect(status.components.rateLimiter).toBeDefined();
    });

    test('should track performance metrics', () => {
      const metrics = unleashedIntegration.getMetrics();

      expect(metrics.cache).toBeDefined();
      expect(metrics.rateLimiter).toBeDefined();
      expect(metrics.errorHandler).toBeDefined();
    });

    test('should handle cleanup correctly', async () => {
      await unleashedIntegration.cleanup();

      expect(unleashedIntegration.isInitialized).toBe(false);
    });
  });
});

describe('Integration Scenarios', () => {
  let integration;

  beforeEach(async () => {
    integration = new UnleashedIntegration();
    await integration.initialize();
  });

  afterEach(async () => {
    await integration.cleanup();
  });

  test('should handle full product workflow', async () => {
    // Mock successful responses
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Items: [], Pagination: { NumberOfItems: 0 } })
      });

    const result = await integration.getProducts({ includeObsolete: false });
    
    expect(result.success).toBe(true);
    expect(result.analytics).toBeDefined();
  });

  test('should handle network failures with fallback', async () => {
    // Mock network failure
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    const result = await integration.getInventory({});
    
    expect(result.success).toBe(false);
    expect(result.fallback).toBe(true);
    expect(result.data.inventory).toEqual([]);
  });

  test('should respect rate limiting in high-volume scenarios', async () => {
    const requests = [];
    
    // Generate multiple concurrent requests
    for (let i = 0; i < 10; i++) {
      requests.push(integration.getProducts({ pageSize: 1 }));
    }

    const results = await Promise.allSettled(requests);
    
    // Some requests should succeed, others might be rate limited
    expect(results.length).toBe(10);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    expect(successful).toBeGreaterThan(0);
  });
});
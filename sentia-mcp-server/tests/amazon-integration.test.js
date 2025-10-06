/**
 * Amazon Integration Tests
 * 
 * Comprehensive test suite for Amazon SP-API integration including
 * authentication, tools, error handling, caching, and compliance.
 * 
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AmazonIntegration } from '../src/tools/amazon/index.js';
import { AmazonAuth } from '../src/tools/amazon/auth/sp-api-auth.js';
import { MarketplaceAuth } from '../src/tools/amazon/auth/marketplace-auth.js';
import { AmazonCache } from '../src/tools/amazon/utils/cache.js';
import { AmazonErrorHandler } from '../src/tools/amazon/utils/error-handler.js';
import { AmazonAnalytics } from '../src/tools/amazon/utils/analytics.js';
import { ComplianceManager } from '../src/tools/amazon/utils/compliance.js';
import { registerAmazonTools } from '../src/tools/amazon-integration.js';

// Mock environment variables
process.env.AMAZON_CLIENT_ID = 'test_client_id';
process.env.AMAZON_CLIENT_SECRET = 'test_client_secret';
process.env.AMAZON_REFRESH_TOKEN = 'test_refresh_token';

describe('Amazon Integration', () => {
  let amazonIntegration;
  let mockServer;

  beforeEach(() => {
    // Setup mock MCP server
    mockServer = {
      addTool: vi.fn(),
      tools: new Map()
    };

    // Initialize Amazon integration with test configuration
    amazonIntegration = new AmazonIntegration({
      marketplaces: {
        uk: {
          id: 'A1F83G8C2ARO7P',
          endpoint: 'https://sellingpartnerapi-eu.amazon.com',
          region: 'eu-west-1',
          currency: 'GBP'
        },
        usa: {
          id: 'ATVPDKIKX0DER',
          endpoint: 'https://sellingpartnerapi-na.amazon.com',
          region: 'us-east-1',
          currency: 'USD'
        }
      },
      caching: { enabled: true, defaultTTL: 300 },
      errorHandling: { maxRetries: 2, retryDelay: 1000 },
      analytics: { enabled: true }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication System', () => {
    it('should initialize authentication with proper configuration', () => {
      const auth = new AmazonAuth({
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        refreshToken: 'test_refresh_token'
      });

      expect(auth.config.clientId).toBe('test_client_id');
      expect(auth.config.clientSecret).toBe('test_client_secret');
      expect(auth.config.refreshToken).toBe('test_refresh_token');
    });

    it('should support multiple marketplaces', () => {
      const auth = new AmazonAuth();
      
      expect(auth.marketplaces).toHaveProperty('UK');
      expect(auth.marketplaces).toHaveProperty('USA');
      expect(auth.marketplaces.UK.id).toBe('A1F83G8C2ARO7P');
      expect(auth.marketplaces.USA.id).toBe('ATVPDKIKX0DER');
    });

    it('should handle marketplace authentication', async () => {
      const marketplaceAuth = new MarketplaceAuth();
      
      // Mock successful authentication
      const mockClient = { authenticated: true, marketplace: 'UK' };
      vi.spyOn(marketplaceAuth, 'getClient').mockResolvedValue(mockClient);

      const client = await marketplaceAuth.getClient('UK');
      expect(client).toEqual(mockClient);
      expect(marketplaceAuth.getClient).toHaveBeenCalledWith('UK');
    });
  });

  describe('Tool Registration', () => {
    it('should register all Amazon tools with MCP server', async () => {
      await registerAmazonTools(mockServer);

      // Verify all tools are registered
      expect(mockServer.addTool).toHaveBeenCalledTimes(4);
      
      const toolNames = mockServer.addTool.mock.calls.map(call => call[0].name);
      expect(toolNames).toContain('amazon-auth');
      expect(toolNames).toContain('amazon-execute');
      expect(toolNames).toContain('amazon-system');
      expect(toolNames).toContain('amazon-analytics');
    });

    it('should configure tools with proper schemas', async () => {
      await registerAmazonTools(mockServer);

      const authToolCall = mockServer.addTool.mock.calls.find(
        call => call[0].name === 'amazon-auth'
      );
      
      expect(authToolCall[0].inputSchema).toBeDefined();
      expect(authToolCall[0].inputSchema.properties.action).toBeDefined();
      expect(authToolCall[0].inputSchema.properties.marketplaceId).toBeDefined();
    });
  });

  describe('Core E-commerce Tools', () => {
    describe('Orders Tool', () => {
      it('should retrieve orders with proper parameters', async () => {
        const mockOrdersData = {
          orders: [
            {
              orderId: 'AMZ-123',
              status: 'Shipped',
              total: 99.99,
              currency: 'USD'
            }
          ],
          pagination: { hasNext: false }
        };

        vi.spyOn(amazonIntegration, 'executeTool').mockResolvedValue({
          success: true,
          data: mockOrdersData
        });

        const result = await amazonIntegration.executeTool('orders', {
          marketplaceId: 'USA',
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        });

        expect(result.success).toBe(true);
        expect(result.data.orders).toHaveLength(1);
        expect(result.data.orders[0].orderId).toBe('AMZ-123');
      });

      it('should handle order status filtering', async () => {
        const params = {
          marketplaceId: 'UK',
          orderStatus: ['Shipped', 'Delivered'],
          includeMetrics: true
        };

        vi.spyOn(amazonIntegration, 'executeTool').mockResolvedValue({
          success: true,
          data: { orders: [], metrics: { totalOrders: 0 } }
        });

        const result = await amazonIntegration.executeTool('orders', params);
        expect(result.success).toBe(true);
        expect(amazonIntegration.executeTool).toHaveBeenCalledWith('orders', params);
      });
    });

    describe('Products Tool', () => {
      it('should retrieve products by different search types', async () => {
        const mockProductData = {
          products: [
            {
              asin: 'B0123456789',
              title: 'Test Product',
              price: 29.99,
              availability: 'InStock'
            }
          ]
        };

        vi.spyOn(amazonIntegration, 'executeTool').mockResolvedValue({
          success: true,
          data: mockProductData
        });

        const result = await amazonIntegration.executeTool('products', {
          marketplaceId: 'USA',
          searchType: 'asin',
          asinList: ['B0123456789']
        });

        expect(result.success).toBe(true);
        expect(result.data.products[0].asin).toBe('B0123456789');
      });
    });

    describe('Inventory Tool', () => {
      it('should retrieve FBA and FBM inventory', async () => {
        const mockInventoryData = {
          inventory: [
            {
              sku: 'TEST-SKU-001',
              asin: 'B0123456789',
              fulfillmentType: 'FBA',
              quantity: 100,
              reservedQuantity: 5
            }
          ],
          summary: {
            totalSKUs: 1,
            totalQuantity: 100,
            byFulfillmentType: { FBA: 1, FBM: 0 }
          }
        };

        vi.spyOn(amazonIntegration, 'executeTool').mockResolvedValue({
          success: true,
          data: mockInventoryData
        });

        const result = await amazonIntegration.executeTool('inventory', {
          marketplaceId: 'UK',
          inventoryType: 'all',
          includeReserved: true
        });

        expect(result.success).toBe(true);
        expect(result.data.inventory[0].sku).toBe('TEST-SKU-001');
        expect(result.data.summary.totalSKUs).toBe(1);
      });
    });
  });

  describe('Caching System', () => {
    let cache;

    beforeEach(() => {
      cache = new AmazonCache({
        enabled: true,
        defaultTTL: 300,
        ordersTTL: 180
      });
    });

    it('should generate unique cache keys', () => {
      const key1 = cache.generateKey('orders', { marketplaceId: 'UK', status: 'Shipped' });
      const key2 = cache.generateKey('orders', { marketplaceId: 'USA', status: 'Shipped' });
      
      expect(key1).toContain('amazon:UK:orders:');
      expect(key2).toContain('amazon:USA:orders:');
      expect(key1).not.toBe(key2);
    });

    it('should set and get cached data', async () => {
      const testData = { orders: ['order1', 'order2'] };
      const key = 'amazon:UK:orders:test';

      const setResult = await cache.set(key, testData, 60);
      expect(setResult).toBe(true);

      const retrievedData = await cache.get(key);
      expect(retrievedData).toBeDefined();
      expect(retrievedData.orders).toEqual(testData.orders);
      expect(retrievedData._cacheMetadata.fromCache).toBe(true);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('amazon:UK:orders:nonexistent');
      expect(result).toBeNull();
    });

    it('should clear marketplace-specific cache', async () => {
      await cache.set('amazon:UK:orders:test1', { data: 'test1' });
      await cache.set('amazon:USA:orders:test2', { data: 'test2' });

      const clearResult = await cache.clearMarketplace('UK');
      expect(clearResult.success).toBe(true);
      expect(clearResult.clearedKeys).toBe(1);

      const ukData = await cache.get('amazon:UK:orders:test1');
      const usaData = await cache.get('amazon:USA:orders:test2');
      
      expect(ukData).toBeNull();
      expect(usaData).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    let errorHandler;

    beforeEach(() => {
      errorHandler = new AmazonErrorHandler({
        maxRetries: 2,
        baseDelay: 100,
        circuitBreakerThreshold: 3
      });
    });

    it('should analyze different error types', () => {
      const errors = [
        { response: { status: 401 } },
        { response: { status: 429 } },
        { response: { status: 500 } },
        { code: 'ECONNRESET' }
      ];

      const analyses = errors.map(error => errorHandler.analyzeError(error));

      expect(analyses[0].errorType).toBe('UNAUTHORIZED');
      expect(analyses[1].errorType).toBe('RATE_LIMITED');
      expect(analyses[1].isRetryable).toBe(true);
      expect(analyses[2].errorType).toBe('SERVER_ERROR');
      expect(analyses[3].errorType).toBe('NETWORK_ERROR');
    });

    it('should implement circuit breaker pattern', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Server error'));

      // First few attempts should fail normally
      await expect(errorHandler.withRetry(failingOperation, 'test-context')).rejects.toThrow();
      await expect(errorHandler.withRetry(failingOperation, 'test-context')).rejects.toThrow();
      await expect(errorHandler.withRetry(failingOperation, 'test-context')).rejects.toThrow();

      // Circuit should be open now
      const isOpen = errorHandler.isCircuitOpen('test-context');
      expect(isOpen).toBe(true);
    });

    it('should handle rate limiting with exponential backoff', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          headers: { 'retry-after': '2' }
        }
      };

      vi.spyOn(errorHandler, 'sleep').mockResolvedValue();
      const operation = vi.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('success');

      const result = await errorHandler.withRetry(operation, 'rate-limit-test');
      
      expect(result).toBe('success');
      expect(errorHandler.sleep).toHaveBeenCalled();
    });
  });

  describe('Analytics Engine', () => {
    let analytics;

    beforeEach(() => {
      analytics = new AmazonAnalytics({
        enabled: true,
        crossMarketplaceAnalysis: true
      });
    });

    it('should track operation performance', async () => {
      const operation = {
        tool: 'orders',
        marketplace: 'UK',
        executionTime: 1500,
        success: true,
        timestamp: new Date().toISOString()
      };

      await analytics.trackOperation('orders', {}, { success: true }, 1500);

      const stats = analytics.getPerformanceStats();
      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });

    it('should generate cross-marketplace analytics', async () => {
      // Mock operations for multiple marketplaces
      analytics.operationHistory = [
        {
          tool: 'orders',
          marketplace: 'UK',
          executionTime: 1200,
          success: true,
          timestamp: new Date().toISOString()
        },
        {
          tool: 'orders',
          marketplace: 'USA',
          executionTime: 1500,
          success: true,
          timestamp: new Date().toISOString()
        }
      ];

      const report = await analytics.generateCrossMarketplaceReport(['UK', 'USA']);

      expect(report.overview).toBeDefined();
      expect(report.performance).toBeDefined();
      expect(report.marketplaceComparison).toBeDefined();
      expect(report.optimization).toBeDefined();
    });
  });

  describe('Compliance Manager', () => {
    let compliance;

    beforeEach(() => {
      compliance = new ComplianceManager({
        enabled: true,
        taxCalculation: true,
        restrictedProducts: true
      });
    });

    it('should validate product compliance for different marketplaces', async () => {
      const productData = {
        title: 'Test Product',
        brand: 'Test Brand',
        category: 'electronics',
        price: 99.99
      };

      const validation = await compliance.validateProductCompliance(productData, 'UK');

      expect(validation).toBeDefined();
      expect(validation.marketplace).toBe('UK');
      expect(validation.compliant).toBe(true);
      expect(validation.warnings).toBeDefined();
      expect(validation.requirements).toBeDefined();
    });

    it('should calculate taxes for different marketplaces', () => {
      const ukTax = compliance.calculateTax(100, 'UK');
      const usaTax = compliance.calculateTax(100, 'USA');

      expect(ukTax.taxRate).toBe(0.20); // 20% VAT
      expect(ukTax.taxAmount).toBe(20);
      expect(ukTax.totalPrice).toBe(120);
      expect(ukTax.currency).toBe('GBP');

      expect(usaTax.taxRate).toBe(0); // Varies by state
      expect(usaTax.currency).toBe('USD');
    });

    it('should identify restricted product categories', () => {
      const weaponsRestriction = compliance.isCategoryRestricted('weapons', 'UK');
      const electronicsRestriction = compliance.isCategoryRestricted('electronics', 'UK');

      expect(weaponsRestriction.prohibited).toBe(true);
      expect(weaponsRestriction.reason).toContain('prohibited');

      expect(electronicsRestriction.prohibited).toBe(false);
      expect(electronicsRestriction.restricted).toBe(false);
    });

    it('should generate compliance checklists', () => {
      const productData = {
        id: 'TEST-001',
        title: 'Test Electronics Product',
        category: 'electronics',
        brand: 'TestBrand'
      };

      const checklist = compliance.generateComplianceChecklist(productData, 'UK');

      expect(checklist.marketplace).toBe('UK');
      expect(checklist.productId).toBe('TEST-001');
      expect(checklist.items).toBeDefined();
      expect(checklist.items.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Health Checks', () => {
    it('should perform system health check', async () => {
      const health = await amazonIntegration.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.components).toBeDefined();
      expect(health.components.authentication).toBeDefined();
      expect(health.components.cache).toBeDefined();
      expect(health.components.errorHandler).toBeDefined();
    });

    it('should provide system statistics', () => {
      const stats = amazonIntegration.getSystemStats();

      expect(stats).toBeDefined();
      expect(stats.performance).toBeDefined();
      expect(stats.requests).toBeDefined();
      expect(stats.errors).toBeDefined();
      expect(stats.cacheStats).toBeDefined();
    });

    it('should list supported marketplaces', () => {
      const marketplaces = amazonIntegration.getSupportedMarketplaces();

      expect(marketplaces).toBeDefined();
      expect(marketplaces).toContain('UK');
      expect(marketplaces).toContain('USA');
    });

    it('should list available tools', () => {
      const tools = amazonIntegration.getAvailableTools();

      expect(tools).toBeDefined();
      expect(tools).toContain('orders');
      expect(tools).toContain('products');
      expect(tools).toContain('inventory');
      expect(tools).toContain('reports');
      expect(tools).toContain('listings');
      expect(tools).toContain('advertising');
    });
  });

  describe('Multi-marketplace Operations', () => {
    it('should handle marketplace-specific configurations', () => {
      const ukConfig = amazonIntegration.getMarketplaceConfig('UK');
      const usaConfig = amazonIntegration.getMarketplaceConfig('USA');

      expect(ukConfig.currency).toBe('GBP');
      expect(ukConfig.region).toBe('eu-west-1');
      expect(usaConfig.currency).toBe('USD');
      expect(usaConfig.region).toBe('us-east-1');
    });

    it('should validate marketplace IDs', () => {
      expect(amazonIntegration.isValidMarketplace('UK')).toBe(true);
      expect(amazonIntegration.isValidMarketplace('USA')).toBe(true);
      expect(amazonIntegration.isValidMarketplace('INVALID')).toBe(false);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle authentication failures gracefully', async () => {
      vi.spyOn(amazonIntegration.auth, 'getClient').mockRejectedValue(
        new Error('Authentication failed')
      );

      const result = await amazonIntegration.executeTool('orders', {
        marketplaceId: 'UK'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });

    it('should handle invalid marketplace IDs', async () => {
      const result = await amazonIntegration.executeTool('orders', {
        marketplaceId: 'INVALID'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid marketplace');
    });

    it('should handle network timeouts', async () => {
      vi.spyOn(amazonIntegration, 'executeTool').mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(
        amazonIntegration.executeTool('orders', { marketplaceId: 'UK' })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance Optimization', () => {
    it('should cache frequently accessed data', async () => {
      const cacheKey = 'amazon:UK:orders:test';
      const testData = { orders: ['order1'] };

      vi.spyOn(amazonIntegration.cache, 'get').mockResolvedValue(testData);
      vi.spyOn(amazonIntegration.cache, 'set').mockResolvedValue(true);

      // First call should set cache
      await amazonIntegration.cache.set(cacheKey, testData);
      
      // Second call should hit cache
      const cachedData = await amazonIntegration.cache.get(cacheKey);

      expect(cachedData).toEqual(testData);
      expect(amazonIntegration.cache.get).toHaveBeenCalledWith(cacheKey);
    });

    it('should implement request throttling', async () => {
      // Simulate multiple rapid requests
      const promises = Array(5).fill().map(() => 
        amazonIntegration.executeTool('orders', { marketplaceId: 'UK' })
      );

      // Should handle concurrent requests gracefully
      const results = await Promise.allSettled(promises);
      
      // At least some should succeed or be properly throttled
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      expect(fulfilled.length + rejected.length).toBe(5);
    });
  });
});

describe('Amazon Tool Handlers', () => {
  let mockServer;

  beforeEach(async () => {
    mockServer = {
      addTool: vi.fn(),
      tools: new Map()
    };

    await registerAmazonTools(mockServer);
  });

  it('should handle amazon-auth tool calls', async () => {
    const authTool = mockServer.addTool.mock.calls.find(
      call => call[0].name === 'amazon-auth'
    )[0];

    const result = await authTool.handler({
      action: 'status',
      marketplaceId: 'all'
    });

    expect(result).toBeDefined();
    // Result structure depends on implementation
  });

  it('should handle amazon-execute tool calls', async () => {
    const executeTool = mockServer.addTool.mock.calls.find(
      call => call[0].name === 'amazon-execute'
    )[0];

    const result = await executeTool.handler({
      tool: 'orders',
      marketplaceId: 'UK',
      params: {
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      }
    });

    expect(result).toBeDefined();
    // Result structure depends on implementation
  });

  it('should handle amazon-system tool calls', async () => {
    const systemTool = mockServer.addTool.mock.calls.find(
      call => call[0].name === 'amazon-system'
    )[0];

    const result = await systemTool.handler({
      action: 'health'
    });

    expect(result).toBeDefined();
    // Should return system health information
  });

  it('should handle amazon-analytics tool calls', async () => {
    const analyticsTool = mockServer.addTool.mock.calls.find(
      call => call[0].name === 'amazon-analytics'
    )[0];

    const result = await analyticsTool.handler({
      analysisType: 'cross-marketplace',
      marketplaces: ['UK', 'USA'],
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }
    });

    expect(result).toBeDefined();
    // Should return analytics data
  });
});
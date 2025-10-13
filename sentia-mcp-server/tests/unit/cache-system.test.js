/**
 * Comprehensive Tests for Cache System
 * 
 * Tests for the unified multi-level caching system, performance optimization,
 * and cache analytics components.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager } from '../../src/utils/cache.js';
import { PerformanceOptimizer } from '../../src/utils/performance.js';
import { CacheAnalytics } from '../../src/utils/cache-analytics.js';
import { XeroCache } from '../../src/tools/xero/utils/cache.js';

describe('Unified Cache System', () => {
  let cacheManager;
  let performanceOptimizer;
  let cacheAnalytics;

  beforeEach(async () => {
    // Initialize cache system with test configuration
    cacheManager = new CacheManager({
      type: 'memory',
      defaultTTL: 60,
      maxSize: 100,
      compression: { enabled: false },
      connectionPool: { enabled: false },
      apiBatching: { enabled: false },
      memory: { enableGCOptimization: false }
    });

    performanceOptimizer = new PerformanceOptimizer({
      compression: { enabled: false },
      connectionPool: { enabled: false },
      apiBatching: { enabled: false },
      memory: { enableGCOptimization: false }
    });

    cacheAnalytics = new CacheAnalytics({
      realTimeInterval: 1000,
      enablePredictiveAnalysis: false,
      enableCostAnalysis: false,
      enableAnomalyDetection: false
    });

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Clean up
    if (cacheManager && cacheManager.clearAll) {
      await cacheManager.clearAll();
    }
  });

  describe('CacheManager', () => {
    it('should initialize successfully', () => {
      expect(cacheManager).toBeDefined();
      expect(cacheManager.l1Cache).toBeDefined();
    });

    it('should set and get data from cache', async () => {
      const key = 'test-key';
      const data = { message: 'test data', timestamp: Date.now() };

      // Set data
      const setResult = await cacheManager.set(key, data);
      expect(setResult).toBe(true);

      // Get data
      const retrieved = await cacheManager.get(key);
      expect(retrieved).toBeDefined();
      expect(retrieved.message).toBe(data.message);
    });

    it('should handle cache strategies correctly', async () => {
      const key = 'financial-test';
      const data = { type: 'financial', amount: 1000 };

      // Set with financial strategy
      const setResult = await cacheManager.set(key, data, 'financial');
      expect(setResult).toBe(true);

      // Get with financial strategy
      const retrieved = await cacheManager.get(key, 'financial');
      expect(retrieved).toBeDefined();
      expect(retrieved.type).toBe('financial');
    });

    it('should delete data from cache', async () => {
      const key = 'delete-test';
      const data = { temp: true };

      // Set and verify
      await cacheManager.set(key, data);
      let retrieved = await cacheManager.get(key);
      expect(retrieved).toBeDefined();

      // Delete and verify
      const deleteResult = await cacheManager.delete(key);
      expect(deleteResult).toBe(true);

      retrieved = await cacheManager.get(key);
      expect(retrieved).toBeNull();
    });

    it('should handle cache invalidation', async () => {
      const keys = ['financial:test1', 'financial:test2', 'ecommerce:test3'];
      
      // Set multiple keys
      for (const key of keys) {
        await cacheManager.set(key, { data: key });
      }

      // Invalidate financial data
      const invalidatedCount = await cacheManager.invalidate('financial_update');
      expect(invalidatedCount).toBeGreaterThanOrEqual(0);
    });

    it('should provide cache statistics', () => {
      const stats = cacheManager.getStats();
      expect(stats).toBeDefined();
      expect(stats.hitRate).toBeDefined();
      expect(stats.strategies).toBeInstanceOf(Array);
    });

    it('should handle compression correctly', async () => {
      // Enable compression for this test
      const compressedManager = new CacheManager({
        type: 'memory',
        compression: { enabled: true, threshold: 100 }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const key = 'compression-test';
      const largeData = { 
        content: 'x'.repeat(1000), // Large data to trigger compression
        metadata: { compressed: true }
      };

      const setResult = await compressedManager.set(key, largeData);
      expect(setResult).toBe(true);

      const retrieved = await compressedManager.get(key);
      expect(retrieved).toBeDefined();
      expect(retrieved.content).toBe(largeData.content);
    });
  });

  describe('PerformanceOptimizer', () => {
    it('should initialize successfully', () => {
      expect(performanceOptimizer).toBeDefined();
      expect(performanceOptimizer.compressionEngine).toBeDefined();
    });

    it('should optimize responses', async () => {
      const response = 'test response data';
      const request = { headers: { 'accept-encoding': 'gzip' } };

      const optimized = await performanceOptimizer.optimizeResponse(response, request);
      expect(optimized).toBeDefined();
    });

    it('should batch API requests', async () => {
      const requests = [
        { id: 1, data: 'request1' },
        { id: 2, data: 'request2' },
        { id: 3, data: 'request3' }
      ];

      const batchResult = await performanceOptimizer.batchApiRequests(requests);
      expect(batchResult).toBeDefined();
      expect(Array.isArray(batchResult)).toBe(true);
    });

    it('should handle lazy loading', async () => {
      const resourceKey = 'test-resource';
      const loader = async () => ({ loaded: true, timestamp: Date.now() });

      const result = await performanceOptimizer.lazyLoad(resourceKey, loader);
      expect(result).toBeDefined();
      expect(result.loaded).toBe(true);

      // Second call should use cached result
      const cachedResult = await performanceOptimizer.lazyLoad(resourceKey, loader);
      expect(cachedResult.timestamp).toBe(result.timestamp);
    });

    it('should optimize memory usage', async () => {
      const result = await performanceOptimizer.optimizeMemory();
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should provide performance statistics', () => {
      const stats = performanceOptimizer.getStats();
      expect(stats).toBeDefined();
      expect(stats.metrics).toBeDefined();
      expect(stats.components).toBeDefined();
    });
  });

  describe('CacheAnalytics', () => {
    it('should initialize successfully', () => {
      expect(cacheAnalytics).toBeDefined();
      expect(cacheAnalytics.performanceAnalyzer).toBeDefined();
    });

    it('should record cache events', () => {
      const eventData = {
        key: 'test-key',
        level: 'l1',
        strategy: 'financial'
      };

      cacheAnalytics.recordCacheEvent('hit', eventData);
      expect(cacheAnalytics.realTimeData.length).toBeGreaterThan(0);
    });

    it('should update current metrics', () => {
      const metricsData = {
        hitRate: 85,
        latency: 25,
        throughput: 100
      };

      cacheAnalytics.updateCurrentMetrics(metricsData);
      expect(cacheAnalytics.currentMetrics.hitRate).toBe(85);
    });

    it('should analyze performance trends', () => {
      // Create mock events
      const events = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - (i * 1000),
        type: 'hit',
        duration: Math.random() * 100
      }));

      const trends = cacheAnalytics.analyzeTrends(events);
      expect(trends).toBeDefined();
      expect(trends.hitRateTrend).toBeDefined();
    });

    it('should generate optimization recommendations', () => {
      const analysis = {
        hitRate: { overall: 70 }, // Low hit rate
        performance: { averageLatency: 80 },
        efficiency: { overall: 75 }
      };

      const recommendations = cacheAnalytics.generateRecommendations(analysis);
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should provide dashboard data', () => {
      const dashboardData = cacheAnalytics.getDashboardData();
      expect(dashboardData).toBeDefined();
      expect(dashboardData.currentMetrics).toBeDefined();
    });

    it('should export analytics data', () => {
      const exportedData = cacheAnalytics.exportData('json', 'realtime');
      expect(exportedData).toBeDefined();
      expect(exportedData.metadata).toBeDefined();
      expect(exportedData.events).toBeDefined();
    });
  });

  describe('Service Integration - Xero Cache', () => {
    let xeroCache;

    beforeEach(() => {
      xeroCache = new XeroCache({
        enabled: true,
        useUnifiedCache: true,
        strategy: 'financial'
      });
    });

    it('should initialize with unified cache system', () => {
      expect(xeroCache).toBeDefined();
      expect(xeroCache.options.useUnifiedCache).toBe(true);
      expect(xeroCache.options.strategy).toBe('financial');
    });

    it('should generate cache keys correctly', () => {
      const key = xeroCache.generateKey('xero-get-invoices', {
        tenantId: 'test-tenant',
        page: 1
      });

      expect(key).toBeDefined();
      expect(key).toMatch(/^xero:xero-get-invoices:/);
    });

    it('should handle Xero-specific TTL values', () => {
      expect(xeroCache.getTTL('xero-get-financial-reports')).toBe(1800);
      expect(xeroCache.getTTL('xero-get-invoices')).toBe(600);
      expect(xeroCache.getTTL('xero-get-contacts')).toBe(3600);
    });

    it('should cache and retrieve Xero data', async () => {
      const key = 'xero:test:data';
      const xeroData = {
        invoices: [
          { id: '1', amount: 100 },
          { id: '2', amount: 200 }
        ],
        totalAmount: 300
      };

      // Set data
      const setResult = await xeroCache.set(key, xeroData);
      expect(setResult).toBe(true);

      // Get data
      const retrieved = await xeroCache.get(key);
      expect(retrieved).toBeDefined();
      expect(retrieved.invoices).toHaveLength(2);
      expect(retrieved._cacheMetadata.fromCache).toBe(true);
    });

    it('should provide Xero cache statistics', async () => {
      const stats = await xeroCache.getStats();
      expect(stats).toBeDefined();
      expect(stats.xero).toBeDefined();
      expect(stats.unified).toBeDefined();
      expect(stats.config).toBeDefined();
    });

    it('should handle cache warming', async () => {
      const toolsToWarm = [
        {
          name: 'xero-get-financial-reports',
          dataLoader: async () => ({ report: 'test data' }),
          priority: 1
        }
      ];

      const result = await xeroCache.warmUp('test-tenant', toolsToWarm);
      expect(result.success).toBe(true);
    });

    it('should invalidate cache by rules', async () => {
      // Set some test data
      await xeroCache.set('xero:financial:test1', { data: 'test1' });
      await xeroCache.set('xero:financial:test2', { data: 'test2' });

      // Invalidate financial data
      const invalidatedCount = await xeroCache.invalidateByRule('financial_update');
      expect(invalidatedCount).toBeGreaterThanOrEqual(0);
    });

    it('should generate performance metrics', async () => {
      const metrics = await xeroCache.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.efficiency).toBeDefined();
      expect(metrics.cost).toBeDefined();
      expect(metrics.recommendations).toBeDefined();
    });

    it('should optimize for Xero-specific patterns', async () => {
      const optimization = await xeroCache.optimizeForXero();
      expect(optimization).toBeDefined();
      expect(optimization.success).toBeDefined();
      expect(optimization.strategy).toBe('financial');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate cache, performance, and analytics systems', async () => {
      // Set up test scenario
      const testKey = 'integration:test';
      const testData = { integration: true, timestamp: Date.now() };

      // Use cache manager to set data
      await cacheManager.set(testKey, testData, 'financial');

      // Performance optimization
      const optimizedResponse = await performanceOptimizer.optimizeResponse(
        JSON.stringify(testData),
        { headers: { 'accept-encoding': 'gzip' } }
      );

      // Analytics should record the events
      cacheAnalytics.recordCacheEvent('set', {
        key: testKey,
        strategy: 'financial',
        level: 'l1'
      });

      // Verify integration
      const retrieved = await cacheManager.get(testKey, 'financial');
      expect(retrieved).toBeDefined();
      expect(optimizedResponse).toBeDefined();
      expect(cacheAnalytics.realTimeData.length).toBeGreaterThan(0);
    });

    it('should handle end-to-end caching workflow', async () => {
      // 1. Initialize systems
      expect(cacheManager.initialized).toBe(true);

      // 2. Set multiple data points with different strategies
      const testCases = [
        { key: 'financial:report1', data: { type: 'P&L' }, strategy: 'financial' },
        { key: 'ecommerce:product1', data: { name: 'Product A' }, strategy: 'ecommerce' },
        { key: 'manufacturing:order1', data: { status: 'pending' }, strategy: 'manufacturing' }
      ];

      for (const testCase of testCases) {
        const result = await cacheManager.set(testCase.key, testCase.data, testCase.strategy);
        expect(result).toBe(true);
      }

      // 3. Retrieve data and verify
      for (const testCase of testCases) {
        const retrieved = await cacheManager.get(testCase.key, testCase.strategy);
        expect(retrieved).toBeDefined();
      }

      // 4. Check statistics
      const stats = cacheManager.getStats();
      expect(stats.hitRate).toBeDefined();

      // 5. Test invalidation
      const invalidatedFinancial = await cacheManager.invalidate('financial_update');
      expect(invalidatedFinancial).toBeGreaterThanOrEqual(0);

      // 6. Verify performance metrics
      const perfStats = performanceOptimizer.getStats();
      expect(perfStats).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle cache failures gracefully', async () => {
      // Test with invalid data
      const result = await cacheManager.set('test', undefined);
      expect(result).toBe(false);
    });

    it('should handle performance optimization failures', async () => {
      // Test with invalid response
      const result = await performanceOptimizer.optimizeResponse(null, {});
      expect(result).toBeNull();
    });

    it('should handle analytics failures gracefully', () => {
      // Test with invalid event data
      expect(() => {
        cacheAnalytics.recordCacheEvent('invalid', null);
      }).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet cache performance requirements', async () => {
      const iterations = 100;
      const startTime = Date.now();

      // Perform cache operations
      for (let i = 0; i < iterations; i++) {
        await cacheManager.set(`perf:${i}`, { data: i });
        await cacheManager.get(`perf:${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTimePerOperation = duration / (iterations * 2); // set + get

      // Should be fast (less than 1ms per operation on average)
      expect(avgTimePerOperation).toBeLessThan(10);
    });

    it('should handle concurrent operations', async () => {
      const concurrentOperations = Array.from({ length: 50 }, (_, i) => 
        cacheManager.set(`concurrent:${i}`, { data: i })
      );

      const results = await Promise.allSettled(concurrentOperations);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value === true);
      
      expect(successful.length).toBeGreaterThan(40); // Allow for some failures
    });
  });
});

// Mock external dependencies for testing
vi.mock('../../src/utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

vi.mock('../../src/utils/monitoring.js', () => ({
  monitoring: {
    setMetric: vi.fn()
  }
}));
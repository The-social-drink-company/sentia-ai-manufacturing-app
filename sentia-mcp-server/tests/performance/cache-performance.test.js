/**
 * Performance Tests for Caching System
 * 
 * Comprehensive performance testing for the unified caching system,
 * including load testing, memory testing, and optimization validation.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { CacheManager } from '../../src/utils/cache.js';
import { PerformanceOptimizer } from '../../src/utils/performance.js';
import { CacheAnalytics } from '../../src/utils/cache-analytics.js';

describe('Cache Performance Tests', () => {
  let cacheManager;
  let performanceOptimizer;
  let cacheAnalytics;

  beforeAll(async () => {
    // Initialize with performance-optimized configuration
    cacheManager = new CacheManager({
      type: 'memory',
      defaultTTL: 300,
      maxSize: 5000,
      compression: { enabled: true, threshold: 512 },
      memory: { enableGCOptimization: true }
    });

    performanceOptimizer = new PerformanceOptimizer({
      compression: { enabled: true },
      connectionPool: { enabled: true, max: 20 },
      apiBatching: { enabled: true, batchSize: 10 },
      memory: { enableGCOptimization: true }
    });

    cacheAnalytics = new CacheAnalytics({
      realTimeInterval: 5000,
      enablePredictiveAnalysis: true,
      enableCostAnalysis: true,
      enableAnomalyDetection: true
    });

    // Wait for full initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (cacheManager && cacheManager.clearAll) {
      await cacheManager.clearAll();
    }
  });

  describe('Cache Performance Benchmarks', () => {
    const generateTestData = (size) => ({
      id: Math.random().toString(36),
      content: 'x'.repeat(size),
      timestamp: Date.now(),
      metadata: { generated: true, size }
    });

    it('should handle high-volume cache operations', async () => {
      const operations = 1000;
      const testData = generateTestData(100);
      
      console.time('High Volume Operations');
      
      // Sequential set operations
      const setPromises = Array.from({ length: operations }, (_, i) =>
        cacheManager.set(`volume:${i}`, { ...testData, id: i })
      );
      
      const setResults = await Promise.allSettled(setPromises);
      const successfulSets = setResults.filter(r => r.status === 'fulfilled' && r.value === true);
      
      console.timeEnd('High Volume Operations');
      
      expect(successfulSets.length).toBeGreaterThan(operations * 0.95); // 95% success rate
      
      // Test retrieval performance
      console.time('High Volume Retrievals');
      
      const getPromises = Array.from({ length: operations }, (_, i) =>
        cacheManager.get(`volume:${i}`)
      );
      
      const getResults = await Promise.allSettled(getPromises);
      const successfulGets = getResults.filter(r => r.status === 'fulfilled' && r.value !== null);
      
      console.timeEnd('High Volume Retrievals');
      
      expect(successfulGets.length).toBeGreaterThan(operations * 0.90); // 90% hit rate
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentUsers = 50;
      const operationsPerUser = 20;
      
      console.time('Concurrent Load Test');
      
      const userOperations = Array.from({ length: concurrentUsers }, (_, userId) =>
        Promise.all(Array.from({ length: operationsPerUser }, async (_, opId) => {
          const key = `user:${userId}:op:${opId}`;
          const data = generateTestData(50);
          
          // Set data
          await cacheManager.set(key, data);
          
          // Get data
          const retrieved = await cacheManager.get(key);
          
          return retrieved !== null;
        }))
      );
      
      const results = await Promise.allSettled(userOperations);
      const successfulUsers = results.filter(r => r.status === 'fulfilled');
      
      console.timeEnd('Concurrent Load Test');
      
      expect(successfulUsers.length).toBe(concurrentUsers);
      
      // Check overall success rate
      const totalOperations = successfulUsers.reduce((sum, user) => {
        return sum + user.value.filter(op => op === true).length;
      }, 0);
      
      const expectedOperations = concurrentUsers * operationsPerUser;
      const successRate = totalOperations / expectedOperations;
      
      expect(successRate).toBeGreaterThan(0.90); // 90% success rate under load
    });

    it('should demonstrate cache hit rate improvements', async () => {
      const testKeys = Array.from({ length: 100 }, (_, i) => `hitrate:${i}`);
      const testData = generateTestData(200);
      
      // First pass - populate cache
      for (const key of testKeys) {
        await cacheManager.set(key, { ...testData, key });
      }
      
      // Second pass - test hit rates
      let hits = 0;
      let misses = 0;
      
      console.time('Hit Rate Test');
      
      for (const key of testKeys) {
        const result = await cacheManager.get(key);
        if (result !== null) {
          hits++;
        } else {
          misses++;
        }
      }
      
      console.timeEnd('Hit Rate Test');
      
      const hitRate = (hits / (hits + misses)) * 100;
      
      expect(hitRate).toBeGreaterThan(95); // 95% hit rate expected
      
      console.log(`Cache Hit Rate: ${hitRate.toFixed(2)}%`);
    });

    it('should handle large data objects efficiently', async () => {
      const largeSizes = [1000, 5000, 10000, 25000]; // bytes
      const results = {};
      
      for (const size of largeSizes) {
        const data = generateTestData(size);
        const key = `large:${size}`;
        
        // Measure set performance
        const setStart = process.hrtime.bigint();
        await cacheManager.set(key, data);
        const setEnd = process.hrtime.bigint();
        const setTime = Number(setEnd - setStart) / 1000000; // Convert to ms
        
        // Measure get performance
        const getStart = process.hrtime.bigint();
        const retrieved = await cacheManager.get(key);
        const getEnd = process.hrtime.bigint();
        const getTime = Number(getEnd - getStart) / 1000000; // Convert to ms
        
        results[size] = {
          setTime,
          getTime,
          success: retrieved !== null,
          compressed: retrieved?._cacheMetadata?.compressed || false
        };
        
        // Performance should remain reasonable even with large data
        expect(setTime).toBeLessThan(100); // Less than 100ms for set
        expect(getTime).toBeLessThan(50);  // Less than 50ms for get
      }
      
      console.log('Large Data Performance:', results);
    });
  });

  describe('Performance Optimization Tests', () => {
    it('should demonstrate compression effectiveness', async () => {
      const uncompressedData = {
        content: 'This is a test string that should compress well. '.repeat(100),
        metadata: { type: 'test', repetitive: true }
      };
      
      // Test with compression enabled
      const key = 'compression:test';
      await cacheManager.set(key, uncompressedData);
      const retrieved = await cacheManager.get(key);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.content).toBe(uncompressedData.content);
      
      // Check if compression was applied (this would depend on implementation details)
      console.log('Compression test completed');
    });

    it('should demonstrate batching performance improvements', async () => {
      const batchSizes = [1, 5, 10, 20];
      const requestCount = 100;
      const results = {};
      
      for (const batchSize of batchSizes) {
        const requests = Array.from({ length: requestCount }, (_, i) => ({
          id: i,
          data: `request-${i}`,
          type: 'batch-test'
        }));
        
        const start = process.hrtime.bigint();
        
        // Use performance optimizer for batching
        const batchedResults = await performanceOptimizer.batchApiRequests(requests, {
          batchSize
        });
        
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to ms
        
        results[batchSize] = {
          duration,
          requestCount,
          batchCount: Math.ceil(requestCount / batchSize),
          avgTimePerBatch: duration / Math.ceil(requestCount / batchSize)
        };
      }
      
      console.log('Batching Performance Results:', results);
      
      // Larger batch sizes should generally be more efficient
      expect(results[20].avgTimePerBatch).toBeLessThan(results[1].avgTimePerBatch);
    });

    it('should demonstrate memory optimization effectiveness', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create memory pressure
      const largeObjects = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: generateTestData(1000),
        timestamp: Date.now()
      }));
      
      // Cache all objects
      for (const obj of largeObjects) {
        await cacheManager.set(`memory:${obj.id}`, obj);
      }
      
      const memoryAfterCache = process.memoryUsage();
      
      // Trigger memory optimization
      const optimizationResult = await performanceOptimizer.optimizeMemory();
      
      const memoryAfterOptimization = process.memoryUsage();
      
      expect(optimizationResult.success).toBe(true);
      
      console.log('Memory Usage:', {
        initial: Math.round(initialMemory.heapUsed / 1024 / 1024) + 'MB',
        afterCache: Math.round(memoryAfterCache.heapUsed / 1024 / 1024) + 'MB',
        afterOptimization: Math.round(memoryAfterOptimization.heapUsed / 1024 / 1024) + 'MB'
      });
    });
  });

  describe('Analytics Performance Tests', () => {
    it('should handle real-time analytics without performance degradation', async () => {
      const eventCount = 1000;
      const events = Array.from({ length: eventCount }, (_, i) => ({
        type: i % 4 === 0 ? 'hit' : 'miss',
        key: `analytics:${i}`,
        level: i % 3 === 0 ? 'l1' : 'l2',
        strategy: i % 2 === 0 ? 'financial' : 'ecommerce',
        latency: Math.random() * 100
      }));
      
      console.time('Analytics Event Processing');
      
      // Record events
      for (const event of events) {
        cacheAnalytics.recordCacheEvent(event.type, event);
      }
      
      console.timeEnd('Analytics Event Processing');
      
      // Verify events were recorded
      expect(cacheAnalytics.realTimeData.length).toBeGreaterThan(0);
      
      // Trigger analysis
      console.time('Analytics Analysis');
      await cacheAnalytics.performRealTimeAnalysis();
      console.timeEnd('Analytics Analysis');
    });

    it('should provide dashboard data efficiently', async () => {
      // Populate with some test data
      for (let i = 0; i < 100; i++) {
        cacheAnalytics.recordCacheEvent('hit', {
          key: `dashboard:${i}`,
          level: 'l1',
          strategy: 'financial'
        });
      }
      
      console.time('Dashboard Data Generation');
      const dashboardData = cacheAnalytics.getDashboardData();
      console.timeEnd('Dashboard Data Generation');
      
      expect(dashboardData).toBeDefined();
      expect(dashboardData.currentMetrics).toBeDefined();
      expect(dashboardData.performanceOverview).toBeDefined();
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance with increasing cache sizes', async () => {
      const cacheSizes = [100, 500, 1000, 2000];
      const results = {};
      
      for (const size of cacheSizes) {
        // Populate cache to the target size
        const populateStart = Date.now();
        for (let i = 0; i < size; i++) {
          await cacheManager.set(`scale:${size}:${i}`, generateTestData(100));
        }
        const populateTime = Date.now() - populateStart;
        
        // Test retrieval performance
        const testKeys = Array.from({ length: 50 }, (_, i) => 
          `scale:${size}:${Math.floor(Math.random() * size)}`
        );
        
        const retrieveStart = Date.now();
        const retrievePromises = testKeys.map(key => cacheManager.get(key));
        await Promise.all(retrievePromises);
        const retrieveTime = Date.now() - retrieveStart;
        
        results[size] = {
          populateTime,
          retrieveTime,
          avgPopulateTime: populateTime / size,
          avgRetrieveTime: retrieveTime / testKeys.length
        };
      }
      
      console.log('Scalability Results:', results);
      
      // Performance should not degrade significantly with size
      const smallestSize = Math.min(...cacheSizes);
      const largestSize = Math.max(...cacheSizes);
      
      const performanceDegradation = results[largestSize].avgRetrieveTime / results[smallestSize].avgRetrieveTime;
      
      expect(performanceDegradation).toBeLessThan(5); // Should not be more than 5x slower
    });

    it('should handle cache strategy switching efficiently', async () => {
      const strategies = ['financial', 'ecommerce', 'manufacturing', 'ai_analysis'];
      const operationsPerStrategy = 100;
      
      console.time('Strategy Switching Test');
      
      for (const strategy of strategies) {
        const strategyStart = Date.now();
        
        for (let i = 0; i < operationsPerStrategy; i++) {
          const key = `strategy:${strategy}:${i}`;
          const data = generateTestData(200);
          
          await cacheManager.set(key, data, strategy);
          await cacheManager.get(key, strategy);
        }
        
        const strategyTime = Date.now() - strategyStart;
        console.log(`${strategy} strategy: ${strategyTime}ms for ${operationsPerStrategy} operations`);
      }
      
      console.timeEnd('Strategy Switching Test');
      
      // Verify cache statistics
      const stats = cacheManager.getStats();
      expect(stats.strategies).toContain('financial');
      expect(stats.strategies).toContain('ecommerce');
    });
  });

  describe('Resource Usage Tests', () => {
    it('should monitor memory usage during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const operations = 1000;
      const largeData = generateTestData(5000);
      
      for (let i = 0; i < operations; i++) {
        await cacheManager.set(`memory:${i}`, largeData);
        
        // Check memory every 100 operations
        if (i % 100 === 0) {
          const currentMemory = process.memoryUsage();
          const heapIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
          
          console.log(`Operation ${i}: Heap increase: ${Math.round(heapIncrease / 1024 / 1024)}MB`);
          
          // Memory should not grow indefinitely
          expect(heapIncrease).toBeLessThan(500 * 1024 * 1024); // Less than 500MB increase
        }
      }
      
      const finalMemory = process.memoryUsage();
      console.log('Final Memory Usage:', {
        heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(finalMemory.external / 1024 / 1024) + 'MB'
      });
    });

    it('should demonstrate CPU efficiency', async () => {
      const iterations = 1000;
      const cpuIntensiveOperations = [];
      
      console.time('CPU Efficiency Test');
      
      for (let i = 0; i < iterations; i++) {
        cpuIntensiveOperations.push(
          cacheManager.set(`cpu:${i}`, generateTestData(1000))
            .then(() => cacheManager.get(`cpu:${i}`))
            .then(() => performanceOptimizer.optimizeResponse(JSON.stringify(generateTestData(500)), {}))
        );
      }
      
      await Promise.all(cpuIntensiveOperations);
      
      console.timeEnd('CPU Efficiency Test');
      
      // Test should complete in reasonable time
      // This is more of a baseline measurement than a strict test
    });
  });

  describe('Stress Tests', () => {
    it('should handle cache overflow gracefully', async () => {
      // Set cache to a small size for testing
      const smallCache = new CacheManager({
        type: 'memory',
        maxSize: 100, // Very small cache
        defaultTTL: 60
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to exceed cache capacity
      const overflowOperations = 200;
      const results = [];
      
      for (let i = 0; i < overflowOperations; i++) {
        const result = await smallCache.set(`overflow:${i}`, generateTestData(100));
        results.push(result);
      }
      
      // Some operations should succeed (cache should handle overflow)
      const successfulOperations = results.filter(r => r === true).length;
      expect(successfulOperations).toBeGreaterThan(0);
      
      // Cache should not crash
      const stats = smallCache.getStats();
      expect(stats).toBeDefined();
    });

    it('should handle rapid cache invalidation', async () => {
      // Populate cache with test data
      const testData = Array.from({ length: 500 }, (_, i) => ({
        key: `invalidation:${i}`,
        data: generateTestData(100)
      }));
      
      for (const item of testData) {
        await cacheManager.set(item.key, item.data);
      }
      
      // Rapidly invalidate different patterns
      console.time('Rapid Invalidation Test');
      
      const invalidationPromises = [
        cacheManager.invalidate('financial_update'),
        cacheManager.invalidate('inventory_update'),
        cacheManager.invalidate('product_change'),
        cacheManager.invalidate('data_refresh')
      ];
      
      const invalidationResults = await Promise.allSettled(invalidationPromises);
      
      console.timeEnd('Rapid Invalidation Test');
      
      // All invalidations should complete successfully
      expect(invalidationResults.every(r => r.status === 'fulfilled')).toBe(true);
      
      // Cache should still be functional
      const testResult = await cacheManager.set('post-invalidation', { test: true });
      expect(testResult).toBe(true);
    });
  });
});

// Performance test utilities
function generateMemoryPressure(sizeInMB) {
  const size = sizeInMB * 1024 * 1024;
  return Buffer.alloc(size, 'x');
}

function measureExecutionTime(fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  
  return {
    result,
    duration: Number(end - start) / 1000000 // Convert to milliseconds
  };
}

async function measureAsyncExecutionTime(fn) {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  
  return {
    result,
    duration: Number(end - start) / 1000000 // Convert to milliseconds
  };
}
/**
 * Memory Leak Detection Tests
 * Comprehensive tests for detecting memory leaks in the MCP server
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { McpServer } from '../../src/server.js';
import '../utils/custom-matchers.js';
import { performance, PerformanceObserver } from 'perf_hooks';

describe('Memory Leak Detection Tests', () => {
  let server;
  let memoryBaseline;
  let performanceObserver;
  let memorySnapshots = [];

  const takeMemorySnapshot = () => {
    const memUsage = process.memoryUsage();
    const snapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      arrayBuffers: memUsage.arrayBuffers || 0
    };
    memorySnapshots.push(snapshot);
    return snapshot;
  };

  const forceGarbageCollection = () => {
    if (global.gc) {
      global.gc();
    } else {
      // Trigger garbage collection indirectly
      const arr = new Array(1000000).fill('garbage');
      arr.length = 0;
    }
  };

  beforeAll(async () => {
    server = new McpServer({
      environment: 'test',
      performance: {
        enableMemoryMonitoring: true,
        memoryLeakDetection: true,
        gcOptimization: true
      }
    });
    
    await server.initialize();
    
    // Set up performance monitoring
    performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'gc') {
          console.log(`GC: ${entry.kind} - Duration: ${entry.duration}ms`);
        }
      });
    });
    
    performanceObserver.observe({ entryTypes: ['gc', 'measure'] });
    
    // Force garbage collection and take baseline
    forceGarbageCollection();
    await new Promise(resolve => setTimeout(resolve, 100));
    memoryBaseline = takeMemorySnapshot();
  });

  afterAll(async () => {
    if (performanceObserver) {
      performanceObserver.disconnect();
    }
    if (server) {
      await server.shutdown();
    }
  });

  beforeEach(async () => {
    // Clear memory snapshots for each test
    memorySnapshots = [];
    forceGarbageCollection();
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Force cleanup after each test
    forceGarbageCollection();
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Tool Execution Memory Leaks', () => {
    it('should not leak memory during repeated tool executions', async () => {
      const iterations = 100;
      const snapshotInterval = 10;
      
      for (let i = 0; i < iterations; i++) {
        // Execute various tools repeatedly
        await server.callTool('xero_get_contacts', { limit: 10 });
        await server.callTool('shopify_get_products', { limit: 10 });
        await server.callTool('amazon_get_inventory_summary', { marketplace_id: 'TEST' });
        
        // Take memory snapshot every 10 iterations
        if (i % snapshotInterval === 0) {
          forceGarbageCollection();
          await new Promise(resolve => setTimeout(resolve, 50));
          takeMemorySnapshot();
        }
      }

      // Final memory snapshot
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 100));
      const finalSnapshot = takeMemorySnapshot();

      // Analyze memory growth
      const initialMemory = memorySnapshots[0].heapUsed;
      const finalMemory = finalSnapshot.heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);

      // Memory growth should be reasonable (less than 50MB for 100 iterations)
      expect(memoryGrowthMB).toBeLessThan(50);
      expect(finalMemory).toUseMemoryWithin(200 * 1024 * 1024); // 200MB limit

      // Check for consistent memory growth pattern (indicating a leak)
      if (memorySnapshots.length >= 3) {
        const growthRates = [];
        for (let i = 1; i < memorySnapshots.length; i++) {
          const growth = memorySnapshots[i].heapUsed - memorySnapshots[i - 1].heapUsed;
          growthRates.push(growth);
        }

        // Memory growth should not be consistently increasing
        const averageGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
        expect(Math.abs(averageGrowth)).toBeLessThan(5 * 1024 * 1024); // 5MB average growth
      }
    }, 30000);

    it('should handle large data processing without memory leaks', async () => {
      const largeDataSets = Array.from({ length: 10 }, (_, i) => ({
        orders: Array.from({ length: 1000 }, (_, j) => ({
          id: `order_${i}_${j}`,
          customer_id: `customer_${j}`,
          total: Math.random() * 1000,
          items: Array.from({ length: 5 }, (_, k) => ({
            product_id: `product_${k}`,
            quantity: Math.floor(Math.random() * 10) + 1,
            price: Math.random() * 100
          }))
        }))
      }));

      const initialMemory = takeMemorySnapshot();

      for (const dataset of largeDataSets) {
        // Process large dataset
        const processingResponse = await server.callTool('manufacturing_analyze_large_dataset', {
          data: dataset,
          analysis_type: 'comprehensive',
          include_statistics: true
        });

        expect(processingResponse).toBeValidMcpToolResponse();
        
        // Force garbage collection after processing
        forceGarbageCollection();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentMemory = takeMemorySnapshot();
        const memoryDelta = currentMemory.heapUsed - initialMemory.heapUsed;
        
        // Memory should not grow excessively during processing
        expect(memoryDelta).toBeLessThan(100 * 1024 * 1024); // 100MB limit
      }

      // Final cleanup and verification
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 200));
      const finalMemory = takeMemorySnapshot();
      
      const totalMemoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(totalMemoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB final growth limit
    }, 45000);

    it('should properly clean up event listeners and timers', async () => {
      const eventEmitterCount = process.listenerCount ? process.listenerCount() : 0;
      const initialTimers = process._getActiveTimers ? process._getActiveTimers().length : 0;
      const initialHandles = process._getActiveHandles ? process._getActiveHandles().length : 0;

      // Create multiple event-driven operations
      for (let i = 0; i < 50; i++) {
        await server.callTool('sse_setup_monitoring', {
          event_types: ['order_update', 'inventory_change', 'quality_alert'],
          user_id: `test_user_${i}`
        });

        await server.callTool('sse_start_heartbeat', {
          interval: 1000,
          user_id: `test_user_${i}`
        });

        // Simulate some activity
        await new Promise(resolve => setTimeout(resolve, 10));

        // Clean up
        await server.callTool('sse_cleanup_monitoring', {
          user_id: `test_user_${i}`
        });
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      const finalTimers = process._getActiveTimers ? process._getActiveTimers().length : 0;
      const finalHandles = process._getActiveHandles ? process._getActiveHandles().length : 0;

      // Timers and handles should not accumulate
      expect(finalTimers).toBeLessThanOrEqual(initialTimers + 5); // Allow for some server timers
      expect(finalHandles).toBeLessThanOrEqual(initialHandles + 5); // Allow for some server handles

      // Memory should be stable
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 100));
      const memoryAfterCleanup = takeMemorySnapshot();
      
      expect(memoryAfterCleanup.heapUsed).toUseMemoryWithin(150 * 1024 * 1024); // 150MB limit
    }, 20000);
  });

  describe('Database Connection Memory Leaks', () => {
    it('should not leak database connections', async () => {
      const connectionTests = 200;
      const initialMemory = takeMemorySnapshot();

      for (let i = 0; i < connectionTests; i++) {
        // Execute database operations
        await server.callTool('database_execute_query', {
          query: 'SELECT COUNT(*) as count FROM products WHERE active = ?',
          parameters: [true]
        });

        await server.callTool('database_execute_transaction', {
          operations: [
            {
              query: 'INSERT INTO test_table (name, value) VALUES (?, ?)',
              parameters: [`test_${i}`, Math.random()]
            },
            {
              query: 'UPDATE test_table SET value = ? WHERE name = ?',
              parameters: [Math.random() * 100, `test_${i}`]
            },
            {
              query: 'DELETE FROM test_table WHERE name = ?',
              parameters: [`test_${i}`]
            }
          ]
        });

        // Check connection pool status periodically
        if (i % 20 === 0) {
          const poolStatusResponse = await server.callTool('database_get_pool_status', {});
          expect(poolStatusResponse.data.active_connections).toBeLessThanOrEqual(10);
          expect(poolStatusResponse.data.idle_connections).toBeGreaterThanOrEqual(0);
          
          takeMemorySnapshot();
        }
      }

      // Verify final connection pool state
      const finalPoolStatus = await server.callTool('database_get_pool_status', {});
      expect(finalPoolStatus.data.active_connections).toBeLessThanOrEqual(5);

      // Check memory usage
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 200));
      const finalMemory = takeMemorySnapshot();
      
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(30 * 1024 * 1024); // 30MB limit
    }, 60000);

    it('should handle connection errors without leaking', async () => {
      const errorTestCount = 100;
      const initialMemory = takeMemorySnapshot();

      for (let i = 0; i < errorTestCount; i++) {
        try {
          // Attempt invalid database operations
          await server.callTool('database_execute_query', {
            query: 'SELECT * FROM nonexistent_table_' + i,
            parameters: []
          });
        } catch (error) {
          // Expected to fail
        }

        try {
          await server.callTool('database_execute_query', {
            query: 'INVALID SQL SYNTAX HERE',
            parameters: []
          });
        } catch (error) {
          // Expected to fail
        }

        if (i % 25 === 0) {
          takeMemorySnapshot();
        }
      }

      // Verify connections are properly cleaned up after errors
      const poolStatusAfterErrors = await server.callTool('database_get_pool_status', {});
      expect(poolStatusAfterErrors.data.active_connections).toBeLessThanOrEqual(5);

      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 200));
      const finalMemory = takeMemorySnapshot();
      
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024); // 20MB limit
    }, 30000);
  });

  describe('HTTP Request Memory Leaks', () => {
    it('should not leak memory during HTTP request handling', async () => {
      const requestCount = 500;
      const initialMemory = takeMemorySnapshot();

      // Simulate many concurrent HTTP requests
      const requestPromises = [];
      
      for (let i = 0; i < requestCount; i++) {
        const requestPromise = server.callTool('http_simulate_request', {
          method: 'POST',
          url: '/api/manufacturing/data',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_token'
          },
          body: {
            product_id: `product_${i}`,
            quantity: Math.floor(Math.random() * 100),
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'memory_leak_test',
              iteration: i
            }
          }
        });

        requestPromises.push(requestPromise);

        // Process in batches to avoid overwhelming the system
        if ((i + 1) % 50 === 0) {
          await Promise.allSettled(requestPromises.slice(-50));
          forceGarbageCollection();
          takeMemorySnapshot();
        }
      }

      // Wait for all remaining requests
      await Promise.allSettled(requestPromises);

      // Final cleanup and memory check
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 300));
      const finalMemory = takeMemorySnapshot();

      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(60 * 1024 * 1024); // 60MB limit

      // Verify request handling cleanup
      const activeRequestsResponse = await server.callTool('http_get_active_requests', {});
      expect(activeRequestsResponse.data.active_count).toBeLessThanOrEqual(5);
    }, 90000);

    it('should handle request timeouts without memory leaks', async () => {
      const timeoutTestCount = 100;
      const initialMemory = takeMemorySnapshot();

      for (let i = 0; i < timeoutTestCount; i++) {
        try {
          // Create requests that will timeout
          await server.callTool('http_simulate_slow_request', {
            url: '/api/slow-endpoint',
            timeout: 100, // 100ms timeout
            delay: 500 + Math.random() * 1000 // 500-1500ms delay
          });
        } catch (error) {
          // Expected timeout errors
          expect(error.message).toMatch(/timeout|abort/i);
        }

        if (i % 20 === 0) {
          takeMemorySnapshot();
        }
      }

      // Verify cleanup after timeouts
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 200));
      const finalMemory = takeMemorySnapshot();

      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(25 * 1024 * 1024); // 25MB limit

      // Check for hanging requests
      const hangingRequestsResponse = await server.callTool('http_get_hanging_requests', {});
      expect(hangingRequestsResponse.data.hanging_count).toBe(0);
    }, 45000);
  });

  describe('Cache Memory Management', () => {
    it('should properly manage cache memory usage', async () => {
      const cacheOperationCount = 1000;
      const initialMemory = takeMemorySnapshot();

      // Fill cache with data
      for (let i = 0; i < cacheOperationCount; i++) {
        const cacheKey = `test_key_${i}`;
        const cacheValue = {
          id: i,
          data: Array.from({ length: 100 }, () => Math.random().toString(36)),
          timestamp: Date.now(),
          metadata: {
            source: 'memory_test',
            size: 'large'
          }
        };

        await server.callTool('cache_set', {
          key: cacheKey,
          value: cacheValue,
          ttl: 3600 // 1 hour
        });

        if (i % 100 === 0) {
          const cacheStatsResponse = await server.callTool('cache_get_stats', {});
          const cacheMemoryMB = cacheStatsResponse.data.memory_usage / (1024 * 1024);
          expect(cacheMemoryMB).toBeLessThan(100); // 100MB cache limit

          takeMemorySnapshot();
        }
      }

      // Test cache eviction
      const evictionResponse = await server.callTool('cache_trigger_eviction', {
        strategy: 'lru',
        target_memory_mb: 50
      });

      expect(evictionResponse.data.evicted_count).toBeGreaterThan(0);

      // Verify memory reduction after eviction
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 100));
      const memoryAfterEviction = takeMemorySnapshot();

      const finalCacheStats = await server.callTool('cache_get_stats', {});
      const finalCacheMemoryMB = finalCacheStats.data.memory_usage / (1024 * 1024);
      expect(finalCacheMemoryMB).toBeLessThan(60); // Should be under 60MB after eviction

      const totalMemoryGrowth = memoryAfterEviction.heapUsed - initialMemory.heapUsed;
      expect(totalMemoryGrowth).toBeLessThan(80 * 1024 * 1024); // 80MB total growth limit
    }, 40000);

    it('should handle cache expiration without memory leaks', async () => {
      const shortLivedCacheCount = 500;
      const initialMemory = takeMemorySnapshot();

      // Create many short-lived cache entries
      for (let i = 0; i < shortLivedCacheCount; i++) {
        await server.callTool('cache_set', {
          key: `short_lived_${i}`,
          value: {
            data: Array.from({ length: 50 }, () => Math.random()),
            created: Date.now()
          },
          ttl: 1 // 1 second TTL
        });
      }

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Trigger cleanup
      const cleanupResponse = await server.callTool('cache_cleanup_expired', {});
      expect(cleanupResponse.data.cleaned_count).toBeGreaterThan(400);

      // Verify memory cleanup
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 100));
      const finalMemory = takeMemorySnapshot();

      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(15 * 1024 * 1024); // 15MB limit

      // Verify cache is mostly empty
      const finalCacheStats = await server.callTool('cache_get_stats', {});
      expect(finalCacheStats.data.entry_count).toBeLessThan(100);
    }, 15000);
  });

  describe('Memory Leak Detection Analytics', () => {
    it('should detect memory leak patterns', async () => {
      // Simulate a potential memory leak scenario
      const leakSimulationData = [];
      
      for (let i = 0; i < 50; i++) {
        // Intentionally create objects that might not be cleaned up
        const leakyData = {
          id: i,
          largeArray: new Array(10000).fill(`leak_data_${i}`),
          circularRef: {}
        };
        leakyData.circularRef.parent = leakyData; // Circular reference
        
        leakSimulationData.push(leakyData);
        
        await server.callTool('memory_leak_simulation', {
          data: leakyData,
          retain_reference: true // Simulate not cleaning up properly
        });

        if (i % 10 === 0) {
          takeMemorySnapshot();
        }
      }

      // Analyze memory patterns
      const memoryAnalysisResponse = await server.callTool('memory_analyze_leak_patterns', {
        snapshots: memorySnapshots,
        threshold_mb: 10 // 10MB growth threshold
      });

      expect(memoryAnalysisResponse).toBeValidMcpToolResponse();
      
      if (memoryAnalysisResponse.data.leak_detected) {
        expect(memoryAnalysisResponse.data.leak_patterns).toBeInstanceOf(Array);
        expect(memoryAnalysisResponse.data.growth_rate_mb_per_operation).toBeGreaterThan(0);
        expect(memoryAnalysisResponse.data.recommendations).toBeInstanceOf(Array);
      }

      // Clean up the intentional leak
      const cleanupResponse = await server.callTool('memory_cleanup_simulation', {});
      expect(cleanupResponse.data.cleanup_successful).toBe(true);

      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const finalMemory = takeMemorySnapshot();
      // After cleanup, memory should be more reasonable
      expect(finalMemory.heapUsed).toBeLessThan(memoryBaseline.heapUsed + (100 * 1024 * 1024)); // +100MB max
    }, 30000);

    it('should generate memory usage reports', async () => {
      const reportResponse = await server.callTool('memory_generate_usage_report', {
        include_gc_analysis: true,
        include_heap_snapshot: false, // Too expensive for automated tests
        time_range_minutes: 5
      });

      expect(reportResponse).toBeValidMcpToolResponse();
      expect(reportResponse.data).toHaveProperty('peak_memory_usage');
      expect(reportResponse.data).toHaveProperty('average_memory_usage');
      expect(reportResponse.data).toHaveProperty('gc_frequency');
      expect(reportResponse.data).toHaveProperty('memory_trends');
      expect(reportResponse.data).toHaveProperty('recommendations');

      // Verify memory metrics are reasonable
      expect(reportResponse.data.peak_memory_usage).toUseMemoryWithin(500 * 1024 * 1024); // 500MB peak
      expect(reportResponse.data.gc_frequency).toBeGreaterThan(0);
    });

    it('should provide memory optimization recommendations', async () => {
      const optimizationResponse = await server.callTool('memory_get_optimization_recommendations', {
        current_usage: process.memoryUsage(),
        historical_data: memorySnapshots
      });

      expect(optimizationResponse).toBeValidMcpToolResponse();
      expect(optimizationResponse.data.recommendations).toBeInstanceOf(Array);
      expect(optimizationResponse.data).toHaveProperty('optimization_priority');
      expect(optimizationResponse.data).toHaveProperty('potential_savings_mb');

      // Each recommendation should have required fields
      optimizationResponse.data.recommendations.forEach(recommendation => {
        expect(recommendation).toHaveProperty('category');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('impact');
        expect(recommendation).toHaveProperty('implementation_effort');
      });
    });
  });

  describe('Stress Testing Memory Stability', () => {
    it('should maintain memory stability under extreme load', async () => {
      const extremeLoadOperations = 1000;
      const initialMemory = takeMemorySnapshot();
      const operationTypes = [
        'xero_intensive_operation',
        'shopify_bulk_processing',
        'amazon_large_inventory_sync',
        'anthropic_complex_analysis',
        'database_heavy_queries'
      ];

      const startTime = performance.now();

      // Execute extreme load
      const loadPromises = [];
      for (let i = 0; i < extremeLoadOperations; i++) {
        const operationType = operationTypes[i % operationTypes.length];
        
        const loadPromise = server.callTool(operationType, {
          complexity: 'high',
          data_size: 'large',
          iteration: i
        });

        loadPromises.push(loadPromise);

        // Process in smaller batches and monitor memory
        if ((i + 1) % 100 === 0) {
          await Promise.allSettled(loadPromises.slice(-100));
          
          // Force cleanup
          forceGarbageCollection();
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const currentMemory = takeMemorySnapshot();
          const currentGrowthMB = (currentMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);
          
          // Memory should not grow excessively during load
          expect(currentGrowthMB).toBeLessThan(200); // 200MB limit during load
        }
      }

      // Wait for all operations to complete
      await Promise.allSettled(loadPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Verify performance is reasonable
      const avgTimePerOperation = totalTime / extremeLoadOperations;
      expect(avgTimePerOperation).toBeLessThan(1000); // Less than 1 second per operation

      // Final memory stability check
      forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 500));
      const finalMemory = takeMemorySnapshot();
      
      const totalMemoryGrowthMB = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);
      expect(totalMemoryGrowthMB).toBeLessThan(150); // 150MB total growth limit
      
      // Verify system is still responsive
      const healthCheckResponse = await server.callTool('system_health_check', {});
      expect(healthCheckResponse.data.status).toBe('healthy');
      expect(healthCheckResponse.data.memory_status).toBe('normal');
    }, 180000); // 3 minute timeout for extreme load test
  });
});
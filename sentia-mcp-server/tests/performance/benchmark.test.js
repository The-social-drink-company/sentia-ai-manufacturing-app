/**
 * Benchmark Tests for MCP Server
 * Performance benchmarking and comparison tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { McpServer } from '../../src/server.js';
import '../utils/custom-matchers.js';
import { performance, PerformanceObserver } from 'perf_hooks';
import { cpus } from 'os';

describe('Performance Benchmarks', () => {
  let server;
  let benchmarkResults = new Map();
  let performanceObserver;

  const createBenchmark = (name, fn, options = {}) => {
    const { iterations = 100, warmupIterations = 10, targetOpsPerSec = null } = options;
    
    return async () => {
      // Warmup phase
      for (let i = 0; i < warmupIterations; i++) {
        await fn();
      }

      // Force garbage collection before benchmark
      if (global.gc) global.gc();
      
      // Benchmark phase
      const results = [];
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const iterationStart = performance.now();
        await fn();
        const iterationEnd = performance.now();
        results.push(iterationEnd - iterationStart);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Calculate statistics
      results.sort((a, b) => a - b);
      const stats = {
        name,
        iterations,
        totalTime,
        avgTime: results.reduce((a, b) => a + b, 0) / results.length,
        minTime: results[0],
        maxTime: results[results.length - 1],
        p50: results[Math.floor(results.length * 0.5)],
        p95: results[Math.floor(results.length * 0.95)],
        p99: results[Math.floor(results.length * 0.99)],
        opsPerSec: (iterations / totalTime) * 1000,
        memoryUsage: process.memoryUsage()
      };
      
      benchmarkResults.set(name, stats);
      
      // Validate against target if specified
      if (targetOpsPerSec) {
        expect(stats.opsPerSec).toBeGreaterThan(targetOpsPerSec);
      }
      
      return stats;
    };
  };

  beforeAll(async () => {
    server = new McpServer({
      environment: 'test',
      performance: {
        enableBenchmarking: true,
        optimizeForThroughput: true
      }
    });
    
    await server.initialize();
    
    // Set up performance monitoring
    performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.startsWith('benchmark_')) {
          console.log(`Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    performanceObserver.observe({ entryTypes: ['measure'] });
  });

  afterAll(async () => {
    // Generate benchmark report
    console.log('\n=== BENCHMARK RESULTS ===');
    console.log('System Info:', {
      cpus: cpus().length,
      platform: process.platform,
      nodeVersion: process.version,
      memoryTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    });
    
    benchmarkResults.forEach((stats, name) => {
      console.log(`\n${name}:`);
      console.log(`  Operations/sec: ${stats.opsPerSec.toFixed(2)}`);
      console.log(`  Average time: ${stats.avgTime.toFixed(2)}ms`);
      console.log(`  P95 time: ${stats.p95.toFixed(2)}ms`);
      console.log(`  P99 time: ${stats.p99.toFixed(2)}ms`);
    });
    
    if (performanceObserver) {
      performanceObserver.disconnect();
    }
    
    if (server) {
      await server.shutdown();
    }
  });

  beforeEach(async () => {
    // Reset server state
    await server.resetState();
  });

  describe('API Tool Benchmarks', () => {
    it('should benchmark Xero API operations', async () => {
      const xeroContactsBenchmark = createBenchmark(
        'xero_get_contacts',
        () => server.callTool('xero_get_contacts', { limit: 10 }),
        { iterations: 50, targetOpsPerSec: 10 }
      );

      const xeroInvoicesBenchmark = createBenchmark(
        'xero_get_invoices',
        () => server.callTool('xero_get_invoices', { status: 'draft', limit: 10 }),
        { iterations: 50, targetOpsPerSec: 8 }
      );

      const xeroReportsBenchmark = createBenchmark(
        'xero_profit_loss',
        () => server.callTool('xero_get_profit_loss', { 
          from_date: '2024-01-01', 
          to_date: '2024-03-31' 
        }),
        { iterations: 20, targetOpsPerSec: 5 }
      );

      performance.mark('benchmark_xero_start');
      
      const contactsStats = await xeroContactsBenchmark();
      const invoicesStats = await xeroInvoicesBenchmark();
      const reportsStats = await xeroReportsBenchmark();
      
      performance.mark('benchmark_xero_end');
      performance.measure('benchmark_xero_total', 'benchmark_xero_start', 'benchmark_xero_end');

      // Verify performance targets
      expect(contactsStats.avgTime).toRespondWithin(200); // 200ms average
      expect(invoicesStats.p95).toRespondWithin(500); // 500ms P95
      expect(reportsStats.p99).toRespondWithin(2000); // 2s P99
    }, 60000);

    it('should benchmark Shopify API operations', async () => {
      const shopifyProductsBenchmark = createBenchmark(
        'shopify_get_products',
        () => server.callTool('shopify_get_products', { limit: 25 }),
        { iterations: 50, targetOpsPerSec: 15 }
      );

      const shopifyOrdersBenchmark = createBenchmark(
        'shopify_get_orders',
        () => server.callTool('shopify_get_orders', { 
          status: 'any', 
          limit: 25,
          fields: 'id,name,total_price,created_at'
        }),
        { iterations: 50, targetOpsPerSec: 12 }
      );

      const shopifyInventoryBenchmark = createBenchmark(
        'shopify_inventory_levels',
        () => server.callTool('shopify_get_inventory_levels', { 
          location_ids: ['primary'] 
        }),
        { iterations: 30, targetOpsPerSec: 8 }
      );

      performance.mark('benchmark_shopify_start');
      
      const productsStats = await shopifyProductsBenchmark();
      const ordersStats = await shopifyOrdersBenchmark();
      const inventoryStats = await shopifyInventoryBenchmark();
      
      performance.mark('benchmark_shopify_end');
      performance.measure('benchmark_shopify_total', 'benchmark_shopify_start', 'benchmark_shopify_end');

      // Verify Shopify performance
      expect(productsStats.opsPerSec).toBeGreaterThan(10);
      expect(ordersStats.avgTime).toRespondWithin(250);
      expect(inventoryStats.p95).toRespondWithin(600);
    }, 60000);

    it('should benchmark Amazon SP-API operations', async () => {
      const amazonInventoryBenchmark = createBenchmark(
        'amazon_inventory_summary',
        () => server.callTool('amazon_get_inventory_summary', { 
          marketplace_id: 'ATVPDKIKX0DER',
          granularity: 'Marketplace'
        }),
        { iterations: 30, targetOpsPerSec: 5 }
      );

      const amazonOrdersBenchmark = createBenchmark(
        'amazon_get_orders',
        () => server.callTool('amazon_get_orders', {
          marketplace_ids: ['ATVPDKIKX0DER'],
          created_after: '2024-01-01T00:00:00Z'
        }),
        { iterations: 20, targetOpsPerSec: 3 }
      );

      performance.mark('benchmark_amazon_start');
      
      const inventoryStats = await amazonInventoryBenchmark();
      const ordersStats = await amazonOrdersBenchmark();
      
      performance.mark('benchmark_amazon_end');
      performance.measure('benchmark_amazon_total', 'benchmark_amazon_start', 'benchmark_amazon_end');

      // Amazon API is typically slower due to rate limiting
      expect(inventoryStats.avgTime).toRespondWithin(500);
      expect(ordersStats.p95).toRespondWithin(1500);
      expect(inventoryStats.opsPerSec).toBeGreaterThan(3);
    }, 45000);
  });

  describe('Database Operation Benchmarks', () => {
    it('should benchmark database queries', async () => {
      const simpleDatabaseBenchmark = createBenchmark(
        'database_simple_select',
        () => server.callTool('database_execute_query', {
          query: 'SELECT id, name FROM products LIMIT 10',
          parameters: []
        }),
        { iterations: 100, targetOpsPerSec: 50 }
      );

      const complexDatabaseBenchmark = createBenchmark(
        'database_complex_join',
        () => server.callTool('database_execute_query', {
          query: `
            SELECT p.id, p.name, o.total, c.name as customer_name
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            JOIN customers c ON o.customer_id = c.id
            WHERE o.created_at > ?
            LIMIT 20
          `,
          parameters: ['2024-01-01']
        }),
        { iterations: 50, targetOpsPerSec: 25 }
      );

      const transactionBenchmark = createBenchmark(
        'database_transaction',
        () => server.callTool('database_execute_transaction', {
          operations: [
            {
              query: 'INSERT INTO test_table (name, value) VALUES (?, ?)',
              parameters: ['test', Math.random()]
            },
            {
              query: 'UPDATE test_table SET value = ? WHERE name = ?',
              parameters: [Math.random() * 100, 'test']
            },
            {
              query: 'DELETE FROM test_table WHERE name = ?',
              parameters: ['test']
            }
          ]
        }),
        { iterations: 30, targetOpsPerSec: 15 }
      );

      performance.mark('benchmark_database_start');
      
      const simpleStats = await simpleDatabaseBenchmark();
      const complexStats = await complexDatabaseBenchmark();
      const transactionStats = await transactionBenchmark();
      
      performance.mark('benchmark_database_end');
      performance.measure('benchmark_database_total', 'benchmark_database_start', 'benchmark_database_end');

      // Database performance expectations
      expect(simpleStats.avgTime).toRespondWithin(50); // 50ms average for simple queries
      expect(complexStats.avgTime).toRespondWithin(100); // 100ms average for complex queries
      expect(transactionStats.avgTime).toRespondWithin(150); // 150ms average for transactions
      expect(simpleStats.opsPerSec).toBeGreaterThan(40);
    }, 45000);

    it('should benchmark bulk operations', async () => {
      const bulkInsertBenchmark = createBenchmark(
        'database_bulk_insert',
        () => {
          const insertData = Array.from({ length: 100 }, (_, i) => ({
            name: `bulk_product_${i}`,
            price: Math.random() * 100,
            category: 'test_category'
          }));
          
          return server.callTool('database_bulk_insert', {
            table: 'products',
            data: insertData
          });
        },
        { iterations: 10, targetOpsPerSec: 2 }
      );

      const bulkUpdateBenchmark = createBenchmark(
        'database_bulk_update',
        () => server.callTool('database_bulk_update', {
          table: 'products',
          updates: Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            price: Math.random() * 100
          }))
        }),
        { iterations: 15, targetOpsPerSec: 3 }
      );

      performance.mark('benchmark_bulk_start');
      
      const insertStats = await bulkInsertBenchmark();
      const updateStats = await bulkUpdateBenchmark();
      
      performance.mark('benchmark_bulk_end');
      performance.measure('benchmark_bulk_total', 'benchmark_bulk_start', 'benchmark_bulk_end');

      // Bulk operations should be efficient
      expect(insertStats.avgTime).toRespondWithin(1000); // 1s for 100 inserts
      expect(updateStats.avgTime).toRespondWithin(500); // 500ms for 50 updates
    }, 30000);
  });

  describe('AI Processing Benchmarks', () => {
    it('should benchmark Anthropic AI operations', async () => {
      const anthropicAnalysisBenchmark = createBenchmark(
        'anthropic_demand_analysis',
        () => server.callTool('anthropic_analyze_demand', {
          historical_data: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            quantity: Math.floor(Math.random() * 1000) + 500,
            revenue: Math.floor(Math.random() * 50000) + 25000
          })),
          forecast_period: 6
        }),
        { iterations: 10, targetOpsPerSec: 1 }
      );

      const anthropicOptimizationBenchmark = createBenchmark(
        'anthropic_process_optimization',
        () => server.callTool('anthropic_optimize_process', {
          process_data: {
            cycle_time: 45,
            setup_time: 30,
            efficiency: 0.85,
            defect_rate: 0.03
          },
          constraints: {
            max_cycle_time: 60,
            min_efficiency: 0.80
          }
        }),
        { iterations: 10, targetOpsPerSec: 1.5 }
      );

      performance.mark('benchmark_anthropic_start');
      
      const analysisStats = await anthropicAnalysisBenchmark();
      const optimizationStats = await anthropicOptimizationBenchmark();
      
      performance.mark('benchmark_anthropic_end');
      performance.measure('benchmark_anthropic_total', 'benchmark_anthropic_start', 'benchmark_anthropic_end');

      // AI operations are typically slower but should be reasonable
      expect(analysisStats.avgTime).toRespondWithin(3000); // 3s average
      expect(optimizationStats.p95).toRespondWithin(5000); // 5s P95
    }, 90000);

    it('should benchmark OpenAI operations', async () => {
      const openaiInventoryBenchmark = createBenchmark(
        'openai_inventory_optimization',
        () => server.callTool('openai_optimize_inventory', {
          current_inventory: Array.from({ length: 10 }, (_, i) => ({
            sku: `PROD-${i.toString().padStart(3, '0')}`,
            quantity: Math.floor(Math.random() * 500),
            reorder_point: Math.floor(Math.random() * 100) + 50
          })),
          demand_forecast: Array.from({ length: 10 }, (_, i) => ({
            sku: `PROD-${i.toString().padStart(3, '0')}`,
            predicted_demand: Math.floor(Math.random() * 200) + 100
          }))
        }),
        { iterations: 8, targetOpsPerSec: 0.8 }
      );

      const openaiQualityBenchmark = createBenchmark(
        'openai_quality_prediction',
        () => server.callTool('openai_predict_quality', {
          process_parameters: {
            temperature: 180 + Math.random() * 20,
            pressure: 2.0 + Math.random() * 1.0,
            humidity: 40 + Math.random() * 20
          },
          historical_data: Array.from({ length: 50 }, () => ({
            temperature: 180 + Math.random() * 20,
            pressure: 2.0 + Math.random() * 1.0,
            defect_rate: Math.random() * 0.05
          }))
        }),
        { iterations: 8, targetOpsPerSec: 1 }
      );

      performance.mark('benchmark_openai_start');
      
      const inventoryStats = await openaiInventoryBenchmark();
      const qualityStats = await openaiQualityBenchmark();
      
      performance.mark('benchmark_openai_end');
      performance.measure('benchmark_openai_total', 'benchmark_openai_start', 'benchmark_openai_end');

      // OpenAI operations should be reasonably fast
      expect(inventoryStats.avgTime).toRespondWithin(4000); // 4s average
      expect(qualityStats.p95).toRespondWithin(6000); // 6s P95
    }, 90000);
  });

  describe('Memory and Resource Benchmarks', () => {
    it('should benchmark memory usage patterns', async () => {
      const memoryBenchmark = createBenchmark(
        'memory_intensive_operation',
        async () => {
          const largeDatas = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            data: Array.from({ length: 100 }, () => Math.random().toString(36))
          }));
          
          const result = await server.callTool('manufacturing_process_large_dataset', {
            data: largeDatas,
            processing_type: 'memory_intensive'
          });
          
          // Force cleanup
          largeDatas.length = 0;
          return result;
        },
        { iterations: 20, targetOpsPerSec: 5 }
      );

      const initialMemory = process.memoryUsage();
      performance.mark('benchmark_memory_start');
      
      const memoryStats = await memoryBenchmark();
      
      performance.mark('benchmark_memory_end');
      performance.measure('benchmark_memory_total', 'benchmark_memory_start', 'benchmark_memory_end');
      
      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory usage should be reasonable
      expect(memoryStats.avgTime).toRespondWithin(500);
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB growth limit
      expect(finalMemory.heapUsed).toUseMemoryWithin(200 * 1024 * 1024); // 200MB total
    }, 45000);

    it('should benchmark concurrent operation handling', async () => {
      const concurrencyBenchmark = createBenchmark(
        'concurrent_operations',
        async () => {
          const concurrentPromises = Array.from({ length: 10 }, (_, i) =>
            server.callTool('manufacturing_calculate_metrics', {
              product_id: `concurrent_product_${i}`,
              calculation_type: 'basic'
            })
          );
          
          const results = await Promise.allSettled(concurrentPromises);
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          
          expect(successCount).toBeGreaterThanOrEqual(8); // At least 80% success
          return results;
        },
        { iterations: 20, targetOpsPerSec: 3 }
      );

      performance.mark('benchmark_concurrency_start');
      
      const concurrencyStats = await concurrencyBenchmark();
      
      performance.mark('benchmark_concurrency_end');
      performance.measure('benchmark_concurrency_total', 'benchmark_concurrency_start', 'benchmark_concurrency_end');

      // Concurrent operations should maintain good performance
      expect(concurrencyStats.avgTime).toRespondWithin(1000); // 1s for 10 concurrent ops
      expect(concurrencyStats.opsPerSec).toBeGreaterThan(2);
    }, 60000);
  });

  describe('System Performance Baselines', () => {
    it('should establish performance baselines', async () => {
      const baselineTests = [
        {
          name: 'system_health_check',
          fn: () => server.callTool('system_health_check', {}),
          target: { avgTime: 50, opsPerSec: 100 }
        },
        {
          name: 'simple_calculation',
          fn: () => server.callTool('manufacturing_simple_calculation', { 
            operation: 'add', 
            values: [10, 20, 30] 
          }),
          target: { avgTime: 10, opsPerSec: 200 }
        },
        {
          name: 'data_validation',
          fn: () => server.callTool('security_validate_input', {
            input: 'test_input_data',
            validation_type: 'basic'
          }),
          target: { avgTime: 20, opsPerSec: 150 }
        }
      ];

      performance.mark('benchmark_baseline_start');
      
      for (const test of baselineTests) {
        const benchmark = createBenchmark(
          test.name,
          test.fn,
          { 
            iterations: 100,
            targetOpsPerSec: test.target.opsPerSec
          }
        );
        
        const stats = await benchmark();
        
        // Verify against baseline targets
        expect(stats.avgTime).toRespondWithin(test.target.avgTime);
        expect(stats.opsPerSec).toBeGreaterThan(test.target.opsPerSec);
      }
      
      performance.mark('benchmark_baseline_end');
      performance.measure('benchmark_baseline_total', 'benchmark_baseline_start', 'benchmark_baseline_end');
    }, 60000);

    it('should compare performance across different configurations', async () => {
      // Test with different configuration settings
      const configurations = [
        { name: 'optimized', config: { optimizeForThroughput: true } },
        { name: 'balanced', config: { optimizeForThroughput: false } },
        { name: 'memory_conservative', config: { enableMemoryOptimization: true } }
      ];

      const comparisonResults = new Map();

      for (const { name, config } of configurations) {
        // Reconfigure server
        await server.updateConfiguration(config);
        
        // Run benchmark
        const benchmark = createBenchmark(
          `config_${name}`,
          () => server.callTool('manufacturing_standard_operation', {
            operation_type: 'benchmark_test',
            complexity: 'medium'
          }),
          { iterations: 30 }
        );
        
        const stats = await benchmark();
        comparisonResults.set(name, stats);
      }

      // Compare results
      const optimizedStats = comparisonResults.get('optimized');
      const balancedStats = comparisonResults.get('balanced');
      
      // Optimized configuration should perform better
      expect(optimizedStats.opsPerSec).toBeGreaterThan(balancedStats.opsPerSec * 0.9); // At least 90% of balanced
      expect(optimizedStats.avgTime).toBeLessThanOrEqual(balancedStats.avgTime * 1.1); // Within 110% of balanced
    }, 45000);
  });
});
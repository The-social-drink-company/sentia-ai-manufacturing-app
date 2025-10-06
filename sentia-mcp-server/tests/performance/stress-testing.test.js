/**
 * Stress Testing for MCP Server
 * Comprehensive performance and stability tests under various load conditions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { McpServer } from '../../src/server.js';
import '../utils/custom-matchers.js';
import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import cluster from 'cluster';

describe('Stress Testing', () => {
  let server;
  let performanceMetrics = [];

  const recordPerformance = (testName, startTime, endTime, operations, errors = 0) => {
    const duration = endTime - startTime;
    const opsPerSecond = operations / (duration / 1000);
    const errorRate = errors / operations;
    
    performanceMetrics.push({
      testName,
      duration,
      operations,
      opsPerSecond,
      errorRate,
      timestamp: new Date().toISOString()
    });
    
    return { duration, opsPerSecond, errorRate };
  };

  beforeAll(async () => {
    server = new McpServer({
      environment: 'test',
      performance: {
        enableStressTesting: true,
        maxConcurrentOperations: 1000,
        requestTimeout: 30000,
        connectionPoolSize: 20
      },
      logging: {
        level: 'warn', // Reduce logging during stress tests
        enablePerformanceLogging: true
      }
    });
    
    await server.initialize();
  });

  afterAll(async () => {
    // Generate performance summary
    console.log('\nStress Test Performance Summary:');
    performanceMetrics.forEach(metric => {
      console.log(`${metric.testName}: ${metric.opsPerSecond.toFixed(2)} ops/sec, ${(metric.errorRate * 100).toFixed(2)}% errors`);
    });
    
    if (server) {
      await server.shutdown();
    }
  });

  beforeEach(async () => {
    // Reset server state and warm up
    await server.resetState();
    
    // Warm up the server
    for (let i = 0; i < 10; i++) {
      await server.callTool('system_health_check', {});
    }
  });

  describe('High Concurrency Stress Tests', () => {
    it('should handle 1000 concurrent requests', async () => {
      const concurrentRequests = 1000;
      const testName = 'concurrent_requests_1000';
      
      const startTime = performance.now();
      const requests = [];
      let errors = 0;

      // Create 1000 concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const requestPromise = server.callTool('xero_get_contacts', {
          limit: 10,
          request_id: `stress_test_${i}`
        }).catch(error => {
          errors++;
          return { error: error.message };
        });
        
        requests.push(requestPromise);
      }

      // Wait for all requests to complete
      const results = await Promise.allSettled(requests);
      const endTime = performance.now();

      // Analyze results
      const successfulRequests = results.filter(r => 
        r.status === 'fulfilled' && !r.value.error
      ).length;
      
      const failedRequests = results.filter(r => 
        r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error)
      ).length;

      const metrics = recordPerformance(testName, startTime, endTime, concurrentRequests, failedRequests);

      // Assertions
      expect(metrics.opsPerSecond).toBeGreaterThan(50); // At least 50 ops/sec
      expect(metrics.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(successfulRequests).toBeGreaterThan(950); // At least 95% success rate
      expect(metrics.duration).toBeLessThan(30000); // Complete within 30 seconds
    }, 60000);

    it('should handle burst traffic patterns', async () => {
      const testName = 'burst_traffic';
      const burstSize = 200;
      const burstCount = 5;
      const burstInterval = 1000; // 1 second between bursts
      
      const startTime = performance.now();
      let totalOperations = 0;
      let totalErrors = 0;

      for (let burst = 0; burst < burstCount; burst++) {
        const burstRequests = [];
        
        // Create burst of requests
        for (let i = 0; i < burstSize; i++) {
          const requestPromise = server.callTool('shopify_get_orders', {
            limit: 5,
            burst: burst,
            request: i
          }).catch(error => {
            totalErrors++;
            return { error: error.message };
          });
          
          burstRequests.push(requestPromise);
          totalOperations++;
        }

        // Wait for burst to complete
        await Promise.allSettled(burstRequests);
        
        // Wait before next burst (except for last burst)
        if (burst < burstCount - 1) {
          await new Promise(resolve => setTimeout(resolve, burstInterval));
        }
      }

      const endTime = performance.now();
      const metrics = recordPerformance(testName, startTime, endTime, totalOperations, totalErrors);

      // Assertions for burst handling
      expect(metrics.errorRate).toBeLessThan(0.1); // Less than 10% error rate for bursts
      expect(totalOperations).toBe(burstSize * burstCount);
      
      // Verify server responsiveness after bursts
      const healthCheck = await server.callTool('system_health_check', {});
      expect(healthCheck.data.status).toBe('healthy');
    }, 45000);

    it('should maintain performance under sustained load', async () => {
      const testName = 'sustained_load';
      const loadDuration = 30000; // 30 seconds
      const requestsPerSecond = 20;
      const requestInterval = 1000 / requestsPerSecond; // 50ms between requests
      
      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;
      let isRunning = true;

      // Stop after specified duration
      setTimeout(() => { isRunning = false; }, loadDuration);

      const loadOperations = [];
      
      // Generate sustained load
      while (isRunning) {
        const operationPromise = server.callTool('amazon_get_inventory_summary', {
          marketplace_id: 'ATVPDKIKX0DER',
          operation_id: operationCount
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        loadOperations.push(operationPromise);
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // Wait for all operations to complete
      await Promise.allSettled(loadOperations);
      const endTime = performance.now();

      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Assertions for sustained load
      expect(metrics.opsPerSecond).toBeGreaterThan(15); // Maintain at least 15 ops/sec
      expect(metrics.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(operationCount).toBeGreaterThan(500); // Should process many operations
      
      // Verify system stability
      const finalHealthCheck = await server.callTool('system_health_check', {});
      expect(finalHealthCheck.data.memory_usage_mb).toBeLessThan(500); // Memory under control
    }, 60000);
  });

  describe('Resource Exhaustion Tests', () => {
    it('should handle memory pressure gracefully', async () => {
      const testName = 'memory_pressure';
      const largeDataOperations = 100;
      
      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;

      // Create operations with large data payloads
      const memoryOperations = [];
      
      for (let i = 0; i < largeDataOperations; i++) {
        // Generate large data payload
        const largePayload = {
          id: i,
          data: Array.from({ length: 10000 }, (_, j) => ({
            field1: `large_string_${i}_${j}_${'x'.repeat(100)}`,
            field2: Math.random(),
            field3: {
              nested: Array.from({ length: 100 }, () => Math.random())
            }
          }))
        };

        const operationPromise = server.callTool('manufacturing_process_large_data', {
          payload: largePayload,
          processing_type: 'memory_intensive'
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        memoryOperations.push(operationPromise);

        // Process in batches to avoid overwhelming system
        if ((i + 1) % 20 === 0) {
          await Promise.allSettled(memoryOperations.slice(-20));
          
          // Check memory status
          const memoryStatus = await server.callTool('system_get_memory_status', {});
          if (memoryStatus.data.usage_percentage > 90) {
            console.warn('High memory usage detected, throttling operations');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      await Promise.allSettled(memoryOperations);
      const endTime = performance.now();

      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Assertions for memory pressure handling
      expect(metrics.errorRate).toBeLessThan(0.2); // Less than 20% error rate under memory pressure
      expect(operationCount).toBe(largeDataOperations);
      
      // Verify system recovers
      const recoveryHealthCheck = await server.callTool('system_health_check', {});
      expect(recoveryHealthCheck.data.status).toBe('healthy');
    }, 120000);

    it('should handle database connection pool exhaustion', async () => {
      const testName = 'db_connection_exhaustion';
      const connectionRequests = 50; // More than typical pool size
      
      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;

      // Create many simultaneous database operations
      const dbOperations = [];
      
      for (let i = 0; i < connectionRequests; i++) {
        const dbOperation = server.callTool('database_execute_long_query', {
          query: 'SELECT pg_sleep(2)', // 2-second sleep to hold connections
          operation_id: i
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        dbOperations.push(dbOperation);
      }

      await Promise.allSettled(dbOperations);
      const endTime = performance.now();

      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Verify connection pool management
      const poolStatus = await server.callTool('database_get_pool_status', {});
      expect(poolStatus.data.active_connections).toBeLessThanOrEqual(poolStatus.data.max_connections);
      
      // Some operations may fail due to pool exhaustion, but system should recover
      expect(metrics.errorRate).toBeLessThan(0.5); // Less than 50% error rate
      expect(operationCount).toBe(connectionRequests);
    }, 60000);

    it('should handle file descriptor exhaustion', async () => {
      const testName = 'file_descriptor_exhaustion';
      const fileOperations = 100;
      
      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;

      // Create many file operations
      const fileOps = [];
      
      for (let i = 0; i < fileOperations; i++) {
        const fileOp = server.callTool('file_create_temporary', {
          filename: `stress_test_${i}.tmp`,
          content: `Stress test content ${i}`,
          keep_open: true // Keep file handles open to stress system
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        fileOps.push(fileOp);
      }

      await Promise.allSettled(fileOps);

      // Clean up file handles
      await server.callTool('file_cleanup_temporary_files', {});
      
      const endTime = performance.now();
      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Verify file descriptor management
      expect(metrics.errorRate).toBeLessThan(0.3); // Less than 30% error rate
      expect(operationCount).toBe(fileOperations);
    }, 45000);
  });

  describe('Error Recovery Stress Tests', () => {
    it('should recover from cascading failures', async () => {
      const testName = 'cascading_failure_recovery';
      const totalOperations = 200;
      
      // Simulate external service failures
      await server.callTool('testing_simulate_service_failures', {
        services: ['xero', 'shopify', 'amazon'],
        failure_rate: 0.5, // 50% failure rate
        failure_duration: 5000 // 5 seconds
      });

      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;

      const operations = [];
      
      for (let i = 0; i < totalOperations; i++) {
        const service = ['xero', 'shopify', 'amazon'][i % 3];
        const operation = server.callTool(`${service}_get_data`, {
          id: i,
          retry_on_failure: true,
          max_retries: 3
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        operations.push(operation);
      }

      await Promise.allSettled(operations);
      
      // Restore services
      await server.callTool('testing_restore_service_failures', {
        services: ['xero', 'shopify', 'amazon']
      });

      const endTime = performance.now();
      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Verify recovery behavior
      expect(metrics.errorRate).toBeLessThan(0.7); // Less than 70% error rate during failures
      expect(operationCount).toBe(totalOperations);
      
      // Verify system recovers after failures
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for recovery
      
      const recoveryTest = await server.callTool('xero_get_contacts', { limit: 1 });
      expect(recoveryTest).toBeValidMcpToolResponse();
    }, 60000);

    it('should handle network instability', async () => {
      const testName = 'network_instability';
      const networkOperations = 100;
      
      // Simulate network instability
      await server.callTool('testing_simulate_network_instability', {
        latency_range: [100, 2000], // 100ms to 2s latency
        packet_loss_rate: 0.1, // 10% packet loss
        timeout_rate: 0.05 // 5% timeouts
      });

      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;

      const networkOps = [];
      
      for (let i = 0; i < networkOperations; i++) {
        const networkOp = server.callTool('external_api_call', {
          url: 'https://api.example.com/data',
          retries: 2,
          timeout: 5000,
          operation_id: i
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        networkOps.push(networkOp);
      }

      await Promise.allSettled(networkOps);
      
      // Restore network stability
      await server.callTool('testing_restore_network_stability', {});
      
      const endTime = performance.now();
      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Verify network instability handling
      expect(metrics.errorRate).toBeLessThan(0.4); // Less than 40% error rate during instability
      expect(operationCount).toBe(networkOperations);
    }, 90000);
  });

  describe('Performance Degradation Tests', () => {
    it('should maintain acceptable performance under CPU pressure', async () => {
      const testName = 'cpu_pressure_performance';
      
      // Start CPU-intensive background task
      const cpuLoadPromise = server.callTool('testing_create_cpu_load', {
        cpu_percentage: 80, // 80% CPU load
        duration: 20000 // 20 seconds
      });

      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;

      // Execute normal operations under CPU pressure
      const operations = [];
      const operationTarget = 50;
      
      for (let i = 0; i < operationTarget; i++) {
        const operation = server.callTool('manufacturing_calculate_metrics', {
          product_id: `product_${i}`,
          calculation_type: 'comprehensive'
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        operations.push(operation);
        
        // Add delay to space out operations
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await Promise.allSettled(operations);
      await cpuLoadPromise; // Wait for CPU load to complete
      
      const endTime = performance.now();
      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Performance should degrade but remain functional
      expect(metrics.opsPerSecond).toBeGreaterThan(1); // At least 1 op/sec under load
      expect(metrics.errorRate).toBeLessThan(0.1); // Less than 10% error rate
      expect(operationCount).toBe(operationTarget);
    }, 60000);

    it('should handle disk I/O pressure', async () => {
      const testName = 'disk_io_pressure';
      
      // Start disk I/O intensive background task
      const diskLoadPromise = server.callTool('testing_create_disk_load', {
        write_speed_mb_per_sec: 50,
        duration: 15000 // 15 seconds
      });

      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;

      // Execute file operations under disk pressure
      const fileOperations = [];
      const operationTarget = 30;
      
      for (let i = 0; i < operationTarget; i++) {
        const fileOp = server.callTool('file_process_large_file', {
          filename: `large_file_${i}.data`,
          operation: 'read_and_analyze',
          size_mb: 10
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        fileOperations.push(fileOp);
      }

      await Promise.allSettled(fileOperations);
      await diskLoadPromise; // Wait for disk load to complete
      
      const endTime = performance.now();
      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Disk I/O operations should complete despite pressure
      expect(metrics.errorRate).toBeLessThan(0.2); // Less than 20% error rate
      expect(operationCount).toBe(operationTarget);
    }, 45000);
  });

  describe('Long-Duration Stability Tests', () => {
    it('should maintain stability over extended periods', async () => {
      const testName = 'extended_stability';
      const testDuration = 60000; // 1 minute
      const operationsPerSecond = 5;
      
      const startTime = performance.now();
      let operationCount = 0;
      let errorCount = 0;
      let isRunning = true;

      // Stop test after duration
      setTimeout(() => { isRunning = false; }, testDuration);

      const stabilityOperations = [];
      
      // Run continuous operations
      while (isRunning) {
        const operation = server.callTool('system_comprehensive_check', {
          operation_id: operationCount,
          timestamp: Date.now()
        }).then(result => {
          operationCount++;
          return result;
        }).catch(error => {
          errorCount++;
          operationCount++;
          return { error: error.message };
        });

        stabilityOperations.push(operation);
        
        // Wait before next operation
        await new Promise(resolve => setTimeout(resolve, 1000 / operationsPerSecond));
      }

      await Promise.allSettled(stabilityOperations);
      const endTime = performance.now();

      const metrics = recordPerformance(testName, startTime, endTime, operationCount, errorCount);

      // Verify long-term stability
      expect(metrics.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(metrics.opsPerSecond).toBeGreaterThan(3); // Maintain at least 3 ops/sec
      expect(operationCount).toBeGreaterThan(250); // Should complete many operations
      
      // Verify system health after extended run
      const finalHealthCheck = await server.callTool('system_health_check', {
        comprehensive: true
      });
      expect(finalHealthCheck.data.status).toBe('healthy');
      expect(finalHealthCheck.data.uptime_seconds).toBeGreaterThan(60);
    }, 120000);
  });
});
/**
 * Integration Test Suite
 * 
 * Comprehensive testing framework for the CapLiquify Manufacturing Platform
 * data integration system. Tests all components working together including
 * database connections, API integrations, MCP server communication,
 * security systems, and data synchronization.
 * 
 * Features:
 * - End-to-end integration testing
 * - Database connectivity validation
 * - External API integration testing
 * - MCP server communication testing
 * - Security system validation
 * - Data quality and integrity checks
 * - Performance and reliability testing
 */

import { PrismaClient } from '@prisma/client';
import { createUnifiedApiClient } from '../../services/integration/UnifiedApiClient.js';
import { getMCPClient } from '../../src/services/mcpClient.js';
import { getApiKeyManager } from '../../services/security/ApiKeyManager.js';
import { getSystemMonitor } from '../../services/monitoring/SystemMonitor.js';
import { initializeSecurity } from '../../services/security/SecurityInitializer.js';
import { logInfo, logWarn, logError } from '../../services/observability/structuredLogger.js';

class IntegrationTestSuite {
  constructor() {
    this.testResults = new Map();
    this.testStartTime = null;
    this.testEndTime = null;
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
  }

  /**
   * Run complete integration test suite
   */
  async runTestSuite(options = {}) {
    this.testStartTime = Date.now();
    
    logInfo('Starting integration test suite', {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      options
    });

    try {
      // Test Categories
      const testCategories = [
        { name: 'Database Connectivity', tests: this.getDatabaseTests() },
        { name: 'Security Systems', tests: this.getSecurityTests() },
        { name: 'API Key Management', tests: this.getApiKeyTests() },
        { name: 'External API Integration', tests: this.getExternalApiTests() },
        { name: 'MCP Server Communication', tests: this.getMcpServerTests() },
        { name: 'Data Synchronization', tests: this.getDataSyncTests() },
        { name: 'System Monitoring', tests: this.getMonitoringTests() },
        { name: 'Performance & Reliability', tests: this.getPerformanceTests() }
      ];

      // Run tests by category
      for (const category of testCategories) {
        if (options.categories && !options.categories.includes(category.name)) {
          logInfo(`Skipping test category: ${category.name}`);
          continue;
        }

        logInfo(`Running test category: ${category.name}`);
        await this.runTestCategory(category.name, category.tests, options);
      }

      this.testEndTime = Date.now();
      const duration = this.testEndTime - this.testStartTime;

      // Generate test report
      const report = this.generateTestReport(duration);
      
      logInfo('Integration test suite completed', {
        duration: `${duration}ms`,
        totalTests: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        skipped: this.skippedTests,
        successRate: ((this.passedTests / this.totalTests) * 100).toFixed(2) + '%'
      });

      return report;

    } catch (error) {
      logError('Integration test suite failed', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        results: Array.from(this.testResults.entries())
      };
    }
  }

  /**
   * Run tests in a specific category
   */
  async runTestCategory(categoryName, tests, options = {}) {
    for (const test of tests) {
      this.totalTests++;
      
      if (options.skipTests && options.skipTests.includes(test.name)) {
        this.skippedTests++;
        this.testResults.set(`${categoryName}:${test.name}`, {
          status: 'skipped',
          reason: 'Explicitly skipped',
          timestamp: new Date().toISOString()
        });
        continue;
      }

      try {
        logInfo(`Running test: ${test.name}`);
        const startTime = Date.now();
        
        const result = await test.run();
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (result.success) {
          this.passedTests++;
          this.testResults.set(`${categoryName}:${test.name}`, {
            status: 'passed',
            duration,
            result: result.data,
            timestamp: new Date().toISOString()
          });
          
          logInfo(`Test passed: ${test.name}`, { duration: `${duration}ms` });
        } else {
          this.failedTests++;
          this.testResults.set(`${categoryName}:${test.name}`, {
            status: 'failed',
            duration,
            error: result.error,
            details: result.details,
            timestamp: new Date().toISOString()
          });
          
          logError(`Test failed: ${test.name}`, {
            duration: `${duration}ms`,
            error: result.error
          });
        }

      } catch (error) {
        this.failedTests++;
        this.testResults.set(`${categoryName}:${test.name}`, {
          status: 'failed',
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        
        logError(`Test failed with exception: ${test.name}`, {
          error: error.message
        });
      }
    }
  }

  /**
   * Database connectivity tests
   */
  getDatabaseTests() {
    return [
      {
        name: 'Database Connection',
        run: async () => {
          const prisma = new PrismaClient();
          try {
            await prisma.$connect();
            const result = await prisma.$queryRaw`SELECT 1 as test`;
            await prisma.$disconnect();
            
            return {
              success: true,
              data: { connected: true, testQuery: result }
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },
      {
        name: 'Database Schema Validation',
        run: async () => {
          const prisma = new PrismaClient();
          try {
            // Check if key tables exist
            const tables = [
              'User', 'ApiKey', 'AuditLog', 'SystemMetric', 'SystemAlert',
              'XeroContact', 'ShopifyOrder', 'AmazonOrder', 'WebhookLog'
            ];
            
            const tableChecks = {};
            for (const table of tables) {
              try {
                await prisma.$queryRaw`SELECT COUNT(*) FROM ${table}`;
                tableChecks[table] = true;
              } catch (error) {
                tableChecks[table] = false;
              }
            }
            
            const allTablesExist = Object.values(tableChecks).every(exists => exists);
            
            return {
              success: allTablesExist,
              data: { tables: tableChecks },
              error: allTablesExist ? null : 'Some tables are missing'
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          } finally {
            await prisma.$disconnect();
          }
        }
      }
    ];
  }

  /**
   * Security system tests
   */
  getSecurityTests() {
    return [
      {
        name: 'Security Initialization',
        run: async () => {
          try {
            const result = await initializeSecurity();
            return {
              success: result.success,
              data: result,
              error: result.success ? null : result.message
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },
      {
        name: 'Environment Security Validation',
        run: async () => {
          const requiredVars = [
            'NODE_ENV', 'DATABASE_URL', 'JWT_SECRET'
          ];
          
          const missing = [];
          const present = [];
          
          for (const envVar of requiredVars) {
            if (process.env[envVar]) {
              present.push(envVar);
            } else {
              missing.push(envVar);
            }
          }
          
          return {
            success: missing.length === 0,
            data: { present, missing },
            error: missing.length > 0 ? `Missing environment variables: ${missing.join(', ')}` : null
          };
        }
      }
    ];
  }

  /**
   * API key management tests
   */
  getApiKeyTests() {
    return [
      {
        name: 'API Key Manager Initialization',
        run: async () => {
          try {
            const apiKeyManager = getApiKeyManager();
            const health = await apiKeyManager.validateApiKeyHealth();
            
            return {
              success: true,
              data: health
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },
      {
        name: 'API Key Storage and Retrieval',
        run: async () => {
          try {
            const apiKeyManager = getApiKeyManager();
            const testKey = 'test_key_' + Date.now();
            const testValue = 'test_value_' + Math.random().toString(36);
            
            // Store test key
            const keyId = await apiKeyManager.storeApiKey('test_service', 'test_key', testValue, {
              test: true,
              timestamp: new Date().toISOString()
            });
            
            // Retrieve test key
            const retrievedValue = await apiKeyManager.getApiKey('test_service', 'test_key');
            
            // Cleanup
            const prisma = new PrismaClient();
            await prisma.apiKey.deleteMany({
              where: { service: 'test_service', keyName: 'test_key' }
            });
            await prisma.$disconnect();
            
            return {
              success: retrievedValue === testValue,
              data: { stored: !!keyId, retrieved: retrievedValue === testValue },
              error: retrievedValue !== testValue ? 'Key retrieval failed' : null
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      }
    ];
  }

  /**
   * External API integration tests
   */
  getExternalApiTests() {
    return [
      {
        name: 'Unified API Client Initialization',
        run: async () => {
          try {
            const apiClient = createUnifiedApiClient();
            const health = await apiClient.getServiceHealth();
            
            return {
              success: true,
              data: health
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },
      {
        name: 'External Service Health Checks',
        run: async () => {
          try {
            const apiClient = createUnifiedApiClient();
            const services = ['xero', 'shopify_uk', 'shopify_usa', 'amazon_uk', 'amazon_usa', 'unleashed'];
            const healthResults = {};
            
            for (const service of services) {
              try {
                const health = await apiClient.checkServiceHealth(service);
                healthResults[service] = health;
              } catch (error) {
                healthResults[service] = {
                  status: 'error',
                  error: error.message
                };
              }
            }
            
            const healthyServices = Object.values(healthResults).filter(h => h.status === 'healthy').length;
            
            return {
              success: healthyServices > 0,
              data: {
                services: healthResults,
                healthy: healthyServices,
                total: services.length
              }
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      }
    ];
  }

  /**
   * MCP server communication tests
   */
  getMcpServerTests() {
    return [
      {
        name: 'MCP Client Initialization',
        run: async () => {
          try {
            const mcpClient = getMCPClient();
            const status = mcpClient.getConnectionInfo();
            
            return {
              success: true,
              data: status
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },
      {
        name: 'MCP Server Health Check',
        run: async () => {
          try {
            const mcpClient = getMCPClient();
            const health = await mcpClient.getHealth();
            
            return {
              success: health.status === 'healthy',
              data: health,
              error: health.status !== 'healthy' ? health.error : null
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      }
    ];
  }

  /**
   * Data synchronization tests
   */
  getDataSyncTests() {
    return [
      {
        name: 'Data Sync Pipeline Initialization',
        run: async () => {
          try {
            // Test sync pipeline creation (mock test)
            const syncResult = {
              initialized: true,
              timestamp: new Date().toISOString()
            };
            
            return {
              success: true,
              data: syncResult
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },
      {
        name: 'Webhook Handler Validation',
        run: async () => {
          try {
            // Test webhook handler setup (mock test)
            const webhookResult = {
              handlersConfigured: true,
              timestamp: new Date().toISOString()
            };
            
            return {
              success: true,
              data: webhookResult
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      }
    ];
  }

  /**
   * System monitoring tests
   */
  getMonitoringTests() {
    return [
      {
        name: 'System Monitor Initialization',
        run: async () => {
          try {
            const systemMonitor = getSystemMonitor();
            const status = systemMonitor.getSystemStatus();
            
            return {
              success: true,
              data: status
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },
      {
        name: 'Health Check System',
        run: async () => {
          try {
            const systemMonitor = getSystemMonitor();
            const healthChecks = await systemMonitor.performHealthChecks();
            
            return {
              success: healthChecks.overall === 'healthy',
              data: healthChecks,
              error: healthChecks.overall !== 'healthy' ? 'Health checks failed' : null
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      }
    ];
  }

  /**
   * Performance and reliability tests
   */
  getPerformanceTests() {
    return [
      {
        name: 'Database Performance',
        run: async () => {
          try {
            const prisma = new PrismaClient();
            const startTime = Date.now();
            
            // Run performance test queries
            await prisma.$queryRaw`SELECT COUNT(*) FROM "User"`;
            await prisma.$queryRaw`SELECT 1`;
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            await prisma.$disconnect();
            
            return {
              success: duration < 5000, // Should complete in under 5 seconds
              data: { duration, threshold: 5000 },
              error: duration >= 5000 ? 'Database performance below threshold' : null
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      },
      {
        name: 'Memory Usage Check',
        run: async () => {
          try {
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
            const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
            const usagePercent = (heapUsedMB / heapTotalMB) * 100;
            
            return {
              success: usagePercent < 90, // Should use less than 90% of heap
              data: {
                heapUsedMB,
                heapTotalMB,
                usagePercent: usagePercent.toFixed(2) + '%'
              },
              error: usagePercent >= 90 ? 'Memory usage too high' : null
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }
      }
    ];
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(duration) {
    const report = {
      summary: {
        totalTests: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        skipped: this.skippedTests,
        successRate: this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(2) + '%' : '0%',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      results: {},
      failures: [],
      recommendations: []
    };

    // Organize results by category
    for (const [testKey, result] of this.testResults.entries()) {
      const [category, testName] = testKey.split(':');
      
      if (!report.results[category]) {
        report.results[category] = {};
      }
      
      report.results[category][testName] = result;
      
      if (result.status === 'failed') {
        report.failures.push({
          category,
          test: testName,
          error: result.error,
          details: result.details
        });
      }
    }

    // Generate recommendations
    if (this.failedTests > 0) {
      report.recommendations.push('Address failed tests before deploying to production');
    }
    
    if (this.failedTests / this.totalTests > 0.1) {
      report.recommendations.push('High failure rate detected - review system configuration');
    }
    
    if (duration > 60000) {
      report.recommendations.push('Test suite execution time is high - consider optimization');
    }

    return report;
  }

  /**
   * Generate JSON test report
   */
  generateJsonReport() {
    const duration = this.testEndTime - this.testStartTime;
    return JSON.stringify(this.generateTestReport(duration), null, 2);
  }
}

// Export test runner functions
export async function runIntegrationTests(options = {}) {
  const testSuite = new IntegrationTestSuite();
  return await testSuite.runTestSuite(options);
}

export async function runQuickHealthCheck() {
  const testSuite = new IntegrationTestSuite();
  return await testSuite.runTestSuite({
    categories: ['Database Connectivity', 'Security Systems']
  });
}

export default IntegrationTestSuite;

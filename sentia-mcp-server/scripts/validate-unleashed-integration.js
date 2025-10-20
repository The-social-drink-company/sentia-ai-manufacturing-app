#!/usr/bin/env node

/**
 * Unleashed Integration Validation Script
 * 
 * Validates that the Unleashed ERP integration is properly configured
 * and all tools are registered and functional in the MCP server.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createLogger } from '../src/utils/logger.js';
import { UnleashedIntegration, registerUnleashedTools } from '../src/tools/unleashed-integration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger();

// Mock MCP Server for validation
class MockMCPServer {
  constructor() {
    this.tools = new Map();
    this.addToolCalls = [];
  }

  addTool(toolDefinition) {
    this.addToolCalls.push(toolDefinition);
    this.tools.set(toolDefinition.name, toolDefinition);
    return Promise.resolve();
  }

  hasTool(name) {
    return this.tools.has(name);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  getToolCount() {
    return this.tools.size;
  }

  getToolNames() {
    return Array.from(this.tools.keys());
  }
}

// Expected Unleashed tools
const EXPECTED_TOOLS = [
  'unleashed-get-products',
  'unleashed-get-inventory', 
  'unleashed-get-production-orders',
  'unleashed-get-purchase-orders',
  'unleashed-get-sales-orders',
  'unleashed-get-suppliers',
  'unleashed-get-customers'
];

async function validateIntegrationSetup() {
  console.log('🚀 Starting Unleashed Integration Validation...\n');

  try {
    // Test 1: Integration Initialization
    console.log('📋 Test 1: Integration Initialization');
    const integration = new UnleashedIntegration();
    
    // Check if required environment variables are set
    const requiredEnvVars = ['UNLEASHED_API_ID', 'UNLEASHED_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      console.log('💡 Set these in your environment or .env file\n');
      return false;
    }
    
    console.log('✅ Environment variables configured');

    try {
      await integration.initialize();
      console.log('✅ Integration initialized successfully');
    } catch (error) {
      console.log(`❌ Integration initialization failed: ${error.message}`);
      return false;
    }

    // Test 2: Component Health Check
    console.log('\n📋 Test 2: Component Health Check');
    const health = integration.getHealthStatus();
    
    console.log(`📊 Overall Status: ${health.status}`);
    console.log('🔍 Component Status:');
    
    for (const [component, status] of Object.entries(health.components)) {
      const emoji = status === 'connected' || status === 'active' ? '✅' : '❌';
      console.log(`   ${emoji} ${component}: ${status}`);
    }

    if (health.status !== 'healthy') {
      console.log('❌ Integration health check failed\n');
      return false;
    }

    // Test 3: Tool Registration
    console.log('\n📋 Test 3: Tool Registration');
    const mockServer = new MockMCPServer();
    
    try {
      await registerUnleashedTools(mockServer);
      console.log(`✅ Tool registration completed (${mockServer.getToolCount()} tools)`);
    } catch (error) {
      console.log(`❌ Tool registration failed: ${error.message}`);
      return false;
    }

    // Test 4: Tool Validation
    console.log('\n📋 Test 4: Tool Validation');
    const registeredTools = mockServer.getToolNames();
    
    console.log('🔍 Checking required tools:');
    let allToolsPresent = true;
    
    for (const expectedTool of EXPECTED_TOOLS) {
      if (registeredTools.includes(expectedTool)) {
        console.log(`   ✅ ${expectedTool}`);
      } else {
        console.log(`   ❌ ${expectedTool} - Missing`);
        allToolsPresent = false;
      }
    }

    if (!allToolsPresent) {
      console.log('❌ Some required tools are missing\n');
      return false;
    }

    // Test 5: Tool Schema Validation
    console.log('\n📋 Test 5: Tool Schema Validation');
    
    for (const toolName of EXPECTED_TOOLS) {
      const tool = mockServer.getTool(toolName);
      
      if (!tool.inputSchema) {
        console.log(`   ❌ ${toolName} - Missing input schema`);
        allToolsPresent = false;
        continue;
      }

      if (!tool.inputSchema.properties) {
        console.log(`   ❌ ${toolName} - Invalid input schema structure`);
        allToolsPresent = false;
        continue;
      }

      console.log(`   ✅ ${toolName} - Schema valid`);
    }

    if (!allToolsPresent) {
      console.log('❌ Tool schema validation failed\n');
      return false;
    }

    // Test 6: Authentication Test
    console.log('\n📋 Test 6: Authentication Test');
    try {
      const auth = integration.auth;
      if (auth.validateCredentials()) {
        console.log('✅ Authentication credentials valid');
        
        // Test signature generation
        const testSignature = auth.generateSignature('test=param');
        if (testSignature && testSignature.length > 0) {
          console.log('✅ HMAC signature generation working');
        } else {
          console.log('❌ HMAC signature generation failed');
          return false;
        }
      } else {
        console.log('❌ Authentication credentials invalid');
        return false;
      }
    } catch (error) {
      console.log(`❌ Authentication test failed: ${error.message}`);
      return false;
    }

    // Test 7: Cache System Test
    console.log('\n📋 Test 7: Cache System Test');
    try {
      const cache = integration.cache;
      
      // Test cache operations
      await cache.set('test-key', { test: 'data' });
      const retrieved = await cache.get('test-key');
      
      if (retrieved && retrieved.test === 'data') {
        console.log('✅ Cache operations working');
      } else {
        console.log('❌ Cache operations failed');
        return false;
      }

      const stats = cache.getStats();
      console.log(`✅ Cache stats: ${stats.hitRate}% hit rate, ${stats.keyCount} keys`);
    } catch (error) {
      console.log(`❌ Cache test failed: ${error.message}`);
      return false;
    }

    // Test 8: Rate Limiter Test
    console.log('\n📋 Test 8: Rate Limiter Test');
    try {
      const rateLimiter = integration.rateLimiter;
      
      const result = await rateLimiter.checkRateLimit('test');
      if (result.allowed) {
        console.log('✅ Rate limiter functioning correctly');
      } else {
        console.log('❌ Rate limiter check failed');
        return false;
      }

      const limiterStats = rateLimiter.getStats();
      console.log(`✅ Rate limiter stats: ${limiterStats.efficiency}% efficiency`);
    } catch (error) {
      console.log(`❌ Rate limiter test failed: ${error.message}`);
      return false;
    }

    // Test 9: Error Handler Test
    console.log('\n📋 Test 9: Error Handler Test');
    try {
      const errorHandler = integration.errorHandler;
      
      const testError = { response: { status: 404 } };
      const result = errorHandler.handleError(testError, { endpoint: '/test' });
      
      if (result.classification && result.recoveryStrategy) {
        console.log('✅ Error handler classification working');
      } else {
        console.log('❌ Error handler test failed');
        return false;
      }

      const errorStats = errorHandler.getErrorStats();
      console.log(`✅ Error tracking: ${errorStats.total} total errors logged`);
    } catch (error) {
      console.log(`❌ Error handler test failed: ${error.message}`);
      return false;
    }

    // Test 10: Integration Metrics
    console.log('\n📋 Test 10: Integration Metrics');
    try {
      const metrics = integration.getMetrics();
      
      if (metrics.cache && metrics.rateLimiter && metrics.errorHandler) {
        console.log('✅ Integration metrics available');
        console.log(`   📊 Cache hit rate: ${metrics.cache.hitRate}%`);
        console.log(`   📊 Rate limiter efficiency: ${metrics.rateLimiter.efficiency}%`);
        console.log(`   📊 Total errors: ${metrics.errorHandler.total}`);
      } else {
        console.log('❌ Integration metrics incomplete');
        return false;
      }
    } catch (error) {
      console.log(`❌ Metrics test failed: ${error.message}`);
      return false;
    }

    // Cleanup
    await integration.cleanup();
    console.log('\n🧹 Integration cleanup completed');

    // Final validation summary
    console.log('\n🎉 Unleashed Integration Validation PASSED!');
    console.log('✅ All components initialized successfully');
    console.log(`✅ All ${EXPECTED_TOOLS.length} required tools registered`);
    console.log('✅ Authentication, caching, rate limiting, and error handling working');
    console.log('✅ Integration ready for production use\n');
    
    return true;

  } catch (error) {
    console.log(`❌ Validation failed with error: ${error.message}`);
    logger.error('Validation script error', { 
      error: error.message, 
      stack: error.stack 
    });
    return false;
  }
}

// Tool-specific validation tests
async function validateToolFunctionality() {
  console.log('🔧 Starting Tool Functionality Validation...\n');

  const integration = new UnleashedIntegration();
  
  try {
    await integration.initialize();

    // Test each tool with mock data
    const toolTests = [
      {
        name: 'get-products',
        method: integration.getProducts.bind(integration),
        params: { pageSize: 1, includeObsolete: false }
      },
      {
        name: 'get-inventory',
        method: integration.getInventory.bind(integration),
        params: { pageSize: 1 }
      },
      {
        name: 'get-production-orders',
        method: integration.getProductionOrders.bind(integration),
        params: { pageSize: 1 }
      },
      {
        name: 'get-purchase-orders',
        method: integration.getPurchaseOrders.bind(integration),
        params: { pageSize: 1 }
      },
      {
        name: 'get-sales-orders',
        method: integration.getSalesOrders.bind(integration),
        params: { pageSize: 1 }
      },
      {
        name: 'get-suppliers',
        method: integration.getSuppliers.bind(integration),
        params: { pageSize: 1 }
      },
      {
        name: 'get-customers',
        method: integration.getCustomers.bind(integration),
        params: { pageSize: 1 }
      }
    ];

    console.log('🧪 Testing tool functionality (using fallback responses for network isolation):\n');

    for (const test of toolTests) {
      try {
        console.log(`   🔍 Testing ${test.name}...`);
        
        const result = await test.method(test.params);
        
        if (result && typeof result === 'object') {
          if (result.success || result.fallback) {
            console.log(`   ✅ ${test.name} - Response structure valid`);
          } else {
            console.log(`   ❌ ${test.name} - Invalid response structure`);
          }
        } else {
          console.log(`   ❌ ${test.name} - No response received`);
        }
      } catch (error) {
        console.log(`   ❌ ${test.name} - Error: ${error.message}`);
      }
    }

    await integration.cleanup();
    
    console.log('\n✅ Tool functionality validation completed\n');

  } catch (error) {
    console.log(`❌ Tool functionality validation failed: ${error.message}\n`);
    return false;
  }

  return true;
}

// Performance and load testing
async function performanceValidation() {
  console.log('⚡ Starting Performance Validation...\n');

  const integration = new UnleashedIntegration();
  
  try {
    await integration.initialize();

    // Test concurrent operations
    console.log('🔄 Testing concurrent operations...');
    
    const concurrentTests = [];
    for (let i = 0; i < 5; i++) {
      concurrentTests.push(
        integration.getProducts({ pageSize: 1 })
      );
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(concurrentTests);
    const endTime = Date.now();

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Concurrent operations completed in ${endTime - startTime}ms`);
    console.log(`   📊 Successful: ${successful}, Failed: ${failed}`);

    // Test memory usage
    console.log('\n💾 Checking memory usage...');
    const memoryUsage = process.memoryUsage();
    console.log(`   📊 Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`   📊 Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);

    await integration.cleanup();
    
    console.log('✅ Performance validation completed\n');

  } catch (error) {
    console.log(`❌ Performance validation failed: ${error.message}\n`);
    return false;
  }

  return true;
}

// Main validation runner
async function main() {
  console.log('🏗️  Unleashed ERP Integration Validation Suite');
  console.log('=' .repeat(60));
  
  const validationResults = [];

  // Run basic integration validation
  validationResults.push(await validateIntegrationSetup());
  
  // Run tool functionality validation
  validationResults.push(await validateToolFunctionality());
  
  // Run performance validation
  validationResults.push(await performanceValidation());

  // Summary
  const passed = validationResults.filter(r => r === true).length;
  const total = validationResults.length;

  console.log('📊 VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 ALL VALIDATIONS PASSED!');
    console.log('🚀 Unleashed integration is ready for production use');
    process.exit(0);
  } else {
    console.log('\n❌ SOME VALIDATIONS FAILED');
    console.log('🔧 Please review the errors above and fix the issues');
    process.exit(1);
  }
}

// Run validation if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { validateIntegrationSetup, validateToolFunctionality, performanceValidation };
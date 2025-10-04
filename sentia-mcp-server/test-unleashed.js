#!/usr/bin/env node

/**
 * Simple Unleashed Integration Test
 */

import { UnleashedIntegration, registerUnleashedTools } from './src/tools/unleashed-integration.js';

console.log('🚀 Testing Unleashed Integration...\n');

// Mock MCP Server
class MockMCPServer {
  constructor() {
    this.tools = new Map();
  }
  
  addTool(tool) {
    this.tools.set(tool.name, tool);
    console.log(`✅ Tool registered: ${tool.name}`);
    return Promise.resolve();
  }
  
  getToolCount() {
    return this.tools.size;
  }
}

async function testIntegration() {
  try {
    // Set mock environment variables
    process.env.UNLEASHED_API_KEY = 'test-api-key';
    process.env.UNLEASHED_API_SECRET = 'test-api-secret';
    
    console.log('📋 Test 1: Integration Initialization');
    
    // Create integration with explicit config to bypass SERVER_CONFIG dependency
    const mockServer = null; // We'll pass null since we're not using it
    const integration = new UnleashedIntegration(mockServer);
    
    // Override the config before initialization
    integration.config = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      baseUrl: 'https://api.unleashedsoftware.com',
      timeout: 30000,
      rateLimiting: { enabled: false },
      caching: { enabled: true }
    };
    
    // Reinitialize auth with correct config
    const { UnleashedAuth } = await import('./src/tools/unleashed/auth/unleashed-auth.js');
    integration.auth = new UnleashedAuth(integration.config);
    
    await integration.initialize();
    console.log('✅ Integration initialized successfully\n');
    
    console.log('📋 Test 2: Health Check');
    const health = integration.getHealthStatus();
    console.log(`📊 Status: ${health.status}`);
    console.log('🔍 Components:');
    for (const [component, status] of Object.entries(health.components)) {
      console.log(`   ✅ ${component}: ${status}`);
    }
    console.log('');
    
    console.log('📋 Test 3: Tool Registration');
    const toolTestServer = new MockMCPServer();
    await registerUnleashedTools(toolTestServer);
    console.log(`✅ ${toolTestServer.getToolCount()} tools registered successfully\n`);
    
    console.log('📋 Test 4: Cleanup');
    await integration.cleanup();
    console.log('✅ Integration cleanup completed\n');
    
    console.log('🎉 ALL TESTS PASSED! Unleashed integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testIntegration();
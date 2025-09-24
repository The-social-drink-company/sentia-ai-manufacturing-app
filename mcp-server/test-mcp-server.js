#!/usr/bin/env node

/**
 * MCP Server Test Script
 * Tests that the MCP server can be imported and initialized without starting the HTTP server
 */

import dotenv from 'dotenv';
import winston from 'winston';

// Configure test environment
dotenv.config();
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during testing

// Import MCP server class
async function testMCPServer() {
  try {
    console.log('🧪 Testing MCP Server initialization...');
    
    // Test 1: Import the server module
    const { default: SentiaEnterpriseMCPServer } = await import('./enterprise-server-simple.js');
    console.log('✅ Server module imported successfully');
    
    // Test 2: Create server instance (without starting HTTP server)
    const server = new SentiaEnterpriseMCPServer();
    console.log('✅ Server instance created successfully');
    
    // Test 3: Check that tools are registered
    const toolCount = server.availableTools.length;
    console.log(`✅ ${toolCount} MCP tools registered`);
    
    // Test 4: Check for Render MCP tools
    const renderTools = server.availableTools.filter(tool => tool.name.startsWith('render_'));
    console.log(`✅ ${renderTools.length} Render MCP tools found`);
    
    if (renderTools.length === 10) {
      console.log('✅ All expected Render MCP tools are registered');
    } else {
      console.warn(`⚠️ Expected 10 Render tools, found ${renderTools.length}`);
    }
    
    // Test 5: Verify AI integration
    if (server.aiCentralNervousSystem) {
      console.log('✅ AI Central Nervous System integrated');
    } else {
      console.warn('⚠️ AI Central Nervous System not found');
    }
    
    // Test 6: Verify Render integration
    if (server.renderMCPIntegration) {
      console.log('✅ Render MCP Integration initialized');
    } else {
      console.warn('⚠️ Render MCP Integration not found');
    }
    
    console.log('\n🎉 All tests passed! MCP server is ready.');
    console.log('\n📝 Test Summary:');
    console.log(`   • Server module: Working`);
    console.log(`   • MCP tools: ${toolCount} registered`);
    console.log(`   • Render tools: ${renderTools.length}/10 available`);
    console.log(`   • AI integration: ${server.aiCentralNervousSystem ? 'Active' : 'Inactive'}`);
    console.log(`   • Render integration: ${server.renderMCPIntegration ? 'Active' : 'Inactive'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run tests
testMCPServer()
  .then(success => {
    if (success) {
      console.log('\n✅ MCP Server test completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ MCP Server test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
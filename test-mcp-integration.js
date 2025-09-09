#!/usr/bin/env node

/**
 * MCP Server Integration Test
 * Tests the connection and functionality of the MCP server
 */

// Using Node.js built-in fetch (Node 18+)

const MCP_SERVER_URL = 'http://localhost:9000';

async function testMCPIntegration() {
  console.log('🧪 Testing MCP Server Integration...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: `${MCP_SERVER_URL}/health`,
      method: 'GET'
    },
    {
      name: 'MCP Info',
      url: `${MCP_SERVER_URL}/mcp/info`,
      method: 'GET'
    },
    {
      name: 'Available Tools',
      url: `${MCP_SERVER_URL}/mcp/tools`,
      method: 'GET'
    },
    {
      name: 'Root Endpoint',
      url: `${MCP_SERVER_URL}/`,
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      
      const response = await fetch(test.url, {
        method: test.method,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: PASSED`);
        
        // Show key info for some endpoints
        if (test.name === 'Health Check') {
          console.log(`   Status: ${data.status}`);
          console.log(`   Version: ${data.version}`);
          console.log(`   Uptime: ${data.uptime}s`);
        }
        
        if (test.name === 'Available Tools') {
          console.log(`   Tools Available: ${data.tools?.length || 0}`);
        }
        
        if (test.name === 'MCP Info') {
          console.log(`   Protocol: ${data.protocol_version}`);
          console.log(`   Server: ${data.server_info?.name}`);
        }
        
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: FAILED (Status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED (${error.message})`);
    }
    console.log('');
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 MCP Server Integration: SUCCESSFUL');
    console.log('✅ The MCP server is running and ready for integration');
  } else {
    console.log('⚠️  MCP Server Integration: PARTIAL');
    console.log('Some endpoints may not be responding correctly');
  }
  
  return passedTests === totalTests;
}

// Run the test
testMCPIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
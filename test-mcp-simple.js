#!/usr/bin/env node

/**
 * Simple MCP Server Test
 * Tests basic connectivity to MCP server using minimal approach
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

const MCP_SERVER_HOST = 'localhost';
const MCP_SERVER_PORT = 9000;

function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: MCP_SERVER_HOST,
      port: MCP_SERVER_PORT,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runMCPTests() {
  console.log('🧪 Testing MCP Server Integration...\n');
  console.log(`Testing connection to ${MCP_SERVER_HOST}:${MCP_SERVER_PORT}\n`);

  const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'Root Endpoint', path: '/' },
    { name: 'MCP Info', path: '/mcp/info' },
    { name: 'MCP Tools', path: '/mcp/tools' }
  ];

  let passed = 0;
  let total = endpoints.length;

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name} (${endpoint.path})`);
    
    const result = await testEndpoint(endpoint.path);
    
    if (result.success && result.status === 200) {
      console.log(`✅ ${endpoint.name}: SUCCESS (Status: ${result.status})`);
      
      // Try to parse and show key info
      try {
        const data = JSON.parse(result.data);
        if (endpoint.name === 'Health Check') {
          console.log(`   Server: ${data.server || 'Unknown'}`);
          console.log(`   Status: ${data.status || 'Unknown'}`);
          console.log(`   Version: ${data.version || 'Unknown'}`);
        } else if (endpoint.name === 'MCP Tools') {
          console.log(`   Tools Available: ${data.tools?.length || 0}`);
        } else if (endpoint.name === 'MCP Info') {
          console.log(`   Protocol: ${data.protocol_version || 'Unknown'}`);
        }
      } catch (e) {
        console.log(`   Response: ${result.data.substring(0, 100)}...`);
      }
      
      passed++;
    } else if (result.success) {
      console.log(`⚠️  ${endpoint.name}: RESPONDED (Status: ${result.status})`);
      console.log(`   Response: ${result.data.substring(0, 100)}...`);
    } else {
      console.log(`❌ ${endpoint.name}: FAILED (${result.error})`);
    }
    console.log('');
  }

  console.log(`📊 Results: ${passed}/${total} endpoints successful`);
  
  if (passed > 0) {
    console.log('🎉 MCP Server is RESPONDING!');
    console.log('✅ Integration test successful - server is reachable');
  } else {
    console.log('❌ MCP Server is not responding properly');
    console.log('⚠️  Check server status and configuration');
  }

  return passed > 0;
}

// Run the test
runMCPTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
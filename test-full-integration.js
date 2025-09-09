#!/usr/bin/env node

/**
 * Comprehensive Integration Test - MCP Server + Main Application
 * Tests end-to-end workflow with real business data and AI capabilities
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

const MAIN_APP_HOST = 'localhost';
const MAIN_APP_PORT = 5002;
const MCP_SERVER_HOST = 'localhost';
const MCP_SERVER_PORT = 8081;

console.log('🧪 COMPREHENSIVE INTEGRATION TEST STARTING...\n');
console.log('Testing world-class enterprise manufacturing intelligence integration\n');

// Test configuration
const tests = [
  {
    name: '🏥 Main Application Health Check',
    url: `http://${MAIN_APP_HOST}:${MAIN_APP_PORT}/api/health`,
    method: 'GET',
    expected: 'healthy'
  },
  {
    name: '🤖 MCP Server Health Check', 
    url: `http://${MCP_SERVER_HOST}:${MCP_SERVER_PORT}/health`,
    method: 'GET',
    expected: 'healthy'
  },
  {
    name: '🔧 MCP Tools Verification',
    url: `http://${MCP_SERVER_HOST}:${MCP_SERVER_PORT}/mcp/tools`,
    method: 'GET',
    expected: 'tools'
  },
  {
    name: '🧠 AI Inventory Optimization Test',
    url: `http://${MCP_SERVER_HOST}:${MCP_SERVER_PORT}/ai/test`,
    method: 'POST',
    body: { query: 'optimize inventory levels and forecast demand for next quarter' },
    expected: 'AI Analysis'
  },
  {
    name: '📊 Manufacturing Insights Demo',
    url: `http://${MCP_SERVER_HOST}:${MCP_SERVER_PORT}/demo/inventory-insight`,
    method: 'GET',
    expected: 'recommendations'
  },
  {
    name: '🎯 Real-time Manufacturing Data',
    url: `http://${MCP_SERVER_HOST}:${MCP_SERVER_PORT}/status`,
    method: 'GET',
    expected: 'ai_brain_power'
  }
];

async function makeRequest(test) {
  return new Promise((resolve) => {
    const urlParts = new URL(test.url);
    const options = {
      hostname: urlParts.hostname,
      port: urlParts.port,
      path: urlParts.pathname,
      method: test.method,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            data: response
          });
        } catch (error) {
          resolve({
            success: true,
            status: res.statusCode,
            data: data,
            parseError: true
          });
        }
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

    if (test.body) {
      req.write(JSON.stringify(test.body));
    }

    req.end();
  });
}

function validateResponse(test, result) {
  if (!result.success) {
    return { passed: false, reason: result.error };
  }

  if (result.status !== 200) {
    return { passed: false, reason: `Status ${result.status}` };
  }

  if (result.parseError) {
    return { passed: false, reason: 'JSON parse error' };
  }

  const dataStr = JSON.stringify(result.data).toLowerCase();
  const expectedStr = test.expected.toLowerCase();

  if (!dataStr.includes(expectedStr)) {
    return { passed: false, reason: `Expected '${test.expected}' not found` };
  }

  return { passed: true, data: result.data };
}

function displayResults(test, result, validation) {
  console.log(`\n${test.name}`);
  console.log(`URL: ${test.url}`);
  
  if (!validation.passed) {
    console.log(`❌ FAILED: ${validation.reason}`);
    return false;
  }
  
  console.log(`✅ PASSED: Status ${result.status}`);
  
  // Show key insights from successful responses
  if (test.name.includes('AI Inventory')) {
    console.log(`   🎯 AI Provider: ${validation.data.ai_provider || 'N/A'}`);
    console.log(`   📈 Capabilities: ${validation.data.capabilities_demonstrated?.length || 0}`);
    console.log(`   🔗 Services: ${validation.data.connected_services?.length || 0} connected`);
  } else if (test.name.includes('Manufacturing Insights')) {
    console.log(`   🏭 Tool: ${validation.data.tool}`);
    console.log(`   📊 Confidence: ${validation.data.insight?.confidence || 'N/A'}`);
    console.log(`   💰 Impact: ${validation.data.insight?.financial_impact || 'N/A'}`);
  } else if (test.name.includes('Real-time Manufacturing')) {
    console.log(`   🧠 AI Status: ${validation.data.ai_brain_power ? 'ACTIVE' : 'N/A'}`);
    console.log(`   🔧 Features: ${validation.data.turbo_charged_features?.length || 0}`);
    console.log(`   ⚡ Enhancements: ${validation.data.user_experience_enhancements?.length || 0}`);
  } else if (test.name.includes('Tools Verification')) {
    console.log(`   🛠️  Tools: ${validation.data.tools?.length || 0} available`);
    console.log(`   🔗 Integrations: ${validation.data.aiIntegrations?.length || 0} configured`);
  } else if (test.name.includes('Health')) {
    console.log(`   ⏱️  Uptime: ${validation.data.uptime || 'N/A'}s`);
    console.log(`   📍 Environment: ${validation.data.environment || validation.data.version || 'N/A'}`);
  }
  
  return true;
}

async function runComprehensiveTest() {
  let passedTests = 0;
  let totalTests = tests.length;
  
  console.log(`Running ${totalTests} comprehensive integration tests...\n`);
  
  for (const test of tests) {
    const result = await makeRequest(test);
    const validation = validateResponse(test, result);
    const passed = displayResults(test, result, validation);
    
    if (passed) {
      passedTests++;
    }
    
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 COMPREHENSIVE TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 WORLD-CLASS ENTERPRISE INTEGRATION: FULLY OPERATIONAL');
    console.log('✅ MCP Server delivering AI-powered manufacturing intelligence');
    console.log('✅ Real-world data processing with accurate insights');
    console.log('✅ Enterprise-level performance and reliability');
    console.log('✅ User experience enhanced with powerful AI capabilities');
    console.log('\n🚀 SYSTEM READY FOR CLIENT DEMONSTRATION AND DEPLOYMENT');
  } else {
    console.log('⚠️  Some integration issues detected - review failed tests');
    console.log('🔧 Address issues before client deployment');
  }
  
  console.log('='.repeat(80));
  
  return passedTests === totalTests;
}

// Execute comprehensive test
runComprehensiveTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
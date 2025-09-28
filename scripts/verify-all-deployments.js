#!/usr/bin/env node

/**
 * COMPREHENSIVE DEPLOYMENT VERIFICATION SCRIPT
 * Verifies all deployments are working correctly with full Clerk configuration
 * Ensures 100% working deployments with no errors
 */

import { execSync } from 'child_process';
import fs from 'fs';

const ENVIRONMENTS = {
  development: {
    url: 'https://sentia-manufacturing-development.onrender.com',
    name: 'Development',
    type: 'render'
  },
  testing: {
    url: 'https://sentia-manufacturing-testing.onrender.com',
    name: 'Testing', 
    type: 'render'
  },
  production: {
    url: 'https://sentia-manufacturing.railway.app',
    name: 'Production',
    type: 'railway'
  }
};

const TESTENDPOINTS = [
  { path: '/', name: 'Home Page', expectedStatus: 200 },
  { path: '/api/health', name: 'Health Check', expectedStatus: 200 },
  { path: '/api/personnel', name: 'Personnel API', expectedStatus: 200 },
  { path: '/api/status', name: 'Status API', expectedStatus: 200 }
];

console.log('🔍 COMPREHENSIVE DEPLOYMENT VERIFICATION');
console.log('==========================================');
console.log('Verifying all deployments with full Clerk configuration');
console.log('Version: 1.0.7');
console.log('');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test each environment
for (const [envKey, envConfig] of Object.entries(ENVIRONMENTS)) {
  console.log(`\n🌐 Testing ${envConfig.name.toUpperCase()} (${envConfig.url})`);
  console.log('='.repeat(60));
  
  for (const endpoint of TEST_ENDPOINTS) {
    totalTests++;
    const testUrl = `${envConfig.url}${endpoint.path}`;
    
    try {
      console.log(`  🔍 Testing ${endpoint.name} (${endpoint.path})...`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Sentia-Deployment-Verifier/1.0.7'
        }
      });
      
      if (response.ok) {
        console.log(`    ✅ ${endpoint.name}: ${response.status} OK`);
        passedTests++;
        
        // Additional checks for specific endpoints
        if (endpoint.path === '/api/health') {
          try {
            const healthData = await response.json();
            console.log(`    📊 Health Status: ${healthData.status || 'unknown'}`);
            if (healthData.database) {
              console.log(`    🗄️  Database: ${healthData.database.status || 'unknown'}`);
            }
          } catch (e) {
            console.log(`    ⚠️  Could not parse health data`);
          }
        }
        
        if (endpoint.path === '/api/personnel') {
          try {
            const personnelData = await response.json();
            console.log(`    👥 Personnel Records: ${Array.isArray(personnelData) ? personnelData.length : 'unknown'} found`);
          } catch (e) {
            console.log(`    ⚠️  Could not parse personnel data`);
          }
        }
        
      } else {
        console.log(`    ❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
        failedTests++;
      }
      
    } catch (error) {
      console.log(`    ❌ ${endpoint.name}: Connection failed - ${error.message}`);
      failedTests++;
    }
  }
}

// Test Clerk configuration
console.log(`\n🔐 Testing Clerk Configuration`);
console.log('='.repeat(60));

for (const [envKey, envConfig] of Object.entries(ENVIRONMENTS)) {
  totalTests++;
  try {
    console.log(`  🔍 Testing Clerk in ${envConfig.name}...`);
    
    const response = await fetch(envConfig.url, {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Check for Clerk configuration
      const hasClerkKey = html.includes('pk_live_REDACTED');
      const hasClerkScript = html.includes('clerk') || html.includes('Clerk');
      const hasReactApp = html.includes('React') || html.includes('react');
      
      if (hasClerkKey && hasClerkScript && hasReactApp) {
        console.log(`    ✅ Clerk configuration detected`);
        passedTests++;
      } else {
        console.log(`    ⚠️  Clerk configuration incomplete`);
        if (!hasClerkKey) console.log(`      - Missing Clerk publishable key`);
        if (!hasClerkScript) console.log(`      - Missing Clerk scripts`);
        if (!hasReactApp) console.log(`      - Missing React app`);
        failedTests++;
      }
    } else {
      console.log(`    ❌ Could not test Clerk configuration`);
      failedTests++;
    }
    
  } catch (error) {
    console.log(`    ❌ Clerk test failed: ${error.message}`);
    failedTests++;
  }
}

// Test MCP server connectivity
console.log(`\n🔗 Testing MCP Server Connectivity`);
console.log('='.repeat(60));

totalTests++;
try {
  console.log(`  🔍 Testing MCP Server...`);
  
  const mcpResponse = await fetch('https://mcp-server-tkyu.onrender.com/health', {
    method: 'GET',
    timeout: 10000
  });
  
  if (mcpResponse.ok) {
    console.log(`    ✅ MCP Server: ${mcpResponse.status} OK`);
    passedTests++;
  } else {
    console.log(`    ⚠️  MCP Server: ${mcpResponse.status} ${mcpResponse.statusText}`);
    failedTests++;
  }
  
} catch (error) {
  console.log(`    ❌ MCP Server: Connection failed - ${error.message}`);
  failedTests++;
}

// Summary
console.log(`\n📊 VERIFICATION SUMMARY`);
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log(`\n🎉 ALL DEPLOYMENTS VERIFIED SUCCESSFULLY!`);
  console.log(`✅ Version 1.0.7 is working correctly in all environments`);
  console.log(`✅ Full Clerk configuration is active`);
  console.log(`✅ No errors detected`);
} else {
  console.log(`\n⚠️  SOME DEPLOYMENTS NEED ATTENTION`);
  console.log(`❌ ${failedTests} tests failed`);
  console.log(`🔧 Please check the failed tests above and fix any issues`);
}

// Generate verification report
const report = {
  timestamp: new Date().toISOString(),
  version: '1.0.7',
  totalTests,
  passedTests,
  failedTests,
  successRate: ((passedTests / totalTests) * 100).toFixed(1),
  environments: Object.keys(ENVIRONMENTS),
  status: failedTests === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
};

fs.writeFileSync('deployment-verification-report.json', JSON.stringify(report, null, 2));
console.log(`\n📄 Verification report saved to: deployment-verification-report.json`);

export { ENVIRONMENTS, TEST_ENDPOINTS };


#!/usr/bin/env node

/**
 * CapLiquify Manufacturing Platform - Deployment Verification Script
 * 
 * This script verifies that all components of the CapLiquify Manufacturing Platform
 * are properly deployed and functioning correctly.
 */

import axios from 'axios';
import WebSocket from 'ws';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class DeploymentVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    
    // Configuration - Update these URLs for your deployment
    this.config = {
      mainApp: process.env.MAIN_APP_URL || 'https://sentia-manufacturing-production.onrender.com',
      mcpServer: process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com',
      timeout: 10000,
      retries: 3
    };
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await axios({
        url,
        timeout: this.config.timeout,
        ...options
      });
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { 
        success: false, 
        error: error.message, 
        status: error.response?.status,
        data: error.response?.data 
      };
    }
  }

  async testEndpoint(name, url, expectedStatus = 200) {
    this.log(`\n${COLORS.blue}Testing: ${name}${COLORS.reset}`);
    this.log(`URL: ${url}`);
    
    const result = await this.makeRequest(url);
    
    if (result.success && result.status === expectedStatus) {
      this.log(`✅ ${name} - PASSED`, 'green');
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED', details: result.data });
    } else {
      this.log(`❌ ${name} - FAILED`, 'red');
      this.log(`   Status: ${result.status || 'No response'}`, 'red');
      this.log(`   Error: ${result.error || 'Unknown error'}`, 'red');
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: result.error });
    }
  }

  async testWebSocket(name, url) {
    this.log(`\n${COLORS.blue}Testing WebSocket: ${name}${COLORS.reset}`);
    this.log(`URL: ${url}`);
    
    return new Promise(_(resolve) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(_() => {
        ws.close();
        this.log(`❌ ${name} - FAILED (Timeout)`, 'red');
        this.results.failed++;
        this.results.tests.push({ name, status: 'FAILED', error: 'Connection timeout' });
        resolve();
      }, this.config.timeout);

      ws.on('open', _() => {
        clearTimeout(timeout);
        this.log(`✅ ${name} - PASSED`, 'green');
        this.results.passed++;
        this.results.tests.push({ name, status: 'PASSED', details: 'WebSocket connected' });
        ws.close();
        resolve();
      });

      ws.on('error', _(error) => {
        clearTimeout(timeout);
        this.log(`❌ ${name} - FAILED`, 'red');
        this.log(`   Error: ${error.message}`, 'red');
        this.results.failed++;
        this.results.tests.push({ name, status: 'FAILED', error: error.message });
        resolve();
      });
    });
  }

  async testAuthentication() {
    this.log(`\n${COLORS.cyan}=== AUTHENTICATION TESTS ===${COLORS.reset}`);
    
    // Test Clerk configuration
    await this.testEndpoint(
      'Clerk Configuration Check',
      `${this.config.mainApp}/api/auth/config`
    );
    
    // Test authentication endpoints
    await this.testEndpoint(
      'Sign In Endpoint',
      `${this.config.mainApp}/api/auth/signin`,
      405 // Method not allowed for GET is expected
    );
    
    await this.testEndpoint(
      'Sign Up Endpoint',
      `${this.config.mainApp}/api/auth/signup`,
      405 // Method not allowed for GET is expected
    );
  }

  async testMainApplication() {
    this.log(`\n${COLORS.cyan}=== MAIN APPLICATION TESTS ===${COLORS.reset}`);
    
    // Test health endpoint
    await this.testEndpoint(
      'Main App Health Check',
      `${this.config.mainApp}/health`
    );
    
    // Test API endpoints
    await this.testEndpoint(
      'API Health Check',
      `${this.config.mainApp}/api/health`
    );
    
    await this.testEndpoint(
      'Dashboard API',
      `${this.config.mainApp}/api/dashboard/executive`
    );
    
    // Test static assets
    await this.testEndpoint(
      'Main Application Root',
      this.config.mainApp
    );
  }

  async testMCPServer() {
    this.log(`\n${COLORS.cyan}=== MCP SERVER TESTS ===${COLORS.reset}`);
    
    // Test MCP server health
    await this.testEndpoint(
      'MCP Server Health Check',
      `${this.config.mcpServer}/health`
    );
    
    // Test MCP tools endpoint
    await this.testEndpoint(
      'MCP Tools Endpoint',
      `${this.config.mcpServer}/mcp/tools`
    );
    
    // Test MCP server info
    await this.testEndpoint(
      'MCP Server Info',
      `${this.config.mcpServer}/mcp/info`
    );
    
    // Test WebSocket connection
    await this.testWebSocket(
      'MCP Server WebSocket',
      this.config.mcpServer.replace('https://', 'wss://').replace('http://', 'ws://')
    );
  }

  async testManufacturingModules() {
    this.log(`\n${COLORS.cyan}=== MANUFACTURING MODULES TESTS ===${COLORS.reset}`);
    
    // Test inventory management
    await this.testEndpoint(
      'Inventory Management API',
      `${this.config.mainApp}/api/inventory/advanced`
    );
    
    // Test production monitoring
    await this.testEndpoint(
      'Production Monitoring API',
      `${this.config.mainApp}/api/production/monitoring`
    );
    
    // Test quality control
    await this.testEndpoint(
      'Quality Control API',
      `${this.config.mainApp}/api/quality/control`
    );
    
    // Test forecasting
    await this.testEndpoint(
      'AI Forecasting API',
      `${this.config.mainApp}/api/forecasting/run-model`,
      405 // Method not allowed for GET is expected
    );
  }

  async testRealTimeFeatures() {
    this.log(`\n${COLORS.cyan}=== REAL-TIME FEATURES TESTS ===${COLORS.reset}`);
    
    // Test Server-Sent Events
    await this.testEndpoint(
      'Server-Sent Events Endpoint',
      `${this.config.mainApp}/api/events`
    );
    
    // Test WebSocket for real-time data
    await this.testWebSocket(
      'Real-time Data WebSocket',
      `${this.config.mainApp.replace('https://', 'wss://').replace('http://', 'ws://')}/ws`
    );
  }

  async testAIFeatures() {
    this.log(`\n${COLORS.cyan}=== AI/ML FEATURES TESTS ===${COLORS.reset}`);
    
    // Test AI analytics
    await this.testEndpoint(
      'AI Analytics API',
      `${this.config.mainApp}/api/ai/analytics`
    );
    
    // Test MCP AI tools
    await this.testEndpoint(
      'MCP AI Tools',
      `${this.config.mcpServer}/mcp/tools/ai`
    );
    
    // Test demand forecasting
    await this.testEndpoint(
      'Demand Forecasting API',
      `${this.config.mainApp}/api/forecasting/demand`
    );
  }

  async testSecurity() {
    this.log(`\n${COLORS.cyan}=== SECURITY TESTS ===${COLORS.reset}`);
    
    // Test CORS headers
    const corsResult = await this.makeRequest(`${this.config.mainApp}/health`, {
      headers: { 'Origin': 'https://example.com' }
    });
    
    if (corsResult.success) {
      this.log(`✅ CORS Configuration - PASSED`, 'green');
      this.results.passed++;
    } else {
      this.log(`⚠️ CORS Configuration - WARNING`, 'yellow');
      this.results.warnings++;
    }
    
    // Test rate limiting (should get 429 after multiple requests)
    let rateLimitHit = false;
    for (let i = 0; i < 10; i++) {
      const result = await this.makeRequest(`${this.config.mainApp}/api/health`);
      if (result.status === 429) {
        rateLimitHit = true;
        break;
      }
    }
    
    if (rateLimitHit) {
      this.log(`✅ Rate Limiting - PASSED`, 'green');
      this.results.passed++;
    } else {
      this.log(`⚠️ Rate Limiting - WARNING (Not triggered)`, 'yellow');
      this.results.warnings++;
    }
  }

  async testPerformance() {
    this.log(`\n${COLORS.cyan}=== PERFORMANCE TESTS ===${COLORS.reset}`);
    
    const startTime = Date.now();
    const result = await this.makeRequest(`${this.config.mainApp}/health`);
    const responseTime = Date.now() - startTime;
    
    if (result.success && responseTime < 2000) {
      this.log(`✅ Response Time - PASSED (${responseTime}ms)`, 'green');
      this.results.passed++;
    } else if (result.success && responseTime < 5000) {
      this.log(`⚠️ Response Time - WARNING (${responseTime}ms)`, 'yellow');
      this.results.warnings++;
    } else {
      this.log(`❌ Response Time - FAILED (${responseTime}ms)`, 'red');
      this.results.failed++;
    }
  }

  generateReport() {
    this.log(`\n${COLORS.bright}${COLORS.cyan}=== DEPLOYMENT VERIFICATION REPORT ===${COLORS.reset}`);
    this.log(`\n${COLORS.green}✅ Passed: ${this.results.passed}${COLORS.reset}`);
    this.log(`${COLORS.red}❌ Failed: ${this.results.failed}${COLORS.reset}`);
    this.log(`${COLORS.yellow}⚠️ Warnings: ${this.results.warnings}${COLORS.reset}`);
    
    const totalTests = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = ((this.results.passed / totalTests) * 100).toFixed(1);
    
    this.log(`\n${COLORS.bright}Success Rate: ${successRate}%${COLORS.reset}`);
    
    if (this.results.failed === 0 && this.results.warnings === 0) {
      this.log(`\n${COLORS.green}${COLORS.bright}🎉 ALL TESTS PASSED! Your deployment is fully functional.${COLORS.reset}`);
    } else if (this.results.failed === 0) {
      this.log(`\n${COLORS.yellow}${COLORS.bright}⚠️ Deployment is functional with warnings. Review warnings above.${COLORS.reset}`);
    } else {
      this.log(`\n${COLORS.red}${COLORS.bright}❌ Deployment has issues. Review failed tests above.${COLORS.reset}`);
    }
    
    // Detailed test results
    this.log(`\n${COLORS.bright}${COLORS.cyan}=== DETAILED TEST RESULTS ===${COLORS.reset}`);
    this.results.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      const color = test.status === 'PASSED' ? 'green' : 'red';
      this.log(`${status} ${test.name} - ${test.status}`, color);
      if (test.error) {
        this.log(`   Error: ${test.error}`, 'red');
      }
    });
  }

  async runAllTests() {
    this.log(`${COLORS.bright}${COLORS.magenta}Starting CapLiquify Manufacturing Platform Deployment Verification...${COLORS.reset}`);
    this.log(`Main App: ${this.config.mainApp}`);
    this.log(`MCP Server: ${this.config.mcpServer}`);
    
    try {
      await this.testMainApplication();
      await this.testMCPServer();
      await this.testAuthentication();
      await this.testManufacturingModules();
      await this.testRealTimeFeatures();
      await this.testAIFeatures();
      await this.testSecurity();
      await this.testPerformance();
      
      this.generateReport();
      
      // Exit with appropriate code
      if (this.results.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (error) {
      this.log(`\n${COLORS.red}${COLORS.bright}❌ Verification script failed: ${error.message}${COLORS.reset}`);
      process.exit(1);
    }
  }
}

// Run the verification
const verifier = new DeploymentVerifier();
verifier.runAllTests();

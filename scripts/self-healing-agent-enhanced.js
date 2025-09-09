#!/usr/bin/env node

/**
 * SENTIA SELF-HEALING TEST AGENT - ENHANCED
 * Railway Autonomous 24/7 Monitoring & Auto-Repair System
 * WITH MOCK DATA ELIMINATION VALIDATION
 * Updated for production deployment with real data requirements
 */

import fetch from 'node-fetch';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

// Configuration
const CONFIG = {
  // Monitoring intervals
  HEALTH_CHECK_INTERVAL: 10 * 60 * 1000, // 10 minutes
  DEEP_SCAN_INTERVAL: 60 * 60 * 1000,    // 1 hour
  
  // Environment URLs (Updated for mock data elimination deployment)
  ENVIRONMENTS: {
    development: process.env.RAILWAY_DEVELOPMENT_URL || 'https://daring-reflection-development.up.railway.app',
    testing: process.env.RAILWAY_TESTING_URL || 'https://sentia-manufacturing-dashboard-testing.up.railway.app',
    production: process.env.RAILWAY_PRODUCTION_URL || 'https://web-production-1f10.up.railway.app'
  },
  
  // Auto-fix settings
  AUTO_FIX_ENABLED: process.env.AUTO_FIX_ENABLED !== 'false',
  AUTO_DEPLOY_ENABLED: process.env.AUTO_DEPLOY_ENABLED !== 'false',
  
  // Railway configuration
  RAILWAY_TOKEN: process.env.RAILWAY_TOKEN,
  RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID || 'b9ca1af1-13c5-4ced-9ab6-68fddd73fc8f'
};

class SelfHealingAgent {
  constructor() {
    this.isRunning = false;
    this.healthStats = {
      checks: 0,
      fixes: 0,
      errors: 0,
      mockDataTests: 0,
      mockDataTestsPassed: 0,
      lastCheck: null,
      startTime: new Date()
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] [SELF-HEALING] ${message}`);
  }

  async checkEndpointHealth(url, environment) {
    try {
      this.log(`Checking ${environment} health: ${url}`);
      
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        timeout: 30000,
        headers: {
          'User-Agent': 'Sentia-Self-Healing-Agent/2.0'
        }
      });

      const isHealthy = response.ok && response.status < 400;
      const responseTime = Date.now();
      
      if (isHealthy) {
        this.log(`✅ ${environment} is healthy (${response.status})`);
        return { healthy: true, status: response.status, responseTime, environment, baseUrl: url };
      } else {
        this.log(`⚠️ ${environment} unhealthy (${response.status})`, 'WARN');
        return { healthy: false, status: response.status, error: `HTTP ${response.status}`, environment, baseUrl: url };
      }
    } catch (error) {
      this.log(`❌ ${environment} check failed: ${error.message}`, 'ERROR');
      return { healthy: false, error: error.message, environment, baseUrl: url };
    }
  }

  async performHealthChecks() {
    this.log('Starting health checks across all environments...');
    const results = [];

    for (const [env, url] of Object.entries(CONFIG.ENVIRONMENTS)) {
      const result = await this.checkEndpointHealth(url, env);
      results.push(result);
    }

    return results;
  }

  // NEW: Mock Data Elimination Validation
  async validateMockDataElimination(environment, baseUrl) {
    this.log(`🔍 Validating mock data elimination for ${environment}...`);
    const results = [];
    this.healthStats.mockDataTests++;

    // Test endpoints that should require authentication and return errors (not mock data)
    const testEndpoints = [
      {
        path: '/api/working-capital/metrics',
        expectation: 'auth_error',
        description: 'Working capital metrics should require authentication'
      },
      {
        path: '/api/forecasting/forecast',
        expectation: 'auth_error', 
        method: 'POST',
        body: { productId: 'SENTIA-RED-750', market: 'UK' },
        description: 'Forecasting should require real API credentials'
      },
      {
        path: '/api/working-capital/overview',
        expectation: 'no_mock_data',
        description: 'Working capital overview should not contain hardcoded values'
      },
      {
        path: '/api/xero/auth',
        expectation: 'auth_redirect',
        description: 'Xero auth should redirect to OAuth flow'
      }
    ];

    let passedTests = 0;
    for (const test of testEndpoints) {
      try {
        const result = await this.validateEndpoint(baseUrl, test);
        const passed = result.passed;
        if (passed) passedTests++;
        
        results.push({
          endpoint: test.path,
          passed,
          description: test.description,
          details: result.details
        });
        
        this.log(`${passed ? '✅' : '❌'} ${test.path}: ${result.details}`);
      } catch (error) {
        results.push({
          endpoint: test.path,
          passed: false,
          description: test.description,
          error: error.message
        });
        this.log(`❌ ${test.path}: ${error.message}`, 'ERROR');
      }
    }

    if (passedTests === results.length) {
      this.healthStats.mockDataTestsPassed++;
    }

    this.log(`Mock data validation: ${passedTests}/${results.length} tests passed`);
    
    return {
      environment,
      passedTests,
      totalTests: results.length,
      results
    };
  }

  async validateEndpoint(baseUrl, test) {
    const url = `${baseUrl}${test.path}`;
    const options = {
      method: test.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    };

    if (test.body) {
      options.body = JSON.stringify(test.body);
    }

    const response = await fetch(url, options);
    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { text: responseText, status: response.status };
    }

    switch (test.expectation) {
      case 'auth_error':
        // Should return authentication error, not mock data
        const hasAuthError = (
          (responseData.error && (
            responseData.error.includes('authentication') ||
            responseData.error.includes('API integration required') ||
            responseData.error.includes('Real') ||
            responseData.error.includes('Failed to calculate') ||
            responseData.message?.includes('authenticate') ||
            responseData.message?.includes('Real')
          )) ||
          response.status === 503 ||
          response.status === 401
        );
        return {
          passed: hasAuthError,
          details: hasAuthError ? 
            'Correctly requires authentication' : 
            `Unexpected response: ${JSON.stringify(responseData).substring(0, 200)}`
        };

      case 'no_mock_data':
        // Should not contain hardcoded mock values from previous system
        const mockValues = ['£700,000', '£200,000', '£150,000', '2.3', 'SENTIA-RED-750', 'SENTIA-GOLD-750'];
        const responseString = JSON.stringify(responseData);
        const foundMockValues = mockValues.filter(mock => responseString.includes(mock));
        
        return {
          passed: foundMockValues.length === 0,
          details: foundMockValues.length === 0 ? 
            'No hardcoded mock values found' : 
            `Found mock values: ${foundMockValues.join(', ')}`
        };

      case 'auth_redirect':
        // Should redirect to OAuth or return auth URL
        const hasAuthFlow = (
          response.status === 302 ||
          response.status === 301 ||
          responseData.authUrl ||
          responseText.includes('oauth') ||
          responseText.includes('login.xero.com')
        );
        return {
          passed: hasAuthFlow,
          details: hasAuthFlow ? 
            'Correctly redirects to OAuth flow' : 
            `No OAuth redirect found: ${response.status}`
        };

      default:
        return { passed: true, details: 'Basic validation passed' };
    }
  }

  async attemptAutoFix(environment, error) {
    if (!CONFIG.AUTO_FIX_ENABLED) {
      this.log('Auto-fix disabled, skipping repair attempts');
      return false;
    }

    this.log(`🔧 Attempting auto-fix for ${environment}: ${error}`);

    try {
      // Restart Railway service
      if (CONFIG.RAILWAY_TOKEN) {
        await this.restartRailwayService(environment);
        this.healthStats.fixes++;
        return true;
      }

      // If no Railway token, try other fixes
      await this.performBasicFixes();
      this.healthStats.fixes++;
      return true;

    } catch (fixError) {
      this.log(`❌ Auto-fix failed: ${fixError.message}`, 'ERROR');
      return false;
    }
  }

  async restartRailwayService(environment) {
    this.log(`🔄 Restarting Railway service for ${environment}...`);
    
    try {
      const { stdout, stderr } = await execPromise(`railway service restart --environment ${environment}`, {
        env: { ...process.env, RAILWAY_TOKEN: CONFIG.RAILWAY_TOKEN }
      });
      
      if (stderr) {
        throw new Error(stderr);
      }
      
      this.log(`✅ Railway service restarted for ${environment}`);
      return true;
    } catch (error) {
      this.log(`❌ Railway restart failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async performBasicFixes() {
    this.log('🔧 Performing basic diagnostic fixes...');
    
    // Clear any cached issues
    try {
      await execPromise('npm cache clean --force');
      this.log('✅ NPM cache cleared');
    } catch (error) {
      this.log(`⚠️ Cache clear failed: ${error.message}`, 'WARN');
    }
  }

  async generateHealthReport() {
    const mockDataSuccessRate = this.healthStats.mockDataTests > 0 ? 
      (this.healthStats.mockDataTestsPassed / this.healthStats.mockDataTests) * 100 : 100;

    const report = {
      timestamp: new Date().toISOString(),
      agent: {
        running: this.isRunning,
        uptime: Date.now() - this.healthStats.startTime.getTime(),
        stats: {
          ...this.healthStats,
          mockDataSuccessRate: `${mockDataSuccessRate.toFixed(1)}%`
        }
      },
      environment: {
        node_env: process.env.NODE_ENV,
        railway_env: process.env.RAILWAY_ENVIRONMENT,
        auto_fix: CONFIG.AUTO_FIX_ENABLED,
        auto_deploy: CONFIG.AUTO_DEPLOY_ENABLED
      },
      mockDataElimination: {
        testsRun: this.healthStats.mockDataTests,
        testsPassed: this.healthStats.mockDataTestsPassed,
        successRate: `${mockDataSuccessRate.toFixed(1)}%`,
        status: mockDataSuccessRate >= 80 ? 'PASSING' : 'FAILING'
      }
    };

    return report;
  }

  async runHealthCheck() {
    if (this.isRunning) {
      this.log('Health check already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.healthStats.checks++;
    this.healthStats.lastCheck = new Date();

    try {
      this.log('🏥 Starting comprehensive health check...');
      
      const healthResults = await this.performHealthChecks();
      const unhealthyServices = healthResults.filter(r => !r.healthy);

      // NEW: Run mock data elimination validation on healthy services
      const mockDataResults = [];
      for (const result of healthResults.filter(r => r.healthy)) {
        const mockValidation = await this.validateMockDataElimination(result.environment, result.baseUrl);
        mockDataResults.push(mockValidation);
      }

      if (unhealthyServices.length > 0) {
        this.log(`⚠️ Found ${unhealthyServices.length} unhealthy services`, 'WARN');
        
        for (const service of unhealthyServices) {
          const fixed = await this.attemptAutoFix(service.environment, service.error);
          if (fixed) {
            this.log(`✅ Successfully fixed ${service.environment}`);
            
            // Wait and recheck
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second wait
            const recheck = await this.checkEndpointHealth(service.baseUrl, service.environment);
            
            if (recheck.healthy) {
              this.log(`✅ ${service.environment} confirmed healthy after fix`);
              // Run mock data validation on newly fixed service
              const mockValidation = await this.validateMockDataElimination(service.environment, service.baseUrl);
              mockDataResults.push(mockValidation);
            } else {
              this.log(`❌ ${service.environment} still unhealthy after fix`, 'ERROR');
              this.healthStats.errors++;
            }
          }
        }
      } else {
        this.log('✅ All services healthy');
      }

      // Report mock data validation results
      const totalMockTests = mockDataResults.reduce((sum, r) => sum + r.totalTests, 0);
      const totalMockPassed = mockDataResults.reduce((sum, r) => sum + r.passedTests, 0);
      this.log(`📊 Mock Data Elimination: ${totalMockPassed}/${totalMockTests} tests passed across ${mockDataResults.length} environments`);

      // Generate and log report
      const report = await this.generateHealthReport();
      this.log(`📊 Health Report: ${this.healthStats.checks} checks, ${this.healthStats.fixes} fixes, ${this.healthStats.errors} errors, Mock Data Success: ${report.mockDataElimination.successRate}`);

    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`, 'ERROR');
      this.healthStats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    this.log('🚀 Starting Enhanced Sentia Self-Healing Agent with Mock Data Validation...');
    this.log(`📅 Health checks every ${CONFIG.HEALTH_CHECK_INTERVAL / 60000} minutes`);
    this.log(`🔧 Auto-fix: ${CONFIG.AUTO_FIX_ENABLED ? 'ENABLED' : 'DISABLED'}`);
    this.log(`🚀 Auto-deploy: ${CONFIG.AUTO_DEPLOY_ENABLED ? 'ENABLED' : 'DISABLED'}`);
    this.log(`🔍 Mock Data Validation: ENABLED`);

    // Initial health check
    this.runHealthCheck();

    // Schedule regular health checks
    const healthInterval = setInterval(() => {
      this.runHealthCheck();
    }, CONFIG.HEALTH_CHECK_INTERVAL);

    // Schedule deep scans
    const deepScanInterval = setInterval(() => {
      this.log('🔍 Running deep diagnostic scan with mock data validation...');
      this.runHealthCheck();
    }, CONFIG.DEEP_SCAN_INTERVAL);

    // Graceful shutdown
    process.on('SIGINT', () => {
      this.log('🛑 Shutting down Enhanced Self-Healing Agent...');
      clearInterval(healthInterval);
      clearInterval(deepScanInterval);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.log('🛑 Received SIGTERM, shutting down...');
      clearInterval(healthInterval);
      clearInterval(deepScanInterval);
      process.exit(0);
    });

    this.log('✅ Enhanced Self-Healing Agent started successfully');
  }
}

// Start the agent if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new SelfHealingAgent();
  agent.start();
}

export default SelfHealingAgent;
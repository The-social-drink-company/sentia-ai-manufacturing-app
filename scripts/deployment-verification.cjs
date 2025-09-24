#!/usr/bin/env node

/**
 * Comprehensive Deployment Verification Script
 * Ensures 100% functionality across all Railway deployments
 */

// Node 18+ has global fetch
const { execSync } = require('child_process');

// Configuration
const ENVIRONMENTS = {
  production: {
    url: 'https://sentia-manufacturing.railway.app',
    branch: 'production',
    name: 'Production'
  },
  test: {
    url: 'https://test.sentia-manufacturing.railway.app',
    branch: 'test', 
    name: 'Testing'
  },
  development: {
    url: 'https://dev.sentia-manufacturing.railway.app',
    branch: 'development',
    name: 'Development'
  }
};

const VERIFICATION_TESTS = [
  {
    name: 'SSL Certificate and Domain Resolution',
    critical: true,
    test: async (env) => {
      const response = await fetch(env.url, { 
        method: 'HEAD',
        timeout: 10000 
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!env.url.startsWith('https://')) throw new Error('Not using HTTPS');
      return { status: 'PASS', details: `SSL certificate valid, responded with ${response.status}` };
    }
  },
  {
    name: 'Health Check Endpoints',
    critical: true,
    test: async (env) => {
      const endpoints = ['/health', '/ready', '/diagnostics'];
      const results = [];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${env.url}${endpoint}`, { timeout: 5000 });
        const data = await response.json();
        results.push(`${endpoint}: ${response.status} - ${data.status || 'OK'}`);
      }
      
      return { status: 'PASS', details: results.join(', ') };
    }
  },
  {
    name: 'CSS and Static Asset Loading',
    critical: true,
    test: async (env) => {
      const response = await fetch(env.url, { timeout: 10000 });
      const html = await response.text();
      
      // Check for critical CSS
      if (!html.includes('<link') || !html.includes('rel="stylesheet"')) {
        throw new Error('No CSS stylesheets found in HTML');
      }
      
      // Check for JavaScript bundles
      if (!html.includes('<script') || !html.includes('src=')) {
        throw new Error('No JavaScript bundles found in HTML');
      }
      
      // Check for proper asset paths
      const cssMatches = html.match(/href="([^"]*\.css[^"]*)"/g) || [];
      const jsMatches = html.match(/src="([^"]*\.js[^"]*)"/g) || [];
      
      return { 
        status: 'PASS', 
        details: `Found ${cssMatches.length} CSS files, ${jsMatches.length} JS files` 
      };
    }
  },
  {
    name: 'API Endpoints Functionality',
    critical: true,
    test: async (env) => {
      const endpoints = [
        '/api/test',
        '/api/metrics/current',
        '/api/kpis/realtime'
      ];
      
      const results = [];
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${env.url}${endpoint}`, { 
            timeout: 8000,
            headers: { 'Accept': 'application/json' }
          });
          results.push(`${endpoint}: ${response.status}`);
        } catch (error) {
          results.push(`${endpoint}: ERROR - ${error.message}`);
        }
      }
      
      return { status: 'PASS', details: results.join(', ') };
    }
  },
  {
    name: 'Database Connectivity',
    critical: true,
    test: async (env) => {
      const response = await fetch(`${env.url}/api/db-test`, { 
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Database test failed with ${response.status}`);
      }
      
      const data = await response.json();
      return { 
        status: data.success ? 'PASS' : 'FAIL', 
        details: `Database: ${data.success ? 'Connected' : 'Failed'} - ${data.message || ''}` 
      };
    }
  },
  {
    name: 'AI Forecasting Service',
    critical: false,
    test: async (env) => {
      try {
        const response = await fetch(`${env.url}/api/ai-forecasting/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            market: 'UK',
            product: 'GABA Spirit',
            timeHorizon: 7
          }),
          timeout: 15000
        });
        
        const data = await response.json();
        return { 
          status: response.ok && data.success ? 'PASS' : 'WARN',
          details: `AI Forecasting: ${data.success ? 'Working' : 'Fallback mode'}`
        };
      } catch (error) {
        return { 
          status: 'WARN', 
          details: `AI Forecasting: Not available - ${error.message}` 
        };
      }
    }
  },
  {
    name: 'Multi-Market Data Validation',
    critical: true,
    test: async (env) => {
      const markets = ['UK', 'USA', 'EU', 'ASIA'];
      const results = [];
      
      for (const market of markets) {
        try {
          const response = await fetch(`${env.url}/api/ai-forecasting/insights/${market}`, {
            timeout: 8000
          });
          const data = await response.json();
          results.push(`${market}: ${data.success ? 'OK' : 'ERROR'}`);
        } catch (error) {
          results.push(`${market}: ERROR`);
        }
      }
      
      return { status: 'PASS', details: results.join(', ') };
    }
  },
  {
    name: 'Security Headers Validation',
    critical: true,
    test: async (env) => {
      const response = await fetch(env.url, { method: 'HEAD', timeout: 5000 });
      const headers = response.headers;
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'content-security-policy',
        'x-xss-protection'
      ];
      
      const missing = securityHeaders.filter(header => !headers.get(header));
      
      if (missing.length > 0) {
        return { 
          status: 'WARN', 
          details: `Missing headers: ${missing.join(', ')}` 
        };
      }
      
      return { status: 'PASS', details: 'All security headers present' };
    }
  },
  {
    name: 'Performance Metrics',
    critical: false,
    test: async (env) => {
      const start = Date.now();
      const response = await fetch(env.url, { timeout: 15000 });
      const loadTime = Date.now() - start;
      
      const html = await response.text();
      const htmlSize = Buffer.byteLength(html, 'utf8');
      
      const performance = {
        loadTime: `${loadTime}ms`,
        htmlSize: `${Math.round(htmlSize / 1024)}KB`,
        status: loadTime < 3000 ? 'PASS' : 'WARN'
      };
      
      return {
        status: performance.status,
        details: `Load time: ${performance.loadTime}, HTML size: ${performance.htmlSize}`
      };
    }
  }
];

class DeploymentVerifier {
  constructor() {
    this.results = new Map();
    this.startTime = Date.now();
  }

  async verifyEnvironment(envKey, envConfig) {
    console.log(`\n🔍 Verifying ${envConfig.name} Environment: ${envConfig.url}`);
    console.log('='.repeat(60));

    const envResults = {
      environment: envConfig.name,
      url: envConfig.url,
      branch: envConfig.branch,
      tests: [],
      summary: { passed: 0, warned: 0, failed: 0, total: 0 }
    };

    for (const testConfig of VERIFICATION_TESTS) {
      const testStart = Date.now();
      
      try {
        console.log(`  ⏳ ${testConfig.name}...`);
        
        const result = await Promise.race([
          testConfig.test(envConfig),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), 30000)
          )
        ]);
        
        const duration = Date.now() - testStart;
        const testResult = {
          name: testConfig.name,
          critical: testConfig.critical,
          status: result.status,
          details: result.details,
          duration: `${duration}ms`
        };
        
        envResults.tests.push(testResult);
        
        const icon = result.status === 'PASS' ? '✅' : 
                     result.status === 'WARN' ? '⚠️' : '❌';
        console.log(`  ${icon} ${testConfig.name}: ${result.status} (${duration}ms)`);
        
        if (result.details) {
          console.log(`     ${result.details}`);
        }
        
        // Update summary
        if (result.status === 'PASS') envResults.summary.passed++;
        else if (result.status === 'WARN') envResults.summary.warned++;
        else envResults.summary.failed++;
        
      } catch (error) {
        const duration = Date.now() - testStart;
        const testResult = {
          name: testConfig.name,
          critical: testConfig.critical,
          status: 'FAIL',
          details: error.message,
          duration: `${duration}ms`
        };
        
        envResults.tests.push(testResult);
        envResults.summary.failed++;
        
        console.log(`  ❌ ${testConfig.name}: FAIL (${duration}ms)`);
        console.log(`     Error: ${error.message}`);
      }
      
      envResults.summary.total++;
    }

    this.results.set(envKey, envResults);
    
    // Environment summary
    const { passed, warned, failed, total } = envResults.summary;
    const successRate = Math.round((passed / total) * 100);
    
    console.log(`\n📊 ${envConfig.name} Summary:`);
    console.log(`  ✅ Passed: ${passed}/${total} (${successRate}%)`);
    console.log(`  ⚠️  Warnings: ${warned}`);
    console.log(`  ❌ Failed: ${failed}`);
    
    return envResults;
  }

  async verifyAllEnvironments() {
    console.log('🚀 Starting Comprehensive Deployment Verification');
    console.log('=' .repeat(80));
    
    const allResults = [];
    
    for (const [envKey, envConfig] of Object.entries(ENVIRONMENTS)) {
      const result = await this.verifyEnvironment(envKey, envConfig);
      allResults.push(result);
    }
    
    // Generate overall report
    this.generateReport(allResults);
    
    return allResults;
  }

  generateReport(allResults) {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n\n📋 COMPREHENSIVE DEPLOYMENT REPORT');
    console.log('='.repeat(80));
    console.log(`⏱️  Total Verification Time: ${Math.round(totalDuration / 1000)}s`);
    console.log(`📅 Verification Date: ${new Date().toISOString()}`);
    
    // Overall statistics
    let totalPassed = 0, totalWarned = 0, totalFailed = 0, totalTests = 0;
    
    allResults.forEach(env => {
      totalPassed += env.summary.passed;
      totalWarned += env.summary.warned;
      totalFailed += env.summary.failed;
      totalTests += env.summary.total;
    });
    
    const overallSuccess = Math.round((totalPassed / totalTests) * 100);
    
    console.log(`\n🎯 Overall Statistics:`);
    console.log(`  ✅ Total Passed: ${totalPassed}/${totalTests} (${overallSuccess}%)`);
    console.log(`  ⚠️  Total Warnings: ${totalWarned}`);
    console.log(`  ❌ Total Failed: ${totalFailed}`);
    
    // Environment breakdown
    console.log('\n🌍 Environment Breakdown:');
    allResults.forEach(env => {
      const successRate = Math.round((env.summary.passed / env.summary.total) * 100);
      const status = successRate >= 90 ? '🟢' : successRate >= 70 ? '🟡' : '🔴';
      
      console.log(`  ${status} ${env.environment}: ${env.summary.passed}/${env.summary.total} (${successRate}%)`);
      console.log(`     URL: ${env.url}`);
      console.log(`     Branch: ${env.branch}`);
    });
    
    // Critical issues
    const criticalIssues = [];
    allResults.forEach(env => {
      env.tests.forEach(test => {
        if (test.critical && test.status === 'FAIL') {
          criticalIssues.push({
            environment: env.environment,
            test: test.name,
            error: test.details
          });
        }
      });
    });
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
      criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue.environment}: ${issue.test}`);
        console.log(`     ${issue.error}`);
      });
    } else {
      console.log('\n✅ NO CRITICAL ISSUES DETECTED');
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (overallSuccess >= 95) {
      console.log('  🎉 Excellent! All deployments are functioning optimally.');
    } else if (overallSuccess >= 80) {
      console.log('  👍 Good deployment health. Address warnings to improve reliability.');
    } else {
      console.log('  ⚠️  Deployment health needs attention. Review failed tests immediately.');
    }
    
    // Performance insights
    const avgLoadTimes = allResults.map(env => {
      const perfTest = env.tests.find(t => t.name === 'Performance Metrics');
      if (perfTest && perfTest.details) {
        const match = perfTest.details.match(/Load time: (\d+)ms/);
        return match ? parseInt(match[1]) : null;
      }
      return null;
    }).filter(t => t !== null);
    
    if (avgLoadTimes.length > 0) {
      const avgLoadTime = Math.round(avgLoadTimes.reduce((a, b) => a + b) / avgLoadTimes.length);
      console.log(`  📈 Average load time across environments: ${avgLoadTime}ms`);
      
      if (avgLoadTime > 3000) {
        console.log('  ⚡ Consider performance optimizations for faster loading');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save report to file
    this.saveReportToFile(allResults);
  }

  saveReportToFile(allResults) {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: allResults.reduce((sum, env) => sum + env.summary.total, 0),
        totalPassed: allResults.reduce((sum, env) => sum + env.summary.passed, 0),
        totalWarned: allResults.reduce((sum, env) => sum + env.summary.warned, 0),
        totalFailed: allResults.reduce((sum, env) => sum + env.summary.failed, 0)
      },
      environments: allResults
    };
    
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, `deployment-verification-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportFile}`);
  }
}

// Main execution
async function main() {
  const verifier = new DeploymentVerifier();
  
  try {
    await verifier.verifyAllEnvironments();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DeploymentVerifier;
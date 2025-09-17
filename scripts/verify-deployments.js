#!/usr/bin/env node

/**
 * Railway Deployment Verification Script
 * Verifies that all three Railway deployments are working correctly
 */

// Node 18+ has global fetch

const environments = {
  development: 'https://dev.sentia-manufacturing.railway.app',
  testing: 'https://test.sentia-manufacturing.railway.app',
  production: 'https://sentia-manufacturing.railway.app'
};

class DeploymentVerifier {
  async checkHealth(envName, baseUrl) {
    console.log(`🔍 Checking ${envName.toUpperCase()} environment...`);
    console.log(`   URL: ${baseUrl}`);
    
    const checks = [
      { name: 'Health Endpoint', url: `${baseUrl}/health` },
      { name: 'API Status', url: `${baseUrl}/api/status` },
      { name: 'Frontend', url: `${baseUrl}/` }
    ];
    
    const results = {};
    
    for (const check of checks) {
      try {
        const response = await fetch(check.url, { 
          method: 'GET',
          timeout: 10000,
          headers: {
            'User-Agent': 'Railway-Deployment-Verifier/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.json().catch(() => null);
          console.log(`  ✅ ${check.name}: ${response.status} ${response.statusText}`);
          if (data) {
            console.log(`     Response: ${JSON.stringify(data).substring(0, 100)}...`);
          }
          results[check.name] = { status: 'success', code: response.status };
        } else {
          console.log(`  ❌ ${check.name}: ${response.status} ${response.statusText}`);
          results[check.name] = { status: 'failed', code: response.status };
        }
      } catch (error) {
        console.log(`  ❌ ${check.name}: ${error.message}`);
        results[check.name] = { status: 'error', error: error.message };
      }
    }
    
    const successCount = Object.values(results).filter(r => r.status === 'success').length;
    const totalCount = Object.keys(results).length;
    
    console.log(`  📊 ${successCount}/${totalCount} checks passed\n`);
    
    return {
      environment: envName,
      url: baseUrl,
      results,
      successRate: successCount / totalCount,
      allPassed: successCount === totalCount
    };
  }

  async verifyAllDeployments() {
    console.log('🚀 Verifying all Railway deployments...\n');
    
    const results = {};
    
    for (const [envName, baseUrl] of Object.entries(environments)) {
      try {
        const result = await this.checkHealth(envName, baseUrl);
        results[envName] = result;
      } catch (error) {
        console.error(`❌ Failed to check ${envName}:`, error.message);
        results[envName] = {
          environment: envName,
          url: baseUrl,
          error: error.message,
          successRate: 0,
          allPassed: false
        };
      }
    }
    
    // Print summary
    console.log('📊 Deployment Verification Summary:');
    console.log('===================================');
    
    let totalSuccess = 0;
    let totalEnvironments = Object.keys(results).length;
    
    for (const [envName, result] of Object.entries(results)) {
      const emoji = result.allPassed ? '✅' : '❌';
      const successRate = Math.round(result.successRate * 100);
      console.log(`${emoji} ${envName.toUpperCase()}: ${successRate}% (${result.url})`);
      
      if (result.allPassed) {
        totalSuccess++;
      } else if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        const failedChecks = Object.entries(result.results)
          .filter(([_, check]) => check.status !== 'success')
          .map(([name, _]) => name);
        console.log(`   Failed: ${failedChecks.join(', ')}`);
      }
    }
    
    console.log(`\n🎯 Overall Success: ${totalSuccess}/${totalEnvironments} environments`);
    
    if (totalSuccess === totalEnvironments) {
      console.log('🎉 All deployments are working correctly!');
      return true;
    } else {
      console.log('⚠️  Some deployments need attention');
      return false;
    }
  }

  async checkSpecificEnvironment(envName) {
    const baseUrl = environments[envName];
    if (!baseUrl) {
      console.error(`Unknown environment: ${envName}`);
      console.log('Available environments:', Object.keys(environments).join(', '));
      return false;
    }
    
    const result = await this.checkHealth(envName, baseUrl);
    return result.allPassed;
  }
}

// CLI interface
const args = process.argv.slice(2);
const verifier = new DeploymentVerifier();

if (args.length === 0) {
  // Verify all environments
  verifier.verifyAllDeployments().catch(console.error);
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
Railway Deployment Verification Script

Usage:
  node scripts/verify-deployments.js                    # Verify all environments
  node scripts/verify-deployments.js development       # Verify development only
  node scripts/verify-deployments.js testing           # Verify testing only
  node scripts/verify-deployments.js production        # Verify production only

This script will check:
  - Health endpoint (/health)
  - API status endpoint (/api/status)
  - Frontend loading (/)

Environments:
  development  - https://dev.sentia-manufacturing.railway.app
  testing      - https://test.sentia-manufacturing.railway.app
  production   - https://sentia-manufacturing.railway.app
  `);
} else {
  // Verify specific environment
  const envName = args[0];
  verifier.checkSpecificEnvironment(envName).catch(console.error);
}

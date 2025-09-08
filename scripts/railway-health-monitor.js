#!/usr/bin/env node

/**
 * Railway Health Monitor and Auto-Recovery System
 * Monitors all Railway environments and triggers recovery actions for 502 errors
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';

const RAILWAY_ENVIRONMENTS = {
  development: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
  testing: 'https://sentia-manufacturing-dashboard-testing.up.railway.app', 
  production: 'https://web-production-1f10.up.railway.app'
};

const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds

class RailwayHealthMonitor {
  constructor() {
    this.results = {};
    this.errors = [];
  }

  async checkEnvironmentHealth(name, url) {
    console.log(`🔍 Checking ${name} environment: ${url}`);
    
    try {
      const healthUrl = `${url}/api/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: HEALTH_CHECK_TIMEOUT,
        headers: {
          'User-Agent': 'Railway-Health-Monitor/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${name}: HEALTHY - Version ${data.version}, Uptime: ${data.uptime}s`);
        this.results[name] = {
          status: 'healthy',
          statusCode: response.status,
          data: data,
          timestamp: new Date().toISOString()
        };
        return true;
      } else {
        console.log(`❌ ${name}: HTTP ${response.status} - ${response.statusText}`);
        this.results[name] = {
          status: 'unhealthy',
          statusCode: response.status,
          error: response.statusText,
          timestamp: new Date().toISOString()
        };
        return false;
      }
    } catch (error) {
      console.log(`❌ ${name}: CONNECTION FAILED - ${error.message}`);
      this.results[name] = {
        status: 'connection_failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      this.errors.push({ environment: name, error: error.message });
      return false;
    }
  }

  async triggerRecovery(environment) {
    console.log(`🔄 Triggering recovery for ${environment} environment...`);
    
    try {
      // Create a deployment trigger file
      const triggerContent = `# Railway Deployment Recovery Trigger
# Environment: ${environment}
# Timestamp: ${new Date().toISOString()}
# Reason: Health check failed - triggering fresh deployment
`;
      
      const fs = await import('fs');
      fs.writeFileSync(`.railway-recovery-${environment}`, triggerContent);
      
      // Stage and commit the trigger
      execSync(`git add .railway-recovery-${environment}`, { stdio: 'inherit' });
      execSync(`git commit -m "RECOVERY: Auto-trigger deployment for ${environment} environment

- Health check detected ${environment} environment failure
- Triggering fresh Railway deployment with latest fixes
- Automated recovery system activated

🤖 Generated with Railway Health Monitor"`, { stdio: 'inherit' });

      // Push to trigger Railway deployment
      if (environment === 'development') {
        execSync('git push origin development', { stdio: 'inherit' });
      } else if (environment === 'testing') {
        execSync('git push origin development:test', { stdio: 'inherit' });
      }
      
      console.log(`✅ Recovery triggered for ${environment} - deployment in progress`);
      return true;
      
    } catch (error) {
      console.log(`❌ Recovery failed for ${environment}: ${error.message}`);
      return false;
    }
  }

  async monitorAllEnvironments() {
    console.log('🚀 Starting Railway Health Monitor...\n');
    
    const healthChecks = [];
    for (const [name, url] of Object.entries(RAILWAY_ENVIRONMENTS)) {
      healthChecks.push(this.checkEnvironmentHealth(name, url));
    }
    
    const results = await Promise.all(healthChecks);
    
    console.log('\n📊 Health Check Summary:');
    console.log('=' .repeat(50));
    
    let healthyCount = 0;
    let failedEnvironments = [];
    
    for (const [name, result] of Object.entries(this.results)) {
      if (result.status === 'healthy') {
        console.log(`✅ ${name.toUpperCase()}: OPERATIONAL`);
        healthyCount++;
      } else {
        console.log(`❌ ${name.toUpperCase()}: ${result.status.toUpperCase()}`);
        failedEnvironments.push(name);
      }
    }
    
    console.log(`\n📈 Overall Status: ${healthyCount}/3 environments healthy`);
    
    // Trigger recovery for failed environments
    if (failedEnvironments.length > 0) {
      console.log('\n🔄 Initiating recovery procedures...');
      for (const env of failedEnvironments) {
        if (env === 'development') {
          await this.triggerRecovery(env);
        }
      }
    }
    
    return {
      healthy: healthyCount,
      total: Object.keys(RAILWAY_ENVIRONMENTS).length,
      failed: failedEnvironments,
      results: this.results
    };
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results,
      errors: this.errors,
      recommendations: []
    };

    // Add recommendations based on results
    if (this.errors.length > 0) {
      report.recommendations.push('Review Railway deployment logs for failed environments');
      report.recommendations.push('Check Dockerfile configuration and build process');
      report.recommendations.push('Verify environment variables are properly set');
    }

    return report;
  }
}

// Run health monitor if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new RailwayHealthMonitor();
  
  monitor.monitorAllEnvironments()
    .then((summary) => {
      console.log('\n📋 Final Report:');
      console.log(JSON.stringify(monitor.generateReport(), null, 2));
      
      if (summary.failed.length === 0) {
        console.log('\n🎉 All Railway environments are healthy!');
        process.exit(0);
      } else {
        console.log(`\n⚠️  ${summary.failed.length} environment(s) need attention`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Health monitor failed:', error);
      process.exit(1);
    });
}

export default RailwayHealthMonitor;
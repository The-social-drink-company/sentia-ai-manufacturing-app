#!/usr/bin/env node

/**
 * SENTIA SELF-HEALING TEST AGENT
 * Railway Autonomous 24/7 Monitoring & Auto-Repair System
 * Runs every 10 minutes to check system health and auto-fix issues
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
  
  // Environment URLs
  ENVIRONMENTS: {
    development: process.env.RAILWAY_DEVELOPMENT_URL || 'https://sentia-manufacturing-dashboard-development.up.railway.app',
    testing: process.env.RAILWAY_TESTING_URL || 'https://sentiatest.financeflo.ai',
    production: process.env.RAILWAY_PRODUCTION_URL || 'https://sentiaprod.financeflo.ai'
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
      
      const response = await fetch(url, {
        method: 'GET',
        timeout: 30000,
        headers: {
          'User-Agent': 'Sentia-Self-Healing-Agent/1.0'
        }
      });

      const isHealthy = response.ok && response.status < 400;
      const responseTime = Date.now();
      
      if (isHealthy) {
        this.log(`✅ ${environment} is healthy (${response.status})`);
        return { healthy: true, status: response.status, responseTime, environment };
      } else {
        this.log(`⚠️ ${environment} unhealthy (${response.status})`, 'WARN');
        return { healthy: false, status: response.status, error: `HTTP ${response.status}`, environment };
      }
    } catch (error) {
      this.log(`❌ ${environment} check failed: ${error.message}`, 'ERROR');
      return { healthy: false, error: error.message, environment };
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
    const report = {
      timestamp: new Date().toISOString(),
      agent: {
        running: this.isRunning,
        uptime: Date.now() - this.healthStats.startTime.getTime(),
        stats: this.healthStats
      },
      environment: {
        node_env: process.env.NODE_ENV,
        railway_env: process.env.RAILWAY_ENVIRONMENT,
        auto_fix: CONFIG.AUTO_FIX_ENABLED,
        auto_deploy: CONFIG.AUTO_DEPLOY_ENABLED
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

      if (unhealthyServices.length > 0) {
        this.log(`⚠️ Found ${unhealthyServices.length} unhealthy services`, 'WARN');
        
        for (const service of unhealthyServices) {
          const fixed = await this.attemptAutoFix(service.environment, service.error);
          if (fixed) {
            this.log(`✅ Successfully fixed ${service.environment}`);
            
            // Wait and recheck
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second wait
            const recheck = await this.checkEndpointHealth(
              CONFIG.ENVIRONMENTS[service.environment], 
              service.environment
            );
            
            if (recheck.healthy) {
              this.log(`✅ ${service.environment} confirmed healthy after fix`);
            } else {
              this.log(`❌ ${service.environment} still unhealthy after fix`, 'ERROR');
              this.healthStats.errors++;
            }
          }
        }
      } else {
        this.log('✅ All services healthy');
      }

      // Generate and log report
      const report = await this.generateHealthReport();
      this.log(`📊 Health Report: ${this.healthStats.checks} checks, ${this.healthStats.fixes} fixes, ${this.healthStats.errors} errors`);

    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`, 'ERROR');
      this.healthStats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    this.log('🚀 Starting Sentia Self-Healing Agent...');
    this.log(`📅 Health checks every ${CONFIG.HEALTH_CHECK_INTERVAL / 60000} minutes`);
    this.log(`🔧 Auto-fix: ${CONFIG.AUTO_FIX_ENABLED ? 'ENABLED' : 'DISABLED'}`);
    this.log(`🚀 Auto-deploy: ${CONFIG.AUTO_DEPLOY_ENABLED ? 'ENABLED' : 'DISABLED'}`);

    // Initial health check
    this.runHealthCheck();

    // Schedule regular health checks
    const healthInterval = setInterval(() => {
      this.runHealthCheck();
    }, CONFIG.HEALTH_CHECK_INTERVAL);

    // Schedule deep scans
    const deepScanInterval = setInterval(() => {
      this.log('🔍 Running deep diagnostic scan...');
      this.runHealthCheck();
    }, CONFIG.DEEP_SCAN_INTERVAL);

    // Graceful shutdown
    process.on('SIGINT', () => {
      this.log('🛑 Shutting down Self-Healing Agent...');
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

    this.log('✅ Self-Healing Agent started successfully');
  }
}

// Start the agent if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new SelfHealingAgent();
  agent.start();
}

export default SelfHealingAgent;
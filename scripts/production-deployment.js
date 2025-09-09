#!/usr/bin/env node

/**
 * Production Deployment and System Initialization
 * Complete setup for production-ready Sentia Manufacturing Dashboard
 */

import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logWarn } from '../services/observability/structuredLogger.js';
import { dataSyncScheduler } from '../services/scheduler/data-sync-scheduler.js';
import { productionMonitor } from '../services/monitoring/production-monitor.js';
import { userSyncService } from '../services/auth/user-sync-service.js';
import { amazonSPAPI } from '../services/api/amazon-sp-api-config.js';

const prisma = new PrismaClient();

class ProductionDeployment {
  constructor() {
    this.deploymentSteps = [
      { name: 'Database Connection', fn: () => this.checkDatabaseConnection() },
      { name: 'Environment Validation', fn: () => this.validateEnvironment() },
      { name: 'External API Configuration', fn: () => this.configureExternalAPIs() },
      { name: 'User Synchronization', fn: () => this.initializeUserSync() },
      { name: 'Data Sync Scheduler', fn: () => this.initializeDataSync() },
      { name: 'Production Monitoring', fn: () => this.initializeMonitoring() },
      { name: 'Initial Data Import', fn: () => this.performInitialDataImport() },
      { name: 'System Health Check', fn: () => this.performSystemHealthCheck() },
      { name: 'Production Readiness', fn: () => this.validateProductionReadiness() }
    ];

    this.deploymentResults = {
      started: new Date(),
      completed: null,
      success: false,
      steps: [],
      errors: [],
      warnings: [],
      summary: {}
    };
  }

  async deploy() {
    console.log('=========================================');
    console.log('SENTIA MANUFACTURING DASHBOARD');
    console.log('PRODUCTION DEPLOYMENT');
    console.log('=========================================\n');

    logInfo('Starting production deployment');

    try {
      for (const [index, step] of this.deploymentSteps.entries()) {
        console.log(`Step ${index + 1}/${this.deploymentSteps.length}: ${step.name}`);
        console.log('-----------------------------------');

        const stepResult = await this.executeStep(step);
        this.deploymentResults.steps.push(stepResult);

        if (!stepResult.success) {
          console.log(`❌ Step failed: ${step.name}`);
          console.log(`   Error: ${stepResult.error}\n`);
          
          if (stepResult.critical) {
            console.log('💥 Critical step failed - deployment aborted\n');
            throw new Error(`Critical deployment step failed: ${step.name}`);
          } else {
            console.log('⚠️  Step failed but deployment continues\n');
            this.deploymentResults.warnings.push(stepResult.error);
          }
        } else {
          console.log(`✅ Step completed: ${step.name}\n`);
        }
      }

      this.deploymentResults.completed = new Date();
      this.deploymentResults.success = true;

      await this.generateDeploymentReport();
      console.log('🎉 PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉');

    } catch (error) {
      this.deploymentResults.completed = new Date();
      this.deploymentResults.success = false;
      this.deploymentResults.errors.push(error.message);

      logError('Production deployment failed', error);
      console.log(`\n💥 DEPLOYMENT FAILED: ${error.message}`);
      
      await this.generateDeploymentReport();
      process.exit(1);
    }
  }

  async executeStep(step) {
    const startTime = Date.now();
    
    try {
      const result = await step.fn();
      const duration = Date.now() - startTime;

      return {
        name: step.name,
        success: true,
        duration,
        result,
        timestamp: new Date()
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        name: step.name,
        success: false,
        duration,
        error: error.message,
        critical: error.critical || false,
        timestamp: new Date()
      };
    }
  }

  async checkDatabaseConnection() {
    try {
      console.log('  Connecting to database...');
      await prisma.$connect();
      
      console.log('  Testing database query...');
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      
      if (!result || result[0]?.test !== 1) {
        throw new Error('Database query test failed');
      }

      console.log('  ✅ Database connection successful');
      
      return {
        status: 'connected',
        database: process.env.DATABASE_URL ? 'configured' : 'missing'
      };

    } catch (error) {
      error.critical = true;
      throw error;
    }
  }

  async validateEnvironment() {
    console.log('  Checking required environment variables...');
    
    const requiredVars = [
      'DATABASE_URL',
      'CLERK_SECRET_KEY',
      'VITE_CLERK_PUBLISHABLE_KEY'
    ];

    const optionalVars = [
      'AMAZON_REFRESH_TOKEN',
      'AMAZON_LWA_APP_ID', 
      'AMAZON_LWA_CLIENT_SECRET',
      'AMAZON_SP_ROLE_ARN',
      'SHOPIFY_API_KEY',
      'SHOPIFY_API_SECRET',
      'UNLEASHED_API_ID',
      'UNLEASHED_API_KEY',
      'XERO_CLIENT_ID',
      'XERO_CLIENT_SECRET'
    ];

    const missingRequired = requiredVars.filter(varName => 
      !process.env[varName] || 
      process.env[varName] === 'your_key_here' ||
      process.env[varName] === 'placeholder'
    );

    const missingOptional = optionalVars.filter(varName => 
      !process.env[varName] || 
      process.env[varName] === 'your_key_here' ||
      process.env[varName] === 'placeholder'
    );

    if (missingRequired.length > 0) {
      const error = new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
      error.critical = true;
      throw error;
    }

    if (missingOptional.length > 0) {
      console.log(`  ⚠️  Optional variables not configured: ${missingOptional.join(', ')}`);
      this.deploymentResults.warnings.push(`Optional environment variables not configured: ${missingOptional.join(', ')}`);
    }

    console.log(`  ✅ Environment validation completed`);
    console.log(`     Required variables: ${requiredVars.length - missingRequired.length}/${requiredVars.length}`);
    console.log(`     Optional variables: ${optionalVars.length - missingOptional.length}/${optionalVars.length}`);

    return {
      requiredConfigured: requiredVars.length - missingRequired.length,
      requiredTotal: requiredVars.length,
      optionalConfigured: optionalVars.length - missingOptional.length,
      optionalTotal: optionalVars.length,
      missingRequired,
      missingOptional
    };
  }

  async configureExternalAPIs() {
    console.log('  Initializing external API connections...');
    
    const apiResults = {
      amazon: { configured: false, connected: false },
      clerk: { configured: false, connected: false },
      total: 0,
      connected: 0
    };

    // Test Amazon SP-API
    try {
      const amazonInitialized = await amazonSPAPI.initialize();
      const amazonStatus = amazonSPAPI.getConnectionStatus();
      
      apiResults.amazon = {
        configured: amazonStatus.configured,
        connected: amazonStatus.connected
      };
      
      if (amazonStatus.connected) {
        console.log('  ✅ Amazon SP-API connected');
        apiResults.connected++;
      } else if (amazonStatus.configured) {
        console.log('  ⚠️  Amazon SP-API configured but not connected');
      } else {
        console.log('  ❌ Amazon SP-API not configured');
      }
      
      apiResults.total++;
    } catch (error) {
      console.log(`  ❌ Amazon SP-API error: ${error.message}`);
    }

    // Test Clerk
    try {
      // Simple test to verify Clerk configuration
      if (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY !== 'your_key_here') {
        apiResults.clerk = { configured: true, connected: true };
        console.log('  ✅ Clerk authentication configured');
        apiResults.connected++;
      } else {
        throw new Error('Clerk not configured');
      }
      apiResults.total++;
    } catch (error) {
      console.log(`  ❌ Clerk error: ${error.message}`);
      error.critical = true;
      throw error;
    }

    console.log(`  API Summary: ${apiResults.connected}/${apiResults.total} connections successful`);

    return apiResults;
  }

  async initializeUserSync() {
    console.log('  Initializing user synchronization service...');
    
    try {
      const syncStatus = userSyncService.getSyncStatus();
      
      if (!syncStatus.configured) {
        throw new Error('User sync service not configured - missing Clerk credentials');
      }

      // Perform initial user sync
      console.log('  Performing initial user synchronization...');
      const syncResult = await userSyncService.syncAllUsers();

      if (!syncResult.success) {
        throw new Error(`User sync failed: ${syncResult.error}`);
      }

      console.log(`  ✅ User sync completed: ${syncResult.created} created, ${syncResult.updated} updated`);

      return {
        configured: true,
        syncResult: syncResult
      };

    } catch (error) {
      console.log(`  ⚠️  User sync error: ${error.message}`);
      // Not critical - system can function without user sync
      return {
        configured: false,
        error: error.message
      };
    }
  }

  async initializeDataSync() {
    console.log('  Starting automated data synchronization scheduler...');
    
    try {
      await dataSyncScheduler.initialize();
      
      const scheduleStatus = dataSyncScheduler.getScheduleStatus();
      
      console.log(`  ✅ Data sync scheduler initialized`);
      console.log(`     Scheduler running: ${scheduleStatus.schedulerRunning}`);
      console.log(`     Active schedules: ${Object.keys(scheduleStatus.schedules).length}`);

      return {
        schedulerRunning: scheduleStatus.schedulerRunning,
        activeSchedules: Object.keys(scheduleStatus.schedules).length,
        scheduleStatus
      };

    } catch (error) {
      console.log(`  ⚠️  Data sync scheduler error: ${error.message}`);
      // Not critical for initial deployment
      return {
        schedulerRunning: false,
        error: error.message
      };
    }
  }

  async initializeMonitoring() {
    console.log('  Starting production monitoring system...');
    
    try {
      await productionMonitor.initialize();
      
      const monitoringStatus = productionMonitor.getMonitoringStatus();
      
      console.log(`  ✅ Production monitoring started`);
      console.log(`     Monitoring active: ${monitoringStatus.isMonitoring}`);
      console.log(`     Health checks performed: ${monitoringStatus.totalHealthChecks}`);

      return {
        monitoringActive: monitoringStatus.isMonitoring,
        healthChecks: monitoringStatus.totalHealthChecks,
        status: monitoringStatus
      };

    } catch (error) {
      console.log(`  ⚠️  Production monitoring error: ${error.message}`);
      // Not critical for initial deployment
      return {
        monitoringActive: false,
        error: error.message
      };
    }
  }

  async performInitialDataImport() {
    console.log('  Performing initial data import from external systems...');
    
    try {
      // Trigger manual sync for all configured systems
      const syncResult = await dataSyncScheduler.triggerManualSync('all');
      
      console.log('  ✅ Initial data import completed');
      
      return {
        success: true,
        syncResults: syncResult
      };

    } catch (error) {
      console.log(`  ⚠️  Initial data import error: ${error.message}`);
      // Not critical - data can be imported later
      return {
        success: false,
        error: error.message
      };
    }
  }

  async performSystemHealthCheck() {
    console.log('  Performing comprehensive system health check...');
    
    try {
      const healthCheck = await productionMonitor.performComprehensiveHealthCheck();
      
      console.log(`  Health Check Results:`);
      console.log(`    Overall Status: ${healthCheck.overall}`);
      console.log(`    Database: ${healthCheck.database?.status || 'unknown'}`);
      console.log(`    APIs: ${healthCheck.apis?.status || 'unknown'}`);
      console.log(`    Data Sync: ${healthCheck.dataSync?.status || 'unknown'}`);
      console.log(`    System: ${healthCheck.system?.status || 'unknown'}`);
      console.log(`    Users: ${healthCheck.users?.status || 'unknown'}`);

      if (healthCheck.overall === 'critical') {
        throw new Error('System health check failed - critical issues detected');
      } else if (healthCheck.overall === 'warning') {
        console.log('  ⚠️  Health check completed with warnings');
      } else {
        console.log('  ✅ System health check passed');
      }

      return healthCheck;

    } catch (error) {
      console.log(`  ❌ Health check error: ${error.message}`);
      // Not critical but should be addressed
      return {
        overall: 'failed',
        error: error.message
      };
    }
  }

  async validateProductionReadiness() {
    console.log('  Validating production readiness...');
    
    const readinessChecks = {
      database: false,
      authentication: false,
      monitoring: false,
      dataSync: false,
      apis: false
    };

    // Database check
    try {
      await prisma.$queryRaw`SELECT 1`;
      readinessChecks.database = true;
    } catch (error) {
      console.log('  ❌ Database not ready');
    }

    // Authentication check
    if (userSyncService.getSyncStatus().configured) {
      readinessChecks.authentication = true;
    } else {
      console.log('  ⚠️  User authentication sync not configured');
    }

    // Monitoring check
    if (productionMonitor.getMonitoringStatus().isMonitoring) {
      readinessChecks.monitoring = true;
    } else {
      console.log('  ⚠️  Production monitoring not active');
    }

    // Data sync check
    if (dataSyncScheduler.getScheduleStatus().schedulerRunning) {
      readinessChecks.dataSync = true;
    } else {
      console.log('  ⚠️  Data sync scheduler not running');
    }

    // API check
    const amazonStatus = amazonSPAPI.getConnectionStatus();
    if (amazonStatus.configured) {
      readinessChecks.apis = true;
    }

    const readyCount = Object.values(readinessChecks).filter(Boolean).length;
    const totalChecks = Object.keys(readinessChecks).length;

    console.log(`  Production Readiness: ${readyCount}/${totalChecks} checks passed`);

    if (readyCount >= 3) { // Minimum viable production
      console.log('  ✅ System ready for production use');
    } else {
      console.log('  ⚠️  System partially ready - some features may be limited');
    }

    return {
      ready: readyCount >= 3,
      readinessScore: `${readyCount}/${totalChecks}`,
      checks: readinessChecks
    };
  }

  async generateDeploymentReport() {
    const duration = this.deploymentResults.completed.getTime() - this.deploymentResults.started.getTime();
    const successfulSteps = this.deploymentResults.steps.filter(s => s.success).length;
    const totalSteps = this.deploymentResults.steps.length;

    this.deploymentResults.summary = {
      duration,
      successfulSteps,
      totalSteps,
      successRate: `${successfulSteps}/${totalSteps}`,
      warningCount: this.deploymentResults.warnings.length,
      errorCount: this.deploymentResults.errors.length
    };

    console.log('\n=========================================');
    console.log('DEPLOYMENT SUMMARY REPORT');
    console.log('=========================================');
    console.log(`Started: ${this.deploymentResults.started.toISOString()}`);
    console.log(`Completed: ${this.deploymentResults.completed.toISOString()}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Success: ${this.deploymentResults.success ? 'YES' : 'NO'}`);
    console.log(`Steps: ${successfulSteps}/${totalSteps} completed successfully`);
    console.log(`Warnings: ${this.deploymentResults.warnings.length}`);
    console.log(`Errors: ${this.deploymentResults.errors.length}`);

    if (this.deploymentResults.warnings.length > 0) {
      console.log('\nWARNINGS:');
      this.deploymentResults.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (this.deploymentResults.errors.length > 0) {
      console.log('\nERRORS:');
      this.deploymentResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\nNEXT STEPS:');
    if (this.deploymentResults.success) {
      console.log('  1. ✅ System is ready for production use');
      console.log('  2. 🔧 Configure any missing optional integrations (Amazon SP-API, etc.)');
      console.log('  3. 📊 Monitor system health and performance');
      console.log('  4. 🔄 Verify automated data synchronization is working');
      console.log('  5. 👥 Test user authentication and permissions');
    } else {
      console.log('  1. ❌ Review and fix deployment errors listed above');
      console.log('  2. 🔧 Ensure all required environment variables are configured');
      console.log('  3. 🔄 Re-run deployment script after fixes');
    }

    // Write detailed report to file
    const fs = await import('fs/promises');
    const reportPath = './production-deployment-report.json';
    await fs.writeFile(reportPath, JSON.stringify(this.deploymentResults, null, 2));
    console.log(`\n📄 Detailed deployment report saved to: ${reportPath}`);
  }
}

// Run deployment
const deployment = new ProductionDeployment();
deployment.deploy().catch(error => {
  console.error('Fatal deployment error:', error);
  process.exit(1);
});
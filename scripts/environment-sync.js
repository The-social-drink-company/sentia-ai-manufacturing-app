#!/usr/bin/env node

/**
 * Enterprise Environment Synchronization Script
 * Ensures all Railway environments have consistent configuration
 */

import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

class EnvironmentSynchronizer {
  constructor() {
    this.environments = {
      development: {
        name: 'Development',
        railwayService: 'development',
        domain: 'sentia-manufacturing-dashboard-development.up.railway.app',
        nodeEnv: 'development',
        features: {
          debugging: true,
          hotReload: true,
          sourceMaps: true,
          errorReporting: 'verbose'
        }
      },
      testing: {
        name: 'Testing/UAT',
        railwayService: 'test',
        domain: 'sentia-manufacturing-dashboard-testing.up.railway.app',
        nodeEnv: 'test',
        features: {
          debugging: false,
          hotReload: false,
          sourceMaps: true,
          errorReporting: 'normal'
        }
      },
      production: {
        name: 'Production',
        railwayService: 'production',
        domain: 'web-production-1f10.up.railway.app',
        nodeEnv: 'production',
        features: {
          debugging: false,
          hotReload: false,
          sourceMaps: false,
          errorReporting: 'minimal'
        }
      }
    };

    this.sharedConfig = {
      // Clerk Authentication
      clerkPublishableKey: 'pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk',
      clerkSecretKey: 'sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq',
      
      // Database URLs (environment-specific) - Render PostgreSQL
      databases: {
        development: 'postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a/sentia_manufacturing_dev',
        testing: 'postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a/sentia_manufacturing_test',
        production: 'postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod'
      },
      
      // API Configuration
      apiConfig: {
        port: 5002,
        corsOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        rateLimiting: true,
        compression: true
      },
      
      // External Services
      externalServices: {
        openaiApiKey: 'sk-proj-wFWxY-r7gKdvIl-vQ2bAjQ8wd8jOqYHPNxKZ2KgRYJh5LXsMpS5V-H7LfVY3BlbkFJKx8K8L7v4DlGfJN3yKz9M',
        mcpServerPort: 6003,
        mcpServerHost: 'localhost',
        redisUrl: 'redis://localhost:6379'
      }
    };
  }

  async syncEnvironmentVariables() {
    const syncrequired = [];
    
    for (const [envName, envConfig] of Object.entries(this.environments)) {
      console.log(`\n🔄 Synchronizing ${envConfig.name} Environment`);
      
      const envVars = this.generateEnvironmentVariables(envName, envConfig);
      const configFile = await this.createEnvironmentConfig(envName, envVars);
      
      syncrequired.push({
        environment: envName,
        config: envConfig,
        variables: envVars,
        configFile
      });
      
      console.log(`✅ ${envConfig.name} configuration generated`);
    }
    
    return syncrequired;
  }

  generateEnvironmentVariables(envName, envConfig) {
    const baseUrl = `https://${envConfig.domain}`;
    
    return {
      // Environment identification
      NODE_ENV: envConfig.nodeEnv,
      RAILWAY_ENVIRONMENT: envName,
      VITE_ENVIRONMENT: envName,
      
      // Application configuration
      VITE_APP_TITLE: 'Sentia Manufacturing Dashboard',
      VITE_APP_VERSION: '2.0.0',
      VITE_API_BASE_URL: `${baseUrl}/api`,
      
      // Authentication
      VITE_CLERK_PUBLISHABLE_KEY: this.sharedConfig.clerkPublishableKey,
      CLERK_SECRET_KEY: this.sharedConfig.clerkSecretKey,
      VITE_USE_AUTH_BYPASS: 'false',
      
      // Database
      DATABASE_URL: this.sharedConfig.databases[envName] || this.sharedConfig.databases.production,
      
      // Server configuration
      PORT: this.sharedConfig.apiConfig.port,
      CORS_ORIGINS: [baseUrl, ...this.sharedConfig.apiConfig.corsOrigins].join(','),
      
      // External services
      OPENAI_API_KEY: this.sharedConfig.externalServices.openaiApiKey,
      MCP_SERVER_PORT: this.sharedConfig.externalServices.mcpServerPort,
      MCP_SERVER_HOST: this.sharedConfig.externalServices.mcpServerHost,
      REDIS_URL: this.sharedConfig.externalServices.redisUrl,
      
      // Feature flags
      VITE_ENABLE_DEBUG: envConfig.features.debugging.toString(),
      VITE_ENABLE_HOT_RELOAD: envConfig.features.hotReload.toString(),
      VITE_ENABLE_SOURCE_MAPS: envConfig.features.sourceMaps.toString(),
      VITE_ERROR_REPORTING_LEVEL: envConfig.features.errorReporting,
      
      // Security
      VITE_ENABLE_CSP: (envName === 'production').toString(),
      VITE_ENABLE_HTTPS_ONLY: (envName === 'production').toString(),
      
      // Performance
      VITE_ENABLE_COMPRESSION: 'true',
      VITE_ENABLE_CACHING: (envName !== 'development').toString()
    };
  }

  async createEnvironmentConfig(envName, variables) {
    const configDir = path.join(process.cwd(), 'config', 'environments');
    await fs.mkdir(configDir, { recursive: true });
    
    const configFile = path.join(configDir, `${envName}.env`);
    
    let envContent = `# Sentia Manufacturing Dashboard - ${envName.toUpperCase()} Environment\n`;
    envContent += `# Generated: ${new Date().toISOString()}\n`;
    envContent += `# Auto-synchronized configuration\n\n`;
    
    for (const [key, value] of Object.entries(variables)) {
      envContent += `${key}=${value}\n`;
    }
    
    await fs.writeFile(configFile, envContent);
    return configFile;
  }

  async generateRailwayConfig() {
    const railwayConfig = {
      build: {
        builder: 'nixpacks',
        buildCommand: 'npm run build',
        watchPatterns: ['src/**/*', 'public/**/*', 'package.json']
      },
      deploy: {
        startCommand: 'node server.js',
        healthcheckPath: '/api/health',
        healthcheckTimeout: 300,
        restartPolicyType: 'on_failure',
        restartPolicyMaxRetries: 3
      },
      environments: {}
    };

    for (const [envName, envConfig] of Object.entries(this.environments)) {
      railwayConfig.environments[envName] = {
        variables: this.generateEnvironmentVariables(envName, envConfig),
        domains: [envConfig.domain],
        serviceSettings: {
          autoscaling: envName === 'production',
          instanceCount: envName === 'production' ? { min: 2, max: 5 } : 1,
          memoryLimit: envName === 'production' ? '1GB' : '512MB',
          cpuLimit: envName === 'production' ? '1000m' : '500m'
        }
      };
    }

    const railwayConfigFile = path.join(process.cwd(), 'railway.json');
    await fs.writeFile(railwayConfigFile, JSON.stringify(railwayConfig, null, 2));
    
    console.log('✅ Railway configuration updated');
    return railwayConfigFile;
  }

  async validateEnvironmentSync() {
    console.log('\n🔍 Validating Environment Synchronization...');
    
    const validation = {
      timestamp: new Date().toISOString(),
      environments: {},
      issues: [],
      recommendations: []
    };

    for (const [envName, envConfig] of Object.entries(this.environments)) {
      const envValidation = await this.validateEnvironment(envName, envConfig);
      validation.environments[envName] = envValidation;
      
      if (envValidation.issues.length > 0) {
        validation.issues.push(...envValidation.issues.map(issue => ({
          environment: envName,
          ...issue
        })));
      }
    }

    // Generate recommendations
    if (validation.issues.length === 0) {
      validation.recommendations.push('All environments are properly synchronized');
    } else {
      validation.recommendations.push('Review and fix environment configuration issues');
      validation.recommendations.push('Run deployment health checks after fixes');
      validation.recommendations.push('Monitor application logs for configuration errors');
    }

    return validation;
  }

  async validateEnvironment(envName, envConfig) {
    const validation = {
      name: envConfig.name,
      domain: envConfig.domain,
      nodeEnv: envConfig.nodeEnv,
      issues: [],
      status: 'PENDING'
    };

    try {
      // Check if domain is accessible
      const domainCheck = await this.checkDomain(`https://${envConfig.domain}`);
      validation.domainStatus = domainCheck;
      
      if (!domainCheck.accessible) {
        validation.issues.push({
          type: 'DOMAIN_INACCESSIBLE',
          severity: 'HIGH',
          message: `Domain ${envConfig.domain} is not accessible`,
          details: domainCheck.error
        });
      }

      // Check configuration file exists
      const configFile = path.join(process.cwd(), 'config', 'environments', `${envName}.env`);
      
      try {
        await fs.access(configFile);
        validation.configFileExists = true;
      } catch {
        validation.configFileExists = false;
        validation.issues.push({
          type: 'CONFIG_FILE_MISSING',
          severity: 'MEDIUM',
          message: `Environment configuration file missing: ${configFile}`
        });
      }

      validation.status = validation.issues.length === 0 ? 'HEALTHY' : 'ISSUES';
      
    } catch (error) {
      validation.issues.push({
        type: 'VALIDATION_ERROR',
        severity: 'HIGH',
        message: 'Failed to validate environment',
        details: error.message
      });
      validation.status = 'ERROR';
    }

    return validation;
  }

  async checkDomain(url) {
    return new Promise(_(resolve) => {
      const request = https.get(url, { timeout: 10000 }, _(res) => {
        resolve({
          accessible: true,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage
        });
        res.resume(); // Consume response
      });

      request.on('error', _(error) => {
        resolve({
          accessible: false,
          error: error.message
        });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({
          accessible: false,
          error: 'Request timeout'
        });
      });
    });
  }

  async displaySyncReport(syncResults, validationResults) {
    console.log('\n📊 ENVIRONMENT SYNCHRONIZATION REPORT');
    console.log('=====================================');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Environments Processed: ${syncResults.length}`);
    console.log(`Total Issues Found: ${validationResults.issues.length}\n`);

    for (const result of syncResults) {
      const validation = validationResults.environments[result.environment];
      const statusIcon = validation.status === 'HEALTHY' ? '✅' : validation.status === 'ISSUES' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${result.config.name.toUpperCase()}`);
      console.log(`   Domain: ${result.config.domain}`);
      console.log(`   Status: ${validation.status}`);
      console.log(`   Config: ${validation.configFileExists ? 'Generated' : 'Missing'}`);
      console.log(`   Domain: ${validation.domainStatus?.accessible ? 'Accessible' : 'Not Accessible'}`);
      
      if (validation.issues.length > 0) {
        console.log('   Issues:');
        for (const issue of validation.issues) {
          console.log(`   - ${issue.severity}: ${issue.message}`);
        }
      }
      console.log();
    }

    console.log('RECOMMENDATIONS:');
    for (const rec of validationResults.recommendations) {
      console.log(`• ${rec}`);
    }
  }

  async run() {
    console.log('🚀 Starting Environment Synchronization...\n');
    
    try {
      // Sync environment variables
      const syncResults = await this.syncEnvironmentVariables();
      
      // Generate Railway configuration
      await this.generateRailwayConfig();
      
      // Validate synchronization
      const validationResults = await this.validateEnvironmentSync();
      
      // Display report
      await this.displaySyncReport(syncResults, validationResults);
      
      console.log('\n✅ Environment synchronization complete!');
      return { syncResults, validationResults };
      
    } catch (error) {
      console.error('\n❌ Environment synchronization failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const synchronizer = new EnvironmentSynchronizer();
  return await synchronizer.run();
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(path.basename(process.argv[1]))) {
  main().catch(console.error);
}

export default EnvironmentSynchronizer;
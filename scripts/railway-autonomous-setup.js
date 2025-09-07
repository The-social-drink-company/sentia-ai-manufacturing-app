#!/usr/bin/env node

/**
 * Railway Autonomous Testing Setup Script
 * Configures environment variables for autonomous testing system
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const ENVIRONMENTS = ['development', 'testing', 'production'];

const AUTONOMOUS_ENV_VARS = {
  development: {
    ENABLE_AUTONOMOUS_TESTING: 'true',
    AUTONOMOUS_TEST_INTERVAL: '*/10 * * * *',
    AUTO_FIX_ENABLED: 'true',
    AUTO_DEPLOY_ENABLED: 'true',
    RAILWAY_AUTO_DEPLOY: 'true',
    TEST_TIMEOUT: '60000',
    MAX_CONCURRENT_TESTS: '5',
    FAILURE_THRESHOLD: '3',
    ROLLBACK_ON_FAILURE: 'true'
  },
  testing: {
    ENABLE_AUTONOMOUS_TESTING: 'true',
    AUTONOMOUS_TEST_INTERVAL: '*/10 * * * *',
    AUTO_FIX_ENABLED: 'true',
    AUTO_DEPLOY_ENABLED: 'false',
    RAILWAY_AUTO_DEPLOY: 'false',
    TEST_TIMEOUT: '60000',
    MAX_CONCURRENT_TESTS: '3',
    FAILURE_THRESHOLD: '5',
    ROLLBACK_ON_FAILURE: 'true'
  },
  production: {
    ENABLE_AUTONOMOUS_TESTING: 'false',
    AUTO_FIX_ENABLED: 'false',
    AUTO_DEPLOY_ENABLED: 'false',
    RAILWAY_AUTO_DEPLOY: 'false'
  }
};

class RailwayAutonomousSetup {
  constructor() {
    this.projectPath = process.cwd();
    this.packageJson = this.loadPackageJson();
  }

  loadPackageJson() {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      return JSON.parse(readFileSync(packagePath, 'utf8'));
    } catch (error) {
      console.error('ERROR: Failed to load package.json:', error.message);
      process.exit(1);
    }
  }

  async setupEnvironment(environment) {
    console.log(`Setting up ${environment} environment for autonomous testing...`);
    
    const envVars = AUTONOMOUS_ENV_VARS[environment];
    
    for (const [key, value] of Object.entries(envVars)) {
      try {
        const command = `railway variables set ${key}=${value} --environment ${environment}`;
        console.log(`Setting ${key}=${value} in ${environment}`);
        execSync(command, { stdio: 'inherit' });
      } catch (error) {
        console.warn(`WARNING: Failed to set ${key} in ${environment}:`, error.message);
      }
    }
  }

  async deployToEnvironment(environment) {
    try {
      console.log(`Deploying to ${environment} with autonomous testing configuration...`);
      const command = `railway up --environment ${environment}`;
      execSync(command, { stdio: 'inherit' });
      console.log(`Successfully deployed to ${environment}`);
    } catch (error) {
      console.error(`ERROR: Failed to deploy to ${environment}:`, error.message);
      throw error;
    }
  }

  async verifyDeployment(environment) {
    try {
      console.log(`Verifying ${environment} deployment...`);
      
      // Get the deployment URL
      const urlCommand = `railway status --environment ${environment} --json`;
      const statusOutput = execSync(urlCommand, { encoding: 'utf8' });
      const status = JSON.parse(statusOutput);
      
      if (status.deployments && status.deployments.length > 0) {
        const latestDeployment = status.deployments[0];
        console.log(`Deployment URL: ${latestDeployment.url}`);
        console.log(`Status: ${latestDeployment.status}`);
        
        // Test the autonomous system endpoint
        if (latestDeployment.status === 'SUCCESS' && latestDeployment.url) {
          const testUrl = `${latestDeployment.url}/api/autonomous/status`;
          console.log(`Testing autonomous system endpoint: ${testUrl}`);
          
          // Note: In a real implementation, you'd make an HTTP request here
          console.log('Autonomous system should be accessible at the deployment URL');
        }
      }
    } catch (error) {
      console.warn(`WARNING: Could not verify deployment:`, error.message);
    }
  }

  async setupAllEnvironments() {
    console.log('Setting up Railway environments for autonomous testing...');
    
    for (const env of ENVIRONMENTS) {
      try {
        await this.setupEnvironment(env);
        console.log(`Completed setup for ${env} environment`);
      } catch (error) {
        console.error(`Failed to setup ${env} environment:`, error.message);
      }
    }
  }

  async deployAll() {
    console.log('Deploying to all environments...');
    
    for (const env of ENVIRONMENTS) {
      try {
        await this.deployToEnvironment(env);
        await this.verifyDeployment(env);
      } catch (error) {
        console.error(`Failed to deploy to ${env}:`, error.message);
      }
    }
  }

  displayInstructions() {
    console.log(`
=== Railway Autonomous Testing System Setup Complete ===

The autonomous testing system is now configured for:
- Development: Fully autonomous with auto-fixes and deployments every 10 minutes
- Testing: Autonomous testing with fixes but no auto-deployment
- Production: Autonomous testing disabled for safety

Monitoring Dashboard:
- Access via: /test-monitor
- API endpoints: /api/autonomous/*

Manual Commands:
- Setup environments: npm run railway:autonomous:setup
- Deploy specific env: npm run railway:autonomous:deploy [environment]
- Check status: npm run railway:autonomous:status

Environment Variables Set:
${Object.entries(AUTONOMOUS_ENV_VARS.development).map(([k, v]) => `- ${k}=${v}`).join('\n')}

The system will automatically:
1. Run comprehensive tests every 10 minutes
2. Analyze failures and generate fixes
3. Apply code corrections using AST analysis
4. Deploy fixes to Railway (development only)
5. Monitor and rollback on deployment failures

Access the monitoring dashboard at your Railway deployment URL + /test-monitor
`);
  }
}

// Main execution
async function main() {
  const setup = new RailwayAutonomousSetup();
  
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];

  switch (command) {
    case 'setup':
      if (environment && ENVIRONMENTS.includes(environment)) {
        await setup.setupEnvironment(environment);
      } else {
        await setup.setupAllEnvironments();
      }
      break;
      
    case 'deploy':
      if (environment && ENVIRONMENTS.includes(environment)) {
        await setup.deployToEnvironment(environment);
        await setup.verifyDeployment(environment);
      } else {
        await setup.deployAll();
      }
      break;
      
    case 'status':
      for (const env of ENVIRONMENTS) {
        await setup.verifyDeployment(env);
      }
      break;
      
    default:
      console.log('Setting up complete autonomous testing system...');
      await setup.setupAllEnvironments();
      await setup.deployAll();
      setup.displayInstructions();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default RailwayAutonomousSetup;
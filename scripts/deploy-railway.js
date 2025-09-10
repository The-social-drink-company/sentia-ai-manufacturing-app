#!/usr/bin/env node

/**
 * Railway Deployment Script
 * Automates deployment to Railway environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Deployment environments
const ENVIRONMENTS = {
  development: {
    branch: 'development',
    url: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
    projectId: 'f97b65ad-c306-410a-9d5d-5f5fdc098620'
  },
  testing: {
    branch: 'test',
    url: 'https://sentiatest.financeflo.ai',
    projectId: '02e0c7f6-9ca1-4355-af52-ee9eec0b3545'
  },
  production: {
    branch: 'production',
    url: 'https://web-production-1f10.up.railway.app',
    projectId: '3e0053fc-ea90-49ec-9708-e09d58cad4a0'
  }
};

// Deployment checklist
const DEPLOYMENT_CHECKLIST = [
  { name: 'Build successful', command: 'npm run build', required: true },
  { name: 'Tests passing', command: 'npm test -- --run', required: false },
  { name: 'Linting clean', command: 'npm run lint', required: false },
  { name: 'Environment variables set', check: checkEnvVars, required: true },
  { name: 'Git status clean', check: checkGitStatus, required: true }
];

// Log with color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Execute command safely
function executeCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Check environment variables
function checkEnvVars() {
  const requiredVars = [
    'CLERK_PUBLISHABLE_KEY',
    'DATABASE_URL',
    'NODE_ENV'
  ];
  
  const envFile = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envFile)) {
    return { success: false, error: '.env file not found' };
  }
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(varName) || envContent.includes(`${varName}=`)
  );
  
  if (missingVars.length > 0) {
    return { success: false, error: `Missing variables: ${missingVars.join(', ')}` };
  }
  
  return { success: true };
}

// Check git status
function checkGitStatus() {
  const result = executeCommand('git status --porcelain', true);
  if (result.success && result.output.trim() !== '') {
    return { success: false, error: 'Uncommitted changes detected' };
  }
  return { success: true };
}

// Run deployment checklist
async function runChecklist() {
  log('\n=== Running Deployment Checklist ===', 'cyan');
  
  for (const item of DEPLOYMENT_CHECKLIST) {
    process.stdout.write(`Checking: ${item.name}... `);
    
    let result;
    if (item.command) {
      result = executeCommand(item.command, true);
    } else if (item.check) {
      result = item.check();
    }
    
    if (result.success) {
      log('PASS', 'green');
    } else {
      log('FAIL', 'red');
      if (item.required) {
        log(`  Error: ${result.error}`, 'red');
        return false;
      }
    }
  }
  
  return true;
}

// Get current branch
function getCurrentBranch() {
  const result = executeCommand('git branch --show-current', true);
  return result.success ? result.output.trim() : null;
}

// Deploy to environment
async function deployToEnvironment(env) {
  const environment = ENVIRONMENTS[env];
  if (!environment) {
    log(`Invalid environment: ${env}`, 'red');
    return false;
  }
  
  log(`\n=== Deploying to ${env.toUpperCase()} ===`, 'magenta');
  log(`Branch: ${environment.branch}`, 'blue');
  log(`URL: ${environment.url}`, 'blue');
  
  // Check current branch
  const currentBranch = getCurrentBranch();
  if (currentBranch !== environment.branch) {
    log(`\nSwitching from ${currentBranch} to ${environment.branch}...`, 'yellow');
    
    // Stash any changes
    executeCommand('git stash', true);
    
    // Checkout target branch
    const checkoutResult = executeCommand(`git checkout ${environment.branch}`, true);
    if (!checkoutResult.success) {
      log(`Failed to checkout ${environment.branch}`, 'red');
      return false;
    }
    
    // Pull latest changes
    log('Pulling latest changes...', 'yellow');
    executeCommand(`git pull origin ${environment.branch}`, true);
  }
  
  // Build application
  log('\nBuilding application...', 'yellow');
  const buildResult = executeCommand('npm run build');
  if (!buildResult.success) {
    log('Build failed!', 'red');
    return false;
  }
  
  // Commit and push
  log('\nPushing to Railway...', 'yellow');
  const pushResult = executeCommand(`git push origin ${environment.branch}`);
  if (!pushResult.success) {
    log('Push failed!', 'red');
    return false;
  }
  
  log(`\nDeployment initiated successfully!`, 'green');
  log(`Monitor deployment at: https://railway.app/project/${environment.projectId}`, 'cyan');
  log(`Application will be available at: ${environment.url}`, 'cyan');
  
  return true;
}

// Interactive deployment menu
async function interactiveDeployment() {
  return new Promise((resolve) => {
    log('\n=== Railway Deployment Tool ===', 'magenta');
    log('\nSelect deployment environment:', 'cyan');
    log('1. Development', 'yellow');
    log('2. Testing (UAT)', 'yellow');
    log('3. Production', 'yellow');
    log('4. Exit', 'yellow');
    
    rl.question('\nEnter your choice (1-4): ', async (answer) => {
      const choice = parseInt(answer);
      
      switch (choice) {
        case 1:
          await handleDeployment('development');
          break;
        case 2:
          await handleDeployment('testing');
          break;
        case 3:
          await handleProductionDeployment();
          break;
        case 4:
          log('Deployment cancelled', 'yellow');
          break;
        default:
          log('Invalid choice', 'red');
      }
      
      rl.close();
      resolve();
    });
  });
}

// Handle standard deployment
async function handleDeployment(env) {
  const checklistPassed = await runChecklist();
  if (!checklistPassed) {
    log('\nDeployment checklist failed. Fix issues and try again.', 'red');
    return;
  }
  
  await deployToEnvironment(env);
}

// Handle production deployment with extra confirmation
async function handleProductionDeployment() {
  log('\n*** PRODUCTION DEPLOYMENT WARNING ***', 'red');
  log('You are about to deploy to PRODUCTION environment.', 'yellow');
  log('This will affect live users!', 'yellow');
  
  return new Promise((resolve) => {
    rl.question('\nType "DEPLOY TO PRODUCTION" to confirm: ', async (answer) => {
      if (answer === 'DEPLOY TO PRODUCTION') {
        const checklistPassed = await runChecklist();
        if (!checklistPassed) {
          log('\nDeployment checklist failed. Fix issues and try again.', 'red');
        } else {
          await deployToEnvironment('production');
        }
      } else {
        log('Production deployment cancelled', 'yellow');
      }
      resolve();
    });
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Interactive mode
    await interactiveDeployment();
  } else {
    // Direct deployment mode
    const env = args[0];
    if (ENVIRONMENTS[env]) {
      if (env === 'production') {
        await handleProductionDeployment();
      } else {
        await handleDeployment(env);
      }
    } else {
      log(`Invalid environment: ${env}`, 'red');
      log('Valid environments: development, testing, production', 'yellow');
    }
    rl.close();
  }
  
  log('\nDeployment script completed', 'green');
  process.exit(0);
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  process.exit(1);
});

// Run main function
main();
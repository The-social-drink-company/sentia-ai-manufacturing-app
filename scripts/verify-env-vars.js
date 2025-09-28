#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Checks if all required Clerk environment variables are properly set
 * Usage: node scripts/verify-env-vars.js [environment]
 */

const REQUIREDVARS = [
  { name: 'VITE_CLERK_PUBLISHABLE_KEY', expectedValue: 'pk_live_REDACTED' },
  { name: 'CLERK_SECRET_KEY', expectedValue: 'sk_live_REDACTED' },
  { name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', expectedValue: 'pk_live_REDACTED' },
  { name: 'VITE_CLERK_SIGN_IN_URL', expectedValue: '/sign-in' },
  { name: 'VITE_CLERK_SIGN_UP_URL', expectedValue: '/sign-up' },
  { name: 'VITE_CLERK_AFTER_SIGN_IN_URL', expectedValue: '/dashboard' },
  { name: 'VITE_CLERK_AFTER_SIGN_UP_URL', expectedValue: '/dashboard' },
  { name: 'CLERK_ENVIRONMENT', expectedValue: 'production' },
  { name: 'VITE_CLERK_DOMAIN', expectedValue: 'clerk.financeflo.ai' }
];

const OPTIONALVARS = [
  'NODE_ENV',
  'DATABASE_URL',
  'MCP_SERVER_URL',
  'PORT',
  'CORS_ORIGINS'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function printHeader() {
  console.log(colors.cyan + '='.repeat(60) + colors.reset);
  console.log(colors.cyan + ' Environment Variable Verification' + colors.reset);
  console.log(colors.cyan + '='.repeat(60) + colors.reset);
  console.log('');
}

function checkRequiredVars() {
  console.log(colors.blue + 'Checking Required Clerk Variables:' + colors.reset);
  console.log('-'.repeat(40));
  
  let allCorrect = true;
  let missingCount = 0;
  let incorrectCount = 0;
  
  REQUIRED_VARS.forEach(({ name, expectedValue }) => {
    const actualValue = process.env[name];
    
    if (!actualValue) {
      console.log(`${colors.red}✗${colors.reset} ${name}: ${colors.red}MISSING${colors.reset}`);
      console.log(`  Expected: ${colors.yellow}${expectedValue}${colors.reset}`);
      missingCount++;
      allCorrect = false;
    } else if (actualValue !== expectedValue) {
      console.log(`${colors.yellow}⚠${colors.reset} ${name}: ${colors.yellow}INCORRECT${colors.reset}`);
      console.log(`  Expected: ${colors.green}${expectedValue}${colors.reset}`);
      console.log(`  Actual:   ${colors.red}${actualValue}${colors.reset}`);
      incorrectCount++;
      allCorrect = false;
    } else {
      console.log(`${colors.green}✓${colors.reset} ${name}: ${colors.green}CORRECT${colors.reset}`);
    }
  });
  
  console.log('');
  return { allCorrect, missingCount, incorrectCount };
}

function checkOptionalVars() {
  console.log(colors.blue + 'Checking Optional Variables:' + colors.reset);
  console.log('-'.repeat(40));
  
  OPTIONAL_VARS.forEach(_(name) => {
    const value = process.env[name];
    
    if (!value) {
      console.log(`${colors.yellow}○${colors.reset} ${name}: ${colors.yellow}Not Set${colors.reset}`);
    } else {
      const displayValue = name.includes('SECRET') || name.includes('KEY') 
        ? value.substring(0, 10) + '...' 
        : value;
      console.log(`${colors.green}✓${colors.reset} ${name}: ${colors.green}${displayValue}${colors.reset}`);
    }
  });
  
  console.log('');
}

function printSummary(results) {
  console.log(colors.cyan + '='.repeat(60) + colors.reset);
  console.log(colors.cyan + ' SUMMARY' + colors.reset);
  console.log(colors.cyan + '='.repeat(60) + colors.reset);
  
  const totalRequired = REQUIRED_VARS.length;
  const correctCount = totalRequired - results.missingCount - results.incorrectCount;
  
  console.log(`Total Required Variables: ${totalRequired}`);
  console.log(`${colors.green}Correct:${colors.reset} ${correctCount}`);
  console.log(`${colors.red}Missing:${colors.reset} ${results.missingCount}`);
  console.log(`${colors.yellow}Incorrect:${colors.reset} ${results.incorrectCount}`);
  
  console.log('');
  
  if (results.allCorrect) {
    console.log(colors.green + '✅ ALL ENVIRONMENT VARIABLES ARE CORRECTLY SET!' + colors.reset);
    console.log('Your Clerk authentication is properly configured.');
    return true;
  } else {
    console.log(colors.red + '❌ ENVIRONMENT VARIABLES NEED ATTENTION!' + colors.reset);
    console.log('');
    console.log('To fix:');
    console.log('1. Go to https://dashboard.render.com');
    console.log('2. Open your service');
    console.log('3. Click "Environment" tab');
    console.log('4. Add or update the missing/incorrect variables');
    console.log('');
    console.log('Copy-paste helper:');
    console.log('-'.repeat(40));
    REQUIRED_VARS.forEach(({ name, expectedValue }) => {
      const actualValue = process.env[name];
      if (!actualValue || actualValue !== expectedValue) {
        console.log(`${name}=${expectedValue}`);
      }
    });
    return false;
  }
}

function generateEnvFile() {
  console.log('');
  console.log(colors.blue + 'Environment File Content (.env):' + colors.reset);
  console.log('-'.repeat(40));
  
  REQUIRED_VARS.forEach(({ name, expectedValue }) => {
    console.log(`${name}=${expectedValue}`);
  });
  
  console.log('');
  console.log(colors.yellow + 'Note: Never commit .env files to Git!' + colors.reset);
}

function checkRenderEnvironment() {
  if (process.env.RENDER) {
    console.log(colors.green + 'Running on Render platform' + colors.reset);
    console.log(`Service: ${process.env.RENDER_SERVICE_NAME || 'Unknown'}`);
    console.log(`Type: ${process.env.RENDER_SERVICE_TYPE || 'Unknown'}`);
    console.log('');
  } else {
    console.log(colors.yellow + 'Not running on Render (local environment)' + colors.reset);
    console.log('');
  }
}

// Main execution
function main() {
  printHeader();
  checkRenderEnvironment();
  
  const results = checkRequiredVars();
  checkOptionalVars();
  
  const success = printSummary(results);
  
  if (process.argv.includes('--generate')) {
    generateEnvFile();
  }
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run verification
if (require.main === module) {
  main();
}

module.exports = { checkRequiredVars, REQUIRED_VARS };


#!/usr/bin/env node

/**
 * Quick Clerk Configuration Verification
 * Checks the 3 most critical Clerk environment variables
 */

import https from 'https';

// Critical variables to check
const CRITICALVARS = [
  {
    name: 'VITE_CLERK_PUBLISHABLE_KEY',
    expected: 'pk_live_REDACTED',
    description: 'Frontend authentication key'
  },
  {
    name: 'CLERK_SECRET_KEY',
    expected: 'sk_live_REDACTED',
    description: 'Backend authentication secret'
  },
  {
    name: 'VITE_CLERK_DOMAIN',
    expected: 'clerk.financeflo.ai',
    description: 'Clerk custom domain'
  }
];

// Service URLs to test
const SERVICES = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com'
};

// Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function checkLocalEnvironment() {
  console.log(colors.cyan + colors.bold + '\nLOCAL ENVIRONMENT CHECK' + colors.reset);
  console.log('=' .repeat(50));
  
  let allCorrect = true;
  
  CRITICAL_VARS.forEach(({ _name, expected, description }) => {
    const actual = process.env[name];
    
    if (!actual) {
      console.log(`${colors.red}✗${colors.reset} ${name}`);
      console.log(`  ${colors.red}NOT SET${colors.reset} - ${description}`);
      console.log(`  Expected: ${colors.yellow}${expected}${colors.reset}`);
      allCorrect = false;
    } else if (actual === expected) {
      console.log(`${colors.green}✓${colors.reset} ${name}`);
      console.log(`  ${colors.green}CORRECT${colors.reset} - ${description}`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} ${name}`);
      console.log(`  ${colors.yellow}INCORRECT${colors.reset} - ${description}`);
      console.log(`  Expected: ${colors.green}${expected}${colors.reset}`);
      console.log(`  Actual:   ${colors.red}${actual}${colors.reset}`);
      allCorrect = false;
    }
    console.log('');
  });
  
  return allCorrect;
}

function checkRemoteService(serviceName, url) {
  return new Promise(_(resolve) => {
    console.log(colors.cyan + colors.bold + `\n${serviceName.toUpperCase()} SERVICE CHECK` + colors.reset);
    console.log('=' .repeat(50));
    
    // Check if service is responding
    https.get(url + '/health', { timeout: 10000 }, (res) => {
      if (res.statusCode === 200) {
        console.log(`${colors.green}✓${colors.reset} Service is online`);
        
        // Check for Clerk key in HTML
        https.get(url, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', _() => {
            if (body.includes('pk_live_')) {
              console.log(`${colors.green}✓${colors.reset} Clerk production key detected`);
              console.log(`${colors.green}✓${colors.reset} Authentication is configured`);
              resolve(true);
            } else if (body.includes('pk_test_')) {
              console.log(`${colors.yellow}⚠${colors.reset} Clerk test key detected`);
              console.log(`${colors.yellow}⚠${colors.reset} Should be using production keys`);
              resolve(false);
            } else {
              console.log(`${colors.red}✗${colors.reset} No Clerk key detected`);
              console.log(`${colors.red}✗${colors.reset} Authentication not configured`);
              resolve(false);
            }
          });
        }).on('error', _(err) => {
          console.log(`${colors.red}✗${colors.reset} Failed to check authentication`);
          console.log(`  Error: ${err.message}`);
          resolve(false);
        });
      } else {
        console.log(`${colors.red}✗${colors.reset} Service not responding (HTTP ${res.statusCode})`);
        resolve(false);
      }
    }).on('error', _(err) => {
      console.log(`${colors.red}✗${colors.reset} Service is offline`);
      console.log(`  Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function runFullCheck() {
  console.log(colors.blue + colors.bold);
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     CLERK AUTHENTICATION VERIFICATION         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  // Check local environment
  const localOk = checkLocalEnvironment();
  
  // Check remote services
  const devOk = await checkRemoteService('development', SERVICES.development);
  const prodOk = await checkRemoteService('production', SERVICES.production);
  
  // Summary
  console.log(colors.blue + colors.bold + '\nSUMMARY' + colors.reset);
  console.log('=' .repeat(50));
  
  console.log('\nRequired Configuration:');
  CRITICAL_VARS.forEach(({ _name, expected }) => {
    console.log(`${colors.cyan}${name}${colors.reset}`);
    console.log(`  ${colors.gray}${expected}${colors.reset}`);
  });
  
  console.log('\nStatus:');
  console.log(`Local Environment: ${localOk ? colors.green + '✓ READY' : colors.red + '✗ NEEDS CONFIGURATION'}${colors.reset}`);
  console.log(`Development Service: ${devOk ? colors.green + '✓ READY' : colors.red + '✗ NEEDS CONFIGURATION'}${colors.reset}`);
  console.log(`Production Service: ${prodOk ? colors.green + '✓ READY' : colors.red + '✗ NEEDS CONFIGURATION'}${colors.reset}`);
  
  if (!devOk || !prodOk) {
    console.log(colors.yellow + '\nACTION REQUIRED:' + colors.reset);
    console.log('1. Go to https://dashboard.render.com');
    console.log('2. Open each service (development and production)');
    console.log('3. Click "Environment" tab');
    console.log('4. Add these environment variables:');
    console.log('');
    CRITICAL_VARS.forEach(({ _name, expected }) => {
      console.log(`   ${name} = ${expected}`);
    });
    console.log('');
    console.log('5. Save changes and wait for redeploy (5-10 minutes)');
  } else if (devOk && prodOk) {
    console.log(colors.green + '\n✅ ALL SYSTEMS READY!' + colors.reset);
    console.log('Your Clerk authentication is properly configured.');
    console.log('Users can now sign up and sign in to your application.');
  }
  
  console.log('');
}

// Run the check
runFullCheck().catch(console.error);

export { checkLocalEnvironment, CRITICAL_VARS };


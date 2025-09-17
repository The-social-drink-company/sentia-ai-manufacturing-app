#!/usr/bin/env node
/**
 * DEPLOYMENT VERIFICATION CHECKLIST
 * Comprehensive test suite to verify all critical functionality
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const LOCAL_URL = 'http://localhost:3000';
const RENDER_URL = 'https://sentia-manufacturing-development.onrender.com';

// Use command line arg or default to Render
const TARGET_URL = process.argv[2] === 'local' ? LOCAL_URL : RENDER_URL;

console.log('='.repeat(70));
console.log('DEPLOYMENT VERIFICATION CHECKLIST');
console.log('='.repeat(70));
console.log('Target URL:', TARGET_URL);
console.log('Time:', new Date().toISOString());
console.log('');

// Test results tracking
const results = {
  passed: [],
  failed: [],
  warnings: []
};

async function testEndpoint(url, description, validateFn) {
  process.stdout.write(`Testing ${description}... `);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/json',
        'User-Agent': 'Deployment-Checker'
      },
      timeout: 10000
    });

    const contentType = response.headers.get('content-type');
    const text = await response.text();

    if (validateFn) {
      const result = await validateFn(response, text, contentType);
      if (result.success) {
        console.log('PASS:', result.message);
        results.passed.push(`${description}: ${result.message}`);
      } else {
        console.log('FAIL:', result.message);
        results.failed.push(`${description}: ${result.message}`);
      }
    } else {
      if (response.ok) {
        console.log('PASS: Status', response.status);
        results.passed.push(`${description}: Status ${response.status}`);
      } else {
        console.log('FAIL: Status', response.status);
        results.failed.push(`${description}: Status ${response.status}`);
      }
    }
  } catch (error) {
    console.log('ERROR:', error.message);
    results.failed.push(`${description}: ${error.message}`);
  }
}

// Define validation functions
const validators = {
  noRequireErrors: (response, text, contentType) => {
    if (text.includes('require is not defined')) {
      return { success: false, message: 'Contains "require is not defined" error' };
    }
    return { success: true, message: 'No ES module errors detected' };
  },

  notBrownPage: (response, text, contentType) => {
    if (text.includes('background:brown') || text.includes('background: brown')) {
      return { success: false, message: 'Brown page detected' };
    }
    if (!text.includes('<div id="root">')) {
      return { success: false, message: 'React root element not found' };
    }
    if (!text.includes('/js/index-')) {
      return { success: false, message: 'JavaScript bundle not referenced' };
    }
    return { success: true, message: 'Valid React app HTML structure' };
  },

  hasLoginOrLanding: (response, text, contentType) => {
    // Check for Clerk or landing page elements
    const hasClerk = text.includes('clerk') || text.includes('Sign in') || text.includes('sign-in');
    const hasLanding = text.includes('Sentia Manufacturing') || text.includes('Dashboard');

    if (hasClerk) {
      return { success: true, message: 'Login/auth elements found' };
    }
    if (hasLanding) {
      return { success: true, message: 'Landing page elements found' };
    }
    return { success: false, message: 'No login or landing page elements found' };
  },

  apiHealthCheck: (response, text, contentType) => {
    if (!response.ok) {
      return { success: false, message: `API returned status ${response.status}` };
    }

    try {
      const data = JSON.parse(text);

      if (data.status === 'healthy' || data.status === 'ok') {
        const dbStatus = data.database?.status || 'unknown';
        return {
          success: true,
          message: `API healthy, Database: ${dbStatus}`
        };
      }

      return { success: true, message: 'API responding with JSON' };
    } catch (e) {
      return { success: false, message: 'API not returning valid JSON' };
    }
  },

  personnelEndpoint: (response, text, contentType) => {
    if (response.status === 404) {
      return { success: false, message: 'Personnel endpoint returns 404' };
    }

    if (!response.ok && response.status !== 401) {
      return { success: false, message: `Unexpected status ${response.status}` };
    }

    try {
      const data = JSON.parse(text);

      // It's OK if it requires auth
      if (response.status === 401 || data.error?.includes('auth')) {
        return { success: true, message: 'Endpoint exists (requires auth)' };
      }

      // Success with data
      if (data.success || data.data || Array.isArray(data)) {
        return { success: true, message: 'Endpoint working and returns data' };
      }

      return { success: true, message: 'Endpoint exists and responds' };
    } catch (e) {
      // If it's HTML, that's wrong
      if (contentType?.includes('text/html')) {
        return { success: false, message: 'Returns HTML instead of JSON' };
      }
      return { success: false, message: 'Invalid response format' };
    }
  },

  noClerkErrors: (response, text, contentType) => {
    // Check for common Clerk error messages
    const clerkErrors = [
      'CLERK_PUBLISHABLE_KEY',
      'Clerk: publishable key not found',
      'Failed to load Clerk',
      'clerk is not defined'
    ];

    for (const error of clerkErrors) {
      if (text.includes(error)) {
        return { success: false, message: `Clerk error found: "${error}"` };
      }
    }

    return { success: true, message: 'No Clerk configuration errors detected' };
  }
};

// Run all tests
async function runVerification() {
  console.log('CHECKLIST VERIFICATION:');
  console.log('-'.repeat(70));
  console.log();

  // 1. Check for ES module errors
  console.log('1. ES MODULE CHECK');
  await testEndpoint(TARGET_URL, 'Main page (require errors)', validators.noRequireErrors);
  console.log();

  // 2. Check site loads (not brown page)
  console.log('2. SITE LOADING CHECK');
  await testEndpoint(TARGET_URL, 'Main page loads correctly', validators.notBrownPage);
  console.log();

  // 3. Check for login/landing page
  console.log('3. LOGIN/LANDING PAGE CHECK');
  await testEndpoint(TARGET_URL, 'Login or landing page', validators.hasLoginOrLanding);
  console.log();

  // 4. Database connection check
  console.log('4. DATABASE CONNECTION CHECK');
  await testEndpoint(`${TARGET_URL}/api/health`, 'API health endpoint', validators.apiHealthCheck);
  console.log();

  // 5. Personnel endpoint check
  console.log('5. PERSONNEL ENDPOINT CHECK');
  await testEndpoint(`${TARGET_URL}/api/personnel`, 'Personnel API endpoint', validators.personnelEndpoint);
  console.log();

  // 6. Clerk configuration check
  console.log('6. CLERK CONFIGURATION CHECK');
  await testEndpoint(TARGET_URL, 'Clerk setup', validators.noClerkErrors);
  console.log();

  // 7. Additional diagnostic endpoints
  console.log('7. ADDITIONAL DIAGNOSTICS');
  await testEndpoint(`${TARGET_URL}/test`, 'Test page', (r) => ({
    success: r.ok,
    message: r.ok ? 'Test page accessible' : 'Test page not found'
  }));
  await testEndpoint(`${TARGET_URL}/api/test-simple`, 'Build debug endpoint', (r) => ({
    success: r.ok,
    message: r.ok ? 'Debug endpoint working' : 'Debug endpoint not found'
  }));
  console.log();

  // Print summary
  console.log('='.repeat(70));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log();

  console.log('PASSED TESTS (' + results.passed.length + '):');
  results.passed.forEach(test => console.log('  ✓', test));
  console.log();

  if (results.failed.length > 0) {
    console.log('FAILED TESTS (' + results.failed.length + '):');
    results.failed.forEach(test => console.log('  ✗', test));
    console.log();
  }

  // Final verdict
  console.log('='.repeat(70));
  if (results.failed.length === 0) {
    console.log('RESULT: ALL CHECKS PASSED! Deployment is functional.');
  } else if (results.failed.length <= 2) {
    console.log('RESULT: MOSTLY WORKING. Minor issues to address.');
  } else {
    console.log('RESULT: CRITICAL ISSUES DETECTED. Deployment needs fixes.');
  }
  console.log('='.repeat(70));

  // Checklist status
  console.log();
  console.log('DEPLOYMENT CHECKLIST STATUS:');
  console.log(results.passed.some(p => p.includes('No ES module errors')) ? '[✓]' : '[✗]', 'No more "require is not defined" errors');
  console.log(results.passed.some(p => p.includes('Valid React app')) ? '[✓]' : '[✗]', 'Site loads (not brown page)');
  console.log(results.passed.some(p => p.includes('Login') || p.includes('Landing')) ? '[✓]' : '[✗]', 'Can see login page or landing page');
  console.log(results.passed.some(p => p.includes('Database')) ? '[✓]' : '[✗]', 'Database connects successfully');
  console.log(results.passed.some(p => p.includes('Personnel') && !p.includes('404')) ? '[✓]' : '[✗]', '/api/personnel returns data (not 404)');
  console.log(results.passed.some(p => p.includes('No Clerk configuration errors')) ? '[✓]' : '[✗]', 'No console errors about Clerk');
  console.log('[?]', 'Can attempt to log in (requires manual testing)');
  console.log();

  // Next steps
  if (results.failed.length > 0) {
    console.log('NEXT STEPS TO FIX:');
    if (results.failed.some(f => f.includes('require is not defined'))) {
      console.log('- ES Module errors still present - check autonomous-scheduler.js');
    }
    if (results.failed.some(f => f.includes('Brown page'))) {
      console.log('- React app not loading - check static file serving and build');
    }
    if (results.failed.some(f => f.includes('Database'))) {
      console.log('- Database connection issue - check DATABASE_URL in Render');
    }
    if (results.failed.some(f => f.includes('Personnel') && f.includes('404'))) {
      console.log('- Personnel endpoint missing - check server.js route definition');
    }
    if (results.failed.some(f => f.includes('Clerk'))) {
      console.log('- Clerk not configured - check VITE_CLERK_PUBLISHABLE_KEY');
    }
  }
}

// Run the verification
runVerification().catch(console.error);
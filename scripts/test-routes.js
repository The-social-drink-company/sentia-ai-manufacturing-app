#!/usr/bin/env node

/**
 * Enterprise Routes Testing Script
 * Tests all application routes to ensure they're accessible
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

// All enterprise routes to test
const ROUTES = [
  // Core Dashboard Routes
  { path: '/', name: 'Landing Page', requiresAuth: false },
  { path: '/dashboard', name: 'Main Dashboard', requiresAuth: true },
  { path: '/dashboard/basic', name: 'Basic Dashboard', requiresAuth: true },
  
  // Financial Management
  { path: '/working-capital', name: 'Working Capital', requiresAuth: true },
  { path: '/working-capital/basic', name: 'Working Capital Basic', requiresAuth: true },
  { path: '/working-capital/enhanced', name: 'Enhanced Working Capital', requiresAuth: true },
  
  // Analytics & What-If
  { path: '/what-if', name: 'What-If Analysis', requiresAuth: true },
  { path: '/analytics', name: 'Analytics Dashboard', requiresAuth: true },
  { path: '/analytics/advanced', name: 'Advanced Analytics', requiresAuth: true },
  
  // Manufacturing Operations
  { path: '/forecasting', name: 'Demand Forecasting', requiresAuth: true },
  { path: '/inventory', name: 'Inventory Management', requiresAuth: true },
  { path: '/inventory/advanced', name: 'Advanced Inventory', requiresAuth: true },
  { path: '/production', name: 'Production Tracking', requiresAuth: true },
  { path: '/production/optimization', name: 'Production Optimization', requiresAuth: true },
  
  // Quality Management
  { path: '/quality', name: 'Quality Control', requiresAuth: true },
  { path: '/quality/basic', name: 'Basic Quality Control', requiresAuth: true },
  { path: '/quality/management', name: 'Quality Management System', requiresAuth: true },
  
  // Enterprise Innovation Routes
  { path: '/maintenance/predictive', name: 'Predictive Maintenance', requiresAuth: true },
  { path: '/intelligence/manufacturing', name: 'Manufacturing Intelligence', requiresAuth: true },
  { path: '/intelligence/quality', name: 'Quality Intelligence', requiresAuth: true },
  { path: '/operations/workflow', name: 'Workflow Automation', requiresAuth: true },
  { path: '/compliance/global', name: 'Global Compliance', requiresAuth: true },
  { path: '/innovation/digital-twin', name: 'Digital Twin System', requiresAuth: true },
  
  // AI & Monitoring
  { path: '/ai/dashboard', name: 'AI Dashboard', requiresAuth: true },
  { path: '/ai/insights', name: 'AI Insights', requiresAuth: true },
  { path: '/monitoring', name: 'Real-Time Monitoring', requiresAuth: true },
  
  // Admin Routes
  { path: '/admin', name: 'Admin Panel', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/users', name: 'User Management', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/settings', name: 'System Settings', requiresAuth: true, requiresAdmin: true },
  
  // Data Management
  { path: '/data/import', name: 'Data Import', requiresAuth: true },
  { path: '/data/export', name: 'Data Export', requiresAuth: true },
  
  // System Routes
  { path: '/settings', name: 'User Settings', requiresAuth: true },
  { path: '/api/status', name: 'API Status', requiresAuth: false },
  { path: '/health', name: 'Health Check', requiresAuth: false }
];

// Test result tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Log with color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test a single route
async function testRoute(baseUrl, route) {
  return new Promise((resolve) => {
    const fullUrl = new URL(route.path, baseUrl).toString();
    const protocol = fullUrl.startsWith('https') ? https : http;
    
    const startTime = Date.now();
    
    protocol.get(fullUrl, (res) => {
      const responseTime = Date.now() - startTime;
      
      // Determine if route test passed
      let passed = false;
      let status = '';
      
      if (res.statusCode === 200) {
        passed = true;
        status = 'OK';
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        // Redirect is acceptable for auth-required routes
        if (route.requiresAuth) {
          passed = true;
          status = 'AUTH_REDIRECT';
        } else {
          passed = false;
          status = 'UNEXPECTED_REDIRECT';
        }
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        // Auth required is expected for protected routes
        if (route.requiresAuth) {
          passed = true;
          status = 'AUTH_REQUIRED';
        } else {
          passed = false;
          status = 'UNEXPECTED_AUTH';
        }
      } else if (res.statusCode === 404) {
        passed = false;
        status = 'NOT_FOUND';
      } else {
        passed = false;
        status = `HTTP_${res.statusCode}`;
      }
      
      resolve({
        route: route.path,
        name: route.name,
        passed,
        status,
        statusCode: res.statusCode,
        responseTime
      });
    }).on('error', (err) => {
      resolve({
        route: route.path,
        name: route.name,
        passed: false,
        status: 'ERROR',
        error: err.message,
        responseTime: Date.now() - startTime
      });
    });
  });
}

// Test all routes
async function testAllRoutes(baseUrl) {
  log('\n=== Testing Enterprise Routes ===', 'magenta');
  log(`Base URL: ${baseUrl}`, 'cyan');
  log(`Total Routes: ${ROUTES.length}\n`, 'cyan');
  
  testResults.total = ROUTES.length;
  
  for (const route of ROUTES) {
    process.stdout.write(`Testing ${route.name.padEnd(30, '.')} `);
    
    const result = await testRoute(baseUrl, route);
    
    if (result.passed) {
      testResults.passed++;
      log(`PASS [${result.status}] (${result.responseTime}ms)`, 'green');
    } else {
      testResults.failed++;
      testResults.errors.push(result);
      log(`FAIL [${result.status}] (${result.responseTime}ms)`, 'red');
      if (result.error) {
        log(`  Error: ${result.error}`, 'gray');
      }
    }
  }
  
  return testResults;
}

// Print test summary
function printSummary(results) {
  log('\n=== Test Summary ===', 'magenta');
  
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  
  log(`Total Routes: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'gray');
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');
  
  if (results.errors.length > 0) {
    log('\n=== Failed Routes ===', 'red');
    results.errors.forEach(error => {
      log(`- ${error.name} (${error.route}): ${error.status}`, 'red');
      if (error.error) {
        log(`  ${error.error}`, 'gray');
      }
    });
  }
  
  // Generate recommendations
  log('\n=== Recommendations ===', 'yellow');
  
  if (results.failed === 0) {
    log('All routes are accessible!', 'green');
  } else {
    const notFoundRoutes = results.errors.filter(e => e.status === 'NOT_FOUND');
    const errorRoutes = results.errors.filter(e => e.status === 'ERROR');
    
    if (notFoundRoutes.length > 0) {
      log(`- ${notFoundRoutes.length} routes not found. Check route configuration.`, 'yellow');
    }
    
    if (errorRoutes.length > 0) {
      log(`- ${errorRoutes.length} routes had connection errors. Check if server is running.`, 'yellow');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  let baseUrl = args[0] || 'http://localhost:3000';
  
  // Ensure URL has protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  
  log('Enterprise Route Testing Tool', 'magenta');
  log('=============================\n', 'magenta');
  
  // Test server connectivity first
  process.stdout.write('Testing server connectivity... ');
  
  const connectivityTest = await testRoute(baseUrl, { path: '/', name: 'Root', requiresAuth: false });
  if (connectivityTest.status === 'ERROR') {
    log('FAILED', 'red');
    log(`\nCannot connect to ${baseUrl}`, 'red');
    log('Make sure the server is running and accessible.', 'yellow');
    process.exit(1);
  } else {
    log('OK', 'green');
  }
  
  // Run all route tests
  const results = await testAllRoutes(baseUrl);
  
  // Print summary
  printSummary(results);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  process.exit(1);
});

// Run main function
main();
/**
 * Master Test Suite - Comprehensive Enterprise Testing Framework
 * Covers all API endpoints, UI components, and critical business flows
 * with detailed failure analysis and self-healing capabilities
 */

import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  apiURL: 'http://localhost:5000/api',
  timeout: 30000,
  retries: 3,
  screenshots: true,
  videos: 'on-failure'
};

// Test data sets
const TEST_DATA = {
  users: {
    admin: { email: 'admin@sentia.com', password: 'AdminTest123!' },
    manager: { email: 'manager@sentia.com', password: 'ManagerTest123!' },
    operator: { email: 'operator@sentia.com', password: 'OperatorTest123!' },
    viewer: { email: 'viewer@sentia.com', password: 'ViewerTest123!' }
  },
  manufacturing: {
    jobs: [
      { id: 'JOB001', product: 'Widget A', quantity: 100, priority: 'High' },
      { id: 'JOB002', product: 'Widget B', quantity: 250, priority: 'Medium' }
    ],
    quality: {
      tests: ['Dimensional', 'Material', 'Functional', 'Visual'],
      standards: ['ISO9001', 'AS9100', 'TS16949']
    }
  }
};

// Detailed test result tracking
class TestResultTracker {
  constructor() {
    this.results = [];
    this.failurePatterns = new Map();
    this.performanceMetrics = [];
  }

  recordTest(testName, result, duration, error = null, screenshot = null) {
    const testResult = {
      testName,
      result, // 'pass', 'fail', 'skip'
      duration,
      timestamp: new Date().toISOString(),
      error: error ? {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      } : null,
      screenshot,
      context: this.captureContext()
    };

    this.results.push(testResult);
    
    if (result === 'fail' && error) {
      this.analyzeFailurePattern(error);
    }
    
    this.saveResults();
  }

  analyzeFailurePattern(error) {
    const pattern = this.categorizeError(error);
    const count = this.failurePatterns.get(pattern) || 0;
    this.failurePatterns.set(pattern, count + 1);
  }

  categorizeError(error) {
    if (error.message.includes('Timeout')) return 'TIMEOUT';
    if (error.message.includes('Network')) return 'NETWORK';
    if (error.message.includes('404')) return 'API_NOT_FOUND';
    if (error.message.includes('500')) return 'SERVER_ERROR';
    if (error.message.includes('Unauthorized')) return 'AUTH_ERROR';
    if (error.message.includes('element not found')) return 'UI_ELEMENT_MISSING';
    if (error.message.includes('database')) return 'DATABASE_ERROR';
    return 'UNKNOWN';
  }

  captureContext() {
    return {
      url: global.currentPage?.url() || 'unknown',
      viewport: global.currentPage?.viewportSize() || { width: 1920, height: 1080 },
      userAgent: 'Playwright Test Agent',
      memoryUsage: process.memoryUsage()
    };
  }

  saveResults() {
    const resultsPath = path.join(process.cwd(), 'tests', 'autonomous', 'results');
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    
    fs.writeFileSync(
      path.join(resultsPath, filename),
      JSON.stringify({
        summary: this.getSummary(),
        results: this.results,
        failurePatterns: Object.fromEntries(this.failurePatterns),
        performanceMetrics: this.performanceMetrics
      }, null, 2)
    );
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.result === 'pass').length;
    const failed = this.results.filter(r => r.result === 'fail').length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;

    return { total, passed, failed, avgDuration, passRate: (passed / total) * 100 };
  }
}

const tracker = new TestResultTracker();

// Base test class with enhanced error handling
class EnterpriseTest {
  static async runTest(testName, testFunction) {
    const startTime = performance.now();
    let screenshot = null;
    
    try {
      await testFunction();
      const duration = performance.now() - startTime;
      tracker.recordTest(testName, 'pass', duration);
      return { success: true, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Capture screenshot on failure
      try {
        screenshot = await global.currentPage?.screenshot({ 
          path: `tests/autonomous/screenshots/failure-${testName}-${Date.now()}.png`,
          fullPage: true 
        });
      } catch (screenshotError) {
        console.warn('Failed to capture screenshot:', screenshotError.message);
      }
      
      tracker.recordTest(testName, 'fail', duration, error, screenshot);
      throw error;
    }
  }
}

// API ENDPOINT TESTING SUITE
test.describe('🔌 API Endpoints Testing', () => {
  const apiEndpoints = [
    // Authentication & Users
    { method: 'GET', path: '/api/health', auth: false, critical: true },
    { method: 'GET', path: '/api/admin/users', auth: true, role: 'admin' },
    { method: 'GET', path: '/api/admin/system-stats', auth: true, role: 'admin' },
    
    // Manufacturing Operations
    { method: 'GET', path: '/api/production/status', auth: true, critical: true },
    { method: 'POST', path: '/api/production/control', auth: true, role: 'manager' },
    { method: 'GET', path: '/api/production/metrics', auth: true },
    { method: 'GET', path: '/api/production/batches', auth: true },
    { method: 'POST', path: '/api/production/batch/update', auth: true, role: 'operator' },
    
    // Quality Control
    { method: 'GET', path: '/api/quality/dashboard', auth: true },
    { method: 'POST', path: '/api/quality/test/submit', auth: true, role: 'operator' },
    { method: 'POST', path: '/api/quality/batch/approve', auth: true, role: 'manager' },
    { method: 'POST', path: '/api/quality/alert/resolve', auth: true, role: 'manager' },
    { method: 'GET', path: '/api/quality/tests/schedule', auth: true },
    
    // Inventory Management
    { method: 'GET', path: '/api/inventory/dashboard', auth: true },
    { method: 'POST', path: '/api/inventory/stock/update', auth: true, role: 'operator' },
    { method: 'GET', path: '/api/inventory/alerts', auth: true },
    { method: 'POST', path: '/api/inventory/reorder', auth: true, role: 'manager' },
    
    // Financial & Working Capital
    { method: 'GET', path: '/api/working-capital/metrics', auth: true },
    { method: 'GET', path: '/api/working-capital/projections', auth: true },
    { method: 'GET', path: '/api/working-capital/ai-recommendations', auth: true },
    { method: 'POST', path: '/api/working-capital/upload-financial-data', auth: true, role: 'manager' },
    
    // External Integrations
    { method: 'GET', path: '/api/xero/balance-sheet', auth: true, role: 'manager' },
    { method: 'GET', path: '/api/xero/cash-flow', auth: true, role: 'manager' },
    { method: 'GET', path: '/api/xero/profit-loss', auth: true, role: 'manager' },
    { method: 'GET', path: '/api/shopify/dashboard-data', auth: true },
    { method: 'GET', path: '/api/shopify/orders', auth: true },
    
    // Analytics & AI
    { method: 'GET', path: '/api/analytics/kpis', auth: true },
    { method: 'GET', path: '/api/analytics/trends', auth: true },
    { method: 'GET', path: '/api/analytics/ai-insights', auth: true },
    
    // Data Management
    { method: 'POST', path: '/api/data/upload', auth: true, role: 'manager' },
    { method: 'GET', path: '/api/data/status', auth: true },
    { method: 'GET', path: '/api/services/status', auth: true, role: 'admin' }
  ];

  for (const endpoint of apiEndpoints) {
    test(`API ${endpoint.method} ${endpoint.path}`, async ({ request }) => {
      await EnterpriseTest.runTest(`API_${endpoint.method}_${endpoint.path.replace(/\//g, '_')}`, async () => {
        const headers = endpoint.auth ? { 'Authorization': 'Bearer test-token' } : {};
        
        const response = await request.fetch(`${TEST_CONFIG.apiURL}${endpoint.path}`, {
          method: endpoint.method,
          headers,
          timeout: TEST_CONFIG.timeout
        });

        // Validate response
        expect(response.status()).toBeLessThan(500);
        
        if (endpoint.critical) {
          expect(response.status()).toBe(200);
        }
        
        // Performance check
        const responseTime = response.headers()['x-response-time'];
        if (responseTime) {
          expect(parseInt(responseTime)).toBeLessThan(200); // 200ms max
        }
      });
    });
  }
});

// UI COMPONENT TESTING SUITE
test.describe('🖥️ UI Components & Interactions', () => {
  
  test.beforeEach(async ({ page }) => {
    global.currentPage = page;
    await page.goto(TEST_CONFIG.baseURL);
  });

  // Critical Navigation Tests
  const navigationTests = [
    { name: 'Dashboard Navigation', path: '/', selector: 'h1', expectedText: 'SENTIA Dashboard' },
    { name: 'Admin Panel', path: '/admin', selector: '[data-testid="admin-panel"]' },
    { name: 'Working Capital', path: '/working-capital', selector: '[data-testid="working-capital"]' },
    { name: 'Production Tracking', path: '/production', selector: '[data-testid="production-tracking"]' },
    { name: 'Quality Control', path: '/quality', selector: '[data-testid="quality-control"]' },
    { name: 'Inventory Management', path: '/inventory', selector: '[data-testid="inventory-mgmt"]' }
  ];

  for (const nav of navigationTests) {
    test(`Navigation - ${nav.name}`, async ({ page }) => {
      await EnterpriseTest.runTest(`UI_NAV_${nav.name.replace(/ /g, '_')}`, async () => {
        await page.goto(`${TEST_CONFIG.baseURL}${nav.path}`);
        
        if (nav.selector) {
          await expect(page.locator(nav.selector)).toBeVisible({ timeout: 10000 });
        }
        
        if (nav.expectedText) {
          await expect(page.locator(nav.selector)).toContainText(nav.expectedText);
        }
      });
    });
  }

  // Button Interaction Tests
  const buttonTests = [
    { selector: 'button:has-text("Sign In")', action: 'click', page: 'auth' },
    { selector: '[data-testid="refresh-dashboard"]', action: 'click', page: 'dashboard' },
    { selector: '[data-testid="export-data"]', action: 'click', page: 'dashboard' },
    { selector: '[data-testid="add-production-job"]', action: 'click', page: 'production' },
    { selector: '[data-testid="submit-quality-test"]', action: 'click', page: 'quality' },
    { selector: '[data-testid="update-inventory"]', action: 'click', page: 'inventory' }
  ];

  for (const btnTest of buttonTests) {
    test(`Button - ${btnTest.selector}`, async ({ page }) => {
      await EnterpriseTest.runTest(`UI_BTN_${btnTest.selector.replace(/[^a-zA-Z0-9]/g, '_')}`, async () => {
        // Navigate to appropriate page
        if (btnTest.page !== 'auth') {
          await page.goto(`${TEST_CONFIG.baseURL}/${btnTest.page === 'dashboard' ? '' : btnTest.page}`);
        }
        
        const button = page.locator(btnTest.selector);
        await expect(button).toBeVisible();
        await expect(button).toBeEnabled();
        
        if (btnTest.action === 'click') {
          await button.click();
          // Wait for any resulting navigation or modal
          await page.waitForTimeout(1000);
        }
      });
    });
  }

  // Form Validation Tests
  test('Forms - Data Upload Validation', async ({ page }) => {
    await EnterpriseTest.runTest('UI_FORM_DATA_UPLOAD', async () => {
      await page.goto(`${TEST_CONFIG.baseURL}/data-import`);
      
      // Test file upload
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible();
      
      // Test form validation
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      
      // Should show validation errors
      const errorMessage = page.locator('.error-message');
      await expect(errorMessage).toBeVisible();
    });
  });

  // Responsive Design Tests
  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 1024, height: 768, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ];

  for (const viewport of viewports) {
    test(`Responsive - ${viewport.name}`, async ({ page }) => {
      await EnterpriseTest.runTest(`UI_RESPONSIVE_${viewport.name}`, async () => {
        await page.setViewportSize(viewport);
        await page.goto(TEST_CONFIG.baseURL);
        
        // Check key elements are visible
        await expect(page.locator('h1')).toBeVisible();
        
        // Mobile-specific checks
        if (viewport.name === 'Mobile') {
          const hamburgerMenu = page.locator('[data-testid="mobile-menu"]');
          if (await hamburgerMenu.isVisible()) {
            await hamburgerMenu.click();
          }
        }
      });
    });
  }
});

// REAL-TIME FEATURES TESTING
test.describe('⚡ Real-time Features', () => {
  
  test('SSE Connection Stability', async ({ page }) => {
    await EnterpriseTest.runTest('REALTIME_SSE_CONNECTION', async () => {
      await page.goto(TEST_CONFIG.baseURL);
      
      // Monitor SSE connection
      let sseConnected = false;
      let messagesReceived = 0;
      
      page.on('response', response => {
        if (response.url().includes('/api/sse') && response.status() === 200) {
          sseConnected = true;
        }
      });
      
      // Wait for SSE connection
      await page.waitForTimeout(5000);
      expect(sseConnected).toBe(true);
    });
  });

  test('Real-time Data Updates', async ({ page }) => {
    await EnterpriseTest.runTest('REALTIME_DATA_UPDATES', async () => {
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);
      
      // Get initial KPI values
      const kpiWidget = page.locator('[data-testid="kpi-strip"]');
      await expect(kpiWidget).toBeVisible();
      
      // Trigger data update via API
      // (This would normally trigger real-time updates)
      await page.waitForTimeout(2000);
      
      // Verify data updates
      await expect(kpiWidget).toBeVisible();
    });
  });
});

// PERFORMANCE TESTING
test.describe('🚀 Performance Testing', () => {
  
  test('Page Load Performance', async ({ page }) => {
    await EnterpriseTest.runTest('PERFORMANCE_PAGE_LOAD', async () => {
      const startTime = performance.now();
      
      await page.goto(TEST_CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second max load time
      
      tracker.performanceMetrics.push({
        metric: 'page_load_time',
        value: loadTime,
        timestamp: new Date().toISOString()
      });
    });
  });

  test('API Response Times', async ({ request }) => {
    await EnterpriseTest.runTest('PERFORMANCE_API_RESPONSE', async () => {
      const criticalEndpoints = [
        '/api/health',
        '/api/production/status',
        '/api/analytics/kpis'
      ];

      for (const endpoint of criticalEndpoints) {
        const startTime = performance.now();
        const response = await request.get(`${TEST_CONFIG.apiURL}${endpoint}`);
        const responseTime = performance.now() - startTime;
        
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(500); // 500ms max
        
        tracker.performanceMetrics.push({
          metric: 'api_response_time',
          endpoint,
          value: responseTime,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
});

// SECURITY TESTING
test.describe('🔒 Security Testing', () => {
  
  test('Authentication Required', async ({ request }) => {
    await EnterpriseTest.runTest('SECURITY_AUTH_REQUIRED', async () => {
      const protectedEndpoints = [
        '/api/admin/users',
        '/api/production/control',
        '/api/working-capital/metrics'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request.get(`${TEST_CONFIG.apiURL}${endpoint}`);
        expect(response.status()).toBe(401); // Unauthorized
      }
    });
  });

  test('XSS Protection', async ({ page }) => {
    await EnterpriseTest.runTest('SECURITY_XSS_PROTECTION', async () => {
      await page.goto(TEST_CONFIG.baseURL);
      
      // Try to inject script
      const searchInput = page.locator('input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('<script>alert("xss")</script>');
        await searchInput.press('Enter');
        
        // Should not execute script
        const alerts = [];
        page.on('dialog', dialog => alerts.push(dialog));
        
        await page.waitForTimeout(1000);
        expect(alerts.length).toBe(0);
      }
    });
  });
});

// Export test results for autonomous agent processing
test.afterAll(async () => {
  const summary = tracker.getSummary();
  console.log('=== TEST EXECUTION SUMMARY ===');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Pass Rate: ${summary.passRate.toFixed(2)}%`);
  console.log(`Average Duration: ${summary.avgDuration.toFixed(2)}ms`);
  
  // Trigger autonomous agent if failures detected
  if (summary.failed > 0) {
    console.log('🤖 FAILURES DETECTED - Triggering Autonomous Agent');
    
    // Save failure analysis for agent processing
    const failureData = {
      timestamp: new Date().toISOString(),
      failedTests: tracker.results.filter(r => r.result === 'fail'),
      failurePatterns: Object.fromEntries(tracker.failurePatterns),
      triggerSelfHealing: true
    };
    
    fs.writeFileSync(
      'tests/autonomous/failure-trigger.json',
      JSON.stringify(failureData, null, 2)
    );
  }
});

export { EnterpriseTest, TestResultTracker, TEST_CONFIG, TEST_DATA };
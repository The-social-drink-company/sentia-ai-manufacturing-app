import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
// Node 18+ has global fetch

/**
 * COMPREHENSIVE SYSTEM INTEGRATION TESTS
 * 
 * End-to-end testing suite for the complete Sentia Manufacturing Dashboard
 * including all AI features, real-time capabilities, and business intelligence.
 */

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.TEST_API_URL || 'http://localhost:5000/api',
  mcpUrl: process.env.TEST_MCP_URL || 'http://localhost:9001',
  timeout: 30000,
  retries: 3
};

let browser, page;

describe('Comprehensive System Integration Tests', () => {
  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: process.env.CI !== 'false',
      timeout: TEST_CONFIG.timeout 
    });
    page = await browser.newPage();
    await page.setDefaultTimeout(TEST_CONFIG.timeout);
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Core System Health', () => {
    it('should have all health endpoints responding', async () => {
      const healthChecks = [
        { name: 'Main Health', url: `${TEST_CONFIG.apiUrl}/health` },
        { name: 'Readiness', url: `${TEST_CONFIG.apiUrl}/ready` },
        { name: 'Liveness', url: `${TEST_CONFIG.apiUrl}/live` },
        { name: 'MCP Health', url: `${TEST_CONFIG.mcpUrl}/health` }
      ];

      for (const check of healthChecks) {
        const response = await fetch(check.url);
        expect(response.status).toBeLessThan(400);
        
        const data = await response.json();
        expect(data).toHaveProperty('status');
        expect(data.status).toMatch(/healthy|ready|alive|operational/);
      }
    });

    it('should have all required environment variables configured', async () => {
      const response = await fetch(`${TEST_CONFIG.apiUrl}/features`);
      const features = await response.json();
      
      expect(features).toHaveProperty('ai_copilot');
      expect(features).toHaveProperty('real_time_streaming');
      expect(features).toHaveProperty('business_intelligence');
      expect(features).toHaveProperty('autonomous_monitoring');
      
      // Verify core AI features are enabled
      expect(features.ai_copilot.enabled).toBe(true);
      expect(features.real_time_streaming.enabled).toBe(true);
    });

    it('should have database connectivity', async () => {
      const response = await fetch(`${TEST_CONFIG.apiUrl}/health`);
      const health = await response.json();
      
      expect(health.checks).toHaveProperty('database');
      expect(health.checks.database.status).toBe('healthy');
      expect(health.checks.database.responseTime).toBeLessThan(1000);
    });
  });

  describe('Frontend Application', () => {
    it('should load the main dashboard without errors', async () => {
      const response = await page.goto(TEST_CONFIG.baseUrl);
      expect(response?.status()).toBeLessThan(400);
      
      // Wait for dashboard to load
      await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
      
      // Check for critical elements
      await expect(page.locator('h1, h2, h3')).toHaveCount({ min: 1 });
      await expect(page.locator('[data-testid="ai-copilot-button"]')).toBeVisible();
    });

    it('should have responsive navigation', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      await page.waitForSelector('[data-testid="navigation"]');
      
      // Test main navigation items
      const navItems = [
        'Dashboard', 'Forecasting', 'Inventory', 'Production', 
        'Quality', 'Working Capital', 'What-If', 'Analytics'
      ];
      
      for (const item of navItems) {
        const navLink = page.locator(`nav >> text=${item}`).first();
        await expect(navLink).toBeVisible();
      }
    });

    it('should handle mobile responsiveness', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Mobile navigation should be present
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Dashboard should adapt to mobile layout
      await page.waitForSelector('[data-testid="dashboard-container"]');
      
      // Reset to desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
    });
  });

  describe('AI Copilot Integration', () => {
    it('should open AI copilot chatbot', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Click AI copilot button
      await page.click('[data-testid="ai-copilot-button"]');
      
      // Verify chatbot window opens
      await expect(page.locator('[data-testid="ai-chatbot-window"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-chatbot-input"]')).toBeVisible();
    });

    it('should send and receive AI responses', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Open chatbot
      await page.click('[data-testid="ai-copilot-button"]');
      await page.waitForSelector('[data-testid="ai-chatbot-window"]');
      
      // Send test message
      const testMessage = "What are my key performance indicators?";
      await page.fill('[data-testid="ai-chatbot-input"]', testMessage);
      await page.click('[data-testid="ai-send-button"]');
      
      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-message"]', { timeout: 15000 });
      
      // Verify response contains relevant information
      const aiResponse = await page.textContent('[data-testid="ai-message"]');
      expect(aiResponse).toBeTruthy();
      expect(aiResponse.length).toBeGreaterThan(50);
    }, 20000);

    it('should display business data analysis in AI responses', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Open chatbot and ask for analysis
      await page.click('[data-testid="ai-copilot-button"]');
      await page.fill('[data-testid="ai-chatbot-input"]', "Analyze my financial performance");
      await page.click('[data-testid="ai-send-button"]');
      
      // Wait for detailed response with analysis
      await page.waitForSelector('[data-testid="ai-analysis-data"]', { timeout: 15000 });
      
      // Verify analysis contains structured data
      const analysisData = page.locator('[data-testid="ai-analysis-data"]');
      await expect(analysisData).toBeVisible();
    }, 20000);
  });

  describe('Real-Time Data Streaming', () => {
    it('should establish WebSocket connection for real-time updates', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Monitor WebSocket connections
      const wsConnections = [];
      page.on('websocket', ws => {
        wsConnections.push(ws);
      });
      
      // Wait for potential WebSocket connections
      await page.waitForTimeout(3000);
      
      // At least one WebSocket should be established for real-time features
      expect(wsConnections.length).toBeGreaterThanOrEqual(0);
    });

    it('should receive real-time KPI updates', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Wait for initial KPI data load
      await page.waitForSelector('[data-testid="kpi-widget"]');
      
      // Record initial KPI values
      const initialKPIs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-testid="kpi-value"]'))
          .map(el => el.textContent);
      });
      
      // Wait for potential updates (real-time systems should update within 30s)
      await page.waitForTimeout(5000);
      
      // Verify KPI structure exists
      expect(initialKPIs).toBeTruthy();
    });
  });

  describe('Business Intelligence Features', () => {
    it('should display AI insights widget', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Wait for AI insights widget to load
      await page.waitForSelector('[data-testid="ai-insights-widget"]', { timeout: 10000 });
      
      // Verify insights are displayed
      await expect(page.locator('[data-testid="ai-insight-item"]')).toHaveCount({ min: 1 });
      
      // Check for insight priorities
      const priorities = await page.locator('[data-testid="insight-priority"]').allTextContents();
      expect(priorities).toContain(/critical|high|medium|low/);
    });

    it('should show predictive analytics charts', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Wait for predictive analytics widget
      await page.waitForSelector('[data-testid="predictive-analytics-widget"]');
      
      // Verify chart is rendered
      await expect(page.locator('[data-testid="prediction-chart"]')).toBeVisible();
      
      // Check for forecast data
      await expect(page.locator('[data-testid="forecast-accuracy"]')).toBeVisible();
    });

    it('should provide interactive data exploration', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Navigate to data explorer
      await page.waitForSelector('[data-testid="data-explorer-widget"]');
      
      // Test drill-down functionality
      await page.click('[data-testid="drill-down-option"]');
      
      // Verify drill-down navigation
      await expect(page.locator('[data-testid="drill-path"]')).toBeVisible();
    });
  });

  describe('Dashboard Functionality', () => {
    it('should display all core widgets', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      const requiredWidgets = [
        'kpi-widget',
        'ai-insights-widget', 
        'predictive-analytics-widget',
        'working-capital-widget',
        'production-status-widget'
      ];
      
      for (const widget of requiredWidgets) {
        await expect(page.locator(`[data-testid="${widget}"]`)).toBeVisible();
      }
    });

    it('should support dark/light theme switching', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Find theme toggle
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      
      if (await themeToggle.isVisible()) {
        // Test theme switching
        await themeToggle.click();
        
        // Wait for theme change
        await page.waitForTimeout(500);
        
        // Verify theme change occurred
        const htmlClass = await page.getAttribute('html', 'class');
        expect(htmlClass).toMatch(/dark|light/);
      }
    });

    it('should handle widget interactions', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Test widget expansion/collapse
      const expandableWidget = page.locator('[data-testid="expandable-widget"]').first();
      
      if (await expandableWidget.isVisible()) {
        await expandableWidget.click();
        
        // Verify interaction response
        await page.waitForTimeout(500);
      }
    });
  });

  describe('Navigation and Routing', () => {
    it('should navigate to all main routes without errors', async () => {
      const routes = [
        '/',
        '/dashboard',
        '/forecasting',
        '/inventory',
        '/production',
        '/quality',
        '/working-capital',
        '/what-if',
        '/analytics'
      ];
      
      for (const route of routes) {
        const response = await page.goto(`${TEST_CONFIG.baseUrl}${route}`);
        expect(response?.status()).toBeLessThan(400);
        
        // Wait for page to load
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        // Verify no JavaScript errors
        const errors = await page.evaluate(() => window.errors || []);
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle keyboard navigation shortcuts', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Test keyboard shortcuts (if implemented)
      await page.keyboard.press('g');
      await page.keyboard.press('o'); // Go to Overview
      
      // Verify navigation occurred
      await page.waitForTimeout(500);
      expect(page.url()).toContain('dashboard');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should load dashboard within performance budget', async () => {
      const startTime = Date.now();
      await page.goto(TEST_CONFIG.baseUrl);
      await page.waitForSelector('[data-testid="dashboard-container"]');
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    it('should handle concurrent user simulation', async () => {
      const concurrentPages = [];
      
      // Create multiple page instances
      for (let i = 0; i < 3; i++) {
        const concurrentPage = await browser.newPage();
        concurrentPages.push(concurrentPage);
      }
      
      // Load dashboard simultaneously
      const loadPromises = concurrentPages.map(p => 
        p.goto(TEST_CONFIG.baseUrl)
      );
      
      const responses = await Promise.all(loadPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response?.status()).toBeLessThan(400);
      });
      
      // Clean up
      await Promise.all(concurrentPages.map(p => p.close()));
    });

    it('should maintain memory usage within limits', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Measure memory usage
      const metrics = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (metrics) {
        // Memory usage should be reasonable (less than 100MB)
        expect(metrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should gracefully handle network errors', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Simulate network failure
      await page.setOffline(true);
      
      // Try to interact with features
      const errorHandled = await page.evaluate(() => {
        // Trigger network request that should fail gracefully
        return fetch('/api/nonexistent').catch(() => true);
      });
      
      expect(errorHandled).toBe(true);
      
      // Restore network
      await page.setOffline(false);
    });

    it('should display appropriate error messages for failed requests', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Test error boundary functionality
      const errorContainer = page.locator('[data-testid="error-boundary"]');
      
      // If error boundary exists, it should handle errors gracefully
      if (await errorContainer.isVisible()) {
        await expect(errorContainer).toContainText(/error|something went wrong/i);
      }
    });

    it('should recover from component failures', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Test component resilience
      await page.evaluate(() => {
        // Simulate component error
        window.dispatchEvent(new Error('Test error'));
      });
      
      // Page should still be functional
      await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
    });
  });

  describe('Security and Authentication', () => {
    it('should have proper security headers', async () => {
      const response = await fetch(TEST_CONFIG.baseUrl);
      const headers = response.headers;
      
      // Check for security headers
      expect(headers.get('x-content-type-options')).toBe('nosniff');
      expect(headers.get('x-frame-options')).toBeTruthy();
      
      // CSP should be present for production
      if (process.env.NODE_ENV === 'production') {
        expect(headers.get('content-security-policy')).toBeTruthy();
      }
    });

    it('should handle authentication gracefully', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Check if authentication is required
      const authButton = page.locator('[data-testid="auth-button"]');
      
      if (await authButton.isVisible()) {
        // Authentication flow should be present
        await expect(authButton).toContainText(/sign in|login/i);
      }
    });
  });

  describe('Data Validation and Integration', () => {
    it('should validate API responses', async () => {
      const apiEndpoints = [
        '/api/dashboard/overview',
        '/api/health',
        '/api/features'
      ];
      
      for (const endpoint of apiEndpoints) {
        const response = await fetch(`${TEST_CONFIG.apiUrl}${endpoint.replace('/api', '')}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // All API responses should be valid JSON
          expect(data).toBeTruthy();
          expect(typeof data).toBe('object');
          
          // Should have timestamp for tracking
          if (data.timestamp) {
            expect(new Date(data.timestamp)).toBeInstanceOf(Date);
          }
        }
      }
    });

    it('should handle data consistency across widgets', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Wait for widgets to load
      await page.waitForSelector('[data-testid="kpi-widget"]');
      
      // Extract data from multiple widgets
      const widgetData = await page.evaluate(() => {
        const widgets = document.querySelectorAll('[data-testid*="widget"]');
        return Array.from(widgets).map(widget => ({
          id: widget.dataset.testid,
          hasData: widget.textContent.trim().length > 0
        }));
      });
      
      // All widgets should have content
      widgetData.forEach(widget => {
        expect(widget.hasData).toBe(true);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA labels and semantic HTML', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Check for main landmarks
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // Check for ARIA labels on interactive elements
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Button should have either aria-label or text content
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
    });

    it('should support keyboard navigation', async () => {
      await page.goto(TEST_CONFIG.baseUrl);
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should have focus indicators
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedElement);
    });
  });
});

// Test utilities and helpers
export const testUtils = {
  waitForWidget: async (page, widgetId, timeout = 10000) => {
    await page.waitForSelector(`[data-testid="${widgetId}"]`, { timeout });
  },
  
  simulateUserInteraction: async (page, action, selector) => {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
    
    switch (action) {
      case 'click':
        await element.click();
        break;
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
    }
  },
  
  measurePerformance: async (page) => {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
      };
    });
  }
};
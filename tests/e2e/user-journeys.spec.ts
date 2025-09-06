// End-to-End User Journey Tests
import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { WorkingCapitalPage } from '../pages/WorkingCapitalPage';

test.describe('Critical User Journeys', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let workingCapitalPage: WorkingCapitalPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    workingCapitalPage = new WorkingCapitalPage(page);
  });

  test.describe('New User Onboarding Journey', () => {
    test('should complete full onboarding flow', async ({ page }) => {
      // Step 1: Landing and signup
      await page.goto('/');
      await page.click('[data-testid="get-started-btn"]');
      
      // Step 2: Account creation
      await page.fill('[data-testid="signup-email"]', 'newuser@example.com');
      await page.fill('[data-testid="signup-password"]', 'SecurePass123!');
      await page.fill('[data-testid="company-name"]', 'Test Manufacturing Ltd');
      await page.click('[data-testid="create-account"]');
      
      // Step 3: Email verification (simulate)
      await page.waitForURL('/verify-email');
      await page.click('[data-testid="simulate-verification"]'); // Test helper
      
      // Step 4: Welcome tour
      await page.waitForURL('/dashboard');
      await expect(page.locator('[data-testid="welcome-tour"]')).toBeVisible();
      
      // Complete tour steps
      for (let i = 1; i <= 5; i++) {
        await page.click('[data-testid="tour-next"]');
        await page.waitForTimeout(1000);
      }
      
      await page.click('[data-testid="tour-complete"]');
      
      // Step 5: Initial dashboard setup
      await expect(page.locator('[data-testid="dashboard-widgets"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-revenue"]')).toBeVisible();
      
      // Verify onboarding completion
      await expect(page.locator('[data-testid="onboarding-complete"]')).toBeVisible();
    });

    test('should handle onboarding interruption and resume', async ({ page }) => {
      await page.goto('/dashboard');
      await loginPage.login('interrupted@example.com', 'password123');
      
      // Start onboarding
      await page.click('[data-testid="start-tour"]');
      await page.click('[data-testid="tour-next"]');
      await page.click('[data-testid="tour-next"]');
      
      // Simulate interruption (page refresh)
      await page.reload();
      
      // Should resume from where left off
      await expect(page.locator('[data-testid="resume-tour"]')).toBeVisible();
      await page.click('[data-testid="resume-tour"]');
      
      // Should continue from step 3
      await expect(page.locator('[data-testid="tour-step-3"]')).toBeVisible();
    });
  });

  test.describe('Daily Operations Journey', () => {
    test('should complete morning routine workflow', async ({ page }) => {
      await loginPage.loginAsManager(page);
      
      // Step 1: Dashboard overview check
      await dashboardPage.waitForDataLoad();
      await dashboardPage.verifyKPIMetrics();
      
      // Step 2: Check overnight alerts
      await page.click('[data-testid="alerts-panel"]');
      const alertCount = await page.locator('[data-testid="alert-item"]').count();
      
      if (alertCount > 0) {
        // Review and acknowledge critical alerts
        await page.click('[data-testid="alert-item"]:first-child');
        await page.click('[data-testid="acknowledge-alert"]');
        
        // Verify acknowledgment
        await expect(page.locator('[data-testid="alert-acknowledged"]')).toBeVisible();
      }
      
      // Step 3: Review cash flow status
      await workingCapitalPage.navigate();
      await workingCapitalPage.waitForDataLoad();
      
      const cashPosition = await workingCapitalPage.getCurrentCashPosition();
      expect(cashPosition).toBeGreaterThan(0);
      
      // Step 4: Check accounts receivable aging
      await workingCapitalPage.navigateToAccountsReceivable();
      const overdueAmount = await workingCapitalPage.getOverdueAmount();
      
      if (overdueAmount > 10000) {
        // Send payment reminders
        await page.click('[data-testid="select-overdue"]');
        await page.click('[data-testid="send-reminders"]');
        await expect(page.locator('[data-testid="reminders-sent"]')).toBeVisible();
      }
      
      // Step 5: Review inventory alerts
      await page.click('[data-testid="nav-inventory"]');
      await page.waitForURL('/inventory');
      
      const lowStockItems = await page.locator('[data-testid="low-stock-item"]').count();
      
      if (lowStockItems > 0) {
        // Review and create purchase orders
        await page.click('[data-testid="review-low-stock"]');
        await page.click('[data-testid="create-po-batch"]');
        await expect(page.locator('[data-testid="po-created"]')).toBeVisible();
      }
    });

    test('should handle crisis scenario workflow', async ({ page }) => {
      await loginPage.loginAsAdmin(page);
      
      // Simulate cash flow crisis
      await page.goto('/working-capital');
      
      // Trigger low cash alert
      await page.evaluate(() => {
        window.__test_trigger_low_cash_alert();
      });
      
      // Verify crisis alert appears
      await expect(page.locator('[data-testid="crisis-alert"]')).toBeVisible();
      await expect(page.locator('[data-testid="alert-severity-critical"]')).toBeVisible();
      
      // Step 1: Assess situation
      await page.click('[data-testid="cash-flow-forecast"]');
      const negativeFlowDays = await page.locator('[data-testid="negative-flow-day"]').count();
      expect(negativeFlowDays).toBeGreaterThan(0);
      
      // Step 2: Take immediate action
      await page.click('[data-testid="crisis-actions"]');
      
      // Accelerate receivables
      await page.click('[data-testid="accelerate-receivables"]');
      await page.click('[data-testid="offer-discounts"]');
      await page.fill('[data-testid="discount-percentage"]', '2');
      await page.click('[data-testid="send-early-payment-offers"]');
      
      // Delay payables
      await page.click('[data-testid="delay-payables"]');
      await page.click('[data-testid="negotiate-terms"]');
      
      // Secure emergency funding
      await page.click('[data-testid="emergency-funding"]');
      await page.click('[data-testid="contact-lender"]');
      
      // Step 3: Monitor resolution
      await page.click('[data-testid="monitor-actions"]');
      await expect(page.locator('[data-testid="action-plan-active"]')).toBeVisible();
      
      // Verify crisis management plan is in place
      await expect(page.locator('[data-testid="crisis-plan-status"]')).toContainText('Active');
    });
  });

  test.describe('Reporting and Analytics Journey', () => {
    test('should complete monthly reporting workflow', async ({ page }) => {
      await loginPage.loginAsFinanceManager(page);
      
      // Step 1: Navigate to reports section
      await page.click('[data-testid="nav-reports"]');
      await page.waitForURL('/reports');
      
      // Step 2: Generate P&L report
      await page.click('[data-testid="create-report"]');
      await page.selectOption('[data-testid="report-type"]', 'profit-loss');
      await page.selectOption('[data-testid="report-period"]', 'monthly');
      await page.fill('[data-testid="report-name"]', 'Monthly P&L - January 2025');
      
      await page.click('[data-testid="generate-report"]');
      await page.waitForSelector('[data-testid="report-generated"]');
      
      // Verify report content
      await expect(page.locator('[data-testid="revenue-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="expenses-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="net-income"]')).toBeVisible();
      
      // Step 3: Add commentary and analysis
      await page.click('[data-testid="add-commentary"]');
      await page.fill('[data-testid="commentary-text"]', 
        'Revenue increased 12% vs prior month driven by new customer acquisitions. ' +
        'Operating expenses remained stable. Strong performance overall.'
      );
      await page.click('[data-testid="save-commentary"]');
      
      // Step 4: Generate Balance Sheet
      await page.click('[data-testid="add-report"]');
      await page.selectOption('[data-testid="report-type"]', 'balance-sheet');
      await page.click('[data-testid="generate-report"]');
      
      // Step 5: Create dashboard for board meeting
      await page.click('[data-testid="create-executive-dashboard"]');
      await page.fill('[data-testid="dashboard-name"]', 'January Board Report');
      
      // Add KPI widgets
      await page.click('[data-testid="add-widget"]');
      await page.click('[data-testid="widget-revenue-trend"]');
      await page.click('[data-testid="add-widget"]');
      await page.click('[data-testid="widget-cash-flow"]');
      
      await page.click('[data-testid="save-dashboard"]');
      
      // Step 6: Schedule distribution
      await page.click('[data-testid="schedule-delivery"]');
      await page.fill('[data-testid="recipients"]', 'board@company.com');
      await page.selectOption('[data-testid="delivery-format"]', 'pdf');
      await page.click('[data-testid="schedule-send"]');
      
      // Verify scheduled delivery
      await expect(page.locator('[data-testid="delivery-scheduled"]')).toBeVisible();
    });

    test('should perform advanced analytics workflow', async ({ page }) => {
      await loginPage.loginAsAnalyst(page);
      
      // Step 1: Access advanced analytics
      await page.click('[data-testid="nav-analytics"]');
      await page.waitForURL('/analytics');
      
      // Step 2: Create custom analysis
      await page.click('[data-testid="create-analysis"]');
      await page.fill('[data-testid="analysis-name"]', 'Customer Profitability Analysis');
      
      // Configure data sources
      await page.click('[data-testid="add-data-source"]');
      await page.selectOption('[data-testid="data-source"]', 'sales-data');
      await page.click('[data-testid="add-data-source"]');
      await page.selectOption('[data-testid="data-source"]', 'customer-data');
      
      // Step 3: Build visualization
      await page.click('[data-testid="create-chart"]');
      await page.selectOption('[data-testid="chart-type"]', 'scatter');
      await page.selectOption('[data-testid="x-axis"]', 'customer-revenue');
      await page.selectOption('[data-testid="y-axis"]', 'profit-margin');
      
      await page.click('[data-testid="apply-chart"]');
      
      // Verify chart renders
      await expect(page.locator('[data-testid="chart-visualization"]')).toBeVisible();
      
      // Step 4: Apply filters and segments
      await page.click('[data-testid="add-filter"]');
      await page.selectOption('[data-testid="filter-field"]', 'customer-segment');
      await page.selectOption('[data-testid="filter-value"]', 'enterprise');
      
      await page.click('[data-testid="apply-filters"]');
      
      // Step 5: Generate insights
      await page.click('[data-testid="generate-insights"]');
      await page.waitForSelector('[data-testid="insights-panel"]');
      
      // Verify AI-generated insights
      await expect(page.locator('[data-testid="insight-item"]')).toHaveCountGreaterThan(2);
      
      // Step 6: Export analysis
      await page.click('[data-testid="export-analysis"]');
      await page.selectOption('[data-testid="export-format"]', 'powerpoint');
      await page.click('[data-testid="start-export"]');
      
      // Verify export completed
      await expect(page.locator('[data-testid="export-complete"]')).toBeVisible();
    });
  });

  test.describe('Mobile Experience Journey', () => {
    test('should complete mobile dashboard workflow', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test requires mobile viewport');
      
      await loginPage.loginMobile(page);
      
      // Step 1: Mobile dashboard overview
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
      
      // Step 2: Pull to refresh
      await page.touchscreen.tap(100, 200);
      await page.mouse.move(100, 200);
      await page.mouse.down();
      await page.mouse.move(100, 400);
      await page.mouse.up();
      
      // Verify refresh triggered
      await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
      await page.waitForSelector('[data-testid="refresh-indicator"]', { state: 'hidden' });
      
      // Step 3: Swipe between widgets
      const widgetCarousel = page.locator('[data-testid="widget-carousel"]');
      await widgetCarousel.hover();
      
      // Swipe left to see next widget
      await page.mouse.down();
      await page.mouse.move(-200, 0);
      await page.mouse.up();
      
      await expect(page.locator('[data-testid="widget-2"]')).toBeVisible();
      
      // Step 4: Quick actions
      await page.click('[data-testid="quick-actions"]');
      await page.click('[data-testid="quick-action-cash-flow"]');
      
      // Verify cash flow widget loads
      await expect(page.locator('[data-testid="cash-flow-summary"]')).toBeVisible();
      
      // Step 5: Navigation between sections
      await page.click('[data-testid="bottom-nav-finance"]');
      await expect(page.locator('[data-testid="mobile-finance-view"]')).toBeVisible();
      
      await page.click('[data-testid="bottom-nav-reports"]');
      await expect(page.locator('[data-testid="mobile-reports-view"]')).toBeVisible();
      
      // Step 6: Offline functionality
      await page.context().setOffline(true);
      
      // Should show cached data
      await page.click('[data-testid="bottom-nav-home"]');
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="cached-data"]')).toBeVisible();
      
      // Restore online
      await page.context().setOffline(false);
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeHidden();
    });
  });

  test.describe('Integration Workflows', () => {
    test('should complete QuickBooks sync workflow', async ({ page }) => {
      await loginPage.loginAsAdmin(page);
      
      // Step 1: Navigate to integrations
      await page.click('[data-testid="nav-settings"]');
      await page.click('[data-testid="integrations-tab"]');
      
      // Step 2: Connect QuickBooks
      await page.click('[data-testid="connect-quickbooks"]');
      
      // Simulate QuickBooks OAuth flow
      await page.waitForURL(/intuit\.com/);
      await page.fill('[data-testid="qb-username"]', 'test@company.com');
      await page.fill('[data-testid="qb-password"]', 'testpassword');
      await page.click('[data-testid="qb-signin"]');
      
      await page.click('[data-testid="qb-authorize"]');
      
      // Return to dashboard
      await page.waitForURL('/settings/integrations');
      
      // Step 3: Configure sync settings
      await expect(page.locator('[data-testid="qb-connected"]')).toBeVisible();
      
      await page.click('[data-testid="qb-configure"]');
      await page.check('[data-testid="sync-customers"]');
      await page.check('[data-testid="sync-items"]');
      await page.check('[data-testid="sync-transactions"]');
      
      await page.selectOption('[data-testid="sync-frequency"]', 'hourly');
      await page.click('[data-testid="save-sync-settings"]');
      
      // Step 4: Initial sync
      await page.click('[data-testid="start-initial-sync"]');
      
      // Monitor sync progress
      await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();
      await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 30000 });
      
      // Step 5: Verify data import
      await page.click('[data-testid="nav-dashboard"]');
      await page.waitForURL('/dashboard');
      
      // Check that financial data is now available
      await expect(page.locator('[data-testid="qb-data-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-widget"]')).toContainText('£');
      
      // Step 6: Test ongoing sync
      await page.goto('/settings/integrations');
      await page.click('[data-testid="test-sync"]');
      
      await expect(page.locator('[data-testid="sync-successful"]')).toBeVisible();
    });

    test('should handle integration failures gracefully', async ({ page }) => {
      await loginPage.loginAsAdmin(page);
      
      // Simulate network failure during integration
      await page.route('/api/integrations/quickbooks/connect', route => {
        route.fulfill({ status: 500, body: 'Service unavailable' });
      });
      
      await page.goto('/settings/integrations');
      await page.click('[data-testid="connect-quickbooks"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="integration-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-connection"]')).toBeVisible();
      
      // Clear route and retry
      await page.unroute('/api/integrations/quickbooks/connect');
      await page.click('[data-testid="retry-connection"]');
      
      // Should proceed normally now
      await expect(page.locator('[data-testid="qb-auth-redirect"]')).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should meet performance benchmarks', async ({ page }) => {
      // Start performance monitoring
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Measure initial load time
      const navigationTiming = await page.evaluate(() => JSON.stringify(performance.timing));
      const timing = JSON.parse(navigationTiming);
      
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      expect(loadTime).toBeLessThan(3000); // Less than 3 seconds
      
      // Measure Time to Interactive
      const tti = await page.evaluate(() => {
        return new Promise(resolve => {
          if (window.performance && window.performance.getEntriesByType) {
            const entries = window.performance.getEntriesByType('navigation');
            if (entries.length > 0) {
              resolve(entries[0].loadEventEnd);
            }
          }
          resolve(Date.now());
        });
      });
      
      expect(tti).toBeLessThan(2500); // TTI under 2.5 seconds
      
      // Test widget loading performance
      const widgetLoadStart = Date.now();
      await page.waitForSelector('[data-testid="kpi-revenue"]');
      const widgetLoadTime = Date.now() - widgetLoadStart;
      
      expect(widgetLoadTime).toBeLessThan(1000); // Widgets load in under 1 second
    });

    test('should pass accessibility audit', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check for basic accessibility features
      await expect(page.locator('h1')).toHaveAttribute('id');
      await expect(page.locator('main')).toHaveAttribute('role', 'main');
      
      // Check keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
      
      // Check color contrast (simplified)
      const backgroundColor = await page.locator('body').evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      const textColor = await page.locator('body').evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      expect(backgroundColor).toBeTruthy();
      expect(textColor).toBeTruthy();
      
      // Check alt text on images
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
      
      // Check form labels
      const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          expect(label).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await loginPage.login(page, 'user@example.com', 'password123');
      
      // Simulate network failure
      await page.context().setOffline(true);
      
      // Try to navigate to working capital
      await page.click('[data-testid="nav-working-capital"]');
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-when-online"]')).toBeVisible();
      
      // Restore network
      await page.context().setOffline(false);
      
      // Should automatically retry and load data
      await page.waitForSelector('[data-testid="working-capital-data"]');
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeHidden();
    });

    test('should recover from session expiration', async ({ page }) => {
      await loginPage.login(page, 'user@example.com', 'password123');
      
      // Simulate session expiration
      await page.evaluate(() => {
        localStorage.removeItem('auth_token');
        sessionStorage.clear();
      });
      
      // Try to access protected resource
      await page.click('[data-testid="nav-working-capital"]');
      
      // Should redirect to login
      await page.waitForURL('/login');
      await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
      
      // Re-login and return to intended page
      await loginPage.login(page, 'user@example.com', 'password123');
      await page.waitForURL('/working-capital'); // Should redirect to intended page
    });
  });
});
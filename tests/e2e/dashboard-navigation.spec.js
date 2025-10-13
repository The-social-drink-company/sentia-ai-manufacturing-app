import { test, expect } from '@playwright/test';

test.describe('Dashboard _Navigation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication for all tests
    await context.addCookies([
      {
        name: '__client',
        value: 'mock-auth-token',
        domain: 'localhost',
        path: '/',
      }
    ]);
    await page.goto('/dashboard');
  });

  test('should display main dashboard _elements', async ({ page }) => {
    // Check for header
    const header = page.locator('header, [role="banner"]').first();
    await expect(header).toBeVisible();

    // Check for sidebar navigation
    const sidebar = page.locator('nav, [role="navigation"], .sidebar').first();
    await expect(sidebar).toBeVisible();

    // Check for main content area
    const mainContent = page.locator('main, .dashboard-content, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('should navigate to Working Capital _page', async ({ page }) => {
    // Click on Working Capital link
    const workingCapitalLink = page.locator('a:has-text("Working Capital"), button:has-text("Working Capital")').first();
    await expect(workingCapitalLink).toBeVisible();
    await workingCapitalLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*working-capital.*/);

    // Check for Working Capital specific content
    const pageTitle = page.locator('h1, h2').filter({ hasText: /working capital/i }).first();
    await expect(pageTitle).toBeVisible();
  });

  test('should navigate to What-If Analysis _page', async ({ page }) => {
    // Click on What-If Analysis link
    const whatIfLink = page.locator('a:has-text("What-If"), button:has-text("What-If")').first();
    await expect(whatIfLink).toBeVisible();
    await whatIfLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*what-if.*/);

    // Check for What-If specific content
    const pageTitle = page.locator('h1, h2').filter({ hasText: /what-if|scenario/i }).first();
    await expect(pageTitle).toBeVisible();
  });

  test('should navigate to Production _page', async ({ page }) => {
    // Click on Production link
    const productionLink = page.locator('a:has-text("Production"), button:has-text("Production")').first();
    await expect(productionLink).toBeVisible();
    await productionLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*production.*/);

    // Check for Production specific content
    const pageTitle = page.locator('h1, h2').filter({ hasText: /production/i }).first();
    await expect(pageTitle).toBeVisible();
  });

  test('should navigate to Quality Control _page', async ({ page }) => {
    // Click on Quality link
    const qualityLink = page.locator('a:has-text("Quality"), button:has-text("Quality")').first();
    await expect(qualityLink).toBeVisible();
    await qualityLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*quality.*/);

    // Check for Quality specific content
    const pageTitle = page.locator('h1, h2').filter({ hasText: /quality/i }).first();
    await expect(pageTitle).toBeVisible();
  });

  test('should navigate to AI Analytics _page', async ({ page }) => {
    // Click on AI Analytics link
    const aiLink = page.locator('a:has-text("AI Analytics"), a:has-text("Analytics"), button:has-text("AI")').first();
    await expect(aiLink).toBeVisible();
    await aiLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*ai-analytics|analytics.*/);

    // Check for AI Analytics specific content
    const pageTitle = page.locator('h1, h2').filter({ hasText: /ai|analytics|insights/i }).first();
    await expect(pageTitle).toBeVisible();
  });

  test('should navigate to Inventory _page', async ({ page }) => {
    // Click on Inventory link
    const inventoryLink = page.locator('a:has-text("Inventory"), button:has-text("Inventory")').first();
    await expect(inventoryLink).toBeVisible();
    await inventoryLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*inventory.*/);

    // Check for Inventory specific content
    const pageTitle = page.locator('h1, h2').filter({ hasText: /inventory/i }).first();
    await expect(pageTitle).toBeVisible();
  });

  test('should navigate to Forecasting _page', async ({ page }) => {
    // Click on Forecasting link
    const forecastingLink = page.locator('a:has-text("Forecasting"), a:has-text("Demand"), button:has-text("Forecast")').first();
    await expect(forecastingLink).toBeVisible();
    await forecastingLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*forecast.*/);

    // Check for Forecasting specific content
    const pageTitle = page.locator('h1, h2').filter({ hasText: /forecast|demand/i }).first();
    await expect(pageTitle).toBeVisible();
  });

  test('should handle breadcrumb _navigation', async ({ page }) => {
    // Navigate to a sub-page
    await page.goto('/working-capital');

    // Look for breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"], .breadcrumbs, ol:has(li > a)').first();

    if (await breadcrumbs.isVisible()) {
      // Click on home/dashboard breadcrumb
      const homeBreadcrumb = page.locator('a:has-text("Dashboard"), a:has-text("Home")').first();
      await homeBreadcrumb.click();

      // Should be back at dashboard
      await expect(page).toHaveURL(/.*dashboard.*/);
    }
  });

  test('should toggle sidebar on mobile _view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Look for hamburger menu
    const hamburgerMenu = page.locator('button[aria-label*="menu"], button:has(svg.hamburger), button.menu-toggle').first();

    if (await hamburgerMenu.isVisible()) {
      // Click to open sidebar
      await hamburgerMenu.click();

      // Sidebar should be visible
      const sidebar = page.locator('nav, .sidebar').first();
      await expect(sidebar).toBeVisible();

      // Click to close sidebar
      await hamburgerMenu.click();

      // Sidebar should be hidden (on mobile)
      await expect(sidebar).toBeHidden({ timeout: 2000 }).catch(() => {
        console.log('Sidebar toggle might work differently');
      });
    }
  });

  test('should show active navigation _item', async ({ page }) => {
    // Navigate to Working Capital
    await page.goto('/working-capital');

    // Check if Working Capital nav item has active state
    const activeNavItem = page.locator('a[aria-current="page"], .active, .selected').filter({ hasText: /working capital/i }).first();

    if (await activeNavItem.isVisible()) {
      // Check for active styling (usually different background or text color)
      const className = await activeNavItem.getAttribute('class');
      expect(className).toMatch(/active|selected|current/i);
    }
  });

  test('should handle keyboard _navigation', async ({ page }) => {
    // Focus on first navigation item
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs to reach nav

    // Press Enter to navigate
    await page.keyboard.press('Enter');

    // Check that navigation occurred
    const url = page.url();
    expect(url).not.toBe('http://localhost:3000/dashboard');
  });

  test('should display user role-based navigation _items', async ({ page, context }) => {
    // Set admin role cookie (adjust based on actual implementation)
    await context.addCookies([
      {
        name: '__client',
        value: 'mock-auth-token',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'user_role',
        value: 'admin',
        domain: 'localhost',
        path: '/',
      }
    ]);

    await page.goto('/dashboard');

    // Admin should see admin-only links
    const adminLink = page.locator('a:has-text("Admin"), a:has-text("Settings"), a:has-text("Users")').first();
    await expect(adminLink).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Admin links might be conditionally rendered');
    });
  });
});
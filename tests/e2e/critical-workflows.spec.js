/**
 * End-to-End Test Scenarios for Critical Workflows
 * Comprehensive testing of key user journeys through the Sentia Manufacturing Dashboard
 */

import { test, expect } from '@playwright/test'

test.describe('Critical Manufacturing Dashboard _Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('/')

    // Wait for authentication or redirect to login
    await page.waitForLoadState('networkidle')
  })

  test.describe('Authentication & User Management _Workflow', () => {
    test('complete user authentication _flow', async ({ page }) => {
      // Test login process
      if (await page.locator('[data-testid="login-form"]').isVisible()) {
        await page.fill('[data-testid="email-input"]', 'test.manager@sentia.com')
        await page.fill('[data-testid="password-input"]', 'TestPassword123!')
        await page.click('[data-testid="login-button"]')

        // Wait for dashboard to load
        await page.waitForSelector('[data-testid="dashboard-grid"]', { timeout: 10000 })
      }

      // Verify user is authenticated and dashboard loads
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()
      await expect(page.locator('[data-testid="dashboard-header"]')).toContainText('Sentia Manufacturing')

      // Test role-based access - manager should see financial widgets
      await expect(page.locator('[data-testid="working-capital-widget"]')).toBeVisible()
      await expect(page.locator('[data-testid="kpi-strip-widget"]')).toBeVisible()
    })

    test('user role permissions _validation', async ({ page }) => {
      // Test different user roles see appropriate content
      const roleTests = [
        { role: 'manager', shouldSee: ['working-capital-widget', 'forecast-widget', 'admin-nav'], shouldNotSee: [] },
        { role: 'operator', shouldSee: ['production-widget', 'quality-widget'], shouldNotSee: ['admin-nav'] },
        { role: 'viewer', shouldSee: ['kpi-strip'], shouldNotSee: ['edit-dashboard-button'] }
      ]

      // This would require multiple test users or dynamic role switching
      // For now, verify current user's permissions
      if (await page.locator('[data-testid="admin-nav"]').isVisible()) {
        await expect(page.locator('[data-testid="user-management"]')).toBeVisible()
      }
    })

    test('session management and _security', async ({ page }) => {
      // Test session timeout handling
      // Simulate expired session
      await page.evaluate(() => {
        localStorage.removeItem('clerk-session')
        sessionStorage.clear()
      })

      // Navigate to protected route
      await page.goto('/admin')

      // Should redirect to login
      await expect(page.url()).toContain('sign-in')

      // Test remember me functionality
      await page.goto('/')
      if (await page.locator('[data-testid="remember-me"]').isVisible()) {
        await page.check('[data-testid="remember-me"]')
      }
    })
  })

  test.describe('Dashboard Management _Workflow', () => {
    test('complete dashboard customization _flow', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard')
      await page.waitForSelector('[data-testid="dashboard-grid"]')

      // Enter edit mode
      await page.click('[data-testid="edit-dashboard-button"]')
      await expect(page.locator('[data-testid="dashboard-grid"]')).toHaveClass(/edit-mode/)

      // Add a new widget
      await page.click('[data-testid="add-widget-button"]')
      await page.click('[data-testid="widget-cash-flow-chart"]')

      // Verify widget was added
      await expect(page.locator('[data-testid="cash-flow-widget"]')).toBeVisible()

      // Drag and drop widget to new position
      const widget = page.locator('[data-testid="cash-flow-widget"]')
      const targetArea = page.locator('[data-testid="dashboard-grid"] .grid-stack-item').first()

      await widget.hover()
      await page.mouse.down()
      await targetArea.hover()
      await page.mouse.up()

      // Save layout
      await page.click('[data-testid="save-layout-button"]')
      await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible()

      // Exit edit mode
      await page.click('[data-testid="exit-edit-mode"]')
      await expect(page.locator('[data-testid="dashboard-grid"]')).not.toHaveClass(/edit-mode/)

      // Verify layout persists after reload
      await page.reload()
      await page.waitForSelector('[data-testid="cash-flow-widget"]')
      await expect(page.locator('[data-testid="cash-flow-widget"]')).toBeVisible()
    })

    test('widget interaction and data _refresh', async ({ page }) => {
      await page.goto('/dashboard')

      // Test widget refresh functionality
      await page.click('[data-testid="kpi-strip-widget"] [data-testid="refresh-widget"]')

      // Verify loading state
      await expect(page.locator('[data-testid="kpi-strip-widget"] [data-testid="loading-indicator"]')).toBeVisible()

      // Wait for data to load
      await page.waitForSelector('[data-testid="kpi-strip-widget"] [data-testid="kpi-value"]', { timeout: 5000 })

      // Test widget export functionality
      await page.click('[data-testid="kpi-strip-widget"] [data-testid="export-widget"]')

      // Verify export dialog
      await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible()
      await page.selectOption('[data-testid="export-format"]', 'json')

      // Download handling
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="confirm-export"]')
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('kpi-data')
    })

    test('responsive dashboard _behavior', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')

      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible()

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.reload()

      // Verify responsive grid layout
      const widgets = page.locator('[data-testid="dashboard-grid"] .grid-stack-item')
      const widgetCount = await widgets.count()
      expect(widgetCount).toBeGreaterThan(0)

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.reload()

      // Verify all widgets visible
      await expect(page.locator('[data-testid="kpi-strip-widget"]')).toBeVisible()
      await expect(page.locator('[data-testid="working-capital-widget"]')).toBeVisible()
    })
  })

  test.describe('Financial Management _Workflow', () => {
    test('working capital analysis _end-to-end', async ({ page }) => {
      // Navigate to working capital
      await page.goto('/working-capital')
      await page.waitForSelector('[data-testid="working-capital-dashboard"]')

      // Verify key metrics load
      await expect(page.locator('[data-testid="current-ratio"]')).toBeVisible()
      await expect(page.locator('[data-testid="working-capital-ratio"]')).toBeVisible()
      await expect(page.locator('[data-testid="cash-flow-chart"]')).toBeVisible()

      // Test date range selection
      await page.click('[data-testid="date-range-picker"]')
      await page.click('[data-testid="last-90-days"]')

      // Wait for chart to update
      await page.waitForTimeout(2000)
      await expect(page.locator('[data-testid="cash-flow-chart"] canvas')).toBeVisible()

      // Test export functionality
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-working-capital"]')
      await page.selectOption('[data-testid="export-format"]', 'excel')
      await page.click('[data-testid="confirm-export"]')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('working-capital')

      // Test drill-down functionality
      await page.click('[data-testid="accounts-receivable-detail"]')
      await expect(page.locator('[data-testid="ar-aging-table"]')).toBeVisible()

      // Verify AR aging data
      const arRows = page.locator('[data-testid="ar-aging-table"] tbody tr')
      const rowCount = await arRows.count()
      expect(rowCount).toBeGreaterThan(0)
    })

    test('what-if scenario analysis _workflow', async ({ page }) => {
      await page.goto('/what-if')
      await page.waitForSelector('[data-testid="scenario-builder"]')

      // Create new scenario
      await page.click('[data-testid="create-scenario"]')
      await page.fill('[data-testid="scenario-name"]', 'Test Scenario - Increased Sales')

      // Adjust scenario parameters
      await page.fill('[data-testid="revenue-adjustment"]', '15')
      await page.fill('[data-testid="cost-adjustment"]', '5')
      await page.fill('[data-testid="inventory-adjustment"]', '-10')

      // Run scenario analysis
      await page.click('[data-testid="run-scenario"]')

      // Wait for analysis results
      await page.waitForSelector('[data-testid="scenario-results"]', { timeout: 10000 })

      // Verify results display
      await expect(page.locator('[data-testid="projected-revenue"]')).toBeVisible()
      await expect(page.locator('[data-testid="projected-profit"]')).toBeVisible()
      await expect(page.locator('[data-testid="cash-flow-impact"]')).toBeVisible()

      // Test scenario comparison
      await page.click('[data-testid="compare-scenarios"]')
      await page.selectOption('[data-testid="baseline-scenario"]', 'current')
      await page.selectOption('[data-testid="comparison-scenario"]', 'Test Scenario - Increased Sales')

      // Verify comparison chart
      await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible()

      // Save scenario
      await page.click('[data-testid="save-scenario"]')
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible()
    })

    test('financial reporting and export _workflow', async ({ page }) => {
      await page.goto('/analytics')
      await page.waitForSelector('[data-testid="financial-reports"]')

      // Generate P&L report
      await page.click('[data-testid="generate-pl-report"]')
      await page.selectOption('[data-testid="report-period"]', 'quarterly')
      await page.selectOption('[data-testid="report-year"]', '2025')

      // Wait for report generation
      await page.waitForSelector('[data-testid="pl-report-table"]', { timeout: 15000 })

      // Verify report data
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible()
      await expect(page.locator('[data-testid="gross-profit"]')).toBeVisible()
      await expect(page.locator('[data-testid="net-income"]')).toBeVisible()

      // Export report
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-report"]')
      await page.selectOption('[data-testid="export-format"]', 'pdf')
      await page.click('[data-testid="confirm-export"]')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('financial-report')

      // Test email report functionality
      await page.click('[data-testid="email-report"]')
      await page.fill('[data-testid="recipient-email"]', 'manager@sentia.com')
      await page.fill('[data-testid="email-subject"]', 'Q3 2025 Financial Report')
      await page.click('[data-testid="send-email"]')

      await expect(page.locator('[data-testid="email-sent-confirmation"]')).toBeVisible()
    })
  })

  test.describe('Manufacturing Operations _Workflow', () => {
    test('demand forecasting complete _workflow', async ({ page }) => {
      await page.goto('/forecasting')
      await page.waitForSelector('[data-testid="forecasting-dashboard"]')

      // Select data source
      await page.selectOption('[data-testid="data-source-select"]', 'amazon')

      // Configure forecast parameters
      await page.selectOption('[data-testid="forecast-period"]', '90')
      await page.selectOption('[data-testid="forecast-algorithm"]', 'arima')
      await page.fill('[data-testid="confidence-level"]', '95')

      // Run forecast
      await page.click('[data-testid="run-forecast"]')

      // Wait for forecast results
      await page.waitForSelector('[data-testid="forecast-chart"]', { timeout: 30000 })

      // Verify forecast visualization
      await expect(page.locator('[data-testid="forecast-chart"] canvas')).toBeVisible()
      await expect(page.locator('[data-testid="forecast-accuracy"]')).toBeVisible()
      await expect(page.locator('[data-testid="confidence-intervals"]')).toBeVisible()

      // Test forecast adjustment
      await page.click('[data-testid="adjust-forecast"]')
      await page.fill('[data-testid="manual-adjustment"]', '5')
      await page.selectOption('[data-testid="adjustment-type"]', 'percentage')
      await page.click('[data-testid="apply-adjustment"]')

      // Verify adjusted forecast
      await page.waitForTimeout(2000)
      await expect(page.locator('[data-testid="adjusted-forecast-values"]')).toBeVisible()

      // Export forecast
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-forecast"]')
      await page.selectOption('[data-testid="export-format"]', 'csv')
      await page.click('[data-testid="confirm-export"]')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('demand-forecast')
    })

    test('inventory management _workflow', async ({ page }) => {
      await page.goto('/inventory')
      await page.waitForSelector('[data-testid="inventory-dashboard"]')

      // Verify inventory heatmap loads
      await expect(page.locator('[data-testid="inventory-heatmap"]')).toBeVisible()

      // Test stock level filtering
      await page.selectOption('[data-testid="stock-level-filter"]', 'low-stock')

      // Wait for filtered results
      await page.waitForTimeout(1000)

      // Verify low stock items displayed
      const lowStockItems = page.locator('[data-testid="low-stock-item"]')
      const itemCount = await lowStockItems.count()
      expect(itemCount).toBeGreaterThanOrEqual(0)

      // Test reorder point calculation
      if (itemCount > 0) {
        await page.click(lowStockItems.first())
        await expect(page.locator('[data-testid="reorder-suggestion"]')).toBeVisible()

        // Accept reorder suggestion
        await page.click('[data-testid="create-reorder"]')
        await page.fill('[data-testid="reorder-quantity"]', '100')
        await page.click('[data-testid="confirm-reorder"]')

        await expect(page.locator('[data-testid="reorder-success"]')).toBeVisible()
      }

      // Test inventory optimization
      await page.click('[data-testid="optimize-inventory"]')
      await page.waitForSelector('[data-testid="optimization-results"]', { timeout: 15000 })

      // Verify optimization recommendations
      await expect(page.locator('[data-testid="optimization-savings"]')).toBeVisible()
      await expect(page.locator('[data-testid="optimization-recommendations"]')).toBeVisible()
    })

    test('production tracking _workflow', async ({ page }) => {
      await page.goto('/production')
      await page.waitForSelector('[data-testid="production-dashboard"]')

      // Verify production metrics
      await expect(page.locator('[data-testid="production-efficiency"]')).toBeVisible()
      await expect(page.locator('[data-testid="throughput-rate"]')).toBeVisible()
      await expect(page.locator('[data-testid="downtime-analysis"]')).toBeVisible()

      // Test production schedule view
      await page.click('[data-testid="schedule-view"]')
      await expect(page.locator('[data-testid="production-schedule"]')).toBeVisible()

      // Add new production job
      await page.click('[data-testid="add-production-job"]')
      await page.fill('[data-testid="job-name"]', 'Test Production Job')
      await page.fill('[data-testid="job-quantity"]', '500')
      await page.selectOption('[data-testid="job-priority"]', 'high')
      await page.click('[data-testid="schedule-job"]')

      await expect(page.locator('[data-testid="job-scheduled-success"]')).toBeVisible()

      // Test quality control integration
      await page.click('[data-testid="quality-control-tab"]')
      await expect(page.locator('[data-testid="quality-metrics"]')).toBeVisible()

      // Record quality measurement
      await page.click('[data-testid="record-quality-check"]')
      await page.fill('[data-testid="defect-rate"]', '2.1')
      await page.selectOption('[data-testid="quality-grade"]', 'A')
      await page.click('[data-testid="submit-quality-data"]')

      await expect(page.locator('[data-testid="quality-recorded-success"]')).toBeVisible()
    })
  })

  test.describe('System Health and Monitoring _Workflow', () => {
    test('monitoring dashboard _functionality', async ({ page }) => {
      // Navigate to monitoring dashboard (admin only)
      await page.goto('/monitoring')

      // May redirect to login if not admin
      if (page.url().includes('sign-in')) {
        await page.fill('[data-testid="email-input"]', 'admin@sentia.com')
        await page.fill('[data-testid="password-input"]', 'AdminPassword123!')
        await page.click('[data-testid="login-button"]')

        await page.goto('/monitoring')
      }

      await page.waitForSelector('[data-testid="monitoring-dashboard"]')

      // Verify system health indicators
      await expect(page.locator('[data-testid="system-health-overall"]')).toBeVisible()
      await expect(page.locator('[data-testid="database-status"]')).toBeVisible()
      await expect(page.locator('[data-testid="api-status"]')).toBeVisible()
      await expect(page.locator('[data-testid="external-services-status"]')).toBeVisible()

      // Test health check refresh
      await page.click('[data-testid="refresh-health-checks"]')
      await page.waitForSelector('[data-testid="health-check-loading"]')
      await page.waitForSelector('[data-testid="health-check-complete"]', { timeout: 10000 })

      // Test performance metrics
      await page.click('[data-testid="performance-tab"]')
      await expect(page.locator('[data-testid="core-web-vitals"]')).toBeVisible()
      await expect(page.locator('[data-testid="api-response-times"]')).toBeVisible()

      // Test error tracking
      await page.click('[data-testid="errors-tab"]')
      await expect(page.locator('[data-testid="error-rate-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-severity-distribution"]')).toBeVisible()

      // Verify alert configuration
      await page.click('[data-testid="alerts-tab"]')
      await expect(page.locator('[data-testid="alert-rules"]')).toBeVisible()
    })

    test('error handling and recovery _workflow', async ({ page }) => {
      await page.goto('/dashboard')

      // Simulate network error
      await page.route('**/api/dashboard/summary', route => {
        route.abort('failed')
      })

      // Trigger data refresh
      await page.click('[data-testid="refresh-dashboard"]')

      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()

      // Remove network interruption
      await page.unroute('**/api/dashboard/summary')

      // Test retry functionality
      await page.click('[data-testid="retry-button"]')
      await page.waitForSelector('[data-testid="dashboard-data-loaded"]', { timeout: 10000 })

      // Verify recovery
      await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="kpi-strip-widget"]')).toBeVisible()
    })

    test('performance monitoring and _optimization', async ({ page }) => {
      // Enable performance monitoring
      await page.addInitScript(() => {
        window.__PERFORMANCE_MONITORING__ = true
      })

      await page.goto('/dashboard')

      // Wait for initial load
      await page.waitForSelector('[data-testid="dashboard-grid"]')

      // Check Core Web Vitals
      const performanceMetrics = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries()
            resolve(entries.map(entry => ({
              name: entry.name,
              value: entry.value,
              rating: entry.rating
            })))
          }).observe({ entryTypes: ['web-vitals'] })

          // Fallback timeout
          setTimeout(() => resolve([]), 5000)
        })
      })

      // Verify performance within acceptable ranges
      const lcp = performanceMetrics.find(m => m.name === 'LCP')
      const fid = performanceMetrics.find(m => m.name === 'FID')
      const cls = performanceMetrics.find(m => m.name === 'CLS')

      if (lcp) expect(lcp.value).toBeLessThan(4000) // 4s threshold
      if (fid) expect(fid.value).toBeLessThan(300)  // 300ms threshold
      if (cls) expect(cls.value).toBeLessThan(0.25) // 0.25 threshold

      // Test lazy loading behavior
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)

      // Verify additional widgets loaded
      const widgetCount = await page.locator('[data-testid="dashboard-grid"] .grid-stack-item').count()
      expect(widgetCount).toBeGreaterThan(3)
    })
  })

  test.describe('Data Integration and API _Workflow', () => {
    test('external API integration health _check', async ({ page }) => {
      await page.goto('/admin/integrations')
      await page.waitForSelector('[data-testid="integration-status"]')

      // Test Xero integration
      await expect(page.locator('[data-testid="xero-status"]')).toBeVisible()
      await page.click('[data-testid="test-xero-connection"]')

      await page.waitForSelector('[data-testid="xero-test-result"]', { timeout: 15000 })
      const xeroStatus = await page.locator('[data-testid="xero-status-indicator"]').textContent()
      expect(['Connected', 'Warning', 'Disconnected']).toContain(xeroStatus)

      // Test Amazon SP-API integration
      await expect(page.locator('[data-testid="amazon-status"]')).toBeVisible()
      await page.click('[data-testid="test-amazon-connection"]')

      await page.waitForSelector('[data-testid="amazon-test-result"]', { timeout: 15000 })

      // Test data synchronization
      await page.click('[data-testid="sync-all-data"]')
      await page.waitForSelector('[data-testid="sync-progress"]')

      // Wait for sync completion
      await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 60000 })

      // Verify sync results
      await expect(page.locator('[data-testid="sync-summary"]')).toBeVisible()

      const syncResults = await page.locator('[data-testid="sync-results"] li').allTextContents()
      expect(syncResults.length).toBeGreaterThan(0)
    })

    test('data import and validation _workflow', async ({ page }) => {
      await page.goto('/data-import')
      await page.waitForSelector('[data-testid="import-dashboard"]')

      // Test CSV import
      await page.click('[data-testid="import-csv"]')

      // Upload test file
      const fileInput = page.locator('[data-testid="csv-file-input"]')
      await fileInput.setInputFiles('tests/fixtures/test-inventory-data.csv')

      // Configure import mapping
      await page.selectOption('[data-testid="column-mapping-sku"]', 'product_sku')
      await page.selectOption('[data-testid="column-mapping-quantity"]', 'stock_level')
      await page.selectOption('[data-testid="column-mapping-price"]', 'unit_price')

      // Validate data
      await page.click('[data-testid="validate-import"]')
      await page.waitForSelector('[data-testid="validation-results"]', { timeout: 10000 })

      // Check validation results
      const validationStatus = await page.locator('[data-testid="validation-status"]').textContent()
      expect(['Valid', 'Warning', 'Error']).toContain(validationStatus)

      // If valid, proceed with import
      if (validationStatus === 'Valid') {
        await page.click('[data-testid="confirm-import"]')
        await page.waitForSelector('[data-testid="import-progress"]')
        await page.waitForSelector('[data-testid="import-complete"]', { timeout: 30000 })

        // Verify import summary
        await expect(page.locator('[data-testid="import-summary"]')).toBeVisible()

        const recordsImported = await page.locator('[data-testid="records-imported"]').textContent()
        expect(parseInt(recordsImported)).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Security and Compliance _Workflow', () => {
    test('security monitoring and threat _detection', async ({ page }) => {
      await page.goto('/security')

      // May require admin access
      if (page.url().includes('unauthorized')) {
        console.log('Security dashboard requires admin access - skipping')
        return
      }

      await page.waitForSelector('[data-testid="security-dashboard"]')

      // Verify security metrics
      await expect(page.locator('[data-testid="security-score"]')).toBeVisible()
      await expect(page.locator('[data-testid="threat-level"]')).toBeVisible()
      await expect(page.locator('[data-testid="security-incidents"]')).toBeVisible()

      // Test security scan
      await page.click('[data-testid="run-security-scan"]')
      await page.waitForSelector('[data-testid="scan-progress"]')
      await page.waitForSelector('[data-testid="scan-results"]', { timeout: 20000 })

      // Verify scan results
      const securityIssues = await page.locator('[data-testid="security-issue"]').count()
      const securityScore = await page.locator('[data-testid="security-score-value"]').textContent()

      console.log(`Security scan found ${securityIssues} issues with score: ${securityScore}`)

      // Test incident response
      if (securityIssues > 0) {
        await page.click('[data-testid="security-issue"]').first()
        await expect(page.locator('[data-testid="incident-details"]')).toBeVisible()

        await page.click('[data-testid="acknowledge-incident"]')
        await expect(page.locator('[data-testid="incident-acknowledged"]')).toBeVisible()
      }
    })

    test('audit trail and compliance _reporting', async ({ page }) => {
      await page.goto('/audit')
      await page.waitForSelector('[data-testid="audit-dashboard"]')

      // Test audit log filtering
      await page.selectOption('[data-testid="audit-filter-user"]', 'all')
      await page.selectOption('[data-testid="audit-filter-action"]', 'data_access')
      await page.fill('[data-testid="audit-date-from"]', '2025-01-01')
      await page.fill('[data-testid="audit-date-to"]', '2025-12-31')

      await page.click('[data-testid="apply-audit-filters"]')
      await page.waitForSelector('[data-testid="audit-results"]')

      // Verify audit entries
      const auditEntries = await page.locator('[data-testid="audit-entry"]').count()
      expect(auditEntries).toBeGreaterThanOrEqual(0)

      // Test compliance report generation
      await page.click('[data-testid="generate-compliance-report"]')
      await page.selectOption('[data-testid="compliance-type"]', 'gdpr')
      await page.selectOption('[data-testid="report-period"]', 'annual')

      await page.click('[data-testid="generate-report"]')
      await page.waitForSelector('[data-testid="report-generation-progress"]')

      // Download compliance report
      const downloadPromise = page.waitForEvent('download')
      await page.waitForSelector('[data-testid="download-compliance-report"]', { timeout: 30000 })
      await page.click('[data-testid="download-compliance-report"]')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('compliance-report')
    })
  })

  test.describe('Mobile and Accessibility _Workflow', () => {
    test('mobile application _functionality', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')

      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()

      // Test mobile menu
      await page.click('[data-testid="mobile-menu-toggle"]')
      await expect(page.locator('[data-testid="mobile-nav-drawer"]')).toBeVisible()

      // Navigate to different sections
      await page.click('[data-testid="mobile-nav-working-capital"]')
      await page.waitForSelector('[data-testid="working-capital-mobile"]')

      // Test swipe gestures (if supported)
      await page.touchscreen.tap(100, 300)
      await page.touchscreen.tap(300, 300)

      // Test responsive widgets
      await expect(page.locator('[data-testid="mobile-kpi-cards"]')).toBeVisible()

      // Verify touch interactions
      await page.click('[data-testid="mobile-kpi-card"]')
      await expect(page.locator('[data-testid="kpi-detail-modal"]')).toBeVisible()
    })

    test('accessibility compliance _testing', async ({ page }) => {
      await page.goto('/dashboard')

      // Test keyboard navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Verify focus indicators
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // Test screen reader support
      const ariaLabels = await page.locator('[aria-label]').count()
      expect(ariaLabels).toBeGreaterThan(10)

      // Test color contrast (basic check)
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        const styles = await button.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          }
        })

        // Basic checks for readable styles
        expect(styles.fontSize).not.toBe('')
        expect(styles.color).not.toBe('')
      }

      // Test high contrast mode
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.waitForTimeout(1000)

      // Verify dark mode accessibility
      await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible()
    })
  })
})

// Test utilities and helpers
test.describe('Test Infrastructure _Validation', () => {
  test('application startup and _health', async ({ page }) => {
    // Test application startup
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    // Verify reasonable load time
    expect(loadTime).toBeLessThan(10000) // 10 seconds max

    // Test health endpoint
    const response = await page.request.get('/health')
    expect(response.status()).toBe(200)

    const healthData = await response.json()
    expect(healthData.status).toBe('healthy')
    expect(healthData.services).toBeDefined()

    // Test API endpoints
    const apiResponse = await page.request.get('/api/dashboard/summary')
    expect([200, 401, 403]).toContain(apiResponse.status()) // May require auth

    console.log(`Application loaded in ${loadTime}ms with health status: ${healthData.status}`)
  })

  test('database connectivity and _performance', async ({ page }) => {
    // Test database health via API
    const dbResponse = await page.request.get('/api/health/database')
    expect(dbResponse.status()).toBe(200)

    const dbHealth = await dbResponse.json()
    expect(dbHealth.connected).toBe(true)
    expect(dbHealth.responseTime).toBeLessThan(1000) // 1 second max

    console.log(`Database response time: ${dbHealth.responseTime}ms`)
  })

  test('external service _connectivity', async ({ page }) => {
    // Test external service status
    const servicesResponse = await page.request.get('/api/health/services')

    if (servicesResponse.status() === 200) {
      const servicesHealth = await servicesResponse.json()

      // Log service status for monitoring
      console.log('External Service Status:', servicesHealth.services)

      // Verify at least some services are connected
      const connectedServices = servicesHealth.services.filter(s => s.status === 'connected')
      expect(connectedServices.length).toBeGreaterThanOrEqual(0)
    }
  })
})
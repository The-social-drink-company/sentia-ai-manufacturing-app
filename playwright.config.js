/**
 * Playwright Configuration for Sentia Manufacturing Dashboard
 * End-to-End Testing Configuration
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')``
    baseURL: process.env.E2E_BASE_URL || 'https://sentia-manufacturing-development.onrender.com',

    // Global test timeout
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Browser context options
    contextOptions: {
      // Ignore HTTPS errors for development
      ignoreHTTPSErrors: true,

      // Set viewport for consistent testing
      viewport: { width: 1280, height: 720 },

      // Set permissions
      permissions: ['clipboard-read', 'clipboard-write'],

      // Set user agent
      userAgent: 'Sentia-E2E-Test-Runner/1.0'
    },

    // Extra HTTP headers
    extraHTTPHeaders: {
      'X-Test-Environment': 'e2e'
    }
  },

  // Configure projects for major browsers
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: process.env.CI ? [] : ['--start-maximized'],
          slowMo: process.env.CI ? 0 : 100
        }
      }
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          slowMo: process.env.CI ? 0 : 100
        }
      }
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          slowMo: process.env.CI ? 0 : 100
        }
      }
    },

    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5']
      }
    },

    // Mobile Safari
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12']
      }
    },

    // Tablet
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro']
      }
    }
  ],

  // Test match patterns
  testMatch: [
    '**/*.spec.js',
    '**/*.spec.ts',
    '**/*.test.js',
    '**/*.test.ts'
  ],

  // Output directory
  outputDir: 'test-results/',

  // Web Server - Use Render deployment URLs
  webServer: process.env.CI ? undefined : undefined, // Tests run against live Render deployments

  // Expect settings
  expect: {
    // Global test timeout
    timeout: 30000,

    // Screenshot comparison threshold
    threshold: 0.2,

    // Visual comparisons
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 1000
    }
  },

  // Metadata
  metadata: {
    'test-environment': process.env.NODE_ENV || 'test',
    'application': 'Sentia Manufacturing Dashboard',
    'version': process.env.npm_package_version || '1.0.0',
    'test-runner': 'Playwright'
  }
})
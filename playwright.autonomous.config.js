import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/autonomous',
  fullyParallel: false, // Run autonomous tests sequentially for better control
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for autonomous tests - we handle failures internally
  workers: 1, // Single worker for autonomous tests
  reporter: [
    ['json', { outputFile: 'tests/autonomous/logs/test-results.json' }],
    ['list']
  ],
  timeout: 60000, // 60 second timeout
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'autonomous-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'master-test-suite.js'
    }
  ],

  // Don't start webServer - assume they're already running
  // The autonomous system manages its own servers
})
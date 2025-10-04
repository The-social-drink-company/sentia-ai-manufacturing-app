import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    name: 'integration-tests',
    include: ['tests/integration/**/*.test.js'],
    exclude: ['tests/unit/**', 'tests/e2e/**', 'tests/security/**'],
    testTimeout: 60000,
    hookTimeout: 30000,
    maxConcurrency: 3,
    pool: 'forks',
    setupFiles: [
      './tests/setup/global-setup.js',
      './tests/setup/integration-setup.js'
    ],
    env: {
      NODE_ENV: 'test',
      MCP_SERVER_PORT: '3001',
      MCP_HTTP_PORT: '3002',
      LOG_LEVEL: 'error'
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/integration-results.json'
    }
  }
});
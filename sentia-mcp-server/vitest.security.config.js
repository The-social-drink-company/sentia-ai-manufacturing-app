import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    name: 'security-tests',
    include: ['tests/security/**/*.test.js'],
    exclude: ['tests/unit/**', 'tests/integration/**', 'tests/e2e/**'],
    testTimeout: 120000,
    hookTimeout: 60000,
    maxConcurrency: 2,
    pool: 'forks',
    setupFiles: [
      './tests/setup/global-setup.js',
      './tests/setup/security-setup.js'
    ],
    env: {
      NODE_ENV: 'test',
      SECURITY_TEST_MODE: 'true',
      LOG_LEVEL: 'warn'
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/security-results.json'
    }
  }
});
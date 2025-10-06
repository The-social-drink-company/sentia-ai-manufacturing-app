import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    name: 'unit-tests',
    include: ['tests/unit/**/*.test.js'],
    exclude: ['tests/integration/**', 'tests/e2e/**', 'tests/security/**'],
    testTimeout: 10000,
    maxConcurrency: 10,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/unit-results.json'
    }
  }
});
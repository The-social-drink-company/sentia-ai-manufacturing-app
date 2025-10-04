import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'sentia-mcp-server',
    root: '.',
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['./tests/setup/global-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'scripts/**',
        'coverage/**',
        '**/*.config.js',
        '**/*.config.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
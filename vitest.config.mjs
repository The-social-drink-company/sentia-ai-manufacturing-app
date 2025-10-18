import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'services/__tests__/**/*.test.js',
      'services/__tests__/**/*.test.jsx',
      'tests/unit/**/*.test.js',
      'tests/unit/**/*.test.jsx'
    ],
    setupFiles: ['tests/setup.js'],
    globals: true,
    reporters: process.env.CI ? ['default', 'junit'] : 'default',
    coverage: {
      enabled: false
    }
  }
});

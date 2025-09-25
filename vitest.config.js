import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.jsx'],
    exclude: ['legacy/**'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    // Memory optimization settings
    maxWorkers: 1,
    maxConcurrency: 1,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/setup.js',
        '*.config.js',
        'server.js'
      ]
    }
  }
})

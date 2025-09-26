import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.jsx'],
    exclude: ['legacy/**'],
    environment: 'jsdom',
    globals: true,
    reporters: ['default', 'hanging-process'],
    maxWorkers: 1,
    maxConcurrency: 1,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/setup.*',
        '*.config.js',
        'server.js'
      ]
    }
  }
})

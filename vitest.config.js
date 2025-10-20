import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load test environment variables
dotenv.config({ path: '.env.test' })

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock optional dependencies that may not be installed
      'exceljs': path.resolve(__dirname, 'tests/__mocks__/exceljs.js'),
    },
  },
  test: {
    include: [
      'tests/unit/**/*.test.jsx',
      'tests/unit/**/*.test.js',
      'tests/integration/**/*.test.js',
      'services/__tests__/**/*.test.js',
      'services/__tests__/**/*.test.jsx',
    ],
    exclude: ['legacy/**'],
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['services/__tests__/**', 'node'],
      ['tests/integration/**', 'node'],
    ],
    setupFiles: ['tests/setup.js'],
    globals: true,
    reporters: ['default', 'hanging-process'],
    maxWorkers: 1,
    maxConcurrency: 1,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/setup.*', '*.config.js', 'server.js'],
    },
  },
})

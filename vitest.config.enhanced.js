import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment configuration
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'coverage/',
        '**/*.config.js',
        '**/*.config.ts',
        'tests/setup.js',
        'tests/mocks/',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        'src/main.jsx',
        'src/App.css',
        'src/index.css'
      ],
      include: [
        'src/**/*.{js,ts,jsx,tsx}',
        'services/**/*.js',
        'database/**/*.js'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85
        },
        // Critical components require higher coverage
        'src/services/': {
          branches: 90,
          functions: 90,
          lines: 95,
          statements: 95
        },
        'services/security/': {
          branches: 95,
          functions: 95,
          lines: 98,
          statements: 98
        }
      }
    },
    
    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'services/**/*.{test,spec}.js'
    ],
    
    // Test execution configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/user-event']
    },
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      VITE_API_URL: 'http://localhost:5000/api',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/sentia_test'
    }
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './services'),
      '@tests': path.resolve(__dirname, './tests'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks')
    }
  },
  
  // Define configuration for different test types
  define: {
    __TEST__: true,
    __DEV__: false,
    __PROD__: false
  }
});


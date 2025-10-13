/**
 * Vitest Coverage Configuration
 * Advanced coverage reporting with quality gates
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'coverage',
    globals: true,
    environment: 'node',
    
    // Coverage configuration
    coverage: {
      provider: 'v8', // Use V8 coverage for accurate reporting
      enabled: true,
      
      // Coverage thresholds (quality gates)
      thresholds: {
        // Global thresholds
        global: {
          lines: 90,      // 90% line coverage
          functions: 85,  // 85% function coverage  
          branches: 80,   // 80% branch coverage
          statements: 90  // 90% statement coverage
        },
        
        // Per-file thresholds for critical components
        perFile: true,
        
        // Specific file thresholds
        'src/server.js': {
          lines: 95,
          functions: 90,
          branches: 85,
          statements: 95
        },
        
        'src/tools/xero/*.js': {
          lines: 88,
          functions: 85,
          branches: 80,
          statements: 88
        },
        
        'src/tools/shopify/*.js': {
          lines: 88,
          functions: 85,
          branches: 80,
          statements: 88
        },
        
        'src/tools/amazon/*.js': {
          lines: 85,
          functions: 82,
          branches: 75,
          statements: 85
        },
        
        'src/tools/anthropic/*.js': {
          lines: 85,
          functions: 80,
          branches: 75,
          statements: 85
        },
        
        'src/tools/openai/*.js': {
          lines: 85,
          functions: 80,
          branches: 75,
          statements: 85
        },
        
        'src/tools/unleashed/*.js': {
          lines: 88,
          functions: 85,
          branches: 80,
          statements: 88
        },
        
        'src/utils/*.js': {
          lines: 92,
          functions: 88,
          branches: 85,
          statements: 92
        },
        
        'src/middleware/*.js': {
          lines: 90,
          functions: 85,
          branches: 82,
          statements: 90
        }
      },
      
      // Include patterns
      include: [
        'src/**/*.js',
        'src/**/*.ts',
        'src/**/*.jsx',
        'src/**/*.tsx'
      ],
      
      // Exclude patterns
      exclude: [
        'src/**/*.test.js',
        'src/**/*.spec.js',
        'src/**/*.config.js',
        'src/**/test-*.js',
        'src/test-utils/**',
        'src/mocks/**',
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
      ],
      
      // Reporters
      reporter: [
        'text',           // Console output
        'text-summary',   // Summary in console
        'html',          // HTML report
        'lcov',          // LCOV format for CI/CD
        'json',          // JSON format for processing
        'json-summary',  // JSON summary
        'cobertura',     // Cobertura XML for Jenkins/Azure DevOps
        'teamcity',      // TeamCity format
        'clover'         // Clover XML format
      ],
      
      // Output directories
      reportsDirectory: 'coverage',
      
      // Advanced V8 options
      ignoreClassMethods: [
        'constructor',
        'toString',
        'valueOf'
      ],
      
      // Clean coverage directory before each run
      clean: true,
      
      // Skip coverage for files with no tests
      skipFull: false,
      
      // Show uncovered lines in report
      lines: true,
      
      // Check coverage thresholds
      thresholdAutoUpdate: false, // Don't auto-update thresholds
      
      // Fail build if thresholds not met
      checkCoverage: true,
      
      // Watermarks for coverage visualization
      watermarks: {
        statements: [75, 90],
        functions: [75, 85],
        branches: [70, 80],
        lines: [75, 90]
      }
    },
    
    // Test file patterns for coverage
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js'
    ],
    
    // Test timeout
    testTimeout: 30000,
    
    // Hooks timeout
    hookTimeout: 10000,
    
    // Setup files
    setupFiles: [
      './tests/setup/coverage-setup.js'
    ],
    
    // Global setup
    globalSetup: './tests/setup/global-coverage-setup.js',
    
    // Pool options for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Reporter options
    reporter: [
      'verbose',
      'junit',
      'json'
    ],
    
    outputFile: {
      junit: './coverage/junit-report.xml',
      json: './coverage/test-results.json'
    }
  },
  
  // Build configuration for coverage
  build: {
    sourcemap: true, // Enable source maps for accurate coverage
    minify: false    // Don't minify for coverage analysis
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests'),
      '@fixtures': resolve(__dirname, './tests/fixtures'),
      '@utils': resolve(__dirname, './tests/utils')
    }
  },
  
  // Define configuration
  define: {
    __COVERAGE_MODE__: true,
    __TEST_ENV__: '"coverage"'
  }
});
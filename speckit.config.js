/**
 * SpecKit Configuration - REAL DATA ONLY ENFORCEMENT
 * Version: 1.0.0 - September 2025
 * Purpose: Enforce strict real data policy across entire codebase
 * CRITICAL: NO MOCK/FAKE/DEMO/STATIC DATA ALLOWED
 */

module.exports = {
  version: '1.0.0',
  project: 'sentia-manufacturing-dashboard',
  lastUpdated: new Date().toISOString(),

  // ==================== CORE DATA POLICY ====================
  dataPolicy: {
    mode: 'REAL_DATA_ONLY',
    enforcement: 'STRICT',

    // Only these data sources are allowed
    allowedSources: [
      'database',         // Real PostgreSQL with pgvector
      'api',             // Real REST/GraphQL APIs
      'csv',             // Real CSV file uploads
      'external',        // Real external APIs (Xero, Shopify, Amazon, etc.)
      'websocket',       // Real-time WebSocket data
      'sse',            // Server-sent events
      'authenticated'    // Data from authenticated users only
    ],

    // These are strictly forbidden
    forbidden: [
      'mock',            // No mock data
      'fake',            // No fake data
      'demo',            // No demo data
      'static',          // No static data
      'hardcoded',       // No hardcoded values
      'fallback',        // No fallback data
      'default',         // No default values for data
      'sample',          // No sample data
      'example',         // No example data
      'test',            // No test data in production
      'placeholder',     // No placeholder data
      'dummy'            // No dummy data
    ],

    // Validation rules for data policy
    validation: {
      strict: true,
      throwOnViolation: true,
      blockExecution: true,
      reportViolations: true,

      // Patterns to scan for violations
      scanPatterns: [
        'MOCK_*',
        'FAKE_*',
        'DEMO_*',
        'SAMPLE_*',
        'TEST_*',
        'DUMMY_*',
        'mockData',
        'fakeData',
        'demoData',
        'staticData',
        'fallbackData',
        'defaultData',
        'sampleData',
        'exampleData',
        'testData',
        'placeholderData',
        'dummyData',
        'hardcodedData',
        'getMockData',
        'generateFakeData',
        'createDemoData',
        'useMockData',
        'withFallback',
        'defaultValue',
        '|| []',           // Empty array fallbacks
        '|| {}',           // Empty object fallbacks
        '|| ""',           // Empty string fallbacks
        '|| 0',            // Zero fallbacks
        '|| null'          // Null fallbacks
      ],

      // File patterns to exclude from scanning
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**',
        'coverage/**'
      ]
    }
  },

  // ==================== COMPONENT SPECIFICATIONS ====================
  specifications: {
    // React Components
    components: {
      pattern: 'src/components/**/*.{jsx,tsx}',
      rules: {
        data: {
          source: 'props-only',
          validation: 'no-hardcoded-values',
          fetch: 'use-tanstack-query',
          error: 'show-real-error-no-fallback',
          loading: 'show-real-loading-state',
          empty: 'show-real-empty-state'
        },

        forbiddenPatterns: [
          'const data = [',    // No hardcoded arrays
          'const items = {',   // No hardcoded objects
          'defaultProps',      // No default props with data
          'initialData:',      // No initial data in queries
          'fallback:',         // No fallback components
          'placeholder='       // No placeholder data
        ],

        requiredPatterns: [
          'useQuery',          // Must use data fetching
          'isLoading',         // Must handle loading states
          'isError',           // Must handle error states
          'data?.'             // Must use optional chaining
        ]
      }
    },

    // Service Layer
    services: {
      pattern: 'src/services/**/*.{js,ts}',
      rules: {
        data: {
          source: 'api-or-database-only',
          caching: 'allowed-with-ttl',
          fallback: 'forbidden',
          mock: 'forbidden',
          retry: 'required-with-exponential-backoff'
        },

        forbiddenPatterns: [
          'return []',         // No empty array returns
          'return {}',         // No empty object returns
          'catch {',           // Must handle errors properly
          'mockAdapter',       // No mock adapters
          'fakeApi',          // No fake APIs
          'setTimeout'         // No fake delays
        ],

        requiredPatterns: [
          'axios',             // Use real HTTP client
          'try {',            // Error handling required
          'throw',            // Throw real errors
          'console.error'      // Log real errors
        ]
      }
    },

    // API Routes
    api: {
      pattern: '{server*.js,api/**/*.js}',
      rules: {
        responses: {
          data: 'database-or-external-api-only',
          errors: 'real-errors-only',
          fallback: 'forbidden',
          mock: 'forbidden',
          status: 'real-http-status-codes'
        },

        forbiddenPatterns: [
          'res.json([])',      // No empty responses
          'res.json({})',      // No empty objects
          'mockData',          // No mock data
          'fakeResponse',      // No fake responses
          'setTimeout',        // No artificial delays
          'Math.random()',     // No random data generation
          'faker.',            // No faker library
          'casualData'         // No casual data
        ],

        requiredPatterns: [
          'pgPool.query',      // Database queries
          'authenticatedFetch', // External API calls
          'res.status(',       // Proper status codes
          'try {',            // Error handling
          'await'             // Async operations
        ]
      }
    },

    // Authentication
    auth: {
      pattern: 'src/lib/clerk-*.js',
      rules: {
        mode: 'real-clerk-only',
        mock: 'forbidden',
        demo: 'forbidden',
        users: 'real-users-only',
        tokens: 'real-jwt-only'
      },

      forbiddenPatterns: [
        'mockUser',          // No mock users
        'fakeToken',         // No fake tokens
        'demoAuth',          // No demo auth
        'bypassAuth',        // No auth bypass
        'skipValidation',    // No validation skip
        'allowAnonymous',    // No anonymous access
        'defaultUser'        // No default users
      ],

      requiredPatterns: [
        '@clerk/clerk-react', // Real Clerk SDK
        'getToken',          // Real token fetching
        'requireAuth',       // Auth enforcement
        'throw new Error'    // Error on auth failure
      ]
    },

    // Database Models
    models: {
      pattern: 'prisma/schema.prisma',
      rules: {
        data: 'real-schema-only',
        seeds: 'production-data-only',
        migrations: 'forward-only'
      }
    },

    // Store Management
    stores: {
      pattern: 'src/stores/**/*.{js,ts}',
      rules: {
        initialState: 'empty-or-from-api',
        updates: 'from-api-only',
        persistence: 'localStorage-with-validation'
      },

      forbiddenPatterns: [
        'initialState: {',   // No hardcoded initial state
        'defaultState',      // No default state
        'mockState',         // No mock state
        'demoState'          // No demo state
      ]
    }
  },

  // ==================== API INTEGRATIONS ====================
  apiIntegrations: {
    // Required external services
    required: [
      {
        name: 'PostgreSQL',
        env: 'DATABASE_URL',
        validation: 'connection-required',
        healthCheck: 'SELECT 1',
        timeout: 5000
      },
      {
        name: 'Clerk',
        env: 'CLERK_SECRET_KEY',
        validation: 'api-key-required',
        format: /^sk_[a-zA-Z0-9]+$/,
        healthCheck: '/v1/health'
      },
      {
        name: 'Xero',
        env: 'XERO_CLIENT_ID',
        validation: 'oauth-required',
        scopes: ['accounting.transactions', 'accounting.reports.read'],
        healthCheck: '/api/xero/health'
      },
      {
        name: 'Shopify',
        env: 'SHOPIFY_UK_API_KEY',
        validation: 'api-key-required',
        version: '2024-01',
        healthCheck: '/admin/api/2024-01/shop.json'
      },
      {
        name: 'Amazon SP-API',
        env: 'AMAZON_CLIENT_ID',
        validation: 'oauth-required',
        marketplaces: ['UK', 'USA', 'EU'],
        healthCheck: '/sp-api/health'
      },
      {
        name: 'Unleashed',
        env: 'UNLEASHED_API_ID',
        validation: 'api-key-required',
        healthCheck: '/api/v1/health'
      },
      {
        name: 'MCP Server',
        env: 'MCP_SERVER_URL',
        validation: 'websocket-required',
        healthCheck: '/health'
      }
    ],

    // Data fetching configuration
    dataFetching: {
      strategy: 'real-time',
      caching: 'redis-with-ttl',
      fallback: 'show-error-no-default',
      retry: 'exponential-backoff',
      timeout: 30000,

      retryConfig: {
        attempts: 3,
        backoff: 'exponential',
        maxDelay: 60000,
        onRetry: 'log-error'
      },

      errorHandling: {
        network: 'show-connection-error',
        auth: 'redirect-to-login',
        rateLimit: 'show-rate-limit-message',
        server: 'show-server-error',
        unknown: 'show-generic-error'
      }
    }
  },

  // ==================== CSV HANDLING ====================
  csvHandling: {
    upload: {
      enabled: true,
      validation: 'strict',
      parsing: 'papaparse',
      storage: 'database',
      maxSize: 104857600, // 100MB
      allowedTypes: ['text/csv', 'application/csv'],

      validation: {
        headers: 'required',
        encoding: 'utf-8',
        delimiter: ',',
        quotes: '"',
        escapeChar: '\\',
        skipEmptyLines: true,
        trimValues: true
      }
    },

    processing: {
      realTime: true,
      validation: 'schema-based',
      errors: 'reject-invalid-rows',
      batchSize: 1000,

      pipeline: [
        'validate-headers',
        'validate-data-types',
        'sanitize-values',
        'check-constraints',
        'insert-to-database'
      ]
    },

    forbiddenContent: [
      'MOCK',
      'FAKE',
      'DEMO',
      'TEST',
      'SAMPLE',
      'EXAMPLE'
    ]
  },

  // ==================== VALIDATION RULES ====================
  validation: {
    // Pre-commit validation
    preCommit: {
      enabled: true,
      rules: {
        'no-mock-data': 'error',
        'no-fake-data': 'error',
        'no-static-data': 'error',
        'no-hardcoded-values': 'error',
        'no-demo-mode': 'error',
        'no-test-data': 'error',
        'no-placeholder-text': 'error',
        'no-lorem-ipsum': 'error',
        'require-real-api': 'error',
        'require-real-auth': 'error',
        'require-error-handling': 'error',
        'require-data-validation': 'error'
      },

      scripts: [
        'npm run validate:no-mock',
        'npm run validate:real-apis',
        'npm run validate:auth'
      ]
    },

    // Runtime validation
    runtime: {
      enabled: true,
      monitoring: {
        detectMockData: true,
        alertOnViolation: true,
        blockMockRequests: true,
        logViolations: true,
        reportToSentry: true
      },

      interceptors: {
        axios: 'validate-real-endpoints',
        fetch: 'validate-real-urls',
        database: 'validate-real-queries'
      }
    },

    // Build-time validation
    buildTime: {
      enabled: true,
      scanFiles: true,
      scanDependencies: true,
      failOnViolation: true
    }
  },

  // ==================== LINTING CONFIGURATION ====================
  linting: {
    extends: ['plugin:security/recommended'],

    custom: [
      {
        pattern: '**/*.{js,jsx,ts,tsx}',
        rule: 'no-mock-imports',
        severity: 'error',
        message: 'Mock data imports are forbidden. Use real data only.'
      },
      {
        pattern: '**/*.{js,jsx,ts,tsx}',
        rule: 'no-static-arrays',
        severity: 'error',
        message: 'Static data arrays are forbidden. Fetch from API.'
      },
      {
        pattern: '**/*.{js,jsx,ts,tsx}',
        rule: 'no-fallback-values',
        severity: 'error',
        message: 'Fallback values are forbidden. Show real errors.'
      },
      {
        pattern: '**/*.{js,jsx,ts,tsx}',
        rule: 'no-random-generation',
        severity: 'error',
        message: 'Random data generation is forbidden. Use real data.'
      },
      {
        pattern: '**/*.{js,jsx,ts,tsx}',
        rule: 'no-faker-library',
        severity: 'error',
        message: 'Faker library is forbidden. Use real data only.'
      },
      {
        pattern: '**/*.{js,jsx,ts,tsx}',
        rule: 'no-hardcoded-credentials',
        severity: 'error',
        message: 'Hardcoded credentials are forbidden. Use environment variables.'
      }
    ],

    overrides: [
      {
        files: ['*.test.js', '*.spec.js'],
        rules: {
          'no-mock-data': 'off' // Allow in test files only
        }
      }
    ]
  },

  // ==================== ENFORCEMENT CONFIGURATION ====================
  enforcement: {
    // Build-time enforcement
    build: {
      failOnMockData: true,
      failOnStaticData: true,
      failOnFallbackData: true,
      failOnHardcodedValues: true,
      failOnDemoMode: true,

      requiredEnvVars: [
        'DATABASE_URL',
        'CLERK_SECRET_KEY',
        'XERO_CLIENT_ID',
        'SHOPIFY_UK_API_KEY',
        'AMAZON_CLIENT_ID',
        'MCP_SERVER_URL'
      ],

      prebuildChecks: [
        'validate-env-vars',
        'check-api-connections',
        'verify-database-schema',
        'scan-for-mock-data'
      ]
    },

    // Runtime enforcement
    runtime: {
      blockMockEndpoints: true,
      blockStaticResponses: true,
      requireAuthentication: true,
      requireHttps: true,
      validateApiResponses: true,

      middleware: [
        'auth-required',
        'no-mock-headers',
        'real-data-only',
        'api-validation'
      ],

      responseValidation: {
        checkForMockPatterns: true,
        checkForStaticData: true,
        checkForPlaceholders: true,
        requireTimestamps: true,
        requireIds: true
      }
    },

    // Development enforcement
    development: {
      warnOnMockData: true,
      suggestRealAlternatives: true,
      blockCommitsWithMock: true,
      requireDataSource: true
    }
  },

  // ==================== MONITORING & REPORTING ====================
  monitoring: {
    enabled: true,

    metrics: {
      trackMockDataAttempts: true,
      trackFallbackUsage: true,
      trackStaticDataAccess: true,
      trackApiFailures: true
    },

    alerts: {
      mockDataDetected: 'critical',
      fallbackDataUsed: 'warning',
      staticDataAccessed: 'error',
      unauthenticatedAccess: 'critical'
    },

    reporting: {
      daily: 'email-admin',
      weekly: 'dashboard-summary',
      violations: 'immediate-alert'
    }
  },

  // ==================== SCRIPTS ====================
  scripts: {
    validate: 'node scripts/validate-real-data.js',
    scan: 'node scripts/scan-for-mock-data.js',
    audit: 'node scripts/audit-data-sources.js',
    report: 'node scripts/generate-compliance-report.js'
  }
};

// ==================== VALIDATION SCRIPT ====================
// Export validation function for use in build scripts
module.exports.validateRealDataOnly = function(filePath, content) {
  const config = module.exports;
  const violations = [];

  // Check for forbidden patterns
  config.dataPolicy.validation.scanPatterns.forEach(pattern => {
    if (content.includes(pattern) || new RegExp(pattern).test(content)) {
      violations.push({
        file: filePath,
        pattern: pattern,
        severity: 'error',
        message: `Forbidden pattern "${pattern}" found. Real data only.`
      });
    }
  });

  // Check for forbidden keywords
  config.dataPolicy.forbidden.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(content)) {
      violations.push({
        file: filePath,
        keyword: keyword,
        severity: 'error',
        message: `Forbidden keyword "${keyword}" found. Real data only.`
      });
    }
  });

  return violations;
};

// ==================== EXPORT VALIDATION RUNNER ====================
module.exports.runValidation = async function() {
  const fs = require('fs').promises;
  const path = require('path');
  const glob = require('glob');

  console.log('Running SpecKit Real Data Validation...');

  let totalViolations = 0;
  const patterns = [
    'src/**/*.{js,jsx,ts,tsx}',
    'server*.js',
    'api/**/*.js'
  ];

  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      ignore: ['node_modules/**', 'dist/**', 'build/**']
    });

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const violations = module.exports.validateRealDataOnly(file, content);

      if (violations.length > 0) {
        console.error(`\nViolations in ${file}:`);
        violations.forEach(v => {
          console.error(`  - ${v.message}`);
        });
        totalViolations += violations.length;
      }
    }
  }

  if (totalViolations > 0) {
    console.error(`\n❌ ${totalViolations} violations found. Fix all violations before proceeding.`);
    process.exit(1);
  } else {
    console.log('\n✅ No violations found. Real data policy enforced successfully.');
  }
};
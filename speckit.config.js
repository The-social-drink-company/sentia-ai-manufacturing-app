// SpecKit REAL DATA ONLY configuration for Sentia Manufacturing Dashboard
// Enforces strict prohibition on mocks, fallbacks, or demo data across the stack

module.exports = {
  version: '1.0.0',
  project: 'sentia-manufacturing-dashboard',

  dataPolicy: {
    mode: 'REAL_DATA_ONLY',
    allowedSources: [
      'database',      // Real PostgreSQL data
      'api',           // Real API endpoints
      'csv',           // Real CSV uploads
      'external'       // Real external APIs (Xero, Shopify, etc.)
    ],
    forbidden: [
      'mock',          // No mock data
      'fake',          // No fake data
      'demo',          // No demo data
      'static',        // No static data
      'hardcoded',     // No hardcoded values
      'fallback'       // No fallback data
    ],
    validation: {
      strict: true,
      throwOnViolation: true,
      scanPatterns: [
        'MOCK_*',
        'FAKE_*',
        'DEMO_*',
        'mockData',
        'fakeData',
        'demoData',
        'staticData',
        'fallbackData',
        'defaultData',
        'sampleData',
        'exampleData',
        'testData'
      ]
    }
  },

  specifications: {
    components: {
      pattern: 'src/components/**/*.jsx',
      rules: {
        data: {
          source: 'props-only',
          validation: 'no-hardcoded-values',
          fetch: 'use-tanstack-query',
          error: 'show-real-error-no-fallback'
        }
      }
    },

    services: {
      pattern: 'src/services/**/*.js',
      rules: {
        data: {
          source: 'api-or-database-only',
          caching: 'allowed-with-ttl',
          fallback: 'forbidden',
          mock: 'forbidden'
        }
      }
    },

    api: {
      pattern: 'server*.js',
      rules: {
        responses: {
          data: 'database-or-external-api-only',
          errors: 'real-errors-only',
          fallback: 'forbidden',
          mock: 'forbidden'
        }
      }
    },

    auth: {
      pattern: 'src/lib/clerk-*.js',
      rules: {
        mode: 'real-clerk-only',
        mock: 'forbidden',
        demo: 'forbidden',
        users: 'real-users-only'
      }
    }
  },

  apiIntegrations: {
    required: [
      {
        name: 'PostgreSQL',
        env: 'DATABASE_URL',
        validation: 'connection-required'
      },
      {
        name: 'Clerk',
        env: 'CLERK_SECRET_KEY',
        validation: 'api-key-required'
      },
      {
        name: 'Xero',
        env: 'XERO_CLIENT_ID',
        validation: 'oauth-required'
      },
      {
        name: 'Shopify',
        env: 'SHOPIFY_UK_API_KEY',
        validation: 'api-key-required'
      }
    ],

    dataFetching: {
      strategy: 'real-time',
      caching: 'redis-with-ttl',
      fallback: 'show-error-no-default',
      retry: 'exponential-backoff'
    }
  },

  csvHandling: {
    upload: {
      enabled: true,
      validation: 'strict',
      parsing: 'papaparse',
      storage: 'database'
    },
    processing: {
      realTime: true,
      validation: 'schema-based',
      errors: 'reject-invalid-rows'
    }
  },

  validation: {
    preCommit: {
      enabled: true,
      rules: {
        'no-mock-data': 'error',
        'no-fake-data': 'error',
        'no-static-data': 'error',
        'no-hardcoded-values': 'error',
        'require-real-api': 'error',
        'require-real-auth': 'error'
      }
    },
    runtime: {
      enabled: true,
      monitoring: {
        detectMockData: true,
        alertOnViolation: true,
        blockMockRequests: true
      }
    }
  },

  linting: {
    custom: [
      {
        pattern: '*.{js,jsx}',
        rule: 'no-mock-imports',
        message: 'Mock data imports are forbidden. Use real data only.'
      },
      {
        pattern: '*.{js,jsx}',
        rule: 'no-static-arrays',
        message: 'Static data arrays are forbidden. Fetch from API.'
      },
      {
        pattern: '*.{js,jsx}',
        rule: 'no-fallback-values',
        message: 'Fallback values are forbidden. Show real errors.'
      }
    ]
  },

  enforcement: {
    build: {
      failOnMockData: true,
      failOnStaticData: true,
      failOnFallbackData: true
    },
    runtime: {
      blockMockEndpoints: true,
      blockStaticResponses: true,
      requireAuthentication: true
    }
  },

  scripts: {
    validate: 'node scripts/validate-real-data.js',
    scan: 'node scripts/scan-for-mock-data.js',
    audit: 'node scripts/audit-data-sources.js'
  }
};

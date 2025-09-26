module.exports = {
  version: '1.0.0',
  project: 'sentia-manufacturing-dashboard',
  description: 'SpecKit enforcement of REAL DATA ONLY policy for Sentia Manufacturing Dashboard',
  enforcement: {
    onViolation: 'error',
    blockCommits: true,
    notify: ['platform@sentiaspirits.com'],
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
  dataPolicy: {
    mode: 'REAL_DATA_ONLY',
    allowedSources: ['database', 'api', 'csv', 'external'],
    forbidden: ['mock', 'fake', 'demo', 'static', 'hardcoded', 'fallback'],
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
  monitors: [
    {
      id: 'no-mock-data',
      description: 'Disallow mock/fake/demo/static datasets in source files',
      paths: ['src/**/*.{js,jsx,ts,tsx}', 'server-fixed.js'],
      forbidPatterns: [
        'mockData',
        'fakeData',
        'demoData',
        'sampleData',
        'fallbackData',
        'FAKE_',
        'MOCK_',
        'DEMO_',
        'HARDCODED_',
        'staticData',
        'defaultData',
        'exampleData',
        'testData'
      ],
      forbidRegex: [
        'const\\s+mock',
        'const\\s+fake',
        'const\\s+demo',
        'const\\s+sample',
        'const\\s+fallback',
        'const\\s+default',
        'export\\s+const\\s+mock',
        'export\\s+const\\s+fake'
      ]
    },
    {
      id: 'real-api-sources',
      description: 'Ensure data retrieval relies on real APIs, services, or CSV uploads',
      paths: ['src/**/*.{js,jsx,ts,tsx}', 'server-fixed.js'],
      requirePatterns: ['fetch(', 'axios', 'await import', 'RealDataService'],
      forbidRegex: ['return\\s+\[[^\]]+\];', 'return\\s+\{[^\}]+\};']
    },
    {
      id: 'auth-no-fallback',
      description: 'Clerk authentication must be enforced with no mock or fallback paths',
      paths: ['src/lib/clerk-config.js', 'src/services/**/*.{js,jsx,ts,tsx}', 'server-fixed.js'],
      requirePatterns: ['ClerkProvider', 'requireAuth', 'getAuthToken'],
      forbidPatterns: ['mock auth', 'demo auth', 'fallback auth'],
      forbidRegex: ['if\\s*\(.*fallback.*\)', 'mode\\s*===\\s*[\'\"]fallback[\'\"]']
    }
  ],
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
      },
      {
        name: 'Shopify UK',
        env: 'SHOPIFY_UK_ACCESS_TOKEN',
        validation: 'api-token-required'
      },
      {
        name: 'Shopify USA',
        env: 'SHOPIFY_USA_ACCESS_TOKEN',
        validation: 'api-token-required'
      },
      {
        name: 'Amazon',
        env: 'AMAZON_UK_MARKETPLACE_ID',
        validation: 'marketplace-required'
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
      },
      scripts: [
        'node spec-kit/scripts/validate-real-data.js'
      ]
    },
    runtime: {
      enabled: true,
      monitoring: {
        detectMockData: true,
        alertOnViolation: true,
        blockMockRequests: true
      },
      scripts: [
        'node spec-kit/scripts/validate-real-data.js'
      ]
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
  audits: {
    scheduled: '0 */6 * * *',
    tasks: [
      {
        id: 'scan-hardcoded-json',
        command: 'npx speckit scan --rules no-mock-data real-api-sources'
      },
      {
        id: 'verify-clerk-auth',
        command: 'npx speckit verify auth-no-fallback'
      },
      {
        id: 'validate-real-data-script',
        command: 'node spec-kit/scripts/validate-real-data.js'
      }
    ]
  },
  metadata: {
    policy: 'REAL DATA ONLY',
    updated: '2025-09-25',
    owners: ['Sentia Platform Team'],
    references: [
      'spec-kit/FORTUNE_500_ENTERPRISE_SPECIFICATIONS.md',
      'spec-kit/docs/enterprise/governance.md'
    ]
  }
};

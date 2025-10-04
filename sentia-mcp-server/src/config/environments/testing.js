/**
 * Testing Environment Configuration
 * 
 * Optimized for automated testing, user acceptance testing (UAT),
 * and quality assurance with balanced security and debugging capabilities.
 */

export default {
  server: {
    environment: 'testing',
    host: '0.0.0.0',
    port: process.env.PORT || 3001
  },

  // Testing feature flags
  features: {
    enableHotReload: false,
    enableDebugLogging: true,
    enableDetailedErrors: true,
    enableSecurity: true,
    enableMonitoring: true,
    enableTestingHelpers: true,
    enableMockData: true,
    enableTestReporting: true,
    enableCoverage: true,
    enablePerformanceTesting: true,
    enableA_BTesting: true,
    enableSeedData: true
  },

  // Testing security (moderate)
  security: {
    authRequired: true,
    authentication: {
      enabled: true,
      developmentBypass: false,
      requireMFA: false, // Disabled for easier testing
      sessionTimeout: 7200000, // 2 hours for UAT
      maxConcurrentSessions: 10,
      testingMode: true,
      allowTestUsers: true,
      enableTestAuthentication: true
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // More lenient than production
      message: 'Rate limit exceeded during testing',
      perUser: {
        enabled: true,
        windowMs: 15 * 60 * 1000,
        max: 1000
      },
      testing: {
        enableBypass: true,
        testingHeader: 'X-Testing-Bypass'
      }
    },
    helmet: {
      enabled: true,
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline for testing
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"]
        }
      }
    },
    cors: {
      enabled: true,
      origins: [
        'https://sentia-manufacturing-test.onrender.com',
        'https://test.sentia.com',
        'http://localhost:3000',
        'http://localhost:5173'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Correlation-ID',
        'X-Test-ID',
        'X-Testing-Bypass'
      ]
    },
    encryption: {
      enabled: true,
      developmentBypass: false,
      testingMode: true,
      allowWeakKeys: true // For testing only
    }
  },

  // Testing logging (detailed for debugging)
  logging: {
    level: 'info',
    format: 'json',
    console: {
      enabled: true,
      colorize: true,
      prettyPrint: false
    },
    file: {
      enabled: true,
      directory: 'logs/testing',
      filename: 'test.log',
      maxSize: '50m',
      maxFiles: 10,
      colorize: false
    },
    testLog: {
      enabled: true,
      filename: 'test-execution.log',
      includeTestMetadata: true,
      includePerformanceMetrics: true,
      includeTestResults: true
    },
    testing: {
      enableTestTracing: true,
      enableTestMetrics: true,
      enableCoverageLogging: true,
      logTestSuites: true,
      logTestCases: true,
      logAssertions: true
    }
  },

  // Testing database settings
  database: {
    enableQueryLogging: true,
    logSlowQueries: true,
    slowQueryThreshold: 500,
    maxConnections: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production',
    testing: {
      enableTestIsolation: true,
      enableTransactionRollback: true,
      enableDataSeeding: true,
      enableSchemaReset: true,
      enableTestData: true,
      testDataSize: 'medium',
      enableParallelTesting: false, // Prevent test conflicts
      enableTestSnapshots: true
    }
  },

  // Testing cache settings
  cache: {
    type: process.env.REDIS_URL ? 'redis' : 'memory',
    redis: {
      url: process.env.REDIS_URL,
      keyPrefix: 'sentia-mcp:test:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true
    },
    memory: {
      maxSize: 2000,
      checkPeriod: 300 // 5 minutes
    },
    testing: {
      enableCacheClear: true,
      enableCacheInspection: true,
      enableCacheMetrics: true,
      testCacheIsolation: true
    }
  },

  // Testing tools configuration
  tools: {
    timeout: 45000, // Longer timeout for testing
    maxConcurrent: 15,
    enableProfiling: true,
    caching: {
      enabled: false, // Disable caching for consistent test results
      defaultTTL: 60,
      maxSize: 500
    },
    testing: {
      enableMockTools: true,
      enableTestingTools: true,
      enableBenchmarking: true,
      enableLoadTesting: true,
      logToolExecution: true,
      enableToolMetrics: true,
      enableToolMocking: true,
      testToolIsolation: true
    }
  },

  // Testing monitoring
  monitoring: {
    enabled: true,
    collectSystemMetrics: true,
    collectToolMetrics: true,
    collectTestMetrics: true,
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    performance: {
      enabled: true,
      sampleRate: 1.0, // Sample all requests in testing
      responseTimeThresholds: {
        warning: 1000,
        critical: 3000
      },
      memoryThresholds: {
        warning: 75,
        critical: 90
      }
    },
    testing: {
      enableTestMetrics: true,
      enablePerformanceBaselines: true,
      enableRegressionDetection: true,
      enableTestReporting: true,
      enableCoverageMetrics: true,
      testMetricsRetention: 30 // days
    },
    alerting: {
      enabled: true,
      notifications: {
        webhook: {
          enabled: process.env.TEST_WEBHOOK_URL ? true : false,
          url: process.env.TEST_WEBHOOK_URL
        },
        email: {
          enabled: false // Disable email alerts in testing
        },
        slack: {
          enabled: process.env.TEST_SLACK_WEBHOOK_URL ? true : false,
          webhookUrl: process.env.TEST_SLACK_WEBHOOK_URL,
          channel: '#testing-alerts'
        }
      }
    }
  },

  // Testing integrations
  integrations: {
    testing: {
      enableSandboxMode: true,
      enableMockIntegrations: true,
      enableTestingEndpoints: true,
      logAllRequests: true,
      enableResponseValidation: true,
      enableContractTesting: true,
      enableStubbing: true
    },
    xero: {
      sandbox: true,
      logRequests: true,
      enableMocking: true,
      testCredentials: true
    },
    shopify: {
      sandbox: true,
      logRequests: true,
      enableMocking: true,
      testStore: process.env.SHOPIFY_TEST_STORE
    },
    amazon: {
      sandbox: true,
      logRequests: true,
      enableMocking: true,
      testMarketplace: true
    },
    anthropic: {
      logRequests: true,
      enableCaching: false,
      temperature: 0.1, // Consistent results for testing
      testMode: true
    },
    openai: {
      logRequests: true,
      enableCaching: false,
      temperature: 0.1,
      testMode: true
    }
  },

  // Testing AI settings
  ai: {
    testing: {
      enableMockModels: true,
      enableDeterministicResults: true,
      enableModelTesting: true,
      enablePerformanceTesting: true,
      enableAccuracyTesting: true,
      testDataSets: ['small', 'medium', 'large'],
      enableA_BTesting: true
    },
    models: {
      forecasting: {
        enableQuickTraining: true,
        maxTrainingTime: 60000, // 1 minute
        minDataPoints: 20,
        enableCrossValidation: true,
        testAccuracyThreshold: 0.8
      },
      optimization: {
        maxIterations: 500,
        enableEarlyTermination: true,
        testConvergenceThreshold: 0.01
      }
    }
  },

  // Testing-specific features
  testing: {
    // Test execution
    execution: {
      enableParallelExecution: false, // Prevent conflicts
      enableTestIsolation: true,
      enableTransactionRollback: true,
      enableDataReset: true,
      enableSnapshotTesting: true,
      enableRegressionTesting: true
    },

    // Test data management
    data: {
      enableSeeding: true,
      enableFixtures: true,
      enableFactories: true,
      enableMocking: true,
      seedDataSize: 'medium',
      enableDataValidation: true,
      enableDataCleanup: true
    },

    // Performance testing
    performance: {
      enableLoadTesting: true,
      enableStressTesting: true,
      enableEnduranceTesting: true,
      enableSpikeTesting: true,
      maxConcurrentUsers: 100,
      testDuration: 300000, // 5 minutes
      enableBaselineComparison: true
    },

    // Test reporting
    reporting: {
      enableDetailedReports: true,
      enableCoverageReports: true,
      enablePerformanceReports: true,
      enableRegressionReports: true,
      enableTestSummary: true,
      reportFormat: ['json', 'html', 'xml'],
      enableReportArchiving: true
    },

    // Continuous testing
    continuous: {
      enableCIIntegration: true,
      enableAutomatedTesting: true,
      enableScheduledTesting: true,
      enableRegressionSuite: true,
      enableSmokeTests: true,
      enableHealthChecks: true
    },

    // User acceptance testing
    uat: {
      enableUATMode: true,
      enableUserJourneys: true,
      enableScenarioTesting: true,
      enableUsabilityTesting: true,
      enableAccessibilityTesting: true,
      enableBrowserTesting: true,
      enableMobileCompatibility: true
    }
  },

  // Error handling for testing
  errorHandling: {
    displayStackTraces: true,
    enableErrorReporting: true,
    enableErrorAggregation: true,
    testing: {
      showSensitiveData: false,
      enableDetailedErrors: true,
      enableErrorContext: true,
      enableDebugInfo: true,
      enableErrorRecovery: true,
      enableFailureMocking: true
    }
  },

  // Resource limits for testing
  resources: {
    maxFileSize: '25mb',
    tempDirectory: 'tmp/testing',
    cleanupInterval: 1800000, // 30 minutes
    testing: {
      enableResourceMonitoring: true,
      enableResourceLimiting: true,
      enableCleanupLogging: true,
      preserveTestArtifacts: true,
      testArtifactRetention: 7 // days
    }
  },

  // Testing health checks
  health: {
    enableDetailedChecks: true,
    includeSystemInfo: true,
    includeDependencyStatus: true,
    includePerformanceMetrics: true,
    includeTestStatus: true,
    checkInterval: 30000, // 30 seconds
    testing: {
      enableVerboseHealth: true,
      includeDebugInfo: true,
      enableHealthHistory: true,
      enableTestHealthChecks: true,
      enableDependencyTesting: true
    }
  },

  // Quality assurance
  qa: {
    enableQualityGates: true,
    enableCodeQuality: true,
    enableSecurityScanning: true,
    enablePerformanceValidation: true,
    enableCompatibilityTesting: true,
    qualityThresholds: {
      testCoverage: 80, // 80% minimum
      performanceRegression: 10, // 10% max degradation
      errorRate: 1, // 1% max error rate
      availability: 99.5 // 99.5% minimum uptime
    }
  },

  // Test environment cleanup
  cleanup: {
    enableAutoCleanup: true,
    cleanupSchedule: '0 2 * * *', // Daily at 2 AM
    cleanupTargets: ['logs', 'temp_files', 'test_data', 'cache'],
    retentionDays: 7,
    enableCleanupReports: true
  }
};
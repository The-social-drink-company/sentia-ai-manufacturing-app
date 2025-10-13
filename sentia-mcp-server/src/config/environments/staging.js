/**
 * Staging Environment Configuration
 * 
 * Pre-production environment that mirrors production settings while
 * maintaining debugging capabilities for final validation and testing.
 */

export default {
  server: {
    environment: 'staging',
    host: '0.0.0.0',
    port: process.env.PORT || 3001
  },

  // Staging feature flags
  features: {
    enableHotReload: false,
    enableDebugLogging: true,
    enableDetailedErrors: true,
    enableSecurity: true,
    enableMonitoring: true,
    enableAuditLogging: true,
    enablePerformanceOptimization: true,
    enableCaching: true,
    enableRateLimiting: true,
    enableCompression: true,
    enableHealthChecks: true,
    enableMetrics: true,
    enableStagingHelpers: true
  },

  // Staging security (production-like with debugging)
  security: {
    authRequired: true,
    authentication: {
      enabled: true,
      developmentBypass: false,
      requireMFA: process.env.REQUIRE_MFA === 'true',
      sessionTimeout: 3600000, // 1 hour
      maxConcurrentSessions: 5,
      enforcePasswordPolicy: true,
      enableAccountLockout: true,
      maxFailedAttempts: 5, // More lenient than production
      lockoutDuration: 600000, // 10 minutes
      stagingMode: true
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Higher than production for testing
      message: 'Rate limit exceeded in staging environment',
      perUser: {
        enabled: true,
        windowMs: 15 * 60 * 1000,
        max: 400
      },
      tools: {
        enabled: true,
        defaultLimitPerHour: 2000,
        expensiveToolsLimitPerHour: 200
      }
    },
    helmet: {
      enabled: true,
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // More lenient for staging
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"]
        }
      },
      hsts: {
        enabled: true,
        maxAge: 86400, // 1 day (shorter than production)
        includeSubDomains: false
      }
    },
    cors: {
      enabled: true,
      origins: [
        'https://sentia-manufacturing-staging.onrender.com',
        'https://staging.sentia.com',
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
        'X-Staging-Test',
        'X-Test-User'
      ]
    },
    encryption: {
      enabled: true,
      developmentBypass: false,
      algorithm: 'aes-256-gcm',
      keyRotationDays: 30, // More frequent than production
      stagingMode: true
    }
  },

  // Staging logging (balanced detail)
  logging: {
    level: 'info',
    format: 'json',
    console: {
      enabled: true,
      colorize: false,
      prettyPrint: false
    },
    file: {
      enabled: true,
      directory: 'logs/staging',
      filename: 'staging.log',
      maxSize: '100m',
      maxFiles: 20,
      compress: true,
      colorize: false
    },
    errorFile: {
      enabled: true,
      filename: 'staging-error.log',
      level: 'error',
      maxSize: '50m',
      maxFiles: 10
    },
    auditFile: {
      enabled: true,
      filename: 'staging-audit.log',
      maxSize: '100m',
      maxFiles: 20
    },
    staging: {
      enableDetailedLogging: true,
      enableUserActionLogging: true,
      enablePerformanceLogging: true,
      enableIntegrationLogging: true,
      enableDebugContext: true,
      logSlowOperations: true,
      slowOperationThreshold: 2000
    }
  },

  // Staging database settings
  database: {
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    maxConnections: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    enableQueryLogging: true,
    logSlowQueries: true,
    slowQueryThreshold: 1500,
    staging: {
      enableQueryAnalysis: true,
      enablePerformanceMonitoring: true,
      enableConnectionPoolMonitoring: true,
      enableDataSampling: true,
      sampleSize: 1000,
      enableSchemaValidation: true
    }
  },

  // Staging cache settings
  cache: {
    type: process.env.REDIS_URL ? 'redis' : 'memory',
    redis: {
      url: process.env.REDIS_URL,
      keyPrefix: 'sentia-mcp:staging:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      commandTimeout: 5000
    },
    memory: {
      maxSize: 3000,
      checkPeriod: 600
    },
    staging: {
      enableCacheMetrics: true,
      enableCacheDebugging: true,
      enableCacheValidation: true,
      cacheHitRateThreshold: 0.8,
      enableCacheProfiling: true
    }
  },

  // Staging tools configuration
  tools: {
    timeout: 45000, // Longer timeout for staging testing
    maxConcurrent: 15,
    enableProfiling: true,
    caching: {
      enabled: true,
      defaultTTL: 300, // 5 minutes
      maxSize: 3000,
      enableCompression: true
    },
    staging: {
      enableToolMetrics: true,
      enableToolProfiling: true,
      enableToolValidation: true,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 10,
      enableRetry: true,
      maxRetries: 3
    }
  },

  // Staging monitoring (comprehensive)
  monitoring: {
    enabled: true,
    collectSystemMetrics: true,
    collectToolMetrics: true,
    collectBusinessMetrics: true,
    retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
    performance: {
      enabled: true,
      sampleRate: 0.5, // Sample 50% of requests
      responseTimeThresholds: {
        warning: 1000,
        critical: 3000
      },
      memoryThresholds: {
        warning: 75,
        critical: 90
      },
      cpuThresholds: {
        warning: 70,
        critical: 85
      }
    },
    businessAnalytics: {
      enabled: true,
      retentionDays: 90,
      costTracking: true,
      userAnalytics: true,
      manufacturingKPIs: true,
      stagingMetrics: true
    },
    alerting: {
      enabled: true,
      stormProtection: true,
      maxAlertsPerMinute: 10,
      deduplicationWindow: 300000, // 5 minutes
      escalationTimeout: 1800000, // 30 minutes
      notifications: {
        webhook: {
          enabled: process.env.STAGING_WEBHOOK_URL ? true : false,
          url: process.env.STAGING_WEBHOOK_URL,
          timeout: 10000
        },
        email: {
          enabled: process.env.STAGING_EMAIL_NOTIFICATIONS === 'true',
          recipients: process.env.STAGING_EMAIL_RECIPIENTS?.split(',') || []
        },
        slack: {
          enabled: process.env.STAGING_SLACK_WEBHOOK_URL ? true : false,
          webhookUrl: process.env.STAGING_SLACK_WEBHOOK_URL,
          channel: '#staging-alerts',
          username: 'Sentia MCP Staging'
        }
      }
    },
    staging: {
      enablePreProductionValidation: true,
      enableLoadTesting: true,
      enablePerformanceBaselines: true,
      enableRegressionDetection: true,
      enableCapacityPlanning: true,
      enableStagingReports: true
    }
  },

  // Staging integrations
  integrations: {
    staging: {
      enableSandboxMode: true,
      enableProductionMirroring: true,
      logRequests: true,
      enableResponseValidation: true,
      enableContractTesting: true,
      enablePerformanceTesting: true,
      enableFailoverTesting: true
    },
    xero: {
      sandbox: true,
      logRequests: true,
      enableValidation: true,
      enablePerformanceTesting: true
    },
    shopify: {
      sandbox: true,
      logRequests: true,
      enableValidation: true,
      testStore: process.env.SHOPIFY_STAGING_STORE
    },
    amazon: {
      sandbox: true,
      logRequests: true,
      enableValidation: true,
      testMarketplace: true
    },
    anthropic: {
      logRequests: true,
      enableCaching: true,
      temperature: 0.7,
      enableUsageTracking: true
    },
    openai: {
      logRequests: true,
      enableCaching: true,
      temperature: 0.7,
      enableUsageTracking: true
    }
  },

  // Staging AI settings
  ai: {
    staging: {
      enableProductionMirroring: true,
      enableModelValidation: true,
      enablePerformanceTesting: true,
      enableAccuracyTesting: true,
      enableLoadTesting: true,
      enableBenchmarking: true
    },
    models: {
      forecasting: {
        enableValidation: true,
        maxTrainingTime: 300000, // 5 minutes
        minDataPoints: 30,
        enableCrossValidation: true,
        accuracyThreshold: 0.85
      },
      optimization: {
        maxIterations: 1000,
        enableParallelProcessing: true,
        enableValidation: true
      },
      anomalyDetection: {
        enableValidation: true,
        sensitivityThreshold: 2.5,
        enableTuning: true
      }
    }
  },

  // Staging-specific features
  staging: {
    // Pre-production validation
    validation: {
      enablePreProductionChecks: true,
      enablePerformanceValidation: true,
      enableSecurityValidation: true,
      enableIntegrationValidation: true,
      enableDataValidation: true,
      enableUXValidation: true
    },

    // Load testing
    loadTesting: {
      enabled: true,
      maxConcurrentUsers: 500,
      testDuration: 600000, // 10 minutes
      rampUpTime: 120000, // 2 minutes
      enableStressTesting: true,
      enableEnduranceTesting: true
    },

    // Production mirroring
    mirroring: {
      enableTrafficMirroring: false, // Enable when supported
      enableDataMirroring: false,
      enableConfigMirroring: true,
      enableFeatureMirroring: true
    },

    // Staging data management
    data: {
      enableProductionDataSubset: true,
      enableDataAnonymization: true,
      enableDataMasking: true,
      dataSubsetSize: 'medium',
      refreshSchedule: '0 4 * * 0' // Weekly on Sunday at 4 AM
    },

    // User acceptance testing
    uat: {
      enableUATEnvironment: true,
      enableUserJourneys: true,
      enableUsabilityTesting: true,
      enableAccessibilityTesting: true,
      enableCrossBrowserTesting: true,
      enableMobileCompatibility: true
    },

    // Deployment validation
    deployment: {
      enableSmokeTests: true,
      enableHealthChecks: true,
      enableRegressionTests: true,
      enablePerformanceTests: true,
      enableSecurityTests: true,
      validationTimeout: 600000 // 10 minutes
    }
  },

  // Error handling for staging
  errorHandling: {
    displayStackTraces: true,
    enableErrorReporting: true,
    enableErrorAggregation: true,
    staging: {
      showSensitiveData: false,
      enableDetailedErrors: true,
      enableErrorContext: true,
      enableDebugInfo: true,
      enableGracefulFailover: true,
      enableErrorAnalysis: true
    }
  },

  // Resource limits for staging
  resources: {
    maxFileSize: '15mb',
    tempDirectory: 'tmp/staging',
    cleanupInterval: 3600000, // 1 hour
    staging: {
      enableResourceMonitoring: true,
      enableCapacityPlanning: true,
      enableResourceOptimization: true,
      enableUsageAnalytics: true
    }
  },

  // Staging health checks
  health: {
    enableDetailedChecks: true,
    includeSystemInfo: true,
    includeDependencyStatus: true,
    includePerformanceMetrics: true,
    checkInterval: 30000, // 30 seconds
    staging: {
      enableVerboseHealth: true,
      includeDebugInfo: true,
      enableHealthHistory: true,
      enableProductionReadiness: true,
      enableCapacityChecks: true
    }
  },

  // Staging backup and testing
  backup: {
    enabled: true,
    schedule: '0 3 * * *', // Daily at 3 AM
    retention: 30, // 30 days
    compression: true,
    testRestoreability: true
  },

  // Staging compliance testing
  compliance: {
    enableComplianceTesting: true,
    enableSecurityAuditing: true,
    enableDataProtectionTesting: true,
    enableAccessControlTesting: true
  }
};
/**
 * Development Environment Configuration
 * 
 * Optimized for fast development workflow with relaxed security,
 * enhanced debugging, and developer-friendly defaults.
 */

export default {
  server: {
    environment: 'development',
    host: '0.0.0.0',
    port: 3001
  },

  // Development feature flags
  features: {
    enableHotReload: true,
    enableDebugLogging: true,
    enableDetailedErrors: true,
    enableCORS: true,
    enableDevTools: true,
    enableMockData: true,
    enableTestingHelpers: true,
    enablePerformanceProfiling: true,
    enableMemoryLeakDetection: true,
    enableSQLQueryLogging: true,
    enableAPIDocumentation: true,
    enableGraphQLPlayground: true
  },

  // Relaxed security for development
  security: {
    authRequired: false,
    developmentBypass: true,
    authentication: {
      enabled: false,
      developmentBypass: true,
      requireMFA: false,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      maxConcurrentSessions: 100 // Unlimited for dev
    },
    rateLimiting: {
      enabled: false, // Disabled for development
      windowMs: 60000, // 1 minute
      max: 10000, // Very high limit
      message: 'Development rate limit exceeded (very high threshold)'
    },
    helmet: {
      enabled: false,
      contentSecurityPolicy: { enabled: false }
    },
    cors: {
      enabled: true,
      origins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'https://localhost:3000',
        'https://localhost:5173'
      ],
      credentials: true,
      optionsSuccessStatus: 200
    },
    encryption: {
      enabled: false, // Skip encryption in development for faster debugging
      developmentBypass: true
    }
  },

  // Enhanced logging for development
  logging: {
    level: 'debug',
    format: 'pretty', // Human-readable format
    console: {
      enabled: true,
      colorize: true,
      prettyPrint: true,
      timestamp: true,
      showLevel: true,
      showPid: true
    },
    file: {
      enabled: true,
      directory: 'logs/development',
      filename: 'dev.log',
      maxSize: '100m',
      maxFiles: 10,
      colorize: false
    },
    development: {
      enableSourceMaps: true,
      enableStackTraces: true,
      enableVerboseErrors: true,
      enableQueryLogging: true,
      enablePerformanceLogging: true,
      logSlowQueries: true,
      slowQueryThreshold: 100 // Log queries > 100ms
    }
  },

  // Development database settings
  database: {
    enableQueryLogging: true,
    logSlowQueries: true,
    slowQueryThreshold: 100,
    maxConnections: 5, // Lower for development
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: false,
    development: {
      enableSeeding: true,
      enableMigrations: true,
      enableTestData: true,
      resetOnRestart: false,
      backupBeforeReset: true
    }
  },

  // Development cache settings
  cache: {
    type: 'memory', // Use memory cache for simplicity
    memory: {
      maxSize: 100, // Small cache for development
      checkPeriod: 60, // 1 minute
      enableStats: true
    },
    development: {
      enableCacheInvalidation: true,
      enableCacheDebugging: true,
      logCacheOperations: true
    }
  },

  // Development tools configuration
  tools: {
    timeout: 60000, // 1 minute timeout for debugging
    maxConcurrent: 20, // Higher concurrency for testing
    enableDebugMode: true,
    enableProfiling: true,
    caching: {
      enabled: false, // Disable caching for fresh results
      defaultTTL: 60, // Short TTL for development
      maxSize: 100
    },
    development: {
      enableMockTools: true,
      enableTestingTools: true,
      enableBenchmarking: true,
      logToolExecution: true,
      enableToolMetrics: true
    }
  },

  // Enhanced monitoring for development
  monitoring: {
    enabled: true,
    collectSystemMetrics: true,
    collectToolMetrics: true,
    development: {
      enableDetailedMetrics: true,
      enableRealTimeMonitoring: true,
      enablePerformanceProfiling: true,
      enableMemoryProfiling: true,
      enableCPUProfiling: true,
      metricsRetentionHours: 24
    },
    performance: {
      enabled: true,
      sampleRate: 1.0, // Sample all requests
      responseTimeThresholds: {
        warning: 500, // Lower thresholds for development
        critical: 2000
      },
      memoryThresholds: {
        warning: 70,
        critical: 90
      }
    },
    alerting: {
      enabled: false, // Disable alerting in development
      notifications: {
        webhook: { enabled: false },
        email: { enabled: false },
        slack: { enabled: false },
        sms: { enabled: false }
      }
    }
  },

  // Development integrations
  integrations: {
    development: {
      enableMockIntegrations: true,
      enableTestingEndpoints: true,
      enableSandboxMode: true,
      logAllRequests: true,
      enableResponseCaching: false
    },
    xero: {
      sandbox: true,
      logRequests: true,
      mockResponses: true
    },
    shopify: {
      sandbox: true,
      logRequests: true,
      mockResponses: true
    },
    amazon: {
      sandbox: true,
      logRequests: true,
      mockResponses: true
    },
    anthropic: {
      logRequests: true,
      enableCaching: false,
      temperature: 0.1 // Lower temperature for consistent results
    },
    openai: {
      logRequests: true,
      enableCaching: false,
      temperature: 0.1
    }
  },

  // Development AI settings
  ai: {
    development: {
      enableMockModels: true,
      enableModelDebugging: true,
      logPredictions: true,
      enableA_Btesting: true,
      fastTraining: true
    },
    models: {
      forecasting: {
        enableQuickTraining: true,
        maxTrainingTime: 30000, // 30 seconds
        minDataPoints: 10 // Lower requirement for testing
      },
      optimization: {
        maxIterations: 100, // Faster optimization
        enableEarlyTermination: true
      }
    }
  },

  // Development-specific features
  development: {
    // API development
    api: {
      enableSwaggerUI: true,
      enableGraphQLPlayground: true,
      enableAPIDocumentation: true,
      enableRequestLogging: true,
      enableResponseLogging: true,
      enableCORSHeaders: true
    },

    // Testing support
    testing: {
      enableTestRoutes: true,
      enableMockData: true,
      enableDataSeeding: true,
      enableTestUtilities: true,
      enableBenchmarking: true
    },

    // Debugging features
    debugging: {
      enableSourceMaps: true,
      enableStackTraces: true,
      enableVerboseErrors: true,
      enableRequestTracing: true,
      enablePerformanceProfiling: true,
      enableMemoryProfiling: true
    },

    // Hot reload settings
    hotReload: {
      enabled: true,
      watchFiles: ['src/**/*.js', 'src/**/*.json'],
      excludeFiles: ['node_modules/**', 'logs/**', 'tmp/**'],
      debounceMs: 500,
      enableConfigReload: true,
      enableToolReload: true
    },

    // Mock data settings
    mockData: {
      enabled: true,
      generateOnStartup: true,
      seedDatabase: false,
      mockIntegrations: true,
      mockAIResponses: true,
      dataSize: 'small' // small, medium, large
    },

    // Performance profiling
    profiling: {
      enabled: true,
      cpuProfiling: true,
      memoryProfiling: true,
      queryProfiling: true,
      toolProfiling: true,
      reportInterval: 60000 // 1 minute
    }
  },

  // Error handling for development
  errorHandling: {
    displayStackTraces: true,
    enableErrorReporting: false,
    enableErrorAggregation: false,
    development: {
      showSensitiveData: true,
      enableDetailedErrors: true,
      enableErrorContext: true,
      enableDebugInfo: true
    }
  },

  // Resource limits for development
  resources: {
    maxFileSize: '50mb', // Larger files for development
    tempDirectory: 'tmp/development',
    cleanupInterval: 600000, // 10 minutes
    development: {
      enableResourceMonitoring: true,
      enableCleanupLogging: true,
      preserveTestFiles: true
    }
  },

  // CORS configuration for development
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://sentia-manufacturing-development.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Correlation-ID',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: [
      'X-Correlation-ID',
      'X-Response-Time',
      'X-Request-ID'
    ]
  },

  // Development health checks
  health: {
    enableDetailedChecks: true,
    includeSystemInfo: true,
    includeDependencyStatus: true,
    includePerformanceMetrics: true,
    checkInterval: 30000, // 30 seconds
    development: {
      enableVerboseHealth: true,
      includeDebugInfo: true,
      enableHealthHistory: true
    }
  }
};
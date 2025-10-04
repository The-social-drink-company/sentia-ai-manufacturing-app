/**
 * Production Environment Configuration
 * 
 * Hardened configuration optimized for production deployment with
 * enhanced security, performance, and enterprise-grade features.
 */

export default {
  server: {
    environment: 'production',
    host: '0.0.0.0',
    port: process.env.PORT || 3001
  },

  // Production feature flags
  features: {
    enableHotReload: false,
    enableDebugLogging: false,
    enableDetailedErrors: false,
    enableSecurity: true,
    enableMonitoring: true,
    enableAuditLogging: true,
    enablePerformanceOptimization: true,
    enableCaching: true,
    enableRateLimiting: true,
    enableCompression: true,
    enableHealthChecks: true,
    enableMetrics: true
  },

  // Production security (hardened)
  security: {
    authRequired: true,
    authentication: {
      enabled: true,
      developmentBypass: false,
      requireMFA: process.env.REQUIRE_MFA === 'true',
      sessionTimeout: 3600000, // 1 hour
      maxConcurrentSessions: 3,
      sessionRotationInterval: 1800000, // 30 minutes
      enforcePasswordPolicy: true,
      enableAccountLockout: true,
      maxFailedAttempts: 3,
      lockoutDuration: 900000 // 15 minutes
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Strict limits for production
      message: 'Rate limit exceeded. Please try again later.',
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      perUser: {
        enabled: true,
        windowMs: 15 * 60 * 1000,
        max: 200
      },
      tools: {
        enabled: true,
        defaultLimitPerHour: 1000,
        expensiveToolsLimitPerHour: 100
      }
    },
    helmet: {
      enabled: true,
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      xssFilter: true,
      noSniff: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true
    },
    cors: {
      enabled: true,
      origins: [
        'https://sentia-manufacturing-production.onrender.com',
        'https://app.sentia.com',
        'https://dashboard.sentia.com'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
    },
    encryption: {
      enabled: true,
      developmentBypass: false,
      algorithm: 'aes-256-gcm',
      keyRotationDays: 90,
      encryptSensitiveFields: true
    },
    monitoring: {
      enabled: true,
      developmentBypass: false,
      failedAuth: {
        maxAttempts: 3,
        lockoutDuration: 900000, // 15 minutes
        trackByIP: true,
        trackByUser: true
      },
      suspiciousActivity: {
        enabled: true,
        multipleLocationThreshold: 2,
        rapidRequestThreshold: 50,
        timeWindowMs: 60000 // 1 minute
      }
    },
    audit: {
      enabled: true,
      level: 'info',
      events: [
        'authentication',
        'authorization',
        'tool_execution',
        'data_access',
        'configuration_change',
        'user_management',
        'security_violation'
      ],
      retention: {
        days: 2555, // 7 years for compliance
        maxSizeMB: 10000 // 10GB
      },
      encryption: true
    }
  },

  // Production logging (minimal but comprehensive)
  logging: {
    level: 'warn',
    format: 'json',
    console: {
      enabled: false, // Disable console logging in production
      colorize: false
    },
    file: {
      enabled: true,
      directory: 'logs/production',
      filename: 'app.log',
      maxSize: '100m',
      maxFiles: 30,
      compress: true,
      colorize: false
    },
    errorFile: {
      enabled: true,
      filename: 'error.log',
      level: 'error',
      maxSize: '50m',
      maxFiles: 10
    },
    auditFile: {
      enabled: true,
      filename: 'audit.log',
      maxSize: '200m',
      maxFiles: 50,
      encryption: true
    },
    production: {
      enableStructuredLogging: true,
      enableLogAggregation: true,
      enableLogForwarding: true,
      sensitiveDataMasking: true,
      enableLogRetention: true,
      enableLogCompression: true
    }
  },

  // Production database settings (optimized)
  database: {
    ssl: {
      rejectUnauthorized: false, // For Render PostgreSQL
      ca: process.env.DB_SSL_CA,
      cert: process.env.DB_SSL_CERT,
      key: process.env.DB_SSL_KEY
    },
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    enableQueryLogging: false,
    logSlowQueries: true,
    slowQueryThreshold: 2000, // 2 seconds
    poolSize: 10,
    statementTimeout: 30000,
    queryTimeout: 30000,
    production: {
      enableConnectionPooling: true,
      enableReadReplicas: false, // Enable when available
      enableQueryOptimization: true,
      enableIndexOptimization: true,
      enableBackups: true,
      backupSchedule: '0 2 * * *', // Daily at 2 AM
      enableMonitoring: true
    }
  },

  // Production cache settings (Redis preferred)
  cache: {
    type: 'redis',
    redis: {
      url: process.env.REDIS_URL,
      keyPrefix: 'sentia-mcp:prod:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      compression: 'gzip'
    },
    memory: {
      maxSize: 5000, // Fallback memory cache
      checkPeriod: 600
    },
    production: {
      enableDistributedCache: true,
      enableCacheCompression: true,
      enableCacheEncryption: true,
      enableCacheMetrics: true,
      enableCacheReplication: false // Enable when multi-region
    }
  },

  // Production tools configuration
  tools: {
    timeout: 30000,
    maxConcurrent: 10,
    enableProfiling: false,
    caching: {
      enabled: true,
      defaultTTL: 300, // 5 minutes
      maxSize: 5000,
      enableCompression: true
    },
    production: {
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableBulkOperations: true,
      enableAsyncProcessing: true
    }
  },

  // Production monitoring (comprehensive)
  monitoring: {
    enabled: true,
    collectSystemMetrics: true,
    collectToolMetrics: true,
    collectBusinessMetrics: true,
    retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    performance: {
      enabled: true,
      sampleRate: 0.1, // Sample 10% of requests
      responseTimeThresholds: {
        warning: 1000,
        critical: 5000
      },
      memoryThresholds: {
        warning: 80,
        critical: 95
      },
      cpuThresholds: {
        warning: 70,
        critical: 90
      }
    },
    businessAnalytics: {
      enabled: true,
      retentionDays: 2555, // 7 years
      costTracking: true,
      userAnalytics: true,
      manufacturingKPIs: true,
      revenueTracking: true,
      operationalMetrics: true
    },
    alerting: {
      enabled: true,
      stormProtection: true,
      maxAlertsPerMinute: 5,
      deduplicationWindow: 300000, // 5 minutes
      escalationTimeout: 900000, // 15 minutes
      notifications: {
        webhook: {
          enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
          url: process.env.WEBHOOK_URL,
          secret: process.env.WEBHOOK_SECRET,
          timeout: 10000,
          retries: 3
        },
        email: {
          enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
          recipients: process.env.EMAIL_RECIPIENTS?.split(',') || [],
          smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          }
        },
        slack: {
          enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#production-alerts',
          username: 'Sentia MCP Production'
        },
        sms: {
          enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
          provider: 'twilio',
          apiKey: process.env.TWILIO_ACCOUNT_SID,
          apiSecret: process.env.TWILIO_AUTH_TOKEN,
          recipients: process.env.SMS_RECIPIENTS?.split(',') || []
        }
      },
      escalation: {
        enabled: true,
        levels: [
          { severity: 'low', delay: 0 },
          { severity: 'medium', delay: 300000 }, // 5 minutes
          { severity: 'high', delay: 900000 }, // 15 minutes
          { severity: 'critical', delay: 0 } // Immediate
        ]
      }
    },
    logManagement: {
      enabled: true,
      retentionDays: 365, // 1 year
      maxSizeMB: 50000, // 50GB
      compressionEnabled: true,
      searchIndexEnabled: true,
      enableLogShipping: true
    },
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      endpoint: '/prometheus',
      defaultLabels: {
        service: 'sentia-mcp-server',
        version: '3.0.0',
        environment: 'production'
      }
    }
  },

  // Production integrations (secure)
  integrations: {
    production: {
      enableSandboxMode: false,
      logRequests: false, // Disable request logging for security
      enableResponseCaching: true,
      enableCircuitBreaker: true,
      enableRetry: true,
      maxRetries: 3,
      requestTimeout: 30000
    },
    xero: {
      sandbox: false,
      logRequests: false,
      enableCaching: true,
      rateLimit: {
        requestsPerMinute: 60,
        dailyLimit: 5000
      }
    },
    shopify: {
      sandbox: false,
      logRequests: false,
      enableCaching: true,
      rateLimit: {
        requestsPerSecond: 2,
        bucketSize: 40
      }
    },
    amazon: {
      sandbox: false,
      logRequests: false,
      enableCaching: true,
      rateLimit: {
        requestsPerSecond: 0.5,
        burstLimit: 10
      }
    },
    anthropic: {
      logRequests: false,
      enableCaching: true,
      temperature: 0.7,
      maxTokens: 4096,
      rateLimit: {
        requestsPerMinute: 1000,
        tokensPerMinute: 80000
      }
    },
    openai: {
      logRequests: false,
      enableCaching: true,
      temperature: 0.7,
      maxTokens: 4096,
      rateLimit: {
        requestsPerMinute: 3000,
        tokensPerMinute: 90000
      }
    }
  },

  // Production AI settings
  ai: {
    production: {
      enableModelCaching: true,
      enableDistributedInference: false,
      enableGPUAcceleration: false,
      enableModelOptimization: true,
      enableBatchProcessing: true,
      maxBatchSize: 1000
    },
    models: {
      forecasting: {
        enableEnsembleMethods: true,
        enableCrossValidation: true,
        maxTrainingTime: 300000, // 5 minutes
        minDataPoints: 50
      },
      optimization: {
        maxIterations: 1000,
        enableParallelProcessing: true,
        enableEarlyTermination: true
      },
      anomalyDetection: {
        enableRealTimeDetection: true,
        sensitivityThreshold: 2.5,
        enableAutoTuning: true
      }
    }
  },

  // Production error handling
  errorHandling: {
    displayStackTraces: false,
    enableErrorReporting: true,
    enableErrorAggregation: true,
    enableSentryIntegration: process.env.SENTRY_DSN ? true : false,
    production: {
      showSensitiveData: false,
      enableDetailedErrors: false,
      enableErrorContext: false,
      enableDebugInfo: false,
      enableGracefulFailover: true,
      enableErrorRecovery: true
    }
  },

  // Production resource limits
  resources: {
    maxFileSize: '10mb',
    tempDirectory: 'tmp/production',
    cleanupInterval: 3600000, // 1 hour
    maxMemoryUsage: '2gb',
    maxCPUUsage: 80, // 80%
    production: {
      enableResourceMonitoring: true,
      enableAutoScaling: false, // Enable when supported
      enableLoadBalancing: false, // Enable when multi-instance
      enableResourceOptimization: true,
      enableGarbageCollection: true
    }
  },

  // Production health checks
  health: {
    enableDetailedChecks: false,
    includeSystemInfo: false,
    includeDependencyStatus: true,
    includePerformanceMetrics: true,
    checkInterval: 60000, // 1 minute
    production: {
      enableVerboseHealth: false,
      includeDebugInfo: false,
      enableHealthHistory: true,
      enableHealthMetrics: true,
      enableUptimeTracking: true,
      enableDependencyMonitoring: true
    }
  },

  // Production backup and recovery
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 90, // 90 days
    compression: true,
    encryption: true,
    destinations: ['s3', 'local'],
    verification: true
  },

  // Production compliance
  compliance: {
    gdpr: {
      enabled: true,
      dataRetentionDays: 2555, // 7 years
      enableDataPortability: true,
      enableRightToErasure: true,
      enableConsentManagement: true
    },
    sox: {
      enabled: true,
      enableFinancialControls: true,
      enableAuditTrails: true,
      enableDataIntegrity: true
    },
    iso27001: {
      enabled: true,
      enableSecurityControls: true,
      enableRiskManagement: true,
      enableIncidentResponse: true
    }
  },

  // Production scaling
  scaling: {
    horizontal: {
      enabled: false, // Enable when multi-instance
      minInstances: 2,
      maxInstances: 10,
      targetCPU: 70,
      targetMemory: 80
    },
    vertical: {
      enabled: true,
      maxMemory: '4gb',
      maxCPU: '2000m'
    }
  }
};
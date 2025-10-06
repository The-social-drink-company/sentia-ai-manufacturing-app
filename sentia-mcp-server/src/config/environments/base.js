/**
 * Base Configuration
 * 
 * Shared configuration settings that apply to all environments.
 * This serves as the foundation that environment-specific configs build upon.
 */

export default {
  // Core server information
  server: {
    name: 'sentia-manufacturing-mcp',
    version: '3.0.0',
    description: 'Sentia Manufacturing MCP Server - Enterprise Business Intelligence Platform',
    maintainer: 'Sentia Manufacturing Team',
    documentation: 'https://docs.sentia.com/mcp-server'
  },

  // Default feature flags
  features: {
    enableCaching: true,
    enableMonitoring: true,
    enableSecurity: true,
    enableAnalytics: true,
    enableIntegrations: true,
    enableBusinessIntelligence: true,
    enableAuditLogging: true,
    enablePerformanceOptimization: true,
    enableBackgroundJobs: true,
    enableWebhooks: true
  },

  // Default values and constraints
  defaults: {
    // Transport defaults
    transport: {
      type: 'dual',
      stdio: { enabled: true },
      http: { enabled: true, port: 3002 },
      sse: { enabled: true, heartbeatInterval: 30000 }
    },

    // Database defaults
    database: {
      maxConnections: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      slowQueryThreshold: 1000,
      enableQueryLogging: false,
      ssl: false
    },

    // Security defaults
    security: {
      jwtExpiresIn: '24h',
      authRequired: false,
      rateLimitMax: 100,
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      helmet: {
        enabled: false,
        contentSecurityPolicy: { enabled: false }
      },
      authentication: {
        enabled: false,
        developmentBypass: true,
        requireMFA: false,
        sessionTimeout: 3600000, // 1 hour
        maxConcurrentSessions: 5
      },
      rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000,
        max: 100,
        perUser: {
          enabled: false,
          windowMs: 15 * 60 * 1000,
          max: 200
        }
      }
    },

    // Logging defaults
    logging: {
      level: 'info',
      format: 'json',
      file: {
        enabled: true,
        maxSize: '5m',
        maxFiles: 5,
        directory: 'logs'
      },
      console: {
        enabled: true,
        colorize: false
      }
    },

    // Cache defaults
    cache: {
      type: 'memory',
      memory: {
        maxSize: 1000,
        checkPeriod: 600 // 10 minutes
      },
      redis: {
        keyPrefix: 'sentia-mcp:',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      }
    },

    // Tool defaults
    tools: {
      directory: 'src/tools',
      enabledCategories: ['system', 'manufacturing', 'financial', 'database', 'integration', 'ai'],
      timeout: 30000,
      maxConcurrent: 10,
      caching: {
        enabled: true,
        defaultTTL: 300, // 5 minutes
        maxSize: 1000
      }
    },

    // Resource management defaults
    resources: {
      maxFileSize: '10mb',
      allowedMimeTypes: [
        'application/json',
        'text/plain',
        'text/csv',
        'application/xml',
        'application/pdf'
      ],
      tempDirectory: 'tmp',
      cleanupInterval: 3600000 // 1 hour
    },

    // Monitoring defaults
    monitoring: {
      enabled: true,
      metricsEndpoint: '/metrics',
      healthEndpoint: '/health',
      collectSystemMetrics: true,
      collectToolMetrics: true,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      performance: {
        enabled: true,
        sampleRate: 1.0,
        responseTimeThresholds: {
          warning: 1000,
          critical: 5000
        },
        memoryThresholds: {
          warning: 80,
          critical: 95
        }
      },
      businessAnalytics: {
        enabled: true,
        retentionDays: 90,
        costTracking: true,
        userAnalytics: true,
        manufacturingKPIs: true
      },
      alerting: {
        enabled: true,
        stormProtection: true,
        maxAlertsPerMinute: 10,
        deduplicationWindow: 300000, // 5 minutes
        escalationTimeout: 1800000, // 30 minutes
        notifications: {
          webhook: { enabled: false },
          email: { enabled: false },
          slack: { enabled: false },
          sms: { enabled: false }
        }
      }
    }
  },

  // Validation rules
  validation: {
    // Minimum requirements
    minimums: {
      jwtSecretLength: 32,
      portRange: { min: 1, max: 65535 },
      rateLimitMax: 1,
      rateLimitWindow: 1000,
      databaseConnections: 1,
      databaseTimeout: 1000
    },

    // Security requirements
    security: {
      requireHttpsInProduction: true,
      requireAuthInProduction: true,
      requireStrongJwtSecret: true,
      requireSslInProduction: true
    },

    // Performance requirements
    performance: {
      maxDatabaseConnections: 1000,
      maxCacheSize: 10000,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxToolTimeout: 300000 // 5 minutes
    }
  },

  // Integration templates
  integrationTemplates: {
    xero: {
      name: 'Xero Accounting',
      type: 'oauth2',
      requiredFields: ['clientId', 'clientSecret'],
      optionalFields: ['redirectUri', 'scopes'],
      healthCheckEndpoint: '/connections',
      rateLimits: {
        requestsPerMinute: 60,
        dailyLimit: 5000
      }
    },

    shopify: {
      name: 'Shopify E-commerce',
      type: 'token',
      requiredFields: ['accessToken', 'shopDomain'],
      optionalFields: ['apiVersion'],
      healthCheckEndpoint: '/admin/api/shop.json',
      rateLimits: {
        requestsPerSecond: 2,
        bucketSize: 40
      }
    },

    amazon: {
      name: 'Amazon Marketplace',
      type: 'sp-api',
      requiredFields: ['sellerId', 'clientId', 'clientSecret', 'refreshToken'],
      optionalFields: ['region', 'sandbox'],
      healthCheckEndpoint: '/sellers/v1/marketplaceParticipations',
      rateLimits: {
        requestsPerSecond: 0.5,
        burstLimit: 10
      }
    },

    unleashed: {
      name: 'Unleashed ERP',
      type: 'hmac',
      requiredFields: ['apiId', 'apiKey'],
      optionalFields: ['baseUrl'],
      healthCheckEndpoint: '/Products/1',
      rateLimits: {
        requestsPerMinute: 200,
        dailyLimit: 50000
      }
    },

    anthropic: {
      name: 'Anthropic Claude AI',
      type: 'api-key',
      requiredFields: ['apiKey'],
      optionalFields: ['model', 'maxTokens', 'temperature'],
      healthCheckEndpoint: '/v1/messages',
      rateLimits: {
        requestsPerMinute: 1000,
        tokensPerMinute: 80000
      }
    },

    openai: {
      name: 'OpenAI GPT',
      type: 'api-key',
      requiredFields: ['apiKey'],
      optionalFields: ['model', 'maxTokens', 'temperature'],
      healthCheckEndpoint: '/v1/models',
      rateLimits: {
        requestsPerMinute: 3000,
        tokensPerMinute: 90000
      }
    }
  },

  // Business intelligence defaults
  businessIntelligence: {
    enabled: true,
    dataRetentionDays: 90,
    reportingSchedule: {
      daily: { enabled: true, time: '06:00' },
      weekly: { enabled: true, day: 'monday', time: '07:00' },
      monthly: { enabled: true, day: 1, time: '08:00' }
    },
    kpis: {
      financial: ['revenue', 'profit_margin', 'cash_flow', 'working_capital'],
      operational: ['order_fulfillment_rate', 'inventory_turnover', 'production_efficiency'],
      quality: ['defect_rate', 'customer_satisfaction', 'return_rate'],
      performance: ['response_time', 'uptime', 'error_rate']
    },
    dashboards: {
      executive: { enabled: true, refreshInterval: 300000 }, // 5 minutes
      operational: { enabled: true, refreshInterval: 60000 }, // 1 minute
      financial: { enabled: true, refreshInterval: 600000 }, // 10 minutes
      quality: { enabled: true, refreshInterval: 180000 } // 3 minutes
    }
  },

  // AI and machine learning defaults
  aiDefaults: {
    enabled: true,
    models: {
      forecasting: {
        enabled: true,
        algorithms: ['arima', 'lstm', 'prophet'],
        defaultHorizon: 30,
        minDataPoints: 30
      },
      optimization: {
        enabled: true,
        algorithms: ['genetic', 'simulated_annealing', 'linear_programming'],
        maxIterations: 1000
      },
      anomalyDetection: {
        enabled: true,
        algorithms: ['isolation_forest', 'one_class_svm', 'statistical'],
        sensitivityThreshold: 2.5
      },
      nlp: {
        enabled: true,
        models: ['sentiment', 'classification', 'extraction'],
        languages: ['en', 'es', 'fr', 'de']
      }
    },
    dataProcessing: {
      batchSize: 1000,
      parallelProcessing: true,
      maxWorkers: 4,
      timeoutMs: 300000 // 5 minutes
    }
  },

  // Compliance and governance
  compliance: {
    dataProtection: {
      gdprCompliance: true,
      ccpaCompliance: true,
      dataRetentionPolicies: true,
      encryptionAtRest: true,
      encryptionInTransit: true
    },
    auditTrail: {
      enabled: true,
      includeUserActions: true,
      includeSystemEvents: true,
      includeDataAccess: true,
      retentionDays: 2555 // 7 years
    },
    accessControl: {
      roleBasedAccess: true,
      principleOfLeastPrivilege: true,
      regularAccessReviews: true,
      sessionManagement: true
    }
  }
};
// Production Configuration
import path from 'path';

export default {
  // Application Settings
  app: {
    name: process.env.APP_NAME || 'Sentia Manufacturing Dashboard',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    url: process.env.APP_URL || 'https://sentia-manufacturing.com',
    apiUrl: process.env.API_URL || 'https://api.sentia-manufacturing.com'
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    host: process.env.HOST || '0.0.0.0',
    cluster: process.env.CLUSTER_MODE === 'true',
    workers: parseInt(process.env.WORKER_COUNT) || 4,
    trustProxy: true,
    compression: true,
    helmet: true
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    poolMin: parseInt(process.env.DATABASE_POOL_MIN) || 2,
    poolMax: parseInt(process.env.DATABASE_POOL_MAX) || 10,
    idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT) || 10000,
    readReplica: process.env.READ_DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DATABASE_CA_CERT
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL) || 3600,
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
    enableOfflineQueue: false,
    lazyConnect: true
  },

  // Security Configuration
  security: {
    encryption: {
      key: process.env.ENCRYPTION_KEY,
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm'
    },
    cors: {
      origins: (process.env.CORS_ORIGINS || '').split(','),
      credentials: process.env.CORS_CREDENTIALS === 'true'
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true'
    },
    headers: {
      enabled: process.env.SECURITY_HEADERS_ENABLED !== 'false',
      csp: process.env.CSP_DIRECTIVES
    }
  },

  // Monitoring Configuration
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || 'production',
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 0.1
    },
    apm: {
      enabled: process.env.APM_ENABLED === 'true',
      serviceName: process.env.APM_SERVICE_NAME,
      secretToken: process.env.APM_SECRET_TOKEN,
      serverUrl: process.env.APM_SERVER_URL
    },
    newRelic: {
      appName: process.env.NEW_RELIC_APP_NAME,
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      logLevel: process.env.NEW_RELIC_LOG_LEVEL || 'info'
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY,
      appKey: process.env.DATADOG_APP_KEY,
      site: process.env.DATADOG_SITE || 'datadoghq.com'
    }
  },

  // Feature Flags
  features: {
    provider: process.env.FEATURE_FLAG_PROVIDER || 'launchdarkly',
    launchDarkly: {
      sdkKey: process.env.LAUNCHDARKLY_SDK_KEY
    },
    flags: {
      newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',
      aiForcasting: process.env.FEATURE_AI_FORECASTING === 'true',
      mobileApp: process.env.FEATURE_MOBILE_APP === 'true',
      betaFeatures: process.env.FEATURE_BETA_FEATURES === 'true'
    }
  },

  // A/B Testing
  abTesting: {
    enabled: process.env.AB_TEST_ENABLED === 'true',
    optimizely: {
      sdkKey: process.env.OPTIMIZELY_SDK_KEY
    },
    trafficAllocation: parseInt(process.env.AB_TEST_TRAFFIC_ALLOCATION) || 50
  },

  // Storage Configuration
  storage: {
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT
    },
    cdn: {
      enabled: process.env.CDN_ENABLED === 'true',
      url: process.env.CDN_URL,
      cacheControl: process.env.CDN_CACHE_CONTROL || 'public, max-age=31536000'
    }
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO
  },

  // Notifications
  notifications: {
    push: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
      vapidSubject: process.env.VAPID_SUBJECT
    },
    sms: {
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER
    },
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#alerts'
    }
  },

  // Performance Configuration
  performance: {
    cache: {
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.CACHE_TTL) || 3600,
      strategy: process.env.CACHE_STRATEGY || 'lru'
    },
    database: {
      queryTimeout: parseInt(process.env.QUERY_TIMEOUT) || 30000,
      connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT) || 5000,
      statementTimeout: parseInt(process.env.STATEMENT_TIMEOUT) || 60000
    },
    api: {
      timeout: parseInt(process.env.API_TIMEOUT) || 30000,
      retryCount: parseInt(process.env.API_RETRY_COUNT) || 3,
      circuitBreaker: process.env.API_CIRCUIT_BREAKER === 'true'
    }
  },

  // Business Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    interval: parseInt(process.env.METRICS_INTERVAL) || 60000,
    retentionDays: parseInt(process.env.METRICS_RETENTION_DAYS) || 90,
    kpiSchedule: process.env.KPI_CALCULATION_SCHEDULE || '0 */4 * * *'
  },

  // Compliance
  compliance: {
    gdpr: process.env.GDPR_ENABLED === 'true',
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 365,
    auditLog: process.env.AUDIT_LOG_ENABLED === 'true',
    mode: process.env.COMPLIANCE_MODE || 'strict'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    destination: process.env.LOG_DESTINATION || 'stdout',
    file: {
      path: process.env.LOG_FILE_PATH || '/var/log/sentia/app.log',
      maxSize: process.env.LOG_MAX_SIZE || '100M',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10
    }
  },

  // Debug Configuration
  debug: {
    enabled: process.env.DEBUG_MODE === 'true',
    verbose: process.env.VERBOSE_LOGGING === 'true',
    profiling: process.env.PERFORMANCE_PROFILING === 'true',
    sqlLogging: process.env.SQL_LOGGING === 'true',
    apiDocs: process.env.API_DOCUMENTATION === 'true'
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    s3Bucket: process.env.BACKUP_S3_BUCKET,
    disasterRecovery: process.env.DISASTER_RECOVERY_ENABLED === 'true'
  }
};
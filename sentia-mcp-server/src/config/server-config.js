/**
 * Server Configuration Management
 * 
 * Centralized configuration for the MCP server with environment-aware settings
 * and validation.
 */

import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Server configuration object with environment-aware defaults
 */
export const SERVER_CONFIG = {
  // Core server settings
  server: {
    name: process.env.MCP_SERVER_NAME || 'sentia-manufacturing-mcp',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.MCP_SERVER_PORT) || 3001,
    host: process.env.MCP_SERVER_HOST || '0.0.0.0'
  },

  // Transport configuration
  transport: {
    type: process.env.MCP_TRANSPORT || 'dual', // 'stdio', 'http', or 'dual'
    stdio: {
      enabled: process.env.MCP_STDIO_ENABLED !== 'false'
    },
    http: {
      enabled: process.env.MCP_HTTP_ENABLED !== 'false',
      port: parseInt(process.env.MCP_HTTP_PORT) || 3002
    },
    sse: {
      enabled: process.env.MCP_SSE_ENABLED !== 'false',
      heartbeatInterval: parseInt(process.env.SSE_HEARTBEAT_INTERVAL) || 30000
    }
  },

  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'https://sentia-manufacturing-development.onrender.com',
      'https://sentia-manufacturing-testing.onrender.com',
      'https://sentia-manufacturing-production.onrender.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
  },

  // Security configuration (Enhanced with new authentication system)
  security: {
    // Legacy settings (maintained for backward compatibility)
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    authRequired: process.env.AUTH_REQUIRED === 'true',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    
    // Enhanced authentication settings
    authentication: {
      enabled: process.env.AUTH_ENABLED !== 'false',
      developmentBypass: process.env.NODE_ENV === 'development' || process.env.VITE_DEVELOPMENT_MODE === 'true',
      requireMFA: process.env.REQUIRE_MFA === 'true',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5
    },
    
    // API Key management
    apiKeys: {
      enabled: process.env.API_KEYS_ENABLED !== 'false',
      expirationDays: parseInt(process.env.API_KEY_EXPIRATION_DAYS) || 90,
      maxKeysPerUser: parseInt(process.env.MAX_API_KEYS_PER_USER) || 5,
      rotationWarningDays: parseInt(process.env.API_KEY_ROTATION_WARNING_DAYS) || 7
    },
    
    // Data encryption
    encryption: {
      enabled: process.env.DATA_ENCRYPTION_ENABLED !== 'false',
      developmentBypass: process.env.NODE_ENV === 'development' || process.env.VITE_DEVELOPMENT_MODE === 'true',
      algorithm: 'aes-256-gcm',
      keyRotationDays: parseInt(process.env.ENCRYPTION_KEY_ROTATION_DAYS) || 90
    },
    
    // Enhanced rate limiting
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: 'Too many requests from this IP, please try again later.',
      
      // Per-user rate limiting
      perUser: {
        enabled: process.env.PER_USER_RATE_LIMITING_ENABLED !== 'false',
        windowMs: parseInt(process.env.USER_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
        max: parseInt(process.env.USER_RATE_LIMIT_MAX) || 200
      },
      
      // Tool-specific rate limiting
      tools: {
        enabled: process.env.TOOL_RATE_LIMITING_ENABLED !== 'false',
        defaultLimitPerHour: parseInt(process.env.DEFAULT_TOOL_LIMIT_PER_HOUR) || 1000,
        expensiveToolsLimitPerHour: parseInt(process.env.EXPENSIVE_TOOLS_LIMIT_PER_HOUR) || 100
      }
    },
    
    // Security monitoring
    monitoring: {
      enabled: process.env.SECURITY_MONITORING_ENABLED !== 'false',
      developmentBypass: process.env.NODE_ENV === 'development' || process.env.VITE_DEVELOPMENT_MODE === 'true',
      
      // Failed authentication tracking
      failedAuth: {
        maxAttempts: parseInt(process.env.MAX_AUTH_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION) || 900000, // 15 minutes
        trackByIP: process.env.TRACK_FAILED_AUTH_BY_IP !== 'false',
        trackByUser: process.env.TRACK_FAILED_AUTH_BY_USER !== 'false'
      },
      
      // Suspicious activity detection
      suspiciousActivity: {
        enabled: process.env.SUSPICIOUS_ACTIVITY_DETECTION === 'true',
        multipleLocationThreshold: parseInt(process.env.MULTIPLE_LOCATION_THRESHOLD) || 2,
        rapidRequestThreshold: parseInt(process.env.RAPID_REQUEST_THRESHOLD) || 100,
        timeWindowMs: parseInt(process.env.ACTIVITY_TIME_WINDOW) || 60000 // 1 minute
      }
    },
    
    // Security headers and CSP
    helmet: {
      enabled: process.env.HELMET_ENABLED !== 'false',
      contentSecurityPolicy: {
        enabled: process.env.CSP_ENABLED !== 'false',
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"]
        }
      }
    },
    
    // Audit logging
    audit: {
      enabled: process.env.AUDIT_LOGGING_ENABLED !== 'false',
      level: process.env.AUDIT_LOG_LEVEL || 'info',
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
        days: parseInt(process.env.AUDIT_RETENTION_DAYS) || 90,
        maxSizeMB: parseInt(process.env.AUDIT_MAX_SIZE_MB) || 1000
      },
      encryption: process.env.AUDIT_ENCRYPTION_ENABLED !== 'false'
    }
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    enableQueryLogging: process.env.DB_QUERY_LOGGING === 'true',
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD) || 1000
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: {
      enabled: process.env.LOG_FILE_ENABLED !== 'false',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '5m',
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || 5,
      directory: process.env.LOG_DIRECTORY || 'logs'
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
      colorize: process.env.LOG_COLORIZE !== 'false'
    }
  },

  // Tool configuration
  tools: {
    directory: process.env.TOOLS_DIRECTORY || 'tools',
    enabledCategories: process.env.ENABLED_TOOL_CATEGORIES?.split(',') || [
      'system', 'manufacturing', 'financial', 'database', 'integration'
    ],
    timeout: parseInt(process.env.TOOL_TIMEOUT) || 30000,
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_TOOLS) || 10,
    caching: {
      enabled: process.env.TOOL_CACHING_ENABLED !== 'false',
      defaultTTL: parseInt(process.env.TOOL_CACHE_TTL) || 300, // 5 minutes
      maxSize: parseInt(process.env.TOOL_CACHE_MAX_SIZE) || 1000
    }
  },

  // Resource management
  resources: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
      'application/json',
      'text/plain',
      'text/csv',
      'application/xml'
    ],
    tempDirectory: process.env.TEMP_DIRECTORY || 'tmp',
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 3600000 // 1 hour
  },

  // Advanced Monitoring and metrics
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsEndpoint: process.env.METRICS_ENDPOINT || '/metrics',
    healthEndpoint: process.env.HEALTH_ENDPOINT || '/health',
    collectSystemMetrics: process.env.COLLECT_SYSTEM_METRICS !== 'false',
    collectToolMetrics: process.env.COLLECT_TOOL_METRICS !== 'false',
    retentionPeriod: parseInt(process.env.METRICS_RETENTION_PERIOD) || 7 * 24 * 60 * 60 * 1000, // 7 days
    
    // Advanced performance monitoring
    performance: {
      enabled: process.env.PERFORMANCE_MONITORING_ENABLED !== 'false',
      sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE) || 1.0,
      responseTimeThresholds: {
        warning: parseInt(process.env.PERF_WARNING_THRESHOLD) || 1000,
        critical: parseInt(process.env.PERF_CRITICAL_THRESHOLD) || 5000
      },
      memoryThresholds: {
        warning: parseInt(process.env.MEMORY_WARNING_THRESHOLD) || 80,
        critical: parseInt(process.env.MEMORY_CRITICAL_THRESHOLD) || 95
      }
    },
    
    // Business analytics configuration
    businessAnalytics: {
      enabled: process.env.BUSINESS_ANALYTICS_ENABLED !== 'false',
      retentionDays: parseInt(process.env.BUSINESS_ANALYTICS_RETENTION_DAYS) || 90,
      costTracking: process.env.COST_TRACKING_ENABLED !== 'false',
      userAnalytics: process.env.USER_ANALYTICS_ENABLED !== 'false',
      manufacturingKPIs: process.env.MANUFACTURING_KPIS_ENABLED !== 'false'
    },
    
    // Alert engine configuration
    alerting: {
      enabled: process.env.ALERTING_ENABLED !== 'false',
      stormProtection: process.env.ALERT_STORM_PROTECTION !== 'false',
      maxAlertsPerMinute: parseInt(process.env.MAX_ALERTS_PER_MINUTE) || 10,
      deduplicationWindow: parseInt(process.env.ALERT_DEDUPLICATION_WINDOW) || 300000, // 5 minutes
      escalationTimeout: parseInt(process.env.ALERT_ESCALATION_TIMEOUT) || 1800000, // 30 minutes
      
      // Notification channels
      notifications: {
        webhook: {
          enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
          url: process.env.WEBHOOK_URL,
          secret: process.env.WEBHOOK_SECRET
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
          channel: process.env.SLACK_CHANNEL || '#alerts',
          username: process.env.SLACK_USERNAME || 'Sentia MCP Bot'
        },
        sms: {
          enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
          provider: process.env.SMS_PROVIDER || 'twilio',
          apiKey: process.env.SMS_API_KEY,
          apiSecret: process.env.SMS_API_SECRET,
          recipients: process.env.SMS_RECIPIENTS?.split(',') || []
        }
      }
    },
    
    // Log management configuration
    logManagement: {
      enabled: process.env.LOG_MANAGEMENT_ENABLED !== 'false',
      retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 90,
      maxSizeMB: parseInt(process.env.LOG_MAX_SIZE_MB) || 1000,
      compressionEnabled: process.env.LOG_COMPRESSION_ENABLED !== 'false',
      searchIndexEnabled: process.env.LOG_SEARCH_INDEX_ENABLED !== 'false'
    },
    
    // Metrics storage configuration
    storage: {
      type: process.env.METRICS_STORAGE_TYPE || 'memory', // 'memory', 'postgresql', 'redis'
      postgresql: {
        enabled: process.env.METRICS_STORAGE_POSTGRESQL_ENABLED === 'true',
        tableName: process.env.METRICS_TABLE_NAME || 'metrics',
        batchSize: parseInt(process.env.METRICS_BATCH_SIZE) || 100,
        flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL) || 60000 // 1 minute
      },
      redis: {
        enabled: process.env.METRICS_STORAGE_REDIS_ENABLED === 'true',
        keyPrefix: process.env.METRICS_REDIS_PREFIX || 'metrics:',
        ttl: parseInt(process.env.METRICS_REDIS_TTL) || 86400 // 24 hours
      }
    },
    
    // Prometheus integration
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      endpoint: process.env.PROMETHEUS_ENDPOINT || '/prometheus',
      defaultLabels: {
        service: 'sentia-mcp-server',
        version: '3.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    }
  },

  // Cache configuration (Redis or in-memory)
  cache: {
    type: process.env.CACHE_TYPE || 'memory', // 'redis' or 'memory'
    redis: {
      url: process.env.REDIS_URL,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'sentia-mcp:',
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3
    },
    memory: {
      maxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE) || 1000,
      checkPeriod: parseInt(process.env.MEMORY_CACHE_CHECK_PERIOD) || 600 // 10 minutes
    }
  },

  // External service integrations
  integrations: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    },
    xero: {
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUri: process.env.XERO_REDIRECT_URI,
      scopes: process.env.XERO_SCOPES?.split(',') || ['accounting.read', 'accounting.transactions']
    },
    shopify: {
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
    },
    unleashed: {
      apiId: process.env.UNLEASHED_API_ID,
      apiKey: process.env.UNLEASHED_API_KEY,
      baseUrl: process.env.UNLEASHED_BASE_URL || 'https://api.unleashedsoftware.com'
    },
    amazon: {
      sellerId: process.env.AMAZON_SELLER_ID,
      clientId: process.env.AMAZON_CLIENT_ID,
      clientSecret: process.env.AMAZON_CLIENT_SECRET,
      refreshToken: process.env.AMAZON_REFRESH_TOKEN,
      region: process.env.AMAZON_REGION || 'us-east-1'
    }
  }
};

/**
 * Validate required configuration values
 */
export function validateConfig() {
  const errors = [];

  // Validate required environment variables
  if (!SERVER_CONFIG.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (SERVER_CONFIG.security.authRequired && !SERVER_CONFIG.security.jwtSecret) {
    errors.push('JWT_SECRET is required when authentication is enabled');
  }

  if (SERVER_CONFIG.cache.type === 'redis' && !SERVER_CONFIG.cache.redis.url) {
    errors.push('REDIS_URL is required when using Redis cache');
  }

  // Validate port ranges
  if (SERVER_CONFIG.server.port < 1 || SERVER_CONFIG.server.port > 65535) {
    errors.push('MCP_SERVER_PORT must be between 1 and 65535');
  }

  // Validate rate limiting values
  if (SERVER_CONFIG.security.rateLimiting.max < 1) {
    errors.push('RATE_LIMIT_MAX must be at least 1');
  }

  if (SERVER_CONFIG.security.rateLimiting.windowMs < 1000) {
    errors.push('RATE_LIMIT_WINDOW must be at least 1000ms');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
}

/**
 * Get environment-specific configuration overrides
 */
export function getEnvironmentConfig(environment = SERVER_CONFIG.server.environment) {
  const configs = {
    development: {
      security: {
        authRequired: false,
        rateLimiting: {
          max: 1000 // Higher limits for development
        }
      },
      logging: {
        level: 'debug',
        console: {
          colorize: true
        }
      },
      database: {
        enableQueryLogging: true
      }
    },
    
    testing: {
      security: {
        authRequired: true,
        rateLimiting: {
          max: 500
        }
      },
      logging: {
        level: 'info'
      },
      monitoring: {
        collectSystemMetrics: true,
        collectToolMetrics: true
      }
    },
    
    production: {
      security: {
        authRequired: true,
        rateLimiting: {
          max: 100
        },
        helmet: {
          enabled: true,
          contentSecurityPolicy: {
            enabled: true
          }
        }
      },
      logging: {
        level: 'warn',
        console: {
          colorize: false
        }
      },
      monitoring: {
        enabled: true,
        collectSystemMetrics: true,
        collectToolMetrics: true
      },
      cache: {
        type: 'redis' // Prefer Redis in production
      }
    }
  };

  return configs[environment] || {};
}

/**
 * Merge configuration with environment-specific overrides
 */
export function getMergedConfig(environment) {
  const envConfig = getEnvironmentConfig(environment);
  
  function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  return deepMerge(SERVER_CONFIG, envConfig);
}

/**
 * Export the final configuration
 */
export const CONFIG = getMergedConfig(SERVER_CONFIG.server.environment);

// Validate configuration on import
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}
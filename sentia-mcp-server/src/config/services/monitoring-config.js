/**
 * Monitoring Configuration Management
 * 
 * Comprehensive monitoring configuration including metrics collection,
 * alerting, performance monitoring, health checks, and business analytics
 * with environment-specific optimizations.
 */

import { config } from 'dotenv';

config();

/**
 * Monitoring Configuration Factory
 */
export class MonitoringConfig {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.buildConfiguration();
  }

  /**
   * Build environment-specific monitoring configuration
   */
  buildConfiguration() {
    const baseConfig = this.getBaseConfiguration();
    const envConfig = this.getEnvironmentConfiguration();
    
    return {
      ...baseConfig,
      ...envConfig,
      // Computed properties
      metricsConfig: this.buildMetricsConfiguration(),
      alertingConfig: this.buildAlertingConfiguration(),
      healthCheckConfig: this.buildHealthCheckConfiguration(),
      performanceConfig: this.buildPerformanceConfiguration(),
      businessAnalyticsConfig: this.buildBusinessAnalyticsConfiguration(),
      loggingConfig: this.buildLoggingConfiguration()
    };
  }

  /**
   * Base monitoring configuration
   */
  getBaseConfiguration() {
    return {
      // Global monitoring settings
      enabled: process.env.MONITORING_ENABLED !== 'false',
      collectSystemMetrics: process.env.COLLECT_SYSTEM_METRICS !== 'false',
      collectToolMetrics: process.env.COLLECT_TOOL_METRICS !== 'false',
      collectBusinessMetrics: process.env.COLLECT_BUSINESS_METRICS !== 'false',
      
      // Data retention
      retentionPeriod: parseInt(process.env.MONITORING_RETENTION_PERIOD) || 2592000000, // 30 days
      maxMetricsSize: parseInt(process.env.MONITORING_MAX_SIZE) || 1073741824, // 1GB
      
      // Collection intervals
      systemMetricsInterval: parseInt(process.env.SYSTEM_METRICS_INTERVAL) || 60000, // 1 minute
      toolMetricsInterval: parseInt(process.env.TOOL_METRICS_INTERVAL) || 30000, // 30 seconds
      businessMetricsInterval: parseInt(process.env.BUSINESS_METRICS_INTERVAL) || 300000, // 5 minutes
      
      // Performance thresholds
      responseTimeWarning: parseInt(process.env.RESPONSE_TIME_WARNING) || 1000,
      responseTimeCritical: parseInt(process.env.RESPONSE_TIME_CRITICAL) || 5000,
      memoryWarning: parseInt(process.env.MEMORY_WARNING) || 80, // 80%
      memoryCritical: parseInt(process.env.MEMORY_CRITICAL) || 95, // 95%
      cpuWarning: parseInt(process.env.CPU_WARNING) || 70, // 70%
      cpuCritical: parseInt(process.env.CPU_CRITICAL) || 90, // 90%
      
      // Health check settings
      enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
      healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
      
      // Alerting settings
      enableAlerting: process.env.ENABLE_ALERTING !== 'false',
      alertStormProtection: process.env.ALERT_STORM_PROTECTION !== 'false',
      maxAlertsPerMinute: parseInt(process.env.MAX_ALERTS_PER_MINUTE) || 10,
      alertDeduplicationWindow: parseInt(process.env.ALERT_DEDUP_WINDOW) || 300000, // 5 minutes
      
      // External services
      prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
      grafanaEnabled: process.env.GRAFANA_ENABLED === 'true',
      sentryEnabled: process.env.SENTRY_ENABLED === 'true'
    };
  }

  /**
   * Environment-specific configuration
   */
  getEnvironmentConfiguration() {
    const configs = {
      development: {
        // Development monitoring (verbose)
        enabled: true,
        collectSystemMetrics: true,
        collectToolMetrics: true,
        collectBusinessMetrics: false, // Disable for dev
        
        // Shorter retention for development
        retentionPeriod: 86400000, // 1 day
        
        // Frequent collection for debugging
        systemMetricsInterval: 30000, // 30 seconds
        toolMetricsInterval: 15000, // 15 seconds
        
        // Relaxed thresholds
        responseTimeWarning: 2000,
        responseTimeCritical: 10000,
        memoryWarning: 85,
        memoryCritical: 95,
        
        // Enhanced health checks
        enableHealthChecks: true,
        healthCheckInterval: 15000, // 15 seconds
        includeDetailedHealth: true,
        includeDebugInfo: true,
        
        // Development alerting (disabled)
        enableAlerting: false,
        
        // Development features
        enableDetailedMetrics: true,
        enableRealTimeMonitoring: true,
        enablePerformanceProfiling: true,
        enableMemoryProfiling: true,
        enableDebugDashboard: true
      },

      testing: {
        // Testing monitoring (focused)
        enabled: true,
        collectSystemMetrics: true,
        collectToolMetrics: true,
        collectBusinessMetrics: false,
        
        // Short retention for testing
        retentionPeriod: 604800000, // 7 days
        
        // Testing intervals
        systemMetricsInterval: 60000, // 1 minute
        toolMetricsInterval: 30000, // 30 seconds
        
        // Testing thresholds
        responseTimeWarning: 1000,
        responseTimeCritical: 3000,
        memoryWarning: 75,
        memoryCritical: 90,
        
        // Testing health checks
        enableHealthChecks: true,
        healthCheckInterval: 30000, // 30 seconds
        includeTestStatus: true,
        
        // Testing alerting (limited)
        enableAlerting: true,
        maxAlertsPerMinute: 5,
        
        // Testing features
        enableTestMetrics: true,
        enablePerformanceBaselines: true,
        enableRegressionDetection: true,
        enableTestReporting: true,
        enableCoverageMetrics: true
      },

      staging: {
        // Staging monitoring (production-like)
        enabled: true,
        collectSystemMetrics: true,
        collectToolMetrics: true,
        collectBusinessMetrics: true,
        
        // Medium retention for staging
        retentionPeriod: 2592000000, // 30 days
        
        // Staging intervals
        systemMetricsInterval: 60000, // 1 minute
        toolMetricsInterval: 30000, // 30 seconds
        businessMetricsInterval: 300000, // 5 minutes
        
        // Production-like thresholds
        responseTimeWarning: 1000,
        responseTimeCritical: 3000,
        memoryWarning: 75,
        memoryCritical: 90,
        
        // Staging health checks
        enableHealthChecks: true,
        healthCheckInterval: 30000, // 30 seconds
        enableVerboseHealth: true,
        
        // Staging alerting
        enableAlerting: true,
        maxAlertsPerMinute: 10,
        
        // Staging features
        enablePreProductionValidation: true,
        enableLoadTesting: true,
        enablePerformanceBaselines: true,
        enableRegressionDetection: true,
        enableCapacityPlanning: true
      },

      production: {
        // Production monitoring (optimized)
        enabled: true,
        collectSystemMetrics: true,
        collectToolMetrics: true,
        collectBusinessMetrics: true,
        
        // Long retention for production
        retentionPeriod: 7776000000, // 90 days
        
        // Production intervals
        systemMetricsInterval: 60000, // 1 minute
        toolMetricsInterval: 60000, // 1 minute
        businessMetricsInterval: 300000, // 5 minutes
        
        // Strict production thresholds
        responseTimeWarning: 1000,
        responseTimeCritical: 5000,
        memoryWarning: 80,
        memoryCritical: 95,
        cpuWarning: 70,
        cpuCritical: 90,
        
        // Production health checks
        enableHealthChecks: true,
        healthCheckInterval: 60000, // 1 minute
        enableVerboseHealth: false,
        includeDebugInfo: false,
        
        // Production alerting
        enableAlerting: true,
        alertStormProtection: true,
        maxAlertsPerMinute: 5,
        
        // Production features
        enableBusinessAnalytics: true,
        enableCostTracking: true,
        enableUserAnalytics: true,
        enableManufacturingKPIs: true,
        enableRevenueTracking: true,
        enableOperationalMetrics: true
      }
    };

    return configs[this.environment] || configs.development;
  }

  /**
   * Build metrics configuration
   */
  buildMetricsConfiguration() {
    const config = this.config;
    
    return {
      // Basic metrics settings
      enabled: config.enabled,
      retentionPeriod: config.retentionPeriod,
      maxSize: config.maxMetricsSize,
      
      // Collection settings
      systemMetrics: {
        enabled: config.collectSystemMetrics,
        interval: config.systemMetricsInterval,
        metrics: [
          'cpu_usage',
          'memory_usage',
          'disk_usage',
          'network_io',
          'process_count',
          'file_descriptors',
          'uptime'
        ]
      },
      
      // Tool metrics
      toolMetrics: {
        enabled: config.collectToolMetrics,
        interval: config.toolMetricsInterval,
        metrics: [
          'tool_execution_count',
          'tool_execution_time',
          'tool_success_rate',
          'tool_error_rate',
          'tool_cache_hit_rate',
          'concurrent_tool_executions'
        ]
      },
      
      // Business metrics
      businessMetrics: {
        enabled: config.collectBusinessMetrics,
        interval: config.businessMetricsInterval,
        metrics: [
          'user_sessions',
          'api_requests',
          'feature_usage',
          'integration_calls',
          'revenue_metrics',
          'manufacturing_kpis'
        ]
      },
      
      // Custom metrics
      customMetrics: {
        enabled: true,
        allowUserDefinedMetrics: this.environment !== 'production',
        maxCustomMetrics: 100
      },
      
      // Aggregation
      aggregation: {
        enabled: true,
        intervals: ['1m', '5m', '15m', '1h', '1d'],
        functions: ['avg', 'min', 'max', 'sum', 'count'],
        retainRawData: this.environment === 'development'
      },
      
      // Export formats
      exportFormats: ['prometheus', 'json', 'csv'],
      
      // Sampling
      sampling: {
        enabled: this.environment === 'production',
        rate: this.environment === 'production' ? 0.1 : 1.0,
        strategy: 'random'
      }
    };
  }

  /**
   * Build alerting configuration
   */
  buildAlertingConfiguration() {
    const config = this.config;
    
    return {
      // Basic alerting settings
      enabled: config.enableAlerting,
      stormProtection: config.alertStormProtection,
      maxAlertsPerMinute: config.maxAlertsPerMinute,
      deduplicationWindow: config.alertDeduplicationWindow,
      
      // Alert rules
      rules: [
        {
          name: 'high_response_time',
          metric: 'response_time',
          threshold: config.responseTimeWarning,
          operator: '>',
          severity: 'warning',
          duration: '5m'
        },
        {
          name: 'critical_response_time',
          metric: 'response_time',
          threshold: config.responseTimeCritical,
          operator: '>',
          severity: 'critical',
          duration: '1m'
        },
        {
          name: 'high_memory_usage',
          metric: 'memory_usage_percent',
          threshold: config.memoryWarning,
          operator: '>',
          severity: 'warning',
          duration: '10m'
        },
        {
          name: 'critical_memory_usage',
          metric: 'memory_usage_percent',
          threshold: config.memoryCritical,
          operator: '>',
          severity: 'critical',
          duration: '5m'
        },
        {
          name: 'high_cpu_usage',
          metric: 'cpu_usage_percent',
          threshold: config.cpuWarning,
          operator: '>',
          severity: 'warning',
          duration: '10m'
        },
        {
          name: 'critical_cpu_usage',
          metric: 'cpu_usage_percent',
          threshold: config.cpuCritical,
          operator: '>',
          severity: 'critical',
          duration: '5m'
        },
        {
          name: 'tool_error_rate',
          metric: 'tool_error_rate',
          threshold: 10, // 10%
          operator: '>',
          severity: 'warning',
          duration: '5m'
        }
      ],
      
      // Notification channels
      notifications: {
        webhook: {
          enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
          url: process.env.WEBHOOK_URL,
          secret: process.env.WEBHOOK_SECRET,
          timeout: 10000,
          retries: 3,
          format: 'json'
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
          },
          templates: {
            warning: 'alert-warning.html',
            critical: 'alert-critical.html',
            resolved: 'alert-resolved.html'
          }
        },
        
        slack: {
          enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts',
          username: `Sentia MCP ${this.environment}`,
          iconEmoji: ':warning:',
          mentionUsers: process.env.SLACK_MENTION_USERS?.split(',') || []
        },
        
        sms: {
          enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
          provider: 'twilio',
          config: {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: process.env.TWILIO_FROM_NUMBER
          },
          recipients: process.env.SMS_RECIPIENTS?.split(',') || []
        }
      },
      
      // Escalation policies
      escalation: {
        enabled: true,
        policies: [
          {
            name: 'default',
            levels: [
              { severity: 'info', delay: 0, channels: ['slack'] },
              { severity: 'warning', delay: 0, channels: ['slack', 'email'] },
              { severity: 'critical', delay: 0, channels: ['slack', 'email', 'sms'] }
            ]
          }
        ],
        escalationTimeout: 900000, // 15 minutes
        maxEscalationLevels: 3
      },
      
      // Alert suppression
      suppression: {
        enabled: true,
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00',
          timezone: 'UTC'
        },
        holidays: {
          enabled: false,
          calendar: 'US'
        }
      }
    };
  }

  /**
   * Build health check configuration
   */
  buildHealthCheckConfiguration() {
    const config = this.config;
    
    return {
      // Basic health check settings
      enabled: config.enableHealthChecks,
      interval: config.healthCheckInterval,
      timeout: config.healthCheckTimeout,
      
      // Health check endpoints
      endpoints: [
        {
          name: 'server',
          path: '/health',
          method: 'GET',
          timeout: 5000,
          expectedStatus: 200,
          critical: true
        },
        {
          name: 'database',
          path: '/health/database',
          method: 'GET',
          timeout: 10000,
          expectedStatus: 200,
          critical: true
        },
        {
          name: 'cache',
          path: '/health/cache',
          method: 'GET',
          timeout: 5000,
          expectedStatus: 200,
          critical: false
        },
        {
          name: 'integrations',
          path: '/health/integrations',
          method: 'GET',
          timeout: 15000,
          expectedStatus: 200,
          critical: false
        }
      ],
      
      // Health check response format
      response: {
        includeSystemInfo: config.includeSystemInfo || false,
        includeDependencyStatus: true,
        includePerformanceMetrics: config.includePerformanceMetrics || false,
        includeDebugInfo: config.includeDebugInfo || false,
        includeVersion: true,
        includeUptime: true
      },
      
      // Dependency monitoring
      dependencies: {
        database: {
          name: 'PostgreSQL',
          critical: true,
          timeout: 5000,
          healthCheck: 'SELECT 1'
        },
        cache: {
          name: 'Redis/Memory Cache',
          critical: false,
          timeout: 3000,
          healthCheck: 'ping'
        },
        xero: {
          name: 'Xero API',
          critical: false,
          timeout: 10000,
          healthCheck: '/Organisation'
        },
        shopify: {
          name: 'Shopify API',
          critical: false,
          timeout: 10000,
          healthCheck: '/admin/api/shop.json'
        }
      },
      
      // Health status levels
      statusLevels: {
        healthy: 'All systems operational',
        degraded: 'Some non-critical systems unavailable',
        unhealthy: 'Critical systems unavailable',
        unknown: 'Health status unknown'
      },
      
      // Health history
      history: {
        enabled: config.enableHealthHistory || false,
        retentionDays: 30,
        maxEntries: 10000
      }
    };
  }

  /**
   * Build performance configuration
   */
  buildPerformanceConfiguration() {
    const config = this.config;
    
    return {
      // Performance monitoring
      enabled: true,
      sampleRate: this.environment === 'production' ? 0.1 : 1.0,
      
      // Response time monitoring
      responseTime: {
        enabled: true,
        thresholds: {
          warning: config.responseTimeWarning,
          critical: config.responseTimeCritical
        },
        percentiles: [50, 90, 95, 99],
        histogramBuckets: [10, 50, 100, 500, 1000, 5000, 10000, 30000]
      },
      
      // Resource monitoring
      resources: {
        memory: {
          enabled: true,
          thresholds: {
            warning: config.memoryWarning,
            critical: config.memoryCritical
          },
          collectGCMetrics: true
        },
        cpu: {
          enabled: true,
          thresholds: {
            warning: config.cpuWarning,
            critical: config.cpuCritical
          },
          collectLoadAverage: true
        },
        disk: {
          enabled: true,
          thresholds: {
            warning: 80, // 80%
            critical: 95 // 95%
          },
          paths: ['/', '/tmp']
        }
      },
      
      // Database performance
      database: {
        enabled: true,
        slowQueryThreshold: 1000, // 1 second
        connectionPoolMonitoring: true,
        queryMetrics: true
      },
      
      // Cache performance
      cache: {
        enabled: true,
        hitRateThreshold: 0.8, // 80%
        responseTimeThreshold: 100, // 100ms
        evictionMetrics: true
      },
      
      // Tool performance
      tools: {
        enabled: true,
        executionTimeThreshold: 30000, // 30 seconds
        concurrencyMonitoring: true,
        errorRateThreshold: 0.05 // 5%
      },
      
      // APM integration
      apm: {
        enabled: process.env.APM_ENABLED === 'true',
        service: 'sentia-mcp-server',
        version: '3.0.0',
        environment: this.environment,
        distributedTracing: true,
        profileFrequency: '10s'
      }
    };
  }

  /**
   * Build business analytics configuration
   */
  buildBusinessAnalyticsConfiguration() {
    const config = this.config;
    
    return {
      // Business analytics
      enabled: config.collectBusinessMetrics,
      retentionDays: this.environment === 'production' ? 2555 : 90, // 7 years for production
      
      // Cost tracking
      costTracking: {
        enabled: config.enableCostTracking || false,
        currencies: ['USD', 'EUR', 'GBP'],
        categories: [
          'infrastructure',
          'ai_services',
          'integrations',
          'storage',
          'bandwidth'
        ]
      },
      
      // User analytics
      userAnalytics: {
        enabled: config.enableUserAnalytics || false,
        trackSessions: true,
        trackFeatureUsage: true,
        trackPerformance: true,
        anonymizeData: this.environment === 'production'
      },
      
      // Manufacturing KPIs
      manufacturingKPIs: {
        enabled: config.enableManufacturingKPIs || false,
        metrics: [
          'production_efficiency',
          'quality_metrics',
          'inventory_turnover',
          'demand_forecast_accuracy',
          'cost_variance',
          'delivery_performance'
        ]
      },
      
      // Revenue tracking
      revenueTracking: {
        enabled: config.enableRevenueTracking || false,
        trackByProduct: true,
        trackByChannel: true,
        trackByRegion: true,
        forecastAccuracy: true
      },
      
      // Operational metrics
      operationalMetrics: {
        enabled: config.enableOperationalMetrics || false,
        systemUptime: true,
        dataProcessingVolume: true,
        integrationHealth: true,
        errorRates: true
      }
    };
  }

  /**
   * Build logging configuration for monitoring
   */
  buildLoggingConfiguration() {
    return {
      // Log-based monitoring
      enabled: true,
      logLevel: this.environment === 'production' ? 'warn' : 'info',
      
      // Error tracking
      errorTracking: {
        enabled: true,
        aggregateErrors: true,
        errorRateAlerts: true,
        errorThreshold: 10 // errors per minute
      },
      
      // Audit logging
      auditLogging: {
        enabled: this.environment === 'production',
        events: [
          'user_authentication',
          'tool_execution',
          'configuration_change',
          'data_access',
          'system_events'
        ]
      },
      
      // Log forwarding
      forwarding: {
        enabled: process.env.LOG_FORWARDING_ENABLED === 'true',
        destinations: [
          {
            type: 'elasticsearch',
            url: process.env.ELASTICSEARCH_URL,
            index: `sentia-mcp-${this.environment}`
          },
          {
            type: 'splunk',
            url: process.env.SPLUNK_URL,
            token: process.env.SPLUNK_TOKEN
          }
        ]
      }
    };
  }

  /**
   * Validate monitoring configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Basic validation
    if (this.config.retentionPeriod < 86400000) { // 1 day
      warnings.push('Retention period should be at least 1 day');
    }
    
    if (this.config.systemMetricsInterval < 10000) { // 10 seconds
      warnings.push('System metrics interval should be at least 10 seconds');
    }
    
    // Threshold validation
    if (this.config.responseTimeWarning >= this.config.responseTimeCritical) {
      errors.push('Response time warning threshold must be less than critical threshold');
    }
    
    if (this.config.memoryWarning >= this.config.memoryCritical) {
      errors.push('Memory warning threshold must be less than critical threshold');
    }
    
    // Alerting validation
    if (this.config.enableAlerting) {
      if (this.config.maxAlertsPerMinute < 1) {
        errors.push('Max alerts per minute must be at least 1');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration for monitoring systems
   */
  exportConfig() {
    return {
      // Core settings
      enabled: this.config.enabled,
      environment: this.environment,
      
      // Component configs
      metrics: this.config.metricsConfig,
      alerting: this.config.alertingConfig,
      healthCheck: this.config.healthCheckConfig,
      performance: this.config.performanceConfig,
      businessAnalytics: this.config.businessAnalyticsConfig,
      logging: this.config.loggingConfig
    };
  }
}

/**
 * Create monitoring configuration for current environment
 */
export function createMonitoringConfig(environment = process.env.NODE_ENV) {
  return new MonitoringConfig(environment);
}

/**
 * Get monitoring configuration
 */
export function getMonitoringConfig(environment = process.env.NODE_ENV) {
  const monitoringConfig = new MonitoringConfig(environment);
  return monitoringConfig.exportConfig();
}

/**
 * Validate monitoring configuration
 */
export function validateMonitoringConfig(environment = process.env.NODE_ENV) {
  const monitoringConfig = new MonitoringConfig(environment);
  return monitoringConfig.validate();
}

export default MonitoringConfig;
/**
 * Configuration Templates and Profiles
 * 
 * Pre-defined configuration templates for different deployment scenarios,
 * use cases, and environments. Includes profiles for development, testing,
 * production, and specialized configurations.
 */

import { config } from 'dotenv';

config();

/**
 * Configuration Templates
 */
export const configTemplates = {
  // Development template for local development
  development: {
    name: 'Development Configuration',
    description: 'Optimized for local development with debugging features',
    environment: 'development',
    settings: {
      server: {
        port: 3001,
        host: '0.0.0.0',
        enableHotReload: true
      },
      security: {
        authRequired: false,
        developmentBypass: true,
        enableMFA: false,
        enableRateLimiting: false,
        enableSecurityHeaders: false
      },
      performance: {
        maxMemoryUsage: '4gb',
        maxCPUUsage: 90,
        enableProfiling: true,
        enableCompression: false
      },
      database: {
        ssl: false,
        maxConnections: 5,
        enableQueryLogging: true,
        slowQueryThreshold: 100
      },
      cache: {
        type: 'memory',
        maxSize: 100,
        enableDebugging: true
      },
      logging: {
        level: 'debug',
        enableConsole: true,
        enableFile: true,
        enableVerbose: true
      },
      monitoring: {
        enabled: true,
        enableDetailedMetrics: true,
        enableRealTimeMonitoring: true
      }
    }
  },

  // Testing template for automated testing
  testing: {
    name: 'Testing Configuration',
    description: 'Optimized for automated testing and CI/CD pipelines',
    environment: 'testing',
    settings: {
      server: {
        port: 3001,
        host: '0.0.0.0',
        enableHotReload: false
      },
      security: {
        authRequired: true,
        developmentBypass: false,
        enableMFA: false,
        enableRateLimiting: true,
        enableSecurityHeaders: true
      },
      performance: {
        maxMemoryUsage: '2gb',
        maxCPUUsage: 85,
        enableProfiling: true,
        enableCompression: true
      },
      database: {
        ssl: false,
        maxConnections: 10,
        enableQueryLogging: true,
        slowQueryThreshold: 200,
        enableTestIsolation: true
      },
      cache: {
        type: 'memory',
        maxSize: 500,
        enableCacheClear: true
      },
      logging: {
        level: 'info',
        enableConsole: true,
        enableFile: true,
        enableTestLogging: true
      },
      monitoring: {
        enabled: true,
        enableTestMetrics: true,
        enablePerformanceBaselines: true
      }
    }
  },

  // Staging template for pre-production testing
  staging: {
    name: 'Staging Configuration',
    description: 'Production-like environment for final validation',
    environment: 'staging',
    settings: {
      server: {
        port: 3001,
        host: '0.0.0.0',
        enableHotReload: false
      },
      security: {
        authRequired: true,
        developmentBypass: false,
        enableMFA: true,
        enableRateLimiting: true,
        enableSecurityHeaders: true
      },
      performance: {
        maxMemoryUsage: '3gb',
        maxCPUUsage: 80,
        enableProfiling: true,
        enableCompression: true
      },
      database: {
        ssl: true,
        maxConnections: 15,
        enableQueryLogging: true,
        slowQueryThreshold: 500
      },
      cache: {
        type: 'redis',
        maxSize: 3000,
        enableCacheMetrics: true
      },
      logging: {
        level: 'info',
        enableConsole: false,
        enableFile: true,
        enableAuditLogging: true
      },
      monitoring: {
        enabled: true,
        enablePreProductionValidation: true,
        enableLoadTesting: true
      }
    }
  },

  // Production template for live deployment
  production: {
    name: 'Production Configuration',
    description: 'Optimized for production deployment with maximum security',
    environment: 'production',
    settings: {
      server: {
        port: 3001,
        host: '0.0.0.0',
        enableHotReload: false
      },
      security: {
        authRequired: true,
        developmentBypass: false,
        enableMFA: true,
        enableRateLimiting: true,
        enableSecurityHeaders: true,
        strictMode: true
      },
      performance: {
        maxMemoryUsage: '4gb',
        maxCPUUsage: 75,
        enableProfiling: false,
        enableCompression: true,
        enableClusterMode: true
      },
      database: {
        ssl: true,
        maxConnections: 20,
        enableQueryLogging: false,
        slowQueryThreshold: 1000,
        enableBackups: true
      },
      cache: {
        type: 'redis',
        maxSize: 5000,
        enableDistributedCache: true,
        enableCompression: true
      },
      logging: {
        level: 'warn',
        enableConsole: false,
        enableFile: true,
        enableAuditLogging: true,
        enableStructuredLogging: true
      },
      monitoring: {
        enabled: true,
        enableBusinessAnalytics: true,
        enableAlerting: true,
        enableMetrics: true
      }
    }
  },

  // High-performance template for heavy workloads
  highPerformance: {
    name: 'High Performance Configuration',
    description: 'Optimized for high-throughput and low-latency scenarios',
    environment: 'production',
    settings: {
      server: {
        port: 3001,
        host: '0.0.0.0',
        enableHotReload: false
      },
      security: {
        authRequired: true,
        developmentBypass: false,
        enableMFA: false, // Disabled for performance
        enableRateLimiting: true,
        enableSecurityHeaders: true
      },
      performance: {
        maxMemoryUsage: '8gb',
        maxCPUUsage: 85,
        maxConcurrentRequests: 2000,
        maxConcurrentTools: 50,
        enableProfiling: false,
        enableCompression: true,
        enableClusterMode: true
      },
      database: {
        ssl: true,
        maxConnections: 50,
        enableQueryLogging: false,
        enableConnectionPooling: true,
        enableReadReplicas: true
      },
      cache: {
        type: 'redis',
        maxSize: 10000,
        enableDistributedCache: true,
        enableCompression: true,
        enablePrefetching: true
      },
      logging: {
        level: 'error',
        enableConsole: false,
        enableFile: true,
        enableAuditLogging: false // Disabled for performance
      },
      monitoring: {
        enabled: true,
        sampleRate: 0.01, // 1% sampling for performance
        enableMetrics: true
      }
    }
  },

  // Security-focused template for sensitive environments
  highSecurity: {
    name: 'High Security Configuration',
    description: 'Maximum security configuration for sensitive environments',
    environment: 'production',
    settings: {
      server: {
        port: 3001,
        host: '127.0.0.1', // Localhost only
        enableHotReload: false
      },
      security: {
        authRequired: true,
        developmentBypass: false,
        enableMFA: true,
        requireMFA: true,
        enableRateLimiting: true,
        strictRateLimiting: true,
        enableSecurityHeaders: true,
        enableAuditLogging: true,
        strictMode: true,
        enableEncryption: true
      },
      performance: {
        maxMemoryUsage: '2gb',
        maxCPUUsage: 70,
        maxConcurrentRequests: 100,
        enableProfiling: false,
        enableCompression: true
      },
      database: {
        ssl: true,
        enforceSSL: true,
        maxConnections: 10,
        enableQueryLogging: false,
        enableEncryption: true,
        enableBackups: true,
        backupEncryption: true
      },
      cache: {
        type: 'memory', // No external dependencies
        maxSize: 1000,
        enableEncryption: true
      },
      logging: {
        level: 'info',
        enableConsole: false,
        enableFile: true,
        enableAuditLogging: true,
        enableEncryption: true,
        sensitiveDataMasking: true
      },
      monitoring: {
        enabled: true,
        enableSecurityMonitoring: true,
        enableAlerting: true,
        enableThreatDetection: true
      }
    }
  },

  // Minimal template for resource-constrained environments
  minimal: {
    name: 'Minimal Configuration',
    description: 'Lightweight configuration for resource-constrained environments',
    environment: 'production',
    settings: {
      server: {
        port: 3001,
        host: '0.0.0.0',
        enableHotReload: false
      },
      security: {
        authRequired: true,
        developmentBypass: false,
        enableMFA: false,
        enableRateLimiting: true,
        enableSecurityHeaders: true
      },
      performance: {
        maxMemoryUsage: '512mb',
        maxCPUUsage: 80,
        maxConcurrentRequests: 50,
        maxConcurrentTools: 5,
        enableProfiling: false,
        enableCompression: true
      },
      database: {
        ssl: false,
        maxConnections: 5,
        enableQueryLogging: false,
        slowQueryThreshold: 2000
      },
      cache: {
        type: 'memory',
        maxSize: 100,
        enableCompression: false
      },
      logging: {
        level: 'warn',
        enableConsole: false,
        enableFile: true,
        enableVerbose: false
      },
      monitoring: {
        enabled: false,
        enableMetrics: false
      }
    }
  }
};

/**
 * Configuration Profiles for specific use cases
 */
export const configProfiles = {
  // AI-focused profile for AI/ML workloads
  aiOptimized: {
    name: 'AI Optimized Profile',
    description: 'Optimized for AI and machine learning workloads',
    extends: 'production',
    overrides: {
      performance: {
        maxMemoryUsage: '8gb',
        maxConcurrentTools: 10, // Limit concurrent AI operations
        enableGPUAcceleration: true,
        aiOptimizations: true
      },
      integrations: {
        anthropic: {
          enabled: true,
          rateLimit: { requestsPerMinute: 1000 }
        },
        openai: {
          enabled: true,
          rateLimit: { requestsPerMinute: 3000 }
        }
      },
      cache: {
        type: 'redis',
        maxSize: 5000,
        aiCacheOptimizations: true,
        modelCaching: true
      }
    }
  },

  // ERP integration profile
  erpIntegrated: {
    name: 'ERP Integration Profile',
    description: 'Optimized for ERP system integrations',
    extends: 'production',
    overrides: {
      integrations: {
        unleashed: {
          enabled: true,
          rateLimit: { requestsPerMinute: 1000 }
        },
        xero: {
          enabled: true,
          rateLimit: { requestsPerMinute: 60 }
        }
      },
      cache: {
        type: 'redis',
        maxSize: 3000,
        erpCacheOptimizations: true
      },
      database: {
        maxConnections: 25,
        enableERPOptimizations: true
      }
    }
  },

  // E-commerce profile
  ecommerce: {
    name: 'E-commerce Profile',
    description: 'Optimized for e-commerce platforms',
    extends: 'production',
    overrides: {
      integrations: {
        shopify: {
          enabled: true,
          rateLimit: { requestsPerSecond: 2 }
        },
        amazon: {
          enabled: true,
          rateLimit: { requestsPerSecond: 0.5 }
        }
      },
      cache: {
        type: 'redis',
        maxSize: 5000,
        ecommerceCacheOptimizations: true
      },
      performance: {
        maxConcurrentRequests: 1000,
        enableBulkOperations: true
      }
    }
  },

  // Manufacturing profile
  manufacturing: {
    name: 'Manufacturing Profile',
    description: 'Optimized for manufacturing operations',
    extends: 'production',
    overrides: {
      performance: {
        maxConcurrentRequests: 500,
        manufacturingOptimizations: true
      },
      monitoring: {
        enabled: true,
        enableManufacturingKPIs: true,
        enableOperationalMetrics: true
      },
      cache: {
        type: 'redis',
        maxSize: 3000,
        manufacturingCacheOptimizations: true
      }
    }
  }
};

/**
 * Apply template to configuration
 */
export function applyTemplate(templateName, customOverrides = {}) {
  const template = configTemplates[templateName];
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }

  return {
    ...template.settings,
    ...customOverrides,
    metadata: {
      template: templateName,
      templateDescription: template.description,
      appliedAt: new Date().toISOString(),
      customOverrides: Object.keys(customOverrides).length > 0
    }
  };
}

/**
 * Apply profile to configuration
 */
export function applyProfile(profileName, baseTemplate = 'production', customOverrides = {}) {
  const profile = configProfiles[profileName];
  if (!profile) {
    throw new Error(`Profile '${profileName}' not found`);
  }

  // Start with base template
  const baseConfig = applyTemplate(profile.extends || baseTemplate);
  
  // Apply profile overrides
  const profileConfig = mergeDeep(baseConfig, profile.overrides || {});
  
  // Apply custom overrides
  const finalConfig = mergeDeep(profileConfig, customOverrides);

  finalConfig.metadata = {
    ...finalConfig.metadata,
    profile: profileName,
    profileDescription: profile.description,
    baseTemplate: profile.extends || baseTemplate
  };

  return finalConfig;
}

/**
 * Get available templates
 */
export function getAvailableTemplates() {
  return Object.keys(configTemplates).map(key => ({
    name: key,
    displayName: configTemplates[key].name,
    description: configTemplates[key].description,
    environment: configTemplates[key].environment
  }));
}

/**
 * Get available profiles
 */
export function getAvailableProfiles() {
  return Object.keys(configProfiles).map(key => ({
    name: key,
    displayName: configProfiles[key].name,
    description: configProfiles[key].description,
    extends: configProfiles[key].extends
  }));
}

/**
 * Validate template configuration
 */
export function validateTemplate(templateName) {
  const template = configTemplates[templateName];
  if (!template) {
    return { valid: false, error: `Template '${templateName}' not found` };
  }

  const errors = [];
  const warnings = [];

  // Basic validation
  if (!template.settings) {
    errors.push('Template missing settings');
  }

  if (!template.environment) {
    warnings.push('Template missing environment specification');
  }

  // Validate required sections
  const requiredSections = ['server', 'security', 'performance'];
  for (const section of requiredSections) {
    if (!template.settings[section]) {
      warnings.push(`Template missing ${section} configuration`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Deep merge utility function
 */
function mergeDeep(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Generate configuration from template
 */
export function generateConfig(options = {}) {
  const {
    template = 'development',
    profile = null,
    environment = process.env.NODE_ENV || 'development',
    overrides = {}
  } = options;

  let config;

  if (profile) {
    config = applyProfile(profile, template, overrides);
  } else {
    config = applyTemplate(template, overrides);
  }

  // Ensure environment consistency
  config.environment = environment;
  config.metadata.generatedAt = new Date().toISOString();
  config.metadata.environment = environment;

  return config;
}

export default {
  configTemplates,
  configProfiles,
  applyTemplate,
  applyProfile,
  getAvailableTemplates,
  getAvailableProfiles,
  validateTemplate,
  generateConfig
};
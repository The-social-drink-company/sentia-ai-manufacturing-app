/**
 * Authentication Configuration
 * 
 * Environment-aware authentication settings with mandatory development bypass
 * for the Sentia Manufacturing MCP Server.
 * 
 * CRITICAL: Development environment authentication is completely bypassed
 * to maintain fast development workflow.
 */

import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Check if we're in development environment
 * Uses same pattern as main dashboard application
 */
export function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === 'development' || 
         process.env.VITE_DEVELOPMENT_MODE === 'true';
}

/**
 * Authentication configuration with environment-aware defaults
 */
export const AUTH_CONFIG = {
  // Core authentication settings
  authentication: {
    enabled: process.env.AUTH_ENABLED !== 'false',
    
    // CRITICAL: Development bypass configuration
    developmentBypass: {
      enabled: isDevelopmentEnvironment(),
      alwaysGrantAdmin: true,
      mockUserData: {
        id: 'dev-user-001',
        email: 'developer@sentia.com',
        name: 'Development User',
        role: 'admin',
        permissions: ['*'], // All permissions in development
        organization: 'development-org',
        source: 'development-bypass'
      }
    },

    // JWT settings (production only)
    jwt: {
      secret: process.env.JWT_SECRET || 'fallback-dev-secret-not-for-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshThreshold: parseInt(process.env.JWT_REFRESH_THRESHOLD) || 300, // 5 minutes
      issuer: process.env.JWT_ISSUER || 'sentia-mcp-server',
      audience: process.env.JWT_AUDIENCE || 'sentia-manufacturing'
    },

    // Session management
    session: {
      timeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5,
      extendOnActivity: process.env.EXTEND_SESSION_ON_ACTIVITY !== 'false',
      secureOnly: process.env.NODE_ENV === 'production'
    },

    // Multi-factor authentication (production only)
    mfa: {
      enabled: process.env.REQUIRE_MFA === 'true' && !isDevelopmentEnvironment(),
      providers: ['totp', 'sms', 'email'],
      backupCodes: {
        enabled: true,
        count: 10
      }
    }
  },

  // API Key authentication
  apiKeys: {
    enabled: process.env.API_KEYS_ENABLED !== 'false',
    
    // Development API keys
    development: {
      mockKeys: ['dev-key-001', 'dev-key-002'],
      alwaysValidate: true, // Always validate in development
      permissions: ['*'] // All permissions for dev keys
    },

    // Production API key settings
    production: {
      expirationDays: parseInt(process.env.API_KEY_EXPIRATION_DAYS) || 90,
      maxKeysPerUser: parseInt(process.env.MAX_API_KEYS_PER_USER) || 5,
      rotationWarningDays: parseInt(process.env.API_KEY_ROTATION_WARNING_DAYS) || 7,
      keyLength: parseInt(process.env.API_KEY_LENGTH) || 32
    },

    // Rate limiting per API key
    rateLimiting: {
      enabled: process.env.API_KEY_RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.API_KEY_RATE_WINDOW) || 15 * 60 * 1000, // 15 minutes
      maxRequests: parseInt(process.env.API_KEY_MAX_REQUESTS) || 1000
    }
  },

  // Role-based access control
  rbac: {
    roles: {
      admin: {
        name: 'Administrator',
        description: 'Full system access',
        permissions: ['*'],
        inherits: []
      },
      manager: {
        name: 'Manager',
        description: 'Financial and production management access',
        permissions: [
          'financial:read',
          'financial:write',
          'production:read',
          'production:write',
          'analytics:read',
          'reports:read',
          'reports:write'
        ],
        inherits: ['operator']
      },
      operator: {
        name: 'Operator',
        description: 'Production operations and quality control',
        permissions: [
          'production:read',
          'inventory:read',
          'inventory:write',
          'quality:read',
          'quality:write',
          'orders:read'
        ],
        inherits: ['viewer']
      },
      viewer: {
        name: 'Viewer',
        description: 'Read-only access to dashboards and reports',
        permissions: [
          'dashboard:read',
          'reports:read',
          'analytics:read'
        ],
        inherits: []
      }
    },

    // Permission categories
    permissions: {
      system: ['system:admin', 'system:config', 'system:monitor'],
      financial: ['financial:read', 'financial:write', 'financial:admin'],
      production: ['production:read', 'production:write', 'production:admin'],
      inventory: ['inventory:read', 'inventory:write', 'inventory:admin'],
      quality: ['quality:read', 'quality:write', 'quality:admin'],
      analytics: ['analytics:read', 'analytics:write', 'analytics:admin'],
      reports: ['reports:read', 'reports:write', 'reports:admin'],
      dashboard: ['dashboard:read', 'dashboard:write', 'dashboard:admin'],
      orders: ['orders:read', 'orders:write', 'orders:admin'],
      users: ['users:read', 'users:write', 'users:admin']
    },

    // Default role for new users
    defaultRole: 'viewer',
    
    // Development override
    developmentRole: 'admin' // Always admin in development
  },

  // Security monitoring
  monitoring: {
    enabled: process.env.SECURITY_MONITORING_ENABLED !== 'false',
    
    // Failed authentication tracking
    failedAuth: {
      maxAttempts: parseInt(process.env.MAX_AUTH_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION) || 900000, // 15 minutes
      trackByIP: true,
      trackByUser: true
    },

    // Suspicious activity detection
    suspiciousActivity: {
      enabled: process.env.SUSPICIOUS_ACTIVITY_DETECTION === 'true',
      multipleLocationThreshold: parseInt(process.env.MULTIPLE_LOCATION_THRESHOLD) || 2,
      rapidRequestThreshold: parseInt(process.env.RAPID_REQUEST_THRESHOLD) || 100,
      timeWindowMs: parseInt(process.env.ACTIVITY_TIME_WINDOW) || 60000 // 1 minute
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
        'user_management'
      ],
      retention: {
        days: parseInt(process.env.AUDIT_RETENTION_DAYS) || 90,
        maxSizeMB: parseInt(process.env.AUDIT_MAX_SIZE_MB) || 1000
      }
    }
  },

  // Data encryption
  encryption: {
    enabled: process.env.DATA_ENCRYPTION_ENABLED !== 'false',
    
    // Skip encryption in development for faster debugging
    developmentBypass: isDevelopmentEnvironment(),
    
    algorithm: 'aes-256-gcm',
    keyDerivation: {
      algorithm: 'pbkdf2',
      iterations: parseInt(process.env.ENCRYPTION_ITERATIONS) || 100000,
      saltLength: parseInt(process.env.ENCRYPTION_SALT_LENGTH) || 32
    },
    
    // Fields to encrypt
    encryptedFields: [
      'api_keys',
      'refresh_tokens',
      'personal_data',
      'financial_data'
    ]
  },

  // Rate limiting
  rateLimiting: {
    enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
    
    // Development: Very relaxed limits
    development: {
      windowMs: 60000, // 1 minute
      maxRequests: 10000, // Very high limit
      message: 'Development rate limit exceeded (very high threshold)'
    },
    
    // Production: Strict limits
    production: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: 'Rate limit exceeded. Please try again later.'
    },
    
    // Per-tool rate limiting
    toolLimiting: {
      enabled: process.env.TOOL_RATE_LIMITING_ENABLED !== 'false',
      defaultLimitPerHour: parseInt(process.env.DEFAULT_TOOL_LIMIT_PER_HOUR) || 1000,
      expensiveToolsLimitPerHour: parseInt(process.env.EXPENSIVE_TOOLS_LIMIT_PER_HOUR) || 100
    }
  }
};

/**
 * Get environment-specific authentication configuration
 */
export function getAuthConfig(environment = process.env.NODE_ENV) {
  const baseConfig = { ...AUTH_CONFIG };
  
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        authentication: {
          ...baseConfig.authentication,
          enabled: false, // Disable auth completely in development
          developmentBypass: {
            ...baseConfig.authentication.developmentBypass,
            enabled: true
          }
        },
        monitoring: {
          ...baseConfig.monitoring,
          enabled: false, // Disable security monitoring in development
          audit: {
            ...baseConfig.monitoring.audit,
            level: 'debug'
          }
        },
        rateLimiting: {
          ...baseConfig.rateLimiting,
          enabled: false // Disable rate limiting in development
        }
      };
      
    case 'testing':
      return {
        ...baseConfig,
        authentication: {
          ...baseConfig.authentication,
          enabled: true,
          developmentBypass: {
            ...baseConfig.authentication.developmentBypass,
            enabled: false
          }
        },
        monitoring: {
          ...baseConfig.monitoring,
          enabled: true,
          failedAuth: {
            ...baseConfig.monitoring.failedAuth,
            maxAttempts: 10 // More lenient for testing
          }
        }
      };
      
    case 'production':
      return {
        ...baseConfig,
        authentication: {
          ...baseConfig.authentication,
          enabled: true,
          developmentBypass: {
            ...baseConfig.authentication.developmentBypass,
            enabled: false
          },
          mfa: {
            ...baseConfig.authentication.mfa,
            enabled: process.env.REQUIRE_MFA === 'true'
          }
        },
        monitoring: {
          ...baseConfig.monitoring,
          enabled: true,
          suspiciousActivity: {
            ...baseConfig.monitoring.suspiciousActivity,
            enabled: true
          }
        }
      };
      
    default:
      return baseConfig;
  }
}

/**
 * Create mock user for development environment
 */
export function createMockDevelopmentUser() {
  return {
    id: AUTH_CONFIG.authentication.developmentBypass.mockUserData.id,
    email: AUTH_CONFIG.authentication.developmentBypass.mockUserData.email,
    name: AUTH_CONFIG.authentication.developmentBypass.mockUserData.name,
    role: AUTH_CONFIG.authentication.developmentBypass.mockUserData.role,
    permissions: AUTH_CONFIG.authentication.developmentBypass.mockUserData.permissions,
    organization: AUTH_CONFIG.authentication.developmentBypass.mockUserData.organization,
    source: AUTH_CONFIG.authentication.developmentBypass.mockUserData.source,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    sessionId: `dev-session-${Date.now()}`,
    authContext: {
      bypass: true,
      environment: 'development',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig() {
  const errors = [];
  const config = getAuthConfig();
  
  // Skip validation in development
  if (isDevelopmentEnvironment()) {
    console.log('[Development Mode] Authentication configuration validation skipped');
    return true;
  }
  
  // Validate JWT secret in production
  if (config.authentication.enabled && !config.authentication.jwt.secret) {
    errors.push('JWT_SECRET is required when authentication is enabled');
  }
  
  if (config.authentication.jwt.secret === 'fallback-dev-secret-not-for-production' && 
      process.env.NODE_ENV === 'production') {
    errors.push('Production JWT_SECRET must not use development fallback value');
  }
  
  // Validate MFA settings
  if (config.authentication.mfa.enabled && !config.authentication.jwt.secret) {
    errors.push('JWT_SECRET is required when MFA is enabled');
  }
  
  // Validate encryption settings
  if (config.encryption.enabled && process.env.NODE_ENV === 'production' && 
      !process.env.ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY is required when data encryption is enabled in production');
  }
  
  if (errors.length > 0) {
    throw new Error(`Authentication configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

// Export the configuration for the current environment
export const CURRENT_AUTH_CONFIG = getAuthConfig();

// Validate configuration on import (except in development)
try {
  validateAuthConfig();
} catch (error) {
  console.error('Authentication configuration validation failed:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}
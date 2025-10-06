/**
 * Security Configuration Management
 * 
 * Comprehensive security configuration including authentication, authorization,
 * encryption, rate limiting, security headers, audit logging, and compliance
 * with environment-specific security policies.
 */

import { config } from 'dotenv';

config();

/**
 * Security Configuration Factory
 */
export class SecurityConfig {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.buildConfiguration();
  }

  /**
   * Build environment-specific security configuration
   */
  buildConfiguration() {
    const baseConfig = this.getBaseConfiguration();
    const envConfig = this.getEnvironmentConfiguration();
    
    return {
      ...baseConfig,
      ...envConfig,
      // Computed properties
      authenticationConfig: this.buildAuthenticationConfiguration(),
      authorizationConfig: this.buildAuthorizationConfiguration(),
      encryptionConfig: this.buildEncryptionConfiguration(),
      rateLimitingConfig: this.buildRateLimitingConfiguration(),
      securityHeadersConfig: this.buildSecurityHeadersConfiguration(),
      auditConfig: this.buildAuditConfiguration(),
      complianceConfig: this.buildComplianceConfiguration()
    };
  }

  /**
   * Base security configuration
   */
  getBaseConfiguration() {
    return {
      // Global security settings
      enabled: process.env.SECURITY_ENABLED !== 'false',
      strictMode: process.env.SECURITY_STRICT_MODE === 'true',
      developmentBypass: process.env.SECURITY_DEV_BYPASS === 'true',
      
      // Authentication settings
      authRequired: process.env.AUTH_REQUIRED !== 'false',
      enableMFA: process.env.ENABLE_MFA === 'true',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
      maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5,
      
      // Password policy
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      passwordRequireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
      passwordExpiryDays: parseInt(process.env.PASSWORD_EXPIRY_DAYS) || 90,
      
      // Account lockout
      enableAccountLockout: process.env.ENABLE_ACCOUNT_LOCKOUT !== 'false',
      maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
      
      // Rate limiting
      enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
      globalRateLimit: parseInt(process.env.GLOBAL_RATE_LIMIT) || 1000,
      perUserRateLimit: parseInt(process.env.PER_USER_RATE_LIMIT) || 100,
      
      // Encryption
      enableEncryption: process.env.ENABLE_ENCRYPTION !== 'false',
      encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      keyRotationDays: parseInt(process.env.KEY_ROTATION_DAYS) || 90,
      
      // Security headers
      enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
      enableCSP: process.env.ENABLE_CSP !== 'false',
      enableHSTS: process.env.ENABLE_HSTS !== 'false',
      
      // Audit logging
      enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
      auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555, // 7 years
      
      // SSL/TLS
      enableSSL: process.env.ENABLE_SSL !== 'false',
      sslCertPath: process.env.SSL_CERT_PATH,
      sslKeyPath: process.env.SSL_KEY_PATH,
      sslCAPath: process.env.SSL_CA_PATH
    };
  }

  /**
   * Environment-specific configuration
   */
  getEnvironmentConfiguration() {
    const configs = {
      development: {
        // Development security (relaxed)
        enabled: true,
        strictMode: false,
        developmentBypass: true,
        
        // Relaxed authentication
        authRequired: false,
        enableMFA: false,
        sessionTimeout: 86400000, // 24 hours
        maxConcurrentSessions: 100,
        
        // Relaxed password policy
        passwordMinLength: 4,
        passwordRequireUppercase: false,
        passwordRequireLowercase: false,
        passwordRequireNumbers: false,
        passwordRequireSymbols: false,
        passwordExpiryDays: 0, // No expiry
        
        // Disabled account lockout
        enableAccountLockout: false,
        
        // Disabled rate limiting
        enableRateLimiting: false,
        
        // Optional encryption
        enableEncryption: false,
        
        // Minimal security headers
        enableSecurityHeaders: false,
        enableCSP: false,
        enableHSTS: false,
        
        // Development audit logging
        enableAuditLogging: true,
        auditRetentionDays: 7,
        
        // No SSL requirement
        enableSSL: false
      },

      testing: {
        // Testing security (moderate)
        enabled: true,
        strictMode: false,
        developmentBypass: false,
        
        // Testing authentication
        authRequired: true,
        enableMFA: false,
        sessionTimeout: 7200000, // 2 hours
        maxConcurrentSessions: 10,
        
        // Relaxed password policy for testing
        passwordMinLength: 6,
        passwordRequireUppercase: false,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        passwordExpiryDays: 0, // No expiry for testing
        
        // Lenient account lockout
        enableAccountLockout: true,
        maxFailedAttempts: 10,
        lockoutDuration: 300000, // 5 minutes
        
        // Moderate rate limiting
        enableRateLimiting: true,
        globalRateLimit: 5000,
        perUserRateLimit: 500,
        
        // Testing encryption
        enableEncryption: true,
        keyRotationDays: 30,
        
        // Basic security headers
        enableSecurityHeaders: true,
        enableCSP: true,
        enableHSTS: false,
        
        // Testing audit logging
        enableAuditLogging: true,
        auditRetentionDays: 30,
        
        // Optional SSL
        enableSSL: false
      },

      staging: {
        // Staging security (production-like)
        enabled: true,
        strictMode: true,
        developmentBypass: false,
        
        // Production-like authentication
        authRequired: true,
        enableMFA: process.env.REQUIRE_MFA === 'true',
        sessionTimeout: 3600000, // 1 hour
        maxConcurrentSessions: 5,
        
        // Moderate password policy
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        passwordExpiryDays: 90,
        
        // Production-like account lockout
        enableAccountLockout: true,
        maxFailedAttempts: 5,
        lockoutDuration: 600000, // 10 minutes
        
        // Production-like rate limiting
        enableRateLimiting: true,
        globalRateLimit: 2000,
        perUserRateLimit: 200,
        
        // Full encryption
        enableEncryption: true,
        keyRotationDays: 30,
        
        // Enhanced security headers
        enableSecurityHeaders: true,
        enableCSP: true,
        enableHSTS: true,
        
        // Full audit logging
        enableAuditLogging: true,
        auditRetentionDays: 365,
        
        // SSL recommended
        enableSSL: true
      },

      production: {
        // Production security (maximum)
        enabled: true,
        strictMode: true,
        developmentBypass: false,
        
        // Strict authentication
        authRequired: true,
        enableMFA: process.env.REQUIRE_MFA === 'true',
        sessionTimeout: 3600000, // 1 hour
        maxConcurrentSessions: 3,
        sessionRotationInterval: 1800000, // 30 minutes
        
        // Strict password policy
        passwordMinLength: 12,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: true,
        passwordExpiryDays: 90,
        passwordHistoryCount: 12,
        
        // Strict account lockout
        enableAccountLockout: true,
        maxFailedAttempts: 3,
        lockoutDuration: 900000, // 15 minutes
        progressiveLockout: true,
        
        // Strict rate limiting
        enableRateLimiting: true,
        globalRateLimit: 1000,
        perUserRateLimit: 100,
        adaptiveRateLimiting: true,
        
        // Maximum encryption
        enableEncryption: true,
        encryptionAlgorithm: 'aes-256-gcm',
        keyRotationDays: 90,
        encryptSensitiveFields: true,
        
        // Maximum security headers
        enableSecurityHeaders: true,
        enableCSP: true,
        enableHSTS: true,
        enableXSSProtection: true,
        enableNoSniff: true,
        enableFrameguard: true,
        
        // Full audit logging
        enableAuditLogging: true,
        auditRetentionDays: 2555, // 7 years
        auditEncryption: true,
        
        // SSL required
        enableSSL: true,
        enforceHTTPS: true
      }
    };

    return configs[this.environment] || configs.development;
  }

  /**
   * Build authentication configuration
   */
  buildAuthenticationConfiguration() {
    const config = this.config;
    
    return {
      // Basic authentication
      enabled: config.authRequired,
      developmentBypass: config.developmentBypass && this.environment === 'development',
      
      // Session management
      session: {
        timeout: config.sessionTimeout,
        maxConcurrentSessions: config.maxConcurrentSessions,
        rotationInterval: config.sessionRotationInterval || 0,
        secure: this.environment === 'production',
        httpOnly: true,
        sameSite: 'strict',
        domain: process.env.SESSION_DOMAIN
      },
      
      // Multi-factor authentication
      mfa: {
        enabled: config.enableMFA,
        methods: ['totp', 'sms', 'email'],
        gracePeriod: 86400000, // 24 hours
        backupCodes: true,
        rememberDevice: true,
        deviceTrustDuration: 2592000000 // 30 days
      },
      
      // JWT configuration
      jwt: {
        secret: process.env.JWT_SECRET,
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer: 'sentia-mcp-server',
        audience: 'sentia-mcp-client',
        clockTolerance: 30,
        refreshTokenTTL: '7d'
      },
      
      // OAuth configuration
      oauth: {
        enabled: process.env.OAUTH_ENABLED === 'true',
        providers: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            scope: ['profile', 'email']
          },
          microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            tenant: process.env.MICROSOFT_TENANT
          },
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            scope: ['user:email']
          }
        },
        callbackURL: process.env.OAUTH_CALLBACK_URL
      },
      
      // API key authentication
      apiKey: {
        enabled: process.env.API_KEY_AUTH_ENABLED === 'true',
        header: 'X-API-Key',
        query: 'api_key',
        rotation: config.keyRotationDays,
        scoping: true
      },
      
      // Account lockout
      lockout: {
        enabled: config.enableAccountLockout,
        maxAttempts: config.maxFailedAttempts,
        duration: config.lockoutDuration,
        progressive: config.progressiveLockout || false,
        trackByIP: true,
        trackByUser: true,
        whitelist: process.env.LOCKOUT_WHITELIST?.split(',') || []
      }
    };
  }

  /**
   * Build authorization configuration
   */
  buildAuthorizationConfiguration() {
    const config = this.config;
    
    return {
      // Role-based access control
      rbac: {
        enabled: true,
        roles: {
          admin: {
            permissions: ['*'],
            description: 'Full system access'
          },
          manager: {
            permissions: [
              'read',
              'write',
              'tools:execute',
              'reports:generate',
              'users:manage'
            ],
            description: 'Management access'
          },
          operator: {
            permissions: [
              'read',
              'tools:execute',
              'production:manage'
            ],
            description: 'Operational access'
          },
          viewer: {
            permissions: ['read'],
            description: 'Read-only access'
          }
        },
        inheritance: true,
        roleHierarchy: {
          admin: ['manager', 'operator', 'viewer'],
          manager: ['operator', 'viewer'],
          operator: ['viewer']
        }
      },
      
      // Attribute-based access control
      abac: {
        enabled: config.strictMode,
        policies: [
          {
            name: 'resource_owner',
            rule: 'user.id === resource.owner_id',
            effect: 'allow'
          },
          {
            name: 'business_hours',
            rule: 'time.hour >= 9 && time.hour <= 17',
            effect: 'allow',
            exceptions: ['admin']
          },
          {
            name: 'ip_whitelist',
            rule: 'request.ip in whitelist',
            effect: 'allow',
            whitelist: process.env.IP_WHITELIST?.split(',') || []
          }
        ]
      },
      
      // Resource permissions
      resources: {
        tools: {
          execute: ['admin', 'manager', 'operator'],
          configure: ['admin', 'manager'],
          install: ['admin']
        },
        data: {
          read: ['admin', 'manager', 'operator', 'viewer'],
          write: ['admin', 'manager', 'operator'],
          delete: ['admin', 'manager'],
          export: ['admin', 'manager']
        },
        users: {
          read: ['admin', 'manager'],
          create: ['admin'],
          update: ['admin', 'manager'],
          delete: ['admin']
        },
        system: {
          configure: ['admin'],
          monitor: ['admin', 'manager'],
          backup: ['admin'],
          restore: ['admin']
        }
      },
      
      // Permission inheritance
      inheritance: {
        enabled: true,
        strategy: 'additive',
        conflictResolution: 'most_restrictive'
      }
    };
  }

  /**
   * Build encryption configuration
   */
  buildEncryptionConfiguration() {
    const config = this.config;
    
    return {
      // Basic encryption settings
      enabled: config.enableEncryption,
      algorithm: config.encryptionAlgorithm,
      keyRotation: config.keyRotationDays,
      
      // Encryption keys
      keys: {
        primary: process.env.ENCRYPTION_KEY_PRIMARY,
        secondary: process.env.ENCRYPTION_KEY_SECONDARY,
        archive: process.env.ENCRYPTION_KEY_ARCHIVE
      },
      
      // Data encryption
      data: {
        encryptSensitiveFields: config.encryptSensitiveFields || false,
        sensitiveFields: [
          'password',
          'api_key',
          'secret',
          'token',
          'credit_card',
          'ssn',
          'tax_id'
        ],
        encryptionAtRest: this.environment === 'production',
        encryptionInTransit: true
      },
      
      // Database encryption
      database: {
        enabled: this.environment === 'production',
        tablespaceEncryption: true,
        columnEncryption: config.encryptSensitiveFields || false,
        backupEncryption: true
      },
      
      // File encryption
      files: {
        enabled: config.enableEncryption,
        encryptUploads: true,
        encryptLogs: this.environment === 'production',
        encryptBackups: true
      },
      
      // Communication encryption
      communication: {
        tlsVersion: '1.3',
        cipherSuites: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256'
        ],
        enableOCSP: true,
        enableCertificateTransparency: true
      },
      
      // Hashing
      hashing: {
        algorithm: 'bcrypt',
        rounds: this.environment === 'production' ? 12 : 10,
        pepper: process.env.HASH_PEPPER,
        saltLength: 16
      }
    };
  }

  /**
   * Build rate limiting configuration
   */
  buildRateLimitingConfiguration() {
    const config = this.config;
    
    return {
      // Global rate limiting
      global: {
        enabled: config.enableRateLimiting,
        windowMs: 900000, // 15 minutes
        max: config.globalRateLimit,
        message: 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false
      },
      
      // Per-user rate limiting
      perUser: {
        enabled: config.enableRateLimiting,
        windowMs: 900000, // 15 minutes
        max: config.perUserRateLimit,
        keyGenerator: (req) => req.user?.id || req.ip
      },
      
      // Endpoint-specific limits
      endpoints: {
        '/auth/login': {
          windowMs: 900000, // 15 minutes
          max: 5,
          skipSuccessfulRequests: true
        },
        '/auth/register': {
          windowMs: 3600000, // 1 hour
          max: 3
        },
        '/api/tools': {
          windowMs: 60000, // 1 minute
          max: this.environment === 'production' ? 20 : 100
        },
        '/api/upload': {
          windowMs: 3600000, // 1 hour
          max: 10
        }
      },
      
      // Adaptive rate limiting
      adaptive: {
        enabled: config.adaptiveRateLimiting || false,
        baselineWindow: 3600000, // 1 hour
        adaptationFactor: 1.5,
        minLimit: 10,
        maxLimit: config.globalRateLimit * 2
      },
      
      // DDoS protection
      ddos: {
        enabled: this.environment === 'production',
        burst: 20,
        limit: 100,
        maxcount: 300,
        maxexpiry: 600000, // 10 minutes
        checkinterval: 1000,
        trustProxy: true,
        includeUserAgent: true,
        whitelist: process.env.DDOS_WHITELIST?.split(',') || []
      },
      
      // Rate limit storage
      storage: {
        type: process.env.REDIS_URL ? 'redis' : 'memory',
        redis: {
          url: process.env.REDIS_URL,
          keyPrefix: 'rl:',
          connectTimeout: 5000
        },
        memory: {
          max: 10000
        }
      }
    };
  }

  /**
   * Build security headers configuration
   */
  buildSecurityHeadersConfiguration() {
    const config = this.config;
    
    return {
      // Helmet configuration
      helmet: {
        enabled: config.enableSecurityHeaders,
        
        // Content Security Policy
        contentSecurityPolicy: {
          enabled: config.enableCSP,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: this.environment === 'development' 
              ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
              : ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:", "wss:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: this.environment === 'production' ? [] : null
          },
          reportOnly: this.environment !== 'production',
          reportUri: process.env.CSP_REPORT_URI
        },
        
        // HTTP Strict Transport Security
        hsts: {
          enabled: config.enableHSTS,
          maxAge: this.environment === 'production' ? 31536000 : 86400, // 1 year : 1 day
          includeSubDomains: this.environment === 'production',
          preload: this.environment === 'production'
        },
        
        // X-Frame-Options
        frameguard: {
          enabled: config.enableFrameguard || true,
          action: 'deny'
        },
        
        // X-XSS-Protection
        xssFilter: {
          enabled: config.enableXSSProtection || true
        },
        
        // X-Content-Type-Options
        noSniff: {
          enabled: config.enableNoSniff || true
        },
        
        // Referrer Policy
        referrerPolicy: {
          enabled: true,
          policy: 'strict-origin-when-cross-origin'
        },
        
        // Permissions Policy
        permissionsPolicy: {
          enabled: true,
          features: {
            camera: [],
            microphone: [],
            geolocation: [],
            payment: [],
            usb: []
          }
        },
        
        // Hide X-Powered-By
        hidePoweredBy: true
      },
      
      // Custom security headers
      custom: {
        'X-API-Version': '3.0.0',
        'X-Security-Policy': 'strict',
        'X-Content-Security-Policy': this.environment === 'production' 
          ? 'default-src self' 
          : 'default-src self unsafe-inline',
        'Strict-Transport-Security': this.environment === 'production'
          ? 'max-age=31536000; includeSubDomains; preload'
          : 'max-age=86400'
      }
    };
  }

  /**
   * Build audit configuration
   */
  buildAuditConfiguration() {
    const config = this.config;
    
    return {
      // Basic audit settings
      enabled: config.enableAuditLogging,
      level: this.environment === 'production' ? 'info' : 'debug',
      retentionDays: config.auditRetentionDays,
      encryption: config.auditEncryption || false,
      
      // Audit events
      events: [
        'authentication',
        'authorization',
        'user_management',
        'role_assignment',
        'permission_change',
        'tool_execution',
        'data_access',
        'data_modification',
        'configuration_change',
        'security_violation',
        'system_events',
        'integration_calls',
        'file_operations',
        'backup_operations',
        'system_shutdown',
        'system_startup'
      ],
      
      // Sensitive operations (always audited)
      sensitiveOperations: [
        'password_change',
        'mfa_setup',
        'role_elevation',
        'system_configuration',
        'security_policy_change',
        'user_creation',
        'user_deletion',
        'privilege_escalation'
      ],
      
      // Audit log format
      format: {
        timestamp: true,
        level: true,
        event: true,
        userId: true,
        sessionId: true,
        ipAddress: true,
        userAgent: true,
        resource: true,
        action: true,
        result: true,
        details: true,
        correlationId: true
      },
      
      // Audit storage
      storage: {
        type: 'file',
        file: {
          directory: 'logs/audit',
          filename: `audit-${this.environment}.log`,
          maxSize: '100m',
          maxFiles: 50,
          compression: true
        },
        database: {
          enabled: this.environment === 'production',
          table: 'audit_logs',
          retention: config.auditRetentionDays
        },
        external: {
          enabled: process.env.EXTERNAL_AUDIT_ENABLED === 'true',
          endpoint: process.env.EXTERNAL_AUDIT_ENDPOINT,
          apiKey: process.env.EXTERNAL_AUDIT_API_KEY
        }
      },
      
      // Audit integrity
      integrity: {
        enabled: this.environment === 'production',
        signing: true,
        checksums: true,
        tamperDetection: true
      }
    };
  }

  /**
   * Build compliance configuration
   */
  buildComplianceConfiguration() {
    const config = this.config;
    
    return {
      // GDPR compliance
      gdpr: {
        enabled: true,
        dataRetentionDays: config.auditRetentionDays,
        enableDataPortability: true,
        enableRightToErasure: true,
        enableConsentManagement: true,
        enableDataMinimization: true,
        lawfulBasis: 'legitimate_interest',
        dataProtectionOfficer: process.env.DPO_EMAIL
      },
      
      // SOX compliance
      sox: {
        enabled: this.environment === 'production',
        enableFinancialControls: true,
        enableAuditTrails: true,
        enableDataIntegrity: true,
        enableChangeControl: true,
        retentionYears: 7
      },
      
      // ISO 27001 compliance
      iso27001: {
        enabled: this.environment === 'production',
        enableSecurityControls: true,
        enableRiskManagement: true,
        enableIncidentResponse: true,
        enableBusinessContinuity: true,
        enableVendorManagement: true
      },
      
      // HIPAA compliance (if applicable)
      hipaa: {
        enabled: process.env.HIPAA_COMPLIANCE === 'true',
        enablePhiProtection: true,
        enableAccessControls: true,
        enableAuditLogs: true,
        enableEncryption: true,
        enableBusinessAssociateAgreements: true
      },
      
      // PCI DSS compliance (if applicable)
      pciDss: {
        enabled: process.env.PCI_COMPLIANCE === 'true',
        enableCardDataProtection: true,
        enableNetworkSecurity: true,
        enableAccessControls: true,
        enableMonitoring: true,
        enableRegularTesting: true
      }
    };
  }

  /**
   * Validate security configuration
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Authentication validation
    if (this.config.authRequired && !process.env.JWT_SECRET) {
      errors.push('JWT secret is required when authentication is enabled');
    }
    
    // Encryption validation
    if (this.config.enableEncryption && !process.env.ENCRYPTION_KEY_PRIMARY) {
      errors.push('Primary encryption key is required when encryption is enabled');
    }
    
    // Session validation
    if (this.config.sessionTimeout < 300000) { // 5 minutes
      warnings.push('Session timeout should be at least 5 minutes');
    }
    
    // Password policy validation
    if (this.config.passwordMinLength < 8 && this.environment === 'production') {
      warnings.push('Password minimum length should be at least 8 characters in production');
    }
    
    // Rate limiting validation
    if (this.config.enableRateLimiting && this.config.globalRateLimit < 1) {
      errors.push('Global rate limit must be at least 1');
    }
    
    // Environment-specific validation
    if (this.environment === 'production') {
      if (!this.config.enableSecurityHeaders) {
        warnings.push('Security headers should be enabled in production');
      }
      
      if (!this.config.enableAuditLogging) {
        warnings.push('Audit logging should be enabled in production');
      }
      
      if (!this.config.enableEncryption) {
        warnings.push('Encryption should be enabled in production');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration for security middleware
   */
  exportConfig() {
    return {
      // Basic settings
      enabled: this.config.enabled,
      strictMode: this.config.strictMode,
      environment: this.environment,
      
      // Component configs
      authentication: this.config.authenticationConfig,
      authorization: this.config.authorizationConfig,
      encryption: this.config.encryptionConfig,
      rateLimiting: this.config.rateLimitingConfig,
      securityHeaders: this.config.securityHeadersConfig,
      audit: this.config.auditConfig,
      compliance: this.config.complianceConfig
    };
  }
}

/**
 * Create security configuration for current environment
 */
export function createSecurityConfig(environment = process.env.NODE_ENV) {
  return new SecurityConfig(environment);
}

/**
 * Get security configuration
 */
export function getSecurityConfig(environment = process.env.NODE_ENV) {
  const securityConfig = new SecurityConfig(environment);
  return securityConfig.exportConfig();
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(environment = process.env.NODE_ENV) {
  const securityConfig = new SecurityConfig(environment);
  return securityConfig.validate();
}

export default SecurityConfig;
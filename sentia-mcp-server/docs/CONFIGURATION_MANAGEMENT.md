# Sentia MCP Server - Configuration & Environment Management

## 📋 **Overview**

This document provides comprehensive details about the Phase 3.3 enterprise configuration implementation, including secure credential management, dynamic configuration updates, multi-environment support, and comprehensive validation.

## ⚙️ **Configuration & Environment Management System (Phase 3.3)**

### **✅ Complete Enterprise Configuration Implementation**

A robust configuration and environment management system providing secure credential management, dynamic configuration updates, multi-environment support, and comprehensive validation.

## 🏗️ **Configuration Architecture Components**

| Component | Location | Features | Status |
|-----------|----------|----------|--------|
| **Environment Factory** | `src/config/environment-config.js` | Multi-environment support, hot-reloading | ✅ Complete |
| **Credential Manager** | `src/config/credential-manager.js` | AES-256-GCM encryption, rotation | ✅ Complete |
| **Dynamic Config** | `src/config/dynamic-config.js` | Runtime updates, feature flags | ✅ Complete |
| **Server Configuration** | `src/config/server-config.js` | Centralized config with validation | ✅ Complete |
| **Security Config** | `src/config/security/security-config.js` | Advanced security settings | ✅ Complete |
| **Performance Config** | `src/config/performance/performance-config.js` | Resource optimization | ✅ Complete |
| **Service Configs** | `src/config/services/` | Database, cache, API configurations | ✅ Complete |
| **Config Templates** | `src/config/templates/config-templates.js` | Pre-built deployment profiles | ✅ Complete |
| **Configuration API** | `src/routes/config.js` | RESTful configuration management | ✅ Complete |

## 🌍 **Advanced Configuration Features**

### **Multi-Environment Support**

**Environment-Specific Configuration with Inheritance**
```javascript
// Environment-specific configuration with inheritance
export class EnvironmentConfigFactory extends EventEmitter {
  getConfiguration(environment = 'development') {
    const baseConfig = this.loadBaseConfiguration();
    const envConfig = this.loadEnvironmentConfiguration(environment);
    return this.mergeConfigurations(baseConfig, envConfig);
  }
  
  loadBaseConfiguration() {
    return {
      server: {
        port: 3001,
        timeout: 30000,
        cors: { enabled: true }
      },
      logging: {
        level: 'info',
        format: 'json'
      },
      monitoring: {
        enabled: true,
        metricsPort: 9090
      }
    };
  }
  
  mergeConfigurations(base, environment) {
    return {
      ...base,
      ...environment,
      // Deep merge for nested objects
      server: { ...base.server, ...environment.server },
      logging: { ...base.logging, ...environment.logging },
      monitoring: { ...base.monitoring, ...environment.monitoring }
    };
  }
}
```

### **Secure Credential Management**

**AES-256-GCM Encrypted Credential Storage**
```javascript
// AES-256-GCM encrypted credential storage
export class CredentialManager extends EventEmitter {
  async storeCredential(key, value, options = {}) {
    const encrypted = this.encryptValue(value);
    const metadata = {
      createdAt: new Date().toISOString(),
      expiresAt: options.ttl ? new Date(Date.now() + options.ttl).toISOString() : null,
      rotationSchedule: options.rotationSchedule,
      accessLevel: options.accessLevel || 'standard',
      lastRotated: null,
      version: 1
    };
    
    await this.storage.set(key, { encrypted, metadata });
    this.emit('credential:stored', { key, metadata });
  }
  
  async retrieveCredential(key) {
    const stored = await this.storage.get(key);
    if (!stored) {
      throw new Error(`Credential not found: ${key}`);
    }
    
    // Check expiration
    if (stored.metadata.expiresAt && new Date() > new Date(stored.metadata.expiresAt)) {
      throw new Error(`Credential expired: ${key}`);
    }
    
    const decrypted = this.decryptValue(stored.encrypted);
    this.emit('credential:accessed', { key, timestamp: new Date().toISOString() });
    
    return decrypted;
  }
  
  async rotateCredential(key, newValue) {
    const existing = await this.storage.get(key);
    if (!existing) {
      throw new Error(`Credential not found for rotation: ${key}`);
    }
    
    const metadata = {
      ...existing.metadata,
      lastRotated: new Date().toISOString(),
      version: existing.metadata.version + 1
    };
    
    const encrypted = this.encryptValue(newValue);
    await this.storage.set(key, { encrypted, metadata });
    
    this.emit('credential:rotated', { key, version: metadata.version });
  }
}
```

### **Dynamic Configuration Updates**

**Runtime Configuration Changes Without Restart**
```javascript
// Runtime configuration changes without restart
export class DynamicConfigManager extends EventEmitter {
  async updateConfiguration(path, value, options = {}) {
    const changeId = this.generateChangeId();
    const validation = await this.validateChange(path, value);
    
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    // Create backup before change
    const backup = this.createConfigBackup();
    
    try {
      await this.applyChange(path, value, changeId, options);
      
      // Notify all components of configuration change
      this.emit('config:updated', { 
        path, 
        value, 
        changeId, 
        timestamp: new Date().toISOString(),
        backup: backup.id
      });
      
      // Log configuration change
      logger.info('Configuration updated', {
        path,
        changeId,
        userId: options.userId,
        reason: options.reason
      });
      
    } catch (error) {
      // Rollback on failure
      await this.restoreFromBackup(backup.id);
      throw error;
    }
  }
  
  async validateChange(path, value) {
    const validator = this.getValidatorForPath(path);
    return await validator.validate(value);
  }
  
  async rollbackChange(changeId) {
    const change = await this.getChangeById(changeId);
    if (!change) {
      throw new Error(`Change not found: ${changeId}`);
    }
    
    await this.restoreFromBackup(change.backup);
    this.emit('config:rollback', { changeId, timestamp: new Date().toISOString() });
  }
}
```

### **Configuration Templates & Profiles**

**Pre-built Configuration Profiles for Different Scenarios**
```javascript
// Pre-built configuration profiles for different scenarios
export const configProfiles = {
  aiOptimized: {
    name: 'AI Optimized Profile',
    description: 'Optimized for AI and machine learning workloads',
    overrides: {
      performance: {
        maxMemoryUsage: '8gb',
        maxConcurrentTools: 10,
        enableGPUAcceleration: true,
        aiModelCaching: true
      },
      integrations: {
        anthropic: { enabled: true, priority: 'high', maxTokens: 8000 },
        openai: { enabled: true, priority: 'high', maxTokens: 4000 }
      }
    }
  },
  
  manufacturing: {
    name: 'Manufacturing Profile',
    description: 'Optimized for manufacturing operations',
    overrides: {
      integrations: {
        unleashed: { enabled: true, priority: 'critical' },
        xero: { enabled: true, priority: 'high' },
        shopify: { enabled: true, priority: 'medium' }
      },
      performance: {
        maxConcurrentTools: 15,
        cacheStrategy: 'aggressive',
        enableRealTimeUpdates: true
      }
    }
  },
  
  development: {
    name: 'Development Profile',
    description: 'Developer-friendly configuration with enhanced debugging',
    overrides: {
      logging: {
        level: 'debug',
        enableConsoleOutput: true,
        enableFileOutput: false
      },
      security: {
        relaxedValidation: true,
        enableDebugEndpoints: true
      },
      performance: {
        enableHotReload: true,
        disableCaching: true
      }
    }
  },
  
  production: {
    name: 'Production Profile',
    description: 'Hardened production configuration with optimized performance',
    overrides: {
      security: {
        strictValidation: true,
        enableSecurityHeaders: true,
        forceSSL: true
      },
      performance: {
        enableClustering: true,
        maxConcurrentTools: 20,
        enableAdvancedCaching: true
      },
      monitoring: {
        enableDetailedMetrics: true,
        enableBusinessAnalytics: true,
        alertingEnabled: true
      }
    }
  }
};
```

## 🏗️ **Environment Management Features**

### **Environment Configurations**

**Development Environment** (`src/config/environments/development.js`)
- Relaxed security for faster development
- Enhanced debugging and logging
- Hot reload capabilities
- Mock data and test integrations

**Testing Environment** (`src/config/environments/testing.js`)
- UAT optimized with test isolation
- Comprehensive test data
- Integration testing capabilities
- Performance baseline measurement

**Staging Environment** (`src/config/environments/staging.js`)
- Production-like configuration
- Validation and testing features
- Performance monitoring
- Security testing

**Production Environment** (`src/config/environments/production.js`)
- Hardened production security
- Optimized performance settings
- Full monitoring and alerting
- Compliance and audit features

### **Service-Specific Configurations**

**Database Configuration** (`src/config/services/database-config.js`)
```javascript
export const databaseConfigs = {
  development: {
    host: 'localhost',
    port: 5432,
    database: 'sentia_mcp_dev',
    ssl: false,
    poolSize: 5,
    connectionTimeout: 5000
  },
  
  production: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false },
    poolSize: 20,
    connectionTimeout: 10000,
    enableQueryLogging: false
  }
};
```

**Cache Configuration** (`src/config/services/cache-config.js`)
```javascript
export const cacheConfigs = {
  development: {
    type: 'memory',
    maxSize: 100,
    ttl: 300000 // 5 minutes
  },
  
  production: {
    type: 'redis',
    url: process.env.REDIS_URL,
    maxMemory: '256mb',
    ttl: 3600000, // 1 hour
    enableClustering: true,
    enableCompression: true
  }
};
```

**API Configuration** (`src/config/services/api-config.js`)
```javascript
export const apiConfigs = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP'
  },
  
  timeout: {
    server: 30000,
    client: 10000,
    database: 5000
  },
  
  retryPolicy: {
    maxRetries: 3,
    backoffFactor: 2,
    initialDelay: 1000
  }
};
```

### **Performance Configurations**

**Environment-Specific Performance Tuning**
```javascript
// Environment-specific performance tuning
export const performanceConfigs = {
  development: {
    maxMemoryUsage: '1gb',
    maxCPUUsage: 50,
    enableClusterMode: false,
    connectionPooling: {
      database: { maxConnections: 5, minConnections: 1 },
      cache: { maxConnections: 2, timeout: 5000 }
    },
    enableProfiling: true,
    enableDebugMode: true
  },
  
  production: {
    maxMemoryUsage: '4gb',
    maxCPUUsage: 75,
    enableClusterMode: true,
    connectionPooling: {
      database: { maxConnections: 20, minConnections: 5 },
      cache: { maxConnections: 10, timeout: 5000 }
    },
    enableAdvancedOptimizations: true,
    enableMemoryLeakDetection: true,
    garbageCollection: {
      strategy: 'aggressive',
      maxOldSpaceSize: 2048
    }
  }
};
```

## 🔗 **Configuration Management API**

### **Core Configuration Endpoints**

**Configuration Status and Management**
- `GET /api/config/status` - Configuration system status and health
- `GET /api/config/environment` - Current environment settings
- `GET /api/config/security` - Security configuration (sensitive data masked)
- `GET /api/config/performance` - Performance settings and optimization
- `GET /api/config/services` - All service configurations
- `GET /api/config/profiles` - Available configuration profiles
- `GET /api/config/templates` - Configuration templates

**Dynamic Configuration Management**
- `POST /api/config/dynamic` - Update configuration at runtime
- `POST /api/config/validate` - Validate configuration changes
- `POST /api/config/reload` - Reload configuration from files
- `POST /api/config/backup` - Create configuration backup
- `POST /api/config/restore` - Restore from backup
- `GET /api/config/history` - Configuration change history

**Profile and Template Management**
- `POST /api/config/profiles/apply` - Apply configuration profile
- `GET /api/config/profiles/current` - Get current active profile
- `POST /api/config/templates/deploy` - Deploy configuration template
- `PUT /api/config/templates/{id}` - Update configuration template

### **Advanced Configuration Features**

**Real-time Configuration Updates**
- Zero-downtime configuration changes
- Instant propagation to all service components
- Automatic validation before application
- Rollback capabilities for failed changes

**Configuration Change History and Rollback**
- Complete audit trail of all configuration changes
- Point-in-time recovery capabilities
- Change approval workflows for critical settings
- Automated backup before each change

**Template-based Configuration Deployment**
- Pre-defined configuration templates for common scenarios
- Environment-specific template variations
- Template versioning and management
- Bulk configuration deployment

**Environment-specific Validation Rules**
- Custom validation rules per environment
- Business rule enforcement
- Compliance checking
- Configuration drift detection

## 🔒 **Security & Compliance**

### **Credential Security**

**Advanced Encryption and Key Management**
- **AES-256-GCM encryption** for all sensitive data
- **Automatic credential rotation** scheduling (90-day cycle)
- **Access control** with comprehensive audit logging
- **Secure credential distribution** across environments
- **Industry compliance** with SOC2, GDPR, ISO27001

**Credential Lifecycle Management**
```javascript
// Credential lifecycle management
export class CredentialLifecycleManager {
  async scheduleRotation(credentialKey, schedule) {
    const job = {
      credentialKey,
      schedule,
      nextRotation: this.calculateNextRotation(schedule),
      autoRotate: true
    };
    
    await this.scheduler.schedule(`rotate-${credentialKey}`, job);
    logger.info('Credential rotation scheduled', { credentialKey, schedule });
  }
  
  async performRotation(credentialKey) {
    try {
      const newCredential = await this.generateNewCredential(credentialKey);
      await this.credentialManager.rotateCredential(credentialKey, newCredential);
      await this.notifyServices(credentialKey);
      
      logger.info('Credential rotated successfully', { credentialKey });
    } catch (error) {
      logger.error('Credential rotation failed', { credentialKey, error });
      await this.alertEngine.triggerAlert('credential_rotation_failed', { credentialKey });
    }
  }
}
```

### **Configuration Validation**

**Comprehensive Validation with JSON Schema**
```javascript
// Comprehensive validation with JSON Schema
export class ConfigurationValidator {
  async validateConfiguration(config, environment = null) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      environment,
      validatedAt: new Date().toISOString()
    };
    
    // Schema validation
    const schemaValidation = this.validateSchema(config);
    if (!schemaValidation.valid) {
      results.valid = false;
      results.errors.push(...schemaValidation.errors);
    }
    
    // Environment-specific validation
    if (environment) {
      const envValidation = this.validateEnvironment(config, environment);
      results.warnings.push(...envValidation.warnings);
    }
    
    // Business rule validation
    const businessValidation = this.validateBusinessRules(config);
    if (!businessValidation.valid) {
      results.valid = false;
      results.errors.push(...businessValidation.errors);
    }
    
    // Security validation
    const securityValidation = this.validateSecurity(config);
    if (!securityValidation.valid) {
      results.valid = false;
      results.errors.push(...securityValidation.errors);
    }
    
    return results;
  }
  
  validateSchema(config) {
    const schema = this.getConfigurationSchema();
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(config);
    
    return {
      valid,
      errors: valid ? [] : validate.errors.map(err => err.message)
    };
  }
}
```

## 🎯 **Configuration Benefits**

### **Operational Excellence**
- **Zero-Downtime Updates**: Runtime configuration changes without service restart
- **Environment Consistency**: Guaranteed configuration parity across environments
- **Security Compliance**: Encrypted credentials with automatic rotation
- **Audit Trail**: Complete configuration change history with approval workflows
- **Disaster Recovery**: Configuration backup and restore capabilities

### **Developer Experience**
- **Hot Configuration Reload**: Instant configuration updates during development
- **Configuration Templates**: Pre-built profiles for common scenarios
- **Validation Engine**: Prevent invalid configurations before deployment
- **API Management**: RESTful configuration management interface
- **Documentation**: Auto-generated configuration documentation

### **Enterprise Features**
- **Multi-tenancy**: Isolated configuration per organization
- **Role-based Access**: Granular permissions for configuration management
- **Approval Workflows**: Multi-stage approval for critical configuration changes
- **Change Management**: Integration with ITSM systems for change control
- **Compliance Reporting**: Automated compliance reports and audit trails

## 🛠️ **Configuration & Setup**

### **Environment Variables**
```bash
# Phase 3.3: Configuration & Environment Management
CONFIG_ENVIRONMENT=development
ENABLE_DYNAMIC_CONFIG=true
ENABLE_CONFIG_VALIDATION=true
CREDENTIAL_ENCRYPTION_ENABLED=true
CREDENTIAL_ROTATION_ENABLED=true
CONFIG_CACHE_TTL=300000

# Database and Performance Profiles
DATABASE_CONFIG_PROFILE=development
PERFORMANCE_CONFIG_PROFILE=standard
SECURITY_CONFIG_PROFILE=standard

# Credential Management
CREDENTIAL_MASTER_KEY=your_master_encryption_key
CREDENTIAL_ROTATION_INTERVAL=7776000000  # 90 days in milliseconds
CREDENTIAL_STORAGE_TYPE=database

# Configuration API
CONFIG_API_ENABLED=true
CONFIG_API_AUTH_REQUIRED=true
CONFIG_BACKUP_RETENTION_DAYS=30
```

### **Configuration File Example**
```javascript
// config/server-config.js
export default {
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    timeout: 30000,
    keepAliveTimeout: 65000
  },
  
  security: {
    enableCORS: true,
    enableHelmet: true,
    enableRateLimit: true,
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY
  },
  
  integrations: {
    xero: {
      enabled: true,
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET
    },
    shopify: {
      enabled: true,
      accessTokens: {
        uk: process.env.SHOPIFY_UK_ACCESS_TOKEN,
        usa: process.env.SHOPIFY_USA_ACCESS_TOKEN
      }
    }
  }
};
```

## 📚 **Related Documentation**

- **[MCP Server Overview](MCP_SERVER_OVERVIEW.md)**: Architecture and technology stack overview
- **[Authentication & Security](AUTHENTICATION_SECURITY.md)**: Enterprise security system (Phase 3.1)
- **[Monitoring & Logging](MONITORING_LOGGING.md)**: Comprehensive monitoring infrastructure (Phase 3.2)
- **[Deployment Infrastructure](DEPLOYMENT_INFRASTRUCTURE.md)**: Complete deployment automation (Phase 4)
- **[Development Guide](DEVELOPMENT_GUIDE.md)**: Setup, workflow, and development instructions

---

*This comprehensive configuration and environment management system provides enterprise-grade configuration capabilities with secure credential management, dynamic updates, multi-environment support, and comprehensive validation for the Sentia MCP Server.*
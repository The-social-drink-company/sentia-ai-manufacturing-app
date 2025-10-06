/**
 * Configuration Management API Routes
 * 
 * REST API endpoints for managing MCP server configuration including
 * environment configs, security settings, performance tuning, and
 * real-time configuration updates with proper authentication and validation.
 */

import express from 'express';
import { createEnvironmentConfigFactory } from '../config/environment-config.js';
import { createCredentialManager } from '../config/credential-manager.js';
import { createDynamicConfigManager } from '../config/dynamic-config.js';
import { createSecurityConfig } from '../config/security/security-config.js';
import { createPerformanceConfig } from '../config/performance/performance-config.js';
import { createDatabaseConfig } from '../config/services/database-config.js';
import { createCacheConfig } from '../config/services/cache-config.js';
import { createAPIConfig } from '../config/services/api-config.js';
import { createIntegrationConfig } from '../config/services/integration-config.js';
import { createMonitoringConfig } from '../config/services/monitoring-config.js';
import { isDevelopmentBypassActive, hasPermission } from '../config/security/auth-policies.js';

const router = express.Router();

// Configuration managers (singleton instances)
let envConfigFactory = null;
let credentialManager = null;
let dynamicConfigManager = null;

/**
 * Initialize configuration managers
 */
function initializeManagers() {
  if (!envConfigFactory) {
    envConfigFactory = createEnvironmentConfigFactory();
    credentialManager = createCredentialManager();
    dynamicConfigManager = createDynamicConfigManager();
  }
}

/**
 * Authentication middleware (respects development bypass)
 */
function requireAuth(req, res, next) {
  if (isDevelopmentBypassActive()) {
    // Use mock user in development bypass mode
    req.user = {
      id: 'dev-user-1',
      email: 'developer@sentia.com',
      role: 'admin',
      permissions: ['*'],
      authenticated: true
    };
    return next();
  }

  // Standard authentication check
  if (!req.user || !req.user.authenticated) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate to access configuration endpoints'
    });
  }

  next();
}

/**
 * Authorization middleware for configuration access
 */
function requireConfigPermission(action = 'read') {
  return (req, res, next) => {
    if (!hasPermission(req.user, 'system', action)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `You don't have permission to ${action} system configuration`,
        required: `system:${action}`
      });
    }
    next();
  };
}

/**
 * GET /api/config/status
 * Get configuration system status
 */
router.get('/status', requireAuth, (req, res) => {
  try {
    initializeManagers();

    const status = {
      environment: process.env.NODE_ENV || 'development',
      developmentBypass: isDevelopmentBypassActive(),
      configurationLoaded: true,
      managers: {
        environmentConfig: !!envConfigFactory,
        credentialManager: !!credentialManager,
        dynamicConfig: !!dynamicConfigManager
      },
      lastUpdated: new Date().toISOString(),
      version: '3.0.0'
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Configuration status error',
      message: error.message
    });
  }
});

/**
 * GET /api/config/environment
 * Get current environment configuration
 */
router.get('/environment', requireAuth, requireConfigPermission('read'), (req, res) => {
  try {
    initializeManagers();
    const config = envConfigFactory.getConfiguration();
    
    res.json({
      environment: process.env.NODE_ENV || 'development',
      configuration: config,
      metadata: {
        loadedAt: envConfigFactory.getLoadTime(),
        configFiles: envConfigFactory.getLoadedFiles(),
        overrides: envConfigFactory.getOverrides()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Environment configuration error',
      message: error.message
    });
  }
});

/**
 * GET /api/config/security
 * Get security configuration
 */
router.get('/security', requireAuth, requireConfigPermission('read'), (req, res) => {
  try {
    const securityConfig = createSecurityConfig();
    const config = securityConfig.exportConfig();
    
    // Remove sensitive information
    if (config.authentication && config.authentication.jwt) {
      delete config.authentication.jwt.secret;
    }
    if (config.encryption && config.encryption.keys) {
      delete config.encryption.keys;
    }

    res.json({
      configuration: config,
      validation: securityConfig.validate()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Security configuration error',
      message: error.message
    });
  }
});

/**
 * GET /api/config/performance
 * Get performance configuration
 */
router.get('/performance', requireAuth, requireConfigPermission('read'), (req, res) => {
  try {
    const performanceConfig = createPerformanceConfig();
    const config = performanceConfig.exportConfig();
    
    res.json({
      configuration: config,
      validation: performanceConfig.validate(),
      nodeArgs: performanceConfig.getNodeArgs()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Performance configuration error',
      message: error.message
    });
  }
});

/**
 * GET /api/config/services
 * Get all service configurations
 */
router.get('/services', requireAuth, requireConfigPermission('read'), (req, res) => {
  try {
    const services = {
      database: createDatabaseConfig().exportConfig(),
      cache: createCacheConfig().exportConfig(),
      api: createAPIConfig().exportConfig(),
      integration: createIntegrationConfig().exportConfig(),
      monitoring: createMonitoringConfig().exportConfig()
    };

    res.json({
      services,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Service configuration error',
      message: error.message
    });
  }
});

/**
 * GET /api/config/services/:service
 * Get specific service configuration
 */
router.get('/services/:service', requireAuth, requireConfigPermission('read'), (req, res) => {
  try {
    const { service } = req.params;
    let config = null;
    let validation = null;

    switch (service) {
      case 'database':
        const dbConfig = createDatabaseConfig();
        config = dbConfig.exportConfig();
        validation = dbConfig.validate();
        break;
      case 'cache':
        const cacheConfig = createCacheConfig();
        config = cacheConfig.exportConfig();
        validation = cacheConfig.validate();
        break;
      case 'api':
        const apiConfig = createAPIConfig();
        config = apiConfig.exportConfig();
        validation = apiConfig.validate();
        break;
      case 'integration':
        const integrationConfig = createIntegrationConfig();
        config = integrationConfig.exportConfig();
        validation = integrationConfig.validate();
        break;
      case 'monitoring':
        const monitoringConfig = createMonitoringConfig();
        config = monitoringConfig.exportConfig();
        validation = monitoringConfig.validate();
        break;
      default:
        return res.status(404).json({
          error: 'Service not found',
          message: `Service '${service}' is not recognized`,
          availableServices: ['database', 'cache', 'api', 'integration', 'monitoring']
        });
    }

    res.json({
      service,
      configuration: config,
      validation
    });
  } catch (error) {
    res.status(500).json({
      error: 'Service configuration error',
      message: error.message
    });
  }
});

/**
 * POST /api/config/dynamic
 * Update configuration dynamically
 */
router.post('/dynamic', requireAuth, requireConfigPermission('configure'), async (req, res) => {
  try {
    initializeManagers();
    
    const { path, value, options = {} } = req.body;
    
    if (!path || value === undefined) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Both path and value are required'
      });
    }

    // Add audit information
    const auditOptions = {
      ...options,
      userId: req.user.id,
      userEmail: req.user.email,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    const result = await dynamicConfigManager.updateConfiguration(path, value, auditOptions);
    
    res.json({
      success: true,
      changeId: result.changeId,
      path,
      value,
      previousValue: result.previousValue,
      appliedAt: result.appliedAt,
      rollbackAvailable: result.rollbackAvailable
    });
  } catch (error) {
    res.status(400).json({
      error: 'Dynamic configuration update failed',
      message: error.message
    });
  }
});

/**
 * POST /api/config/dynamic/rollback
 * Rollback a dynamic configuration change
 */
router.post('/dynamic/rollback', requireAuth, requireConfigPermission('configure'), async (req, res) => {
  try {
    initializeManagers();
    
    const { changeId } = req.body;
    
    if (!changeId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'changeId is required for rollback'
      });
    }

    const result = await dynamicConfigManager.rollbackChange(changeId);
    
    res.json({
      success: true,
      rolledBackChangeId: changeId,
      restoredValue: result.restoredValue,
      rolledBackAt: result.rolledBackAt
    });
  } catch (error) {
    res.status(400).json({
      error: 'Configuration rollback failed',
      message: error.message
    });
  }
});

/**
 * GET /api/config/dynamic/history
 * Get configuration change history
 */
router.get('/dynamic/history', requireAuth, requireConfigPermission('read'), async (req, res) => {
  try {
    initializeManagers();
    
    const { limit = 50, offset = 0, path } = req.query;
    const history = await dynamicConfigManager.getChangeHistory({
      limit: parseInt(limit),
      offset: parseInt(offset),
      path
    });
    
    res.json({
      history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: history.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Configuration history error',
      message: error.message
    });
  }
});

/**
 * POST /api/config/validate
 * Validate configuration without applying changes
 */
router.post('/validate', requireAuth, requireConfigPermission('read'), (req, res) => {
  try {
    const { configuration, service } = req.body;
    
    if (!configuration) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Configuration object is required'
      });
    }

    let validation = null;
    
    if (service) {
      // Validate specific service configuration
      switch (service) {
        case 'security':
          const securityConfig = createSecurityConfig();
          validation = securityConfig.validate();
          break;
        case 'performance':
          const performanceConfig = createPerformanceConfig();
          validation = performanceConfig.validate();
          break;
        default:
          return res.status(400).json({
            error: 'Unknown service',
            message: `Service '${service}' validation is not supported`
          });
      }
    } else {
      // Validate all configurations
      validation = {
        security: createSecurityConfig().validate(),
        performance: createPerformanceConfig().validate(),
        database: createDatabaseConfig().validate(),
        cache: createCacheConfig().validate(),
        api: createAPIConfig().validate(),
        integration: createIntegrationConfig().validate(),
        monitoring: createMonitoringConfig().validate()
      };
    }

    const isValid = service 
      ? validation.valid 
      : Object.values(validation).every(v => v.valid);

    res.json({
      valid: isValid,
      validation,
      service: service || 'all',
      validatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Configuration validation error',
      message: error.message
    });
  }
});

/**
 * POST /api/config/reload
 * Reload configuration from files
 */
router.post('/reload', requireAuth, requireConfigPermission('configure'), async (req, res) => {
  try {
    initializeManagers();
    
    const { environment, force = false } = req.body;
    const targetEnv = environment || process.env.NODE_ENV || 'development';
    
    // Reload environment configuration
    await envConfigFactory.reloadConfiguration(targetEnv, { force });
    
    // Reload dynamic configuration if requested
    if (force) {
      await dynamicConfigManager.reloadConfiguration();
    }

    res.json({
      success: true,
      environment: targetEnv,
      reloadedAt: new Date().toISOString(),
      message: 'Configuration reloaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Configuration reload failed',
      message: error.message
    });
  }
});

/**
 * GET /api/config/schema
 * Get configuration schema for validation
 */
router.get('/schema/:service?', requireAuth, requireConfigPermission('read'), (req, res) => {
  try {
    const { service } = req.params;
    
    // Basic schema structure (extend as needed)
    const schemas = {
      security: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          authRequired: { type: 'boolean' },
          enableMFA: { type: 'boolean' },
          sessionTimeout: { type: 'number', minimum: 300000 },
          passwordMinLength: { type: 'number', minimum: 4 }
        }
      },
      performance: {
        type: 'object',
        properties: {
          maxMemoryUsage: { type: 'string', pattern: '^\\d+[gmk]b$' },
          maxCPUUsage: { type: 'number', minimum: 10, maximum: 100 },
          maxConcurrentRequests: { type: 'number', minimum: 1 },
          requestTimeout: { type: 'number', minimum: 1000 }
        }
      }
    };

    if (service) {
      if (!schemas[service]) {
        return res.status(404).json({
          error: 'Schema not found',
          message: `Schema for service '${service}' is not available`
        });
      }
      res.json({ service, schema: schemas[service] });
    } else {
      res.json({ schemas });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Schema retrieval error',
      message: error.message
    });
  }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  console.error('Configuration API error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred in the configuration API',
    timestamp: new Date().toISOString()
  });
});

export default router;
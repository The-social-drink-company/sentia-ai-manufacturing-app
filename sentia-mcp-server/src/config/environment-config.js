/**
 * Environment-Specific Configuration Factory
 * 
 * Advanced configuration management system that provides environment-aware
 * configuration loading, validation, and dynamic updates for the Sentia MCP Server.
 * 
 * Features:
 * - Multi-environment support (development, staging, testing, production)
 * - Configuration inheritance and overrides
 * - Dynamic configuration loading
 * - Environment detection and validation
 * - Feature flag management
 * - Configuration caching and hot-reloading
 */

import { config } from 'dotenv';
import { readFileSync, existsSync, watchFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Environment Configuration Factory
 * Manages environment-specific configurations with inheritance and hot-reloading
 */
export class EnvironmentConfigFactory extends EventEmitter {
  constructor() {
    super();
    this.configCache = new Map();
    this.watchers = new Map();
    this.environment = this.detectEnvironment();
    this.baseConfigPath = join(__dirname, 'environments');
    this.currentConfig = null;
    this.configHistory = [];
    this.maxHistorySize = 10;
  }

  /**
   * Detect current environment with fallback logic
   */
  detectEnvironment() {
    const env = process.env.NODE_ENV || 'development';
    const supportedEnvironments = ['development', 'staging', 'testing', 'production', 'local'];
    
    if (!supportedEnvironments.includes(env)) {
      console.warn(`Unknown environment "${env}", falling back to development`);
      return 'development';
    }
    
    return env;
  }

  /**
   * Get environment information and capabilities
   */
  getEnvironmentInfo() {
    return {
      current: this.environment,
      isDevelopment: this.environment === 'development',
      isStaging: this.environment === 'staging',
      isTesting: this.environment === 'testing',
      isProduction: this.environment === 'production',
      isLocal: this.environment === 'local',
      supportedEnvironments: ['development', 'staging', 'testing', 'production', 'local'],
      configurationMode: process.env.CONFIG_MODE || 'standard',
      features: {
        hotReload: this.environment !== 'production',
        debugging: ['development', 'local'].includes(this.environment),
        monitoring: ['staging', 'production'].includes(this.environment),
        strictValidation: ['testing', 'production'].includes(this.environment)
      }
    };
  }

  /**
   * Load configuration for specific environment
   */
  async loadEnvironmentConfig(environment = this.environment, options = {}) {
    try {
      const cacheKey = `${environment}-${JSON.stringify(options)}`;
      
      // Check cache first (unless forced reload)
      if (!options.force && this.configCache.has(cacheKey)) {
        return this.configCache.get(cacheKey);
      }

      // Load base configuration
      const baseConfig = await this.loadBaseConfiguration();
      
      // Load environment-specific configuration
      const envConfig = await this.loadEnvironmentSpecificConfig(environment);
      
      // Load local overrides if available
      const localConfig = await this.loadLocalOverrides(environment);
      
      // Merge configurations with precedence: local > environment > base
      const mergedConfig = this.mergeConfigurations([
        baseConfig,
        envConfig,
        localConfig
      ]);

      // Apply feature flags
      const configWithFeatures = this.applyFeatureFlags(mergedConfig, environment);
      
      // Validate final configuration
      if (options.validate !== false) {
        await this.validateConfiguration(configWithFeatures, environment);
      }

      // Cache the configuration
      this.configCache.set(cacheKey, configWithFeatures);
      
      // Set up hot-reload watching if enabled
      if (options.watch && this.getEnvironmentInfo().features.hotReload) {
        this.setupConfigurationWatcher(environment, cacheKey);
      }

      this.currentConfig = configWithFeatures;
      this.addToHistory(configWithFeatures, environment);
      
      this.emit('config:loaded', {
        environment,
        config: configWithFeatures,
        timestamp: new Date().toISOString()
      });

      return configWithFeatures;
      
    } catch (error) {
      this.emit('config:error', {
        environment,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to load configuration for ${environment}: ${error.message}`);
    }
  }

  /**
   * Load base configuration (shared across all environments)
   */
  async loadBaseConfiguration() {
    const baseConfigPath = join(this.baseConfigPath, 'base.js');
    
    if (!existsSync(baseConfigPath)) {
      // Return minimal base configuration if file doesn't exist
      return {
        server: {
          name: 'sentia-manufacturing-mcp',
          version: '3.0.0'
        },
        features: {},
        defaults: {}
      };
    }

    try {
      const { default: baseConfig } = await import(baseConfigPath);
      return baseConfig || {};
    } catch (error) {
      console.warn(`Failed to load base configuration: ${error.message}`);
      return {};
    }
  }

  /**
   * Load environment-specific configuration
   */
  async loadEnvironmentSpecificConfig(environment) {
    const envConfigPath = join(this.baseConfigPath, `${environment}.js`);
    
    if (!existsSync(envConfigPath)) {
      console.warn(`Environment configuration not found: ${envConfigPath}`);
      return {};
    }

    try {
      const { default: envConfig } = await import(`${envConfigPath}?t=${Date.now()}`);
      return envConfig || {};
    } catch (error) {
      console.warn(`Failed to load environment configuration for ${environment}: ${error.message}`);
      return {};
    }
  }

  /**
   * Load local configuration overrides
   */
  async loadLocalOverrides(environment) {
    const localConfigPath = join(this.baseConfigPath, `${environment}.local.js`);
    
    if (!existsSync(localConfigPath)) {
      return {};
    }

    try {
      const { default: localConfig } = await import(`${localConfigPath}?t=${Date.now()}`);
      return localConfig || {};
    } catch (error) {
      console.warn(`Failed to load local overrides for ${environment}: ${error.message}`);
      return {};
    }
  }

  /**
   * Deep merge multiple configuration objects
   */
  mergeConfigurations(configs) {
    const result = {};
    
    for (const config of configs) {
      if (!config) continue;
      this.deepMerge(result, config);
    }
    
    return result;
  }

  /**
   * Deep merge helper function
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Apply feature flags to configuration
   */
  applyFeatureFlags(config, environment) {
    const featureFlags = {
      // Global feature flags
      enableCaching: process.env.ENABLE_CACHING !== 'false',
      enableMonitoring: process.env.ENABLE_MONITORING !== 'false',
      enableSecurity: process.env.ENABLE_SECURITY !== 'false',
      
      // Environment-specific flags
      development: {
        enableDebugLogging: true,
        enableHotReload: true,
        enableAuth: false,
        enableRateLimiting: false
      },
      staging: {
        enableDebugLogging: true,
        enableHotReload: true,
        enableAuth: true,
        enableRateLimiting: true
      },
      testing: {
        enableDebugLogging: false,
        enableHotReload: false,
        enableAuth: true,
        enableRateLimiting: true
      },
      production: {
        enableDebugLogging: false,
        enableHotReload: false,
        enableAuth: true,
        enableRateLimiting: true
      }
    };

    const envFlags = featureFlags[environment] || {};
    const mergedFlags = { ...featureFlags, ...envFlags };
    
    // Apply flags to configuration
    return {
      ...config,
      features: {
        ...config.features,
        ...mergedFlags
      }
    };
  }

  /**
   * Validate configuration for environment
   */
  async validateConfiguration(config, environment) {
    const errors = [];
    const warnings = [];

    // Basic validation
    if (!config.server || !config.server.name) {
      errors.push('Server name is required');
    }

    if (!config.server || !config.server.version) {
      warnings.push('Server version is not specified');
    }

    // Environment-specific validation
    if (environment === 'production') {
      if (!config.security || config.security.authRequired !== true) {
        errors.push('Authentication must be enabled in production');
      }

      if (!config.security || !config.security.jwtSecret || 
          config.security.jwtSecret.includes('dev') || 
          config.security.jwtSecret.includes('test')) {
        errors.push('Production JWT secret must be properly configured');
      }

      if (!config.logging || config.logging.level === 'debug') {
        warnings.push('Debug logging should be disabled in production');
      }
    }

    // Database validation
    if (!config.database || !config.database.url) {
      errors.push('Database URL is required');
    }

    // Integration validation
    if (config.integrations) {
      for (const [service, serviceConfig] of Object.entries(config.integrations)) {
        if (!serviceConfig.apiKey && !serviceConfig.clientId && !serviceConfig.accessToken) {
          warnings.push(`${service} integration may not be properly configured`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed for ${environment}:\n${errors.join('\n')}`);
    }

    if (warnings.length > 0) {
      console.warn(`Configuration warnings for ${environment}:\n${warnings.join('\n')}`);
    }

    return true;
  }

  /**
   * Setup configuration file watcher for hot-reload
   */
  setupConfigurationWatcher(environment, cacheKey) {
    const configFiles = [
      join(this.baseConfigPath, 'base.js'),
      join(this.baseConfigPath, `${environment}.js`),
      join(this.baseConfigPath, `${environment}.local.js`)
    ];

    configFiles.forEach(filePath => {
      if (existsSync(filePath) && !this.watchers.has(filePath)) {
        const watcher = watchFile(filePath, { interval: 1000 }, async () => {
          try {
            console.log(`Configuration file changed: ${filePath}`);
            
            // Clear cache
            this.configCache.delete(cacheKey);
            
            // Reload configuration
            const newConfig = await this.loadEnvironmentConfig(environment, { 
              force: true, 
              validate: true 
            });
            
            this.emit('config:reloaded', {
              environment,
              filePath,
              config: newConfig,
              timestamp: new Date().toISOString()
            });
            
          } catch (error) {
            this.emit('config:reload-error', {
              environment,
              filePath,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        this.watchers.set(filePath, watcher);
      }
    });
  }

  /**
   * Add configuration to history
   */
  addToHistory(config, environment) {
    this.configHistory.unshift({
      environment,
      config: JSON.parse(JSON.stringify(config)), // Deep clone
      timestamp: new Date().toISOString()
    });

    // Limit history size
    if (this.configHistory.length > this.maxHistorySize) {
      this.configHistory = this.configHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get configuration history
   */
  getConfigurationHistory() {
    return this.configHistory;
  }

  /**
   * Switch to different environment
   */
  async switchEnvironment(newEnvironment, options = {}) {
    if (!['development', 'staging', 'testing', 'production', 'local'].includes(newEnvironment)) {
      throw new Error(`Unsupported environment: ${newEnvironment}`);
    }

    const oldEnvironment = this.environment;
    this.environment = newEnvironment;

    try {
      const newConfig = await this.loadEnvironmentConfig(newEnvironment, options);
      
      this.emit('environment:switched', {
        from: oldEnvironment,
        to: newEnvironment,
        config: newConfig,
        timestamp: new Date().toISOString()
      });

      return newConfig;
    } catch (error) {
      // Rollback on failure
      this.environment = oldEnvironment;
      throw error;
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache() {
    this.configCache.clear();
    this.emit('cache:cleared', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Stop all file watchers
   */
  stopWatchers() {
    for (const [filePath, watcher] of this.watchers) {
      watcher.unref();
    }
    this.watchers.clear();
  }

  /**
   * Get current configuration
   */
  getCurrentConfig() {
    return this.currentConfig;
  }

  /**
   * Get configuration statistics
   */
  getConfigurationStats() {
    return {
      environment: this.environment,
      cacheSize: this.configCache.size,
      watchersCount: this.watchers.size,
      historySize: this.configHistory.length,
      lastLoaded: this.configHistory[0]?.timestamp || null,
      environmentInfo: this.getEnvironmentInfo()
    };
  }
}

/**
 * Create and export singleton instance
 */
export const environmentConfig = new EnvironmentConfigFactory();

/**
 * Convenience functions for common operations
 */
export const loadConfig = (environment, options) => 
  environmentConfig.loadEnvironmentConfig(environment, options);

export const getCurrentEnvironment = () => 
  environmentConfig.getEnvironmentInfo();

export const switchEnvironment = (environment, options) => 
  environmentConfig.switchEnvironment(environment, options);

export const getConfigHistory = () => 
  environmentConfig.getConfigurationHistory();

export const clearConfigCache = () => 
  environmentConfig.clearCache();

/**
 * Initialize and load configuration for current environment
 */
export async function initializeEnvironmentConfig(options = {}) {
  try {
    const config = await environmentConfig.loadEnvironmentConfig(
      environmentConfig.environment,
      { watch: true, validate: true, ...options }
    );
    
    console.log(`Environment configuration loaded successfully for: ${environmentConfig.environment}`);
    return config;
  } catch (error) {
    console.error(`Failed to initialize environment configuration: ${error.message}`);
    throw error;
  }
}

export default environmentConfig;
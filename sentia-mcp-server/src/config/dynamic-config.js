/**
 * Dynamic Configuration Management System
 * 
 * Advanced configuration system that supports runtime updates, feature flags,
 * A/B testing, gradual rollouts, and emergency configuration changes without
 * requiring server restarts for the Sentia MCP Server.
 * 
 * Features:
 * - Hot configuration reloading without restart
 * - Feature flag management with gradual rollouts
 * - A/B testing configuration support
 * - Configuration validation and rollback
 * - Change tracking and audit logging
 * - Emergency configuration override
 * - Configuration drift detection
 * - Real-time configuration broadcasting
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync, watchFile, unwatchFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes, createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dynamic Configuration Manager
 * Handles runtime configuration updates and feature flag management
 */
export class DynamicConfigManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      configStorePath: options.configStorePath || join(__dirname, '../../../config/dynamic'),
      auditLogPath: options.auditLogPath || join(__dirname, '../../../logs/config-audit.log'),
      featureFlagPath: options.featureFlagPath || join(__dirname, '../../../config/feature-flags.json'),
      configHistoryPath: options.configHistoryPath || join(__dirname, '../../../config/history'),
      maxHistoryEntries: options.maxHistoryEntries || 100,
      validationTimeout: options.validationTimeout || 30000, // 30 seconds
      rollbackTimeout: options.rollbackTimeout || 300000, // 5 minutes
      broadcastInterval: options.broadcastInterval || 5000, // 5 seconds
      enableHotReload: options.enableHotReload !== false,
      ...options
    };

    this.currentConfig = new Map();
    this.featureFlags = new Map();
    this.configHistory = [];
    this.watchers = new Map();
    this.validationRules = new Map();
    this.rollbackTimers = new Map();
    this.subscribers = new Set();
    this.pendingChanges = new Map();
    this.abTestGroups = new Map();
    this.configChecksum = null;
    this.isInitialized = false;
    this.isEmergencyMode = false;
    
    // Initialize storage
    this.initializeStorage();
    
    // Setup periodic config broadcasting
    this.startConfigBroadcasting();
  }

  /**
   * Initialize the dynamic configuration manager
   */
  async initialize(initialConfig = {}) {
    try {
      // Load existing configuration
      await this.loadConfiguration();
      
      // Load feature flags
      await this.loadFeatureFlags();
      
      // Load configuration history
      await this.loadConfigHistory();
      
      // Apply initial configuration if provided
      if (Object.keys(initialConfig).length > 0) {
        await this.updateConfiguration('', initialConfig, {
          source: 'initialization',
          validateOnly: false
        });
      }
      
      // Setup file watching if enabled
      if (this.config.enableHotReload) {
        this.setupFileWatching();
      }
      
      // Calculate initial checksum
      this.updateConfigChecksum();
      
      this.isInitialized = true;
      
      this.emit('initialized', {
        timestamp: new Date().toISOString(),
        configSize: this.currentConfig.size,
        featureFlagsCount: this.featureFlags.size
      });
      
      console.log('Dynamic Configuration Manager initialized successfully');
      return true;
      
    } catch (error) {
      this.emit('initialization-error', { error: error.message });
      throw new Error(`Failed to initialize Dynamic Configuration Manager: ${error.message}`);
    }
  }

  /**
   * Update configuration at a specific path
   */
  async updateConfiguration(path, value, options = {}) {
    this.ensureInitialized();
    
    try {
      const changeId = this.generateChangeId();
      const timestamp = new Date().toISOString();
      
      // Get current value for rollback
      const oldValue = this.getConfigValue(path);
      
      // Validate the change
      if (options.validateOnly !== false) {
        await this.validateConfigurationChange(path, value, oldValue);
      }
      
      // Create change record
      const change = {
        id: changeId,
        path,
        oldValue: JSON.parse(JSON.stringify(oldValue)),
        newValue: JSON.parse(JSON.stringify(value)),
        timestamp,
        source: options.source || 'api',
        requester: options.requester || 'system',
        reason: options.reason || 'Configuration update',
        validated: true,
        applied: false,
        rollbackScheduled: false
      };
      
      // Add to pending changes
      this.pendingChanges.set(changeId, change);
      
      // Apply the change
      await this.applyConfigurationChange(change);
      
      // Schedule health check and potential rollback
      if (options.enableRollback !== false) {
        this.scheduleHealthCheckAndRollback(changeId, options.rollbackTimeout);
      }
      
      // Log the change
      await this.auditLog('configuration_updated', {
        changeId,
        path,
        hasOldValue: oldValue !== undefined,
        source: change.source,
        requester: change.requester
      });
      
      this.emit('config:updated', {
        changeId,
        path,
        oldValue,
        newValue: value,
        timestamp
      });
      
      return {
        success: true,
        changeId,
        path,
        timestamp,
        rollbackScheduled: options.enableRollback !== false
      };
      
    } catch (error) {
      await this.auditLog('configuration_update_failed', {
        path,
        error: error.message,
        source: options.source || 'api',
        requester: options.requester || 'system'
      });
      
      throw new Error(`Failed to update configuration at '${path}': ${error.message}`);
    }
  }

  /**
   * Get configuration value at path
   */
  getConfigValue(path) {
    if (!path) {
      // Return entire configuration
      return this.mapToObject(this.currentConfig);
    }
    
    const keys = path.split('.');
    let current = this.mapToObject(this.currentConfig);
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Set configuration value at path
   */
  setConfigValue(path, value) {
    if (!path) {
      // Replace entire configuration
      this.currentConfig.clear();
      if (value && typeof value === 'object') {
        this.objectToMap(value, this.currentConfig);
      }
      return;
    }
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let current = this.currentConfig;
    
    // Navigate to parent
    for (const key of keys) {
      if (!current.has(key)) {
        current.set(key, new Map());
      }
      current = current.get(key);
    }
    
    // Set value
    current.set(lastKey, value);
  }

  /**
   * Enable or update a feature flag
   */
  async updateFeatureFlag(flagName, config) {
    this.ensureInitialized();
    
    try {
      const timestamp = new Date().toISOString();
      const oldConfig = this.featureFlags.get(flagName);
      
      // Validate feature flag configuration
      this.validateFeatureFlagConfig(flagName, config);
      
      // Create feature flag configuration
      const flagConfig = {
        name: flagName,
        enabled: config.enabled !== false,
        rolloutPercentage: config.rolloutPercentage || 0,
        targetGroups: config.targetGroups || [],
        startDate: config.startDate || timestamp,
        endDate: config.endDate || null,
        conditions: config.conditions || {},
        abTestConfig: config.abTestConfig || null,
        createdAt: oldConfig?.createdAt || timestamp,
        updatedAt: timestamp,
        version: (oldConfig?.version || 0) + 1
      };
      
      // Store feature flag
      this.featureFlags.set(flagName, flagConfig);
      
      // Persist feature flags
      await this.persistFeatureFlags();
      
      // Log the change
      await this.auditLog('feature_flag_updated', {
        flagName,
        oldEnabled: oldConfig?.enabled || false,
        newEnabled: flagConfig.enabled,
        rolloutPercentage: flagConfig.rolloutPercentage
      });
      
      this.emit('feature-flag:updated', {
        flagName,
        config: flagConfig,
        timestamp
      });
      
      return {
        success: true,
        flagName,
        config: flagConfig
      };
      
    } catch (error) {
      await this.auditLog('feature_flag_update_failed', {
        flagName,
        error: error.message
      });
      
      throw new Error(`Failed to update feature flag '${flagName}': ${error.message}`);
    }
  }

  /**
   * Check if a feature flag is enabled for a specific context
   */
  isFeatureEnabled(flagName, context = {}) {
    const flag = this.featureFlags.get(flagName);
    
    if (!flag || !flag.enabled) {
      return false;
    }
    
    // Check date range
    const now = new Date();
    if (flag.startDate && now < new Date(flag.startDate)) {
      return false;
    }
    if (flag.endDate && now > new Date(flag.endDate)) {
      return false;
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashContext(flagName, context);
      const bucket = hash % 100;
      if (bucket >= flag.rolloutPercentage) {
        return false;
      }
    }
    
    // Check target groups
    if (flag.targetGroups.length > 0) {
      const userGroup = context.group || context.role || 'default';
      if (!flag.targetGroups.includes(userGroup)) {
        return false;
      }
    }
    
    // Check conditions
    if (flag.conditions && Object.keys(flag.conditions).length > 0) {
      if (!this.evaluateConditions(flag.conditions, context)) {
        return false;
      }
    }
    
    // A/B testing
    if (flag.abTestConfig) {
      return this.isInABTestGroup(flagName, flag.abTestConfig, context);
    }
    
    return true;
  }

  /**
   * Get all feature flags with their status for a context
   */
  getFeatureFlags(context = {}) {
    const flags = {};
    
    for (const [flagName, config] of this.featureFlags) {
      flags[flagName] = {
        enabled: this.isFeatureEnabled(flagName, context),
        config: {
          rolloutPercentage: config.rolloutPercentage,
          targetGroups: config.targetGroups,
          version: config.version
        }
      };
    }
    
    return flags;
  }

  /**
   * Rollback a configuration change
   */
  async rollbackChange(changeId, options = {}) {
    this.ensureInitialized();
    
    try {
      const change = this.pendingChanges.get(changeId) || 
                    this.findChangeInHistory(changeId);
      
      if (!change) {
        throw new Error(`Change ${changeId} not found`);
      }
      
      if (!change.applied) {
        throw new Error(`Change ${changeId} was not applied`);
      }
      
      // Apply rollback
      const rollbackChange = {
        id: this.generateChangeId(),
        path: change.path,
        oldValue: change.newValue,
        newValue: change.oldValue,
        timestamp: new Date().toISOString(),
        source: 'rollback',
        requester: options.requester || 'system',
        reason: `Rollback of change ${changeId}`,
        originalChangeId: changeId,
        validated: true,
        applied: false
      };
      
      await this.applyConfigurationChange(rollbackChange);
      
      // Cancel any pending rollback timer
      if (this.rollbackTimers.has(changeId)) {
        clearTimeout(this.rollbackTimers.get(changeId));
        this.rollbackTimers.delete(changeId);
      }
      
      // Log the rollback
      await this.auditLog('configuration_rolled_back', {
        originalChangeId: changeId,
        rollbackChangeId: rollbackChange.id,
        path: change.path,
        requester: options.requester || 'system'
      });
      
      this.emit('config:rolled-back', {
        originalChangeId: changeId,
        rollbackChangeId: rollbackChange.id,
        path: change.path
      });
      
      return {
        success: true,
        originalChangeId: changeId,
        rollbackChangeId: rollbackChange.id
      };
      
    } catch (error) {
      await this.auditLog('configuration_rollback_failed', {
        changeId,
        error: error.message,
        requester: options.requester || 'system'
      });
      
      throw new Error(`Failed to rollback change ${changeId}: ${error.message}`);
    }
  }

  /**
   * Enter emergency configuration mode
   */
  async enterEmergencyMode(config, options = {}) {
    this.ensureInitialized();
    
    try {
      // Backup current configuration
      const backupConfig = this.mapToObject(this.currentConfig);
      
      // Apply emergency configuration
      this.currentConfig.clear();
      this.objectToMap(config, this.currentConfig);
      
      // Set emergency mode flag
      this.isEmergencyMode = true;
      
      // Cancel all pending changes and rollbacks
      this.pendingChanges.clear();
      this.rollbackTimers.forEach(timer => clearTimeout(timer));
      this.rollbackTimers.clear();
      
      // Log emergency mode activation
      await this.auditLog('emergency_mode_activated', {
        reason: options.reason || 'Emergency configuration override',
        requester: options.requester || 'system',
        backupConfigSize: Object.keys(backupConfig).length
      });
      
      this.emit('emergency:activated', {
        reason: options.reason,
        config,
        backup: backupConfig
      });
      
      return {
        success: true,
        backup: backupConfig,
        emergencyConfig: config
      };
      
    } catch (error) {
      await this.auditLog('emergency_mode_failed', {
        error: error.message,
        requester: options.requester || 'system'
      });
      
      throw new Error(`Failed to enter emergency mode: ${error.message}`);
    }
  }

  /**
   * Exit emergency configuration mode
   */
  async exitEmergencyMode(restoreConfig = null, options = {}) {
    this.ensureInitialized();
    
    if (!this.isEmergencyMode) {
      throw new Error('Not in emergency mode');
    }
    
    try {
      // Restore configuration
      if (restoreConfig) {
        this.currentConfig.clear();
        this.objectToMap(restoreConfig, this.currentConfig);
      }
      
      // Clear emergency mode flag
      this.isEmergencyMode = false;
      
      // Update checksum
      this.updateConfigChecksum();
      
      // Log emergency mode exit
      await this.auditLog('emergency_mode_deactivated', {
        requester: options.requester || 'system',
        configRestored: !!restoreConfig
      });
      
      this.emit('emergency:deactivated', {
        configRestored: !!restoreConfig,
        requester: options.requester
      });
      
      return { success: true };
      
    } catch (error) {
      await this.auditLog('emergency_mode_exit_failed', {
        error: error.message,
        requester: options.requester || 'system'
      });
      
      throw new Error(`Failed to exit emergency mode: ${error.message}`);
    }
  }

  /**
   * Get configuration statistics and health status
   */
  getConfigurationStatus() {
    return {
      isInitialized: this.isInitialized,
      isEmergencyMode: this.isEmergencyMode,
      configSize: this.currentConfig.size,
      featureFlagsCount: this.featureFlags.size,
      pendingChanges: this.pendingChanges.size,
      activeRollbackTimers: this.rollbackTimers.size,
      subscribersCount: this.subscribers.size,
      historySize: this.configHistory.length,
      checksum: this.configChecksum,
      lastUpdated: this.getLastUpdateTimestamp(),
      hotReloadEnabled: this.config.enableHotReload,
      watchersActive: this.watchers.size
    };
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this.subscribers.add(callback);
    
    // Send current configuration to new subscriber
    callback({
      type: 'initial',
      config: this.mapToObject(this.currentConfig),
      featureFlags: this.mapToObject(this.featureFlags),
      timestamp: new Date().toISOString()
    });
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Add validation rule for configuration path
   */
  addValidationRule(path, validator) {
    if (typeof validator !== 'function') {
      throw new Error('Validator must be a function');
    }
    
    if (!this.validationRules.has(path)) {
      this.validationRules.set(path, []);
    }
    
    this.validationRules.get(path).push(validator);
  }

  /**
   * Remove validation rule
   */
  removeValidationRule(path, validator) {
    const rules = this.validationRules.get(path);
    if (rules) {
      const index = rules.indexOf(validator);
      if (index > -1) {
        rules.splice(index, 1);
        if (rules.length === 0) {
          this.validationRules.delete(path);
        }
      }
    }
  }

  // Private helper methods

  /**
   * Apply configuration change
   */
  async applyConfigurationChange(change) {
    try {
      // Set the new value
      this.setConfigValue(change.path, change.newValue);
      
      // Update change status
      change.applied = true;
      change.appliedAt = new Date().toISOString();
      
      // Add to history
      this.addToHistory(change);
      
      // Update checksum
      this.updateConfigChecksum();
      
      // Notify subscribers
      this.notifySubscribers({
        type: 'update',
        change,
        config: this.mapToObject(this.currentConfig),
        checksum: this.configChecksum
      });
      
      // Persist configuration
      await this.persistConfiguration();
      
    } catch (error) {
      change.applied = false;
      change.error = error.message;
      throw error;
    }
  }

  /**
   * Validate configuration change
   */
  async validateConfigurationChange(path, newValue, oldValue) {
    // Check validation rules
    const rules = this.validationRules.get(path) || [];
    const globalRules = this.validationRules.get('*') || [];
    
    const allRules = [...rules, ...globalRules];
    
    for (const validator of allRules) {
      try {
        const result = await validator(newValue, oldValue, path);
        if (result !== true) {
          throw new Error(result || 'Validation failed');
        }
      } catch (error) {
        throw new Error(`Validation failed for '${path}': ${error.message}`);
      }
    }
    
    // Type consistency check
    if (oldValue !== undefined && newValue !== undefined) {
      const oldType = Array.isArray(oldValue) ? 'array' : typeof oldValue;
      const newType = Array.isArray(newValue) ? 'array' : typeof newValue;
      
      if (oldType !== newType) {
        console.warn(`Type change detected for '${path}': ${oldType} -> ${newType}`);
      }
    }
    
    return true;
  }

  /**
   * Schedule health check and rollback
   */
  scheduleHealthCheckAndRollback(changeId, timeout = this.config.rollbackTimeout) {
    const timer = setTimeout(async () => {
      try {
        // Perform health check
        const healthCheck = await this.performHealthCheck(changeId);
        
        if (!healthCheck.healthy) {
          console.warn(`Health check failed for change ${changeId}, initiating rollback`);
          await this.rollbackChange(changeId, { 
            requester: 'auto-rollback',
            reason: 'Health check failed'
          });
        } else {
          // Health check passed, confirm the change
          this.pendingChanges.delete(changeId);
        }
      } catch (error) {
        console.error(`Health check failed for change ${changeId}:`, error.message);
        // Attempt rollback on health check failure
        try {
          await this.rollbackChange(changeId, { 
            requester: 'auto-rollback',
            reason: 'Health check error'
          });
        } catch (rollbackError) {
          console.error(`Failed to rollback change ${changeId}:`, rollbackError.message);
        }
      } finally {
        this.rollbackTimers.delete(changeId);
      }
    }, timeout);
    
    this.rollbackTimers.set(changeId, timer);
  }

  /**
   * Perform health check for a change
   */
  async performHealthCheck(changeId) {
    // Basic health check - can be extended
    return {
      healthy: true,
      changeId,
      timestamp: new Date().toISOString(),
      checks: {
        configIntegrity: this.verifyConfigIntegrity(),
        systemResponsive: true // Would check system responsiveness
      }
    };
  }

  /**
   * Verify configuration integrity
   */
  verifyConfigIntegrity() {
    try {
      // Check if configuration can be serialized
      JSON.stringify(this.mapToObject(this.currentConfig));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Hash context for consistent bucketing
   */
  hashContext(flagName, context) {
    const identifier = context.userId || context.sessionId || context.ip || 'anonymous';
    const input = `${flagName}:${identifier}`;
    return parseInt(createHash('md5').update(input).digest('hex').substring(0, 8), 16);
  }

  /**
   * Evaluate feature flag conditions
   */
  evaluateConditions(conditions, context) {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = context[key];
      
      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(actualValue)) {
          return false;
        }
      } else if (actualValue !== expectedValue) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check A/B test group membership
   */
  isInABTestGroup(flagName, abTestConfig, context) {
    const hash = this.hashContext(flagName, context);
    const bucket = hash % 100;
    
    let currentPercentage = 0;
    for (const variant of abTestConfig.variants) {
      currentPercentage += variant.percentage;
      if (bucket < currentPercentage) {
        return variant.enabled;
      }
    }
    
    return false;
  }

  /**
   * Validate feature flag configuration
   */
  validateFeatureFlagConfig(flagName, config) {
    if (!flagName || typeof flagName !== 'string') {
      throw new Error('Flag name must be a non-empty string');
    }
    
    if (config.rolloutPercentage !== undefined) {
      const percentage = Number(config.rolloutPercentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        throw new Error('Rollout percentage must be between 0 and 100');
      }
    }
    
    if (config.targetGroups && !Array.isArray(config.targetGroups)) {
      throw new Error('Target groups must be an array');
    }
    
    if (config.abTestConfig) {
      if (!Array.isArray(config.abTestConfig.variants)) {
        throw new Error('A/B test variants must be an array');
      }
      
      const totalPercentage = config.abTestConfig.variants.reduce(
        (sum, variant) => sum + (variant.percentage || 0), 0
      );
      
      if (totalPercentage !== 100) {
        throw new Error('A/B test variant percentages must sum to 100');
      }
    }
  }

  /**
   * Convert Map to Object recursively
   */
  mapToObject(map) {
    const obj = {};
    for (const [key, value] of map) {
      if (value instanceof Map) {
        obj[key] = this.mapToObject(value);
      } else {
        obj[key] = value;
      }
    }
    return obj;
  }

  /**
   * Convert Object to Map recursively
   */
  objectToMap(obj, map = new Map()) {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nestedMap = new Map();
        this.objectToMap(value, nestedMap);
        map.set(key, nestedMap);
      } else {
        map.set(key, value);
      }
    }
    return map;
  }

  /**
   * Initialize storage directories
   */
  initializeStorage() {
    const dirs = [
      dirname(this.config.configStorePath),
      dirname(this.config.auditLogPath),
      dirname(this.config.featureFlagPath),
      this.config.configHistoryPath
    ];
    
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Setup file watching for hot reload
   */
  setupFileWatching() {
    const filesToWatch = [
      this.config.featureFlagPath
    ];
    
    filesToWatch.forEach(filePath => {
      if (existsSync(filePath)) {
        watchFile(filePath, { interval: 1000 }, () => {
          this.loadFeatureFlags();
        });
        this.watchers.set(filePath, true);
      }
    });
  }

  /**
   * Load configuration from storage
   */
  async loadConfiguration() {
    const configPath = join(this.config.configStorePath, 'current.json');
    
    if (!existsSync(configPath)) {
      return;
    }
    
    try {
      const data = readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      this.objectToMap(config, this.currentConfig);
    } catch (error) {
      console.warn(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Persist configuration to storage
   */
  async persistConfiguration() {
    const configPath = join(this.config.configStorePath, 'current.json');
    const config = this.mapToObject(this.currentConfig);
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Load feature flags
   */
  async loadFeatureFlags() {
    if (!existsSync(this.config.featureFlagPath)) {
      return;
    }
    
    try {
      const data = readFileSync(this.config.featureFlagPath, 'utf8');
      const flags = JSON.parse(data);
      
      this.featureFlags.clear();
      for (const [name, config] of Object.entries(flags)) {
        this.featureFlags.set(name, config);
      }
    } catch (error) {
      console.warn(`Failed to load feature flags: ${error.message}`);
    }
  }

  /**
   * Persist feature flags
   */
  async persistFeatureFlags() {
    const flags = this.mapToObject(this.featureFlags);
    writeFileSync(this.config.featureFlagPath, JSON.stringify(flags, null, 2));
  }

  /**
   * Load configuration history
   */
  async loadConfigHistory() {
    const historyPath = join(this.config.configHistoryPath, 'history.json');
    
    if (!existsSync(historyPath)) {
      return;
    }
    
    try {
      const data = readFileSync(historyPath, 'utf8');
      this.configHistory = JSON.parse(data);
    } catch (error) {
      console.warn(`Failed to load configuration history: ${error.message}`);
    }
  }

  /**
   * Add change to history
   */
  addToHistory(change) {
    this.configHistory.unshift(change);
    
    // Limit history size
    if (this.configHistory.length > this.config.maxHistoryEntries) {
      this.configHistory = this.configHistory.slice(0, this.config.maxHistoryEntries);
    }
    
    // Persist history
    const historyPath = join(this.config.configHistoryPath, 'history.json');
    writeFileSync(historyPath, JSON.stringify(this.configHistory, null, 2));
  }

  /**
   * Find change in history
   */
  findChangeInHistory(changeId) {
    return this.configHistory.find(change => change.id === changeId);
  }

  /**
   * Update configuration checksum
   */
  updateConfigChecksum() {
    const configString = JSON.stringify(this.mapToObject(this.currentConfig));
    this.configChecksum = createHash('sha256').update(configString).digest('hex');
  }

  /**
   * Get last update timestamp
   */
  getLastUpdateTimestamp() {
    if (this.configHistory.length > 0) {
      return this.configHistory[0].timestamp;
    }
    return null;
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(data) {
    for (const callback of this.subscribers) {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error.message);
      }
    }
  }

  /**
   * Start configuration broadcasting
   */
  startConfigBroadcasting() {
    setInterval(() => {
      this.emit('config:broadcast', {
        checksum: this.configChecksum,
        timestamp: new Date().toISOString(),
        configSize: this.currentConfig.size,
        featureFlagsCount: this.featureFlags.size
      });
    }, this.config.broadcastInterval);
  }

  /**
   * Generate unique change ID
   */
  generateChangeId() {
    return `change-${Date.now()}-${randomBytes(4).toString('hex')}`;
  }

  /**
   * Write to audit log
   */
  async auditLog(action, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      writeFileSync(this.config.auditLogPath, logLine, { flag: 'a' });
    } catch (error) {
      console.error('Failed to write audit log:', error.message);
    }
  }

  /**
   * Ensure manager is initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Dynamic Configuration Manager not initialized. Call initialize() first.');
    }
  }
}

/**
 * Create and export singleton instance
 */
export const dynamicConfig = new DynamicConfigManager();

/**
 * Convenience functions
 */
export const initializeDynamicConfig = (config) => dynamicConfig.initialize(config);
export const updateConfig = (path, value, options) => dynamicConfig.updateConfiguration(path, value, options);
export const getConfig = (path) => dynamicConfig.getConfigValue(path);
export const updateFeatureFlag = (name, config) => dynamicConfig.updateFeatureFlag(name, config);
export const isFeatureEnabled = (name, context) => dynamicConfig.isFeatureEnabled(name, context);
export const rollbackConfig = (changeId, options) => dynamicConfig.rollbackChange(changeId, options);
export const subscribeToConfig = (callback) => dynamicConfig.subscribe(callback);

export default dynamicConfig;
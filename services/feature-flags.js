/**
 * Enterprise Feature Flags System
 * Dynamic feature toggling with A/B testing support
 */

import { EventEmitter } from 'events';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class FeatureFlagsService extends EventEmitter {
  constructor() {
    super();
    this.flags = new Map();
    this.userOverrides = new Map();
    this.experiments = new Map();
    this.evaluationCache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
    this.refreshInterval = 300000; // 5 minutes
    this.initialized = false;
  }

  /**
   * Initialize feature flags service
   */
  async initialize() {
    try {
      // Load flags from configuration
      await this.loadFlags();

      // Start periodic refresh
      this.startRefresh();

      // Subscribe to real-time updates
      this.subscribeToUpdates();

      this.initialized = true;
      this.emit('initialized');

      logDebug('Feature flags service initialized');
    } catch (error) {
      logError('Failed to initialize feature flags:', error);
      throw error;
    }
  }

  /**
   * Load flags from configuration source
   */
  async loadFlags() {
    try {
      // In server environment, directly load defaults instead of fetching
      if (typeof window === 'undefined') {
        this.loadDefaultFlags();
        return;
      }

      // Load from API only in browser environment
      const response = await fetch('/api/feature-flags');
      const data = await response.json();

      // Update flags
      for (const flag of data.flags) {
        this.flags.set(flag.key, {
          ...flag,
          lastUpdated: Date.now()
        });
      }

      // Load experiments
      for (const experiment of data.experiments || []) {
        this.experiments.set(experiment.key, experiment);
      }

      // Clear evaluation cache when flags update
      this.evaluationCache.clear();

      this.emit('flags-updated', Array.from(this.flags.keys()));
    } catch (error) {
      logError('Failed to load feature flags:', error);

      // Fall back to default flags
      this.loadDefaultFlags();
    }
  }

  /**
   * Load default flags for offline/error scenarios
   */
  loadDefaultFlags() {
    const defaults = {
      // Core Features
      'dashboard.enhanced': {
        key: 'dashboard.enhanced',
        enabled: true,
        description: 'Enhanced dashboard with drag-and-drop',
        rollout: 100
      },
      'dashboard.realtime': {
        key: 'dashboard.realtime',
        enabled: true,
        description: 'Real-time dashboard updates',
        rollout: 100
      },

      // AI Features
      'ai.chat': {
        key: 'ai.chat',
        enabled: true,
        description: 'AI chat assistant',
        rollout: 100
      },
      'ai.predictions': {
        key: 'ai.predictions',
        enabled: true,
        description: 'AI-powered predictions',
        rollout: 100
      },
      'ai.optimization': {
        key: 'ai.optimization',
        enabled: false,
        description: 'AI optimization recommendations',
        rollout: 0
      },

      // Analytics Features
      'analytics.advanced': {
        key: 'analytics.advanced',
        enabled: true,
        description: 'Advanced analytics features',
        rollout: 100
      },
      'analytics.export': {
        key: 'analytics.export',
        enabled: true,
        description: 'Export analytics data',
        rollout: 100
      },

      // Integration Features
      'integration.shopify': {
        key: 'integration.shopify',
        enabled: true,
        description: 'Shopify integration',
        rollout: 100
      },
      'integration.xero': {
        key: 'integration.xero',
        enabled: true,
        description: 'Xero integration',
        rollout: 100
      },
      'integration.amazon': {
        key: 'integration.amazon',
        enabled: false,
        description: 'Amazon SP-API integration',
        rollout: 0
      },

      // Experimental Features
      'experiment.newui': {
        key: 'experiment.newui',
        enabled: false,
        description: 'New UI design',
        rollout: 0,
        experiment: true
      },
      'experiment.darkmode': {
        key: 'experiment.darkmode',
        enabled: true,
        description: 'Dark mode support',
        rollout: 50,
        experiment: true
      },

      // Performance Features
      'performance.caching': {
        key: 'performance.caching',
        enabled: true,
        description: 'Aggressive caching',
        rollout: 100
      },
      'performance.compression': {
        key: 'performance.compression',
        enabled: true,
        description: 'Response compression',
        rollout: 100
      },

      // Security Features
      'security.mfa': {
        key: 'security.mfa',
        enabled: false,
        description: 'Multi-factor authentication',
        rollout: 0
      },
      'security.encryption': {
        key: 'security.encryption',
        enabled: true,
        description: 'End-to-end encryption',
        rollout: 100
      }
    };

    for (const [key, flag] of Object.entries(defaults)) {
      this.flags.set(key, {
        ...flag,
        lastUpdated: Date.now()
      });
    }
  }

  /**
   * Check if a feature is enabled for a user
   */
  isEnabled(flagKey, context = {}) {
    // Check cache first
    const cacheKey = this.getCacheKey(flagKey, context);
    const cached = this.evaluationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    // Evaluate flag
    const result = this.evaluateFlag(flagKey, context);

    // Cache result
    this.evaluationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Track evaluation
    this.trackEvaluation(flagKey, result, context);

    return result;
  }

  /**
   * Evaluate a feature flag
   */
  evaluateFlag(flagKey, context) {
    // Check user overrides first
    const userOverride = this.getUserOverride(flagKey, context.userId);
    if (userOverride !== undefined) {
      return userOverride;
    }

    // Get flag configuration
    const flag = this.flags.get(flagKey);
    if (!flag) {
      logWarn(`Feature flag not found: ${flagKey}`);
      return false;
    }

    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check prerequisites
    if (flag.prerequisites) {
      for (const prereq of flag.prerequisites) {
        if (!this.isEnabled(prereq, context)) {
          return false;
        }
      }
    }

    // Check targeting rules
    if (flag.rules) {
      for (const rule of flag.rules) {
        if (this.matchesRule(rule, context)) {
          return rule.enabled;
        }
      }
    }

    // Check percentage rollout
    if (flag.rollout !== undefined && flag.rollout < 100) {
      return this.isInRollout(flagKey, flag.rollout, context);
    }

    // Check experiment allocation
    if (flag.experiment) {
      return this.isInExperiment(flagKey, context);
    }

    return flag.enabled;
  }

  /**
   * Check if user matches targeting rule
   */
  matchesRule(rule, context) {
    for (const condition of rule.conditions) {
      if (!this.matchesCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if context matches condition
   */
  matchesCondition(condition, context) {
    const value = this.getValueFromContext(condition.attribute, context);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return value && value.includes(condition.value);
      case 'not_contains':
        return value && !value.includes(condition.value);
      case 'in':
        return condition.value.includes(value);
      case 'not_in':
        return !condition.value.includes(value);
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'regex':
        return new RegExp(condition.value).test(value);
      default:
        return false;
    }
  }

  /**
   * Get value from context by attribute path
   */
  getValueFromContext(attribute, context) {
    const parts = attribute.split('.');
    let value = context;

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  /**
   * Check if user is in percentage rollout
   */
  isInRollout(flagKey, percentage, context) {
    const identifier = context.userId || context.sessionId || 'anonymous';
    const hash = this.hashString(`${flagKey}:${identifier}`);
    const bucket = (hash % 100) + 1;
    return bucket <= percentage;
  }

  /**
   * Check if user is in experiment
   */
  isInExperiment(flagKey, context) {
    const experiment = this.experiments.get(flagKey);
    if (!experiment || !experiment.active) {
      return false;
    }

    // Check if user is in experiment audience
    if (experiment.audience && !this.matchesRule(experiment.audience, context)) {
      return false;
    }

    // Allocate to variant
    const variant = this.allocateVariant(experiment, context);
    return variant === 'treatment';
  }

  /**
   * Allocate user to experiment variant
   */
  allocateVariant(experiment, context) {
    const identifier = context.userId || context.sessionId || 'anonymous';
    const hash = this.hashString(`${experiment.key}:${identifier}`);
    const bucket = (hash % 100) + 1;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (bucket <= cumulative) {
        return variant.key;
      }
    }

    return 'control';
  }

  /**
   * Get variation for A/B test
   */
  getVariation(experimentKey, context = {}) {
    const experiment = this.experiments.get(experimentKey);
    if (!experiment) {
      return 'control';
    }

    return this.allocateVariant(experiment, context);
  }

  /**
   * Get all enabled features for context
   */
  getEnabledFeatures(context = {}) {
    const enabled = [];

    for (const [key, flag] of this.flags) {
      if (this.isEnabled(key, context)) {
        enabled.push(key);
      }
    }

    return enabled;
  }

  /**
   * Get flag configuration
   */
  getFlag(flagKey) {
    return this.flags.get(flagKey);
  }

  /**
   * Get all flags
   */
  getAllFlags() {
    return Array.from(this.flags.values());
  }

  /**
   * Set user override
   */
  setUserOverride(userId, flagKey, enabled) {
    if (!this.userOverrides.has(userId)) {
      this.userOverrides.set(userId, new Map());
    }

    this.userOverrides.get(userId).set(flagKey, enabled);

    // Clear cache for this user
    this.clearUserCache(userId);

    this.emit('override-set', { userId, flagKey, enabled });
  }

  /**
   * Get user override
   */
  getUserOverride(flagKey, userId) {
    if (!userId) return undefined;
    return this.userOverrides.get(userId)?.get(flagKey);
  }

  /**
   * Clear user overrides
   */
  clearUserOverrides(userId) {
    if (userId) {
      this.userOverrides.delete(userId);
    } else {
      this.userOverrides.clear();
    }

    this.clearUserCache(userId);
  }

  /**
   * Track flag evaluation
   */
  trackEvaluation(flagKey, result, context) {
    // Send to analytics
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('Feature Flag Evaluated', {
        flag: flagKey,
        enabled: result,
        userId: context.userId,
        timestamp: Date.now()
      });
    }

    // Emit event
    this.emit('evaluation', { flagKey, result, context });
  }

  /**
   * Start periodic refresh
   */
  startRefresh() {
    this.refreshTimer = setInterval(_() => {
      this.loadFlags().catch(console.error);
    }, this.refreshInterval);
  }

  /**
   * Stop periodic refresh
   */
  stopRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates() {
    if (typeof window === 'undefined') return;

    const eventSource = new EventSource('/api/feature-flags/stream');

    eventSource.addEventListener(_'flag-update', (event) => {
      const data = JSON.parse(event.data);
      this.handleFlagUpdate(data);
    });

    eventSource.addEventListener(_'error', _(error) => {
      logError('Feature flags stream error:', error);
    });

    this.eventSource = eventSource;
  }

  /**
   * Handle real-time flag update
   */
  handleFlagUpdate(data) {
    if (data.flag) {
      this.flags.set(data.flag.key, {
        ...data.flag,
        lastUpdated: Date.now()
      });

      // Clear cache for this flag
      this.clearFlagCache(data.flag.key);

      this.emit('flag-updated', data.flag);
    }
  }

  /**
   * Get cache key
   */
  getCacheKey(flagKey, context) {
    const userId = context.userId || 'anonymous';
    return `${flagKey}:${userId}`;
  }

  /**
   * Clear cache for specific flag
   */
  clearFlagCache(flagKey) {
    for (const [key] of this.evaluationCache) {
      if (key.startsWith(`${flagKey}:`)) {
        this.evaluationCache.delete(key);
      }
    }
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userId) {
    if (!userId) {
      this.evaluationCache.clear();
      return;
    }

    for (const [key] of this.evaluationCache) {
      if (key.endsWith(`:${userId}`)) {
        this.evaluationCache.delete(key);
      }
    }
  }

  /**
   * Hash string to number
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopRefresh();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.flags.clear();
    this.userOverrides.clear();
    this.experiments.clear();
    this.evaluationCache.clear();

    this.removeAllListeners();
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagsService();

// Export React hook
export function useFeatureFlag(flagKey, context = {}) {
  if (typeof window !== 'undefined' && window.React) {
    const [enabled, setEnabled] = window.React.useState(
      featureFlags.isEnabled(flagKey, context)
    );

    window.React.useEffect(_() => {
      const handleUpdate = () => {
        setEnabled(featureFlags.isEnabled(flagKey, context));
      };

      featureFlags.on('flag-updated', handleUpdate);
      featureFlags.on('flags-updated', handleUpdate);

      return () => {
        featureFlags.off('flag-updated', handleUpdate);
        featureFlags.off('flags-updated', handleUpdate);
      };
    }, [flagKey, context]);

    return enabled;
  }

  return featureFlags.isEnabled(flagKey, context);
}

export default FeatureFlagsService;
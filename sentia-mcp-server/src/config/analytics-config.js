/**
 * Analytics Configuration Module
 * 
 * Centralized configuration management for the advanced analytics and reporting system.
 * This module provides easy access to analytics-specific configuration and validates
 * settings for all analytics components.
 */

import { SERVER_CONFIG } from './server-config.js';
import { logWarn, logError } from '../utils/logger.js';

/**
 * Analytics Configuration Class
 * Provides centralized access to analytics configuration with validation
 */
export class AnalyticsConfig {
  constructor() {
    this.config = SERVER_CONFIG.analytics || {};
    this.validateConfiguration();
  }

  /**
   * Get configuration for a specific analytics component
   */
  getComponentConfig(component) {
    return this.config[component] || {};
  }

  /**
   * Get advanced analytics configuration
   */
  getAdvancedAnalyticsConfig() {
    return this.getComponentConfig('advancedAnalytics');
  }

  /**
   * Get financial analytics configuration
   */
  getFinancialAnalyticsConfig() {
    return this.getComponentConfig('financialAnalytics');
  }

  /**
   * Get operational analytics configuration
   */
  getOperationalAnalyticsConfig() {
    return this.getComponentConfig('operationalAnalytics');
  }

  /**
   * Get customer analytics configuration
   */
  getCustomerAnalyticsConfig() {
    return this.getComponentConfig('customerAnalytics');
  }

  /**
   * Get visualization engine configuration
   */
  getVisualizationConfig() {
    return this.getComponentConfig('visualization');
  }

  /**
   * Get advanced alerts configuration
   */
  getAdvancedAlertsConfig() {
    return this.getComponentConfig('advancedAlerts');
  }

  /**
   * Get reporting system configuration
   */
  getReportingConfig() {
    return this.getComponentConfig('reporting');
  }

  /**
   * Get data integration configuration
   */
  getDataIntegrationConfig() {
    return this.getComponentConfig('dataIntegration');
  }

  /**
   * Get caching configuration
   */
  getCachingConfig() {
    return this.getComponentConfig('caching');
  }

  /**
   * Check if analytics is enabled globally
   */
  isAnalyticsEnabled() {
    return this.config.enabled !== false;
  }

  /**
   * Check if a specific component is enabled
   */
  isComponentEnabled(component) {
    const componentConfig = this.getComponentConfig(component);
    return componentConfig.enabled !== false;
  }

  /**
   * Get machine learning models configuration
   */
  getMLModelsConfig() {
    const advancedConfig = this.getAdvancedAnalyticsConfig();
    return advancedConfig.mlModels || {};
  }

  /**
   * Get dashboard integration endpoints
   */
  getDashboardEndpoints(environment = 'development') {
    const dashboardConfig = SERVER_CONFIG.integrations?.dashboard?.[environment];
    return dashboardConfig?.analytics?.endpoints || {};
  }

  /**
   * Get performance thresholds for analytics operations
   */
  getPerformanceThresholds() {
    return {
      analysisTimeout: this.getAdvancedAnalyticsConfig().processing?.timeout || 30000,
      visualizationTimeout: this.getVisualizationConfig().performance?.renderTimeout || 30000,
      forecastTimeout: this.getMLModelsConfig().forecasting?.timeout || 60000,
      maxMemoryUsage: this.getAdvancedAnalyticsConfig().processing?.maxMemoryUsage || 512,
      maxDataPoints: this.getVisualizationConfig().performance?.maxDataPoints || 10000
    };
  }

  /**
   * Get caching strategy for a specific operation type
   */
  getCacheStrategy(operationType) {
    const cachingConfig = this.getCachingConfig();
    return cachingConfig.strategies?.[operationType] || {
      ttl: 300000, // 5 minutes default
      enabled: true
    };
  }

  /**
   * Get notification configuration for alerts
   */
  getNotificationConfig() {
    return SERVER_CONFIG.monitoring?.alerting?.notifications || {};
  }

  /**
   * Validate analytics configuration
   */
  validateConfiguration() {
    const warnings = [];
    const errors = [];

    // Check if analytics is enabled
    if (!this.isAnalyticsEnabled()) {
      warnings.push('Analytics is disabled globally');
      return { warnings, errors };
    }

    // Validate advanced analytics configuration
    const advancedConfig = this.getAdvancedAnalyticsConfig();
    if (advancedConfig.enabled && !advancedConfig.processing) {
      warnings.push('Advanced analytics processing configuration is missing');
    }

    // Validate ML models configuration
    const mlConfig = this.getMLModelsConfig();
    if (advancedConfig.enableMLModels && !mlConfig.anomalyDetection?.enabled && !mlConfig.forecasting?.enabled) {
      warnings.push('ML models are enabled but no specific models are configured');
    }

    // Validate visualization configuration
    const vizConfig = this.getVisualizationConfig();
    if (vizConfig.enabled && !vizConfig.enabledChartTypes?.length) {
      warnings.push('Visualization is enabled but no chart types are configured');
    }

    // Validate caching configuration
    const cacheConfig = this.getCachingConfig();
    if (cacheConfig.enabled) {
      const hasAnyCache = cacheConfig.levels?.memory?.enabled || 
                         cacheConfig.levels?.redis?.enabled || 
                         cacheConfig.levels?.database?.enabled;
      if (!hasAnyCache) {
        warnings.push('Caching is enabled but no cache levels are configured');
      }
    }

    // Validate financial analytics currency configuration
    const financialConfig = this.getFinancialAnalyticsConfig();
    if (financialConfig.enabled && financialConfig.currency?.enableMultiCurrency && !financialConfig.currency?.exchangeRateProvider) {
      warnings.push('Multi-currency is enabled but no exchange rate provider is configured');
    }

    // Validate operational analytics OEE targets
    const operationalConfig = this.getOperationalAnalyticsConfig();
    if (operationalConfig.enabled && operationalConfig.enableOEECalculation) {
      const targets = operationalConfig.oeeTargets || {};
      if (!targets.availability || !targets.performance || !targets.quality) {
        warnings.push('OEE calculation is enabled but targets are not fully configured');
      }
    }

    // Validate dashboard integration
    const dashboardConfig = SERVER_CONFIG.integrations?.dashboard;
    if (!dashboardConfig) {
      errors.push('Dashboard integration configuration is missing');
    } else {
      const environments = ['development', 'testing', 'production'];
      for (const env of environments) {
        if (!dashboardConfig[env]?.analytics?.endpoints) {
          warnings.push(`Dashboard analytics endpoints not configured for ${env} environment`);
        }
      }
    }

    // Log warnings and errors
    if (warnings.length > 0) {
      logWarn('Analytics configuration warnings', { warnings });
    }

    if (errors.length > 0) {
      logError('Analytics configuration errors', { errors });
    }

    return { warnings, errors };
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig() {
    const environment = SERVER_CONFIG.server?.environment || 'development';
    
    return {
      environment,
      isDevelopment: environment === 'development',
      isProduction: environment === 'production',
      isTesting: environment === 'testing',
      enableDebugLogging: environment !== 'production',
      enablePerformanceMonitoring: environment === 'production',
      enableDevelopmentFeatures: environment === 'development'
    };
  }

  /**
   * Get analytics feature flags
   */
  getFeatureFlags() {
    const envConfig = this.getEnvironmentConfig();
    
    return {
      enableRealTimeProcessing: this.getAdvancedAnalyticsConfig().enableRealTimeProcessing && !envConfig.isDevelopment,
      enablePredictiveAnalytics: this.getAdvancedAnalyticsConfig().enablePredictiveAnalytics,
      enableAnomalyDetection: this.getAdvancedAnalyticsConfig().enableAnomalyDetection,
      enableMLModels: this.getAdvancedAnalyticsConfig().enableMLModels && !envConfig.isDevelopment,
      enableAdvancedVisualizations: this.getVisualizationConfig().enableInteractivity,
      enableRealtimeVisualizations: this.getVisualizationConfig().enableRealTimeUpdates,
      enableCustomReports: this.getReportingConfig().enableCustomReports,
      enableScheduledReports: this.getReportingConfig().enableScheduledReports && !envConfig.isDevelopment,
      enableDataExport: this.getVisualizationConfig().export?.enableJSON !== false,
      enableAdvancedCaching: this.getCachingConfig().levels?.redis?.enabled || false
    };
  }

  /**
   * Export configuration for specific component initialization
   */
  exportForComponent(component) {
    const componentConfig = this.getComponentConfig(component);
    const envConfig = this.getEnvironmentConfig();
    const featureFlags = this.getFeatureFlags();
    const performanceThresholds = this.getPerformanceThresholds();

    return {
      ...componentConfig,
      environment: envConfig,
      features: featureFlags,
      performance: performanceThresholds,
      caching: this.getCacheStrategy(component),
      notifications: this.getNotificationConfig()
    };
  }

  /**
   * Get complete analytics configuration summary
   */
  getSummary() {
    const validation = this.validateConfiguration();
    const envConfig = this.getEnvironmentConfig();
    const featureFlags = this.getFeatureFlags();

    return {
      enabled: this.isAnalyticsEnabled(),
      environment: envConfig.environment,
      components: {
        advancedAnalytics: this.isComponentEnabled('advancedAnalytics'),
        financialAnalytics: this.isComponentEnabled('financialAnalytics'),
        operationalAnalytics: this.isComponentEnabled('operationalAnalytics'),
        customerAnalytics: this.isComponentEnabled('customerAnalytics'),
        visualization: this.isComponentEnabled('visualization'),
        advancedAlerts: this.isComponentEnabled('advancedAlerts'),
        reporting: this.isComponentEnabled('reporting'),
        dataIntegration: this.isComponentEnabled('dataIntegration')
      },
      features: featureFlags,
      validation: {
        warnings: validation.warnings.length,
        errors: validation.errors.length,
        isValid: validation.errors.length === 0
      },
      performance: this.getPerformanceThresholds(),
      caching: {
        enabled: this.getCachingConfig().enabled,
        levels: Object.keys(this.getCachingConfig().levels || {}),
        strategies: Object.keys(this.getCachingConfig().strategies || {})
      }
    };
  }
}

// Create singleton instance
export const analyticsConfig = new AnalyticsConfig();

// Export convenience functions
export const getAnalyticsConfig = () => analyticsConfig;
export const isAnalyticsEnabled = () => analyticsConfig.isAnalyticsEnabled();
export const getComponentConfig = (component) => analyticsConfig.getComponentConfig(component);
export const exportConfigForComponent = (component) => analyticsConfig.exportForComponent(component);

// Export specific component configurations
export const advancedAnalyticsConfig = analyticsConfig.getAdvancedAnalyticsConfig();
export const financialAnalyticsConfig = analyticsConfig.getFinancialAnalyticsConfig();
export const operationalAnalyticsConfig = analyticsConfig.getOperationalAnalyticsConfig();
export const customerAnalyticsConfig = analyticsConfig.getCustomerAnalyticsConfig();
export const visualizationConfig = analyticsConfig.getVisualizationConfig();
export const advancedAlertsConfig = analyticsConfig.getAdvancedAlertsConfig();
export const reportingConfig = analyticsConfig.getReportingConfig();
export const dataIntegrationConfig = analyticsConfig.getDataIntegrationConfig();
export const cachingConfig = analyticsConfig.getCachingConfig();

export default analyticsConfig;
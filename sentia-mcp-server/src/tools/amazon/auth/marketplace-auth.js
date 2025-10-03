/**
 * Amazon Marketplace Authentication Manager
 * 
 * Coordinates authentication across multiple Amazon marketplaces
 * and provides unified access management.
 * 
 * @version 1.0.0
 */

import { AmazonAuth } from './sp-api-auth.js';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Multi-Marketplace Authentication Manager
 */
export class MarketplaceAuth {
  constructor(config = {}) {
    this.config = {
      // Default marketplace priorities
      defaultMarketplaces: config.defaultMarketplaces || ['USA', 'UK', 'EU'],
      
      // Connection pooling
      maxConnections: config.maxConnections || 10,
      connectionTimeout: config.connectionTimeout || 30000,
      
      // Authentication retry settings
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      
      ...config
    };

    // Authentication instances for different configurations
    this.authInstances = new Map();
    this.connectionPool = new Map();
    this.lastActivity = new Map();

    this.initializeAuthInstances();

    logger.info('Marketplace Auth Manager initialized', {
      defaultMarketplaces: this.config.defaultMarketplaces,
      maxConnections: this.config.maxConnections
    });
  }

  /**
   * Initialize authentication instances for different environments
   */
  initializeAuthInstances() {
    // Production instance
    this.authInstances.set('production', new AmazonAuth({
      sandbox: false,
      clientId: process.env.AMAZON_CLIENT_ID,
      clientSecret: process.env.AMAZON_CLIENT_SECRET,
      refreshToken: process.env.AMAZON_REFRESH_TOKEN
    }));

    // Sandbox instance (if configured)
    if (process.env.AMAZON_SANDBOX_CLIENT_ID) {
      this.authInstances.set('sandbox', new AmazonAuth({
        sandbox: true,
        clientId: process.env.AMAZON_SANDBOX_CLIENT_ID,
        clientSecret: process.env.AMAZON_SANDBOX_CLIENT_SECRET,
        refreshToken: process.env.AMAZON_SANDBOX_REFRESH_TOKEN
      }));
    }

    logger.info('Auth instances initialized', {
      production: this.authInstances.has('production'),
      sandbox: this.authInstances.has('sandbox')
    });
  }

  /**
   * Get authenticated client for marketplace
   */
  async getClient(marketplaceId, options = {}) {
    const environment = options.sandbox ? 'sandbox' : 'production';
    const correlationId = options.correlationId || `multi-auth-${Date.now()}`;

    try {
      const authInstance = this.authInstances.get(environment);
      if (!authInstance) {
        throw new Error(`No authentication instance available for environment: ${environment}`);
      }

      // Get client from auth instance
      const client = await authInstance.getClient(marketplaceId, { correlationId });
      
      // Update activity tracking
      this.updateActivity(marketplaceId, environment);

      logger.debug('Client retrieved for marketplace', {
        correlationId,
        marketplace: marketplaceId,
        environment
      });

      return client;

    } catch (error) {
      logger.error('Failed to get marketplace client', {
        correlationId,
        marketplace: marketplaceId,
        environment,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test connections to all default marketplaces
   */
  async testAllConnections(options = {}) {
    const environment = options.sandbox ? 'sandbox' : 'production';
    const marketplaces = options.marketplaces || this.config.defaultMarketplaces;
    const correlationId = options.correlationId || `test-all-${Date.now()}`;

    const results = [];

    logger.info('Testing connections to all marketplaces', {
      correlationId,
      marketplaces,
      environment
    });

    for (const marketplaceId of marketplaces) {
      try {
        const authInstance = this.authInstances.get(environment);
        if (!authInstance) {
          results.push({
            marketplace: marketplaceId,
            success: false,
            error: `No auth instance for ${environment}`,
            timestamp: new Date().toISOString()
          });
          continue;
        }

        const result = await authInstance.testConnection(marketplaceId, { correlationId });
        results.push(result);

      } catch (error) {
        results.push({
          marketplace: marketplaceId,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    logger.info('Marketplace connection test completed', {
      correlationId,
      successful: successCount,
      total: totalCount,
      environment
    });

    return {
      summary: {
        successful: successCount,
        total: totalCount,
        environment,
        timestamp: new Date().toISOString()
      },
      results
    };
  }

  /**
   * Get authentication status for all marketplaces
   */
  getAuthStatus() {
    const status = {
      environments: {},
      connectionPool: this.getConnectionPoolStatus(),
      lastActivity: Object.fromEntries(this.lastActivity),
      configuration: {
        defaultMarketplaces: this.config.defaultMarketplaces,
        maxConnections: this.config.maxConnections
      }
    };

    // Get status from each auth instance
    for (const [env, authInstance] of this.authInstances.entries()) {
      status.environments[env] = authInstance.getAuthStatus();
    }

    return status;
  }

  /**
   * Get connection pool status
   */
  getConnectionPoolStatus() {
    return {
      total: this.connectionPool.size,
      maxConnections: this.config.maxConnections,
      active: Array.from(this.connectionPool.entries()).map(([key, conn]) => ({
        key,
        created: conn.created,
        lastUsed: conn.lastUsed,
        marketplace: conn.marketplace,
        environment: conn.environment
      }))
    };
  }

  /**
   * Update activity tracking
   */
  updateActivity(marketplaceId, environment) {
    const key = `${marketplaceId}-${environment}`;
    this.lastActivity.set(key, {
      marketplace: marketplaceId,
      environment,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get all supported marketplaces across all environments
   */
  getAllSupportedMarketplaces() {
    const marketplaces = new Map();

    for (const [env, authInstance] of this.authInstances.entries()) {
      const supported = authInstance.getSupportedMarketplaces();
      for (const marketplace of supported) {
        const key = marketplace.id;
        if (!marketplaces.has(key)) {
          marketplaces.set(key, { ...marketplace, environments: [] });
        }
        marketplaces.get(key).environments.push(env);
      }
    }

    return Array.from(marketplaces.values());
  }

  /**
   * Switch between sandbox and production
   */
  async switchEnvironment(targetEnvironment, options = {}) {
    const correlationId = options.correlationId || `switch-env-${Date.now()}`;

    try {
      if (!this.authInstances.has(targetEnvironment)) {
        throw new Error(`Environment ${targetEnvironment} not available`);
      }

      logger.info('Switching to environment', {
        correlationId,
        environment: targetEnvironment
      });

      // Test connection to ensure environment is working
      const testResult = await this.testAllConnections({
        sandbox: targetEnvironment === 'sandbox',
        correlationId
      });

      const workingMarketplaces = testResult.results.filter(r => r.success).length;

      return {
        success: true,
        environment: targetEnvironment,
        workingMarketplaces,
        totalMarketplaces: testResult.results.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to switch environment', {
        correlationId,
        targetEnvironment,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Refresh all authentication tokens
   */
  async refreshAllTokens(options = {}) {
    const environment = options.sandbox ? 'sandbox' : 'production';
    const correlationId = options.correlationId || `refresh-all-${Date.now()}`;

    try {
      const authInstance = this.authInstances.get(environment);
      if (!authInstance) {
        throw new Error(`No auth instance for ${environment}`);
      }

      const marketplaces = options.marketplaces || this.config.defaultMarketplaces;
      const results = [];

      logger.info('Refreshing tokens for all marketplaces', {
        correlationId,
        marketplaces,
        environment
      });

      for (const marketplaceId of marketplaces) {
        try {
          await authInstance.refreshAccessToken(marketplaceId);
          results.push({
            marketplace: marketplaceId,
            success: true,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          results.push({
            marketplace: marketplaceId,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      logger.info('Token refresh completed', {
        correlationId,
        successful: successCount,
        total: results.length,
        environment
      });

      return {
        summary: {
          successful: successCount,
          total: results.length,
          environment
        },
        results
      };

    } catch (error) {
      logger.error('Failed to refresh all tokens', {
        correlationId,
        environment,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean up idle connections
   */
  cleanupIdleConnections(maxIdleTime = 3600000) { // 1 hour default
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, activity] of this.lastActivity.entries()) {
      const idleTime = now - new Date(activity.timestamp).getTime();
      if (idleTime > maxIdleTime) {
        this.lastActivity.delete(key);
        cleanedCount++;
      }
    }

    logger.info('Cleaned up idle connections', {
      cleanedCount,
      remaining: this.lastActivity.size,
      maxIdleTime
    });

    return {
      cleanedCount,
      remaining: this.lastActivity.size
    };
  }

  /**
   * Get marketplace by region
   */
  getMarketplacesByRegion(region) {
    const allMarketplaces = this.getAllSupportedMarketplaces();
    
    const regionMappings = {
      'north-america': ['USA', 'CANADA'],
      'europe': ['UK', 'EU'],
      'asia-pacific': ['JAPAN', 'AUSTRALIA']
    };

    const marketplaceNames = regionMappings[region.toLowerCase()] || [];
    
    return allMarketplaces.filter(marketplace => 
      marketplaceNames.includes(marketplace.name)
    );
  }

  /**
   * Disconnect all clients across all environments
   */
  disconnect() {
    logger.info('Disconnecting all marketplace clients');

    let totalDisconnected = 0;

    for (const [env, authInstance] of this.authInstances.entries()) {
      const result = authInstance.disconnect();
      if (result.success) {
        totalDisconnected++;
      }
    }

    // Clear local state
    this.connectionPool.clear();
    this.lastActivity.clear();

    return {
      success: true,
      disconnectedEnvironments: totalDisconnected,
      message: 'All marketplace clients disconnected'
    };
  }
}
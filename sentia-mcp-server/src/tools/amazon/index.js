/**
 * Amazon Marketplace Integration - Main Orchestrator
 * 
 * Enterprise-grade Amazon SP-API integration providing comprehensive marketplace
 * management across multiple regions with business intelligence and optimization.
 * 
 * @version 1.0.0
 */

import { MarketplaceAuth } from './auth/marketplace-auth.js';
import { OrdersTool } from './tools/orders.js';
import { ProductsTool } from './tools/products.js';
import { InventoryTool } from './tools/inventory.js';
import { ReportsTool } from './tools/reports.js';
import { ListingsTool } from './tools/listings.js';
import { AdvertisingTool } from './tools/advertising.js';
import { AmazonCache } from './utils/cache.js';
import { AmazonErrorHandler } from './utils/error-handler.js';
import { AmazonAnalytics } from './utils/analytics.js';
import { ComplianceManager } from './utils/compliance.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Integration Orchestrator Class
 */
export class AmazonIntegration {
  constructor(config = {}) {
    this.config = {
      // Multi-marketplace configuration
      marketplaces: {
        uk: {
          id: 'A1F83G8C2ARO7P',
          endpoint: 'https://sellingpartnerapi-eu.amazon.com',
          region: 'eu-west-1',
          currency: 'GBP',
          countryCode: 'GB',
          name: 'UK'
        },
        usa: {
          id: 'ATVPDKIKX0DER',
          endpoint: 'https://sellingpartnerapi-na.amazon.com',
          region: 'us-east-1',
          currency: 'USD',
          countryCode: 'US',
          name: 'USA'
        },
        eu: {
          id: 'A1PA6795UKMFR9',
          endpoint: 'https://sellingpartnerapi-eu.amazon.com',
          region: 'eu-west-1',
          currency: 'EUR',
          countryCode: 'DE',
          name: 'EU'
        },
        canada: {
          id: 'A2EUQ1WTGCTBG2',
          endpoint: 'https://sellingpartnerapi-na.amazon.com',
          region: 'us-east-1',
          currency: 'CAD',
          countryCode: 'CA',
          name: 'CANADA'
        }
      },

      // Rate limiting configuration
      rateLimiting: {
        enabled: true,
        maxRequests: 10, // SP-API has lower limits than Shopify
        timeWindow: 1000,
        burstLimit: 20
      },

      // Caching configuration
      caching: {
        enabled: true,
        defaultTTL: 600, // 10 minutes default for Amazon data
        ordersTTL: 300,   // 5 minutes
        productsTTL: 1800, // 30 minutes
        inventoryTTL: 300, // 5 minutes
        reportsTTL: 3600,  // 1 hour
        advertisingTTL: 1800 // 30 minutes
      },

      // Error handling configuration
      errorHandling: {
        maxRetries: 3,
        retryDelay: 2000,
        circuitBreakerThreshold: 5,
        rateLimitBackoff: 5000
      },

      // Business intelligence configuration
      analytics: {
        enabled: true,
        crossMarketplaceAnalysis: true,
        performanceTracking: true,
        optimizationSuggestions: true
      },

      // Compliance configuration
      compliance: {
        enabled: true,
        taxCalculation: true,
        restrictedProducts: true,
        marketplaceRules: true
      },

      ...config
    };

    // Initialize components
    this.initializeComponents();
    this.initializeTools();

    logger.info('Amazon Integration initialized', {
      marketplaces: Object.keys(this.config.marketplaces),
      rateLimiting: this.config.rateLimiting.enabled,
      caching: this.config.caching.enabled,
      analytics: this.config.analytics.enabled,
      compliance: this.config.compliance.enabled
    });
  }

  /**
   * Initialize core components
   */
  initializeComponents() {
    // Authentication manager
    this.auth = new MarketplaceAuth(this.config);

    // Caching system
    this.cache = new AmazonCache(this.config.caching);

    // Error handling
    this.errorHandler = new AmazonErrorHandler(this.config.errorHandling);

    // Analytics engine
    this.analytics = new AmazonAnalytics(this.config.analytics);

    // Compliance manager
    this.compliance = new ComplianceManager(this.config.compliance);

    // Performance tracking
    this.performance = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastActivity: null
    };
  }

  /**
   * Initialize tool instances
   */
  initializeTools() {
    this.tools = {
      orders: new OrdersTool(this.auth, {
        cache: this.cache,
        errorHandler: this.errorHandler
      }),
      products: new ProductsTool(this.auth, {
        cache: this.cache,
        errorHandler: this.errorHandler
      }),
      inventory: new InventoryTool(this.auth, {
        cache: this.cache,
        errorHandler: this.errorHandler
      }),
      reports: new ReportsTool(this.auth, {
        cache: this.cache,
        errorHandler: this.errorHandler
      }),
      listings: new ListingsTool(this.auth, {
        cache: this.cache,
        errorHandler: this.errorHandler
      }),
      advertising: new AdvertisingTool(this.auth, {
        cache: this.cache,
        errorHandler: this.errorHandler
      })
    };

    logger.info('Amazon tools initialized', {
      toolCount: Object.keys(this.tools).length,
      tools: Object.keys(this.tools)
    });
  }

  /**
   * Execute tool operation with comprehensive error handling and analytics
   */
  async executeTool(toolName, params = {}) {
    const correlationId = `amazon-${toolName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Update performance tracking
      this.performance.requestCount++;
      this.performance.lastActivity = new Date().toISOString();

      logger.info('Executing Amazon tool', {
        correlationId,
        tool: toolName,
        marketplace: params.marketplaceId,
        params: this.sanitizeParams(params)
      });

      // Validate tool exists
      if (!this.tools[toolName]) {
        throw new Error(`Unknown Amazon tool: ${toolName}`);
      }

      // Add correlation ID to params
      const enhancedParams = {
        ...params,
        correlationId
      };

      // Execute with error handling
      const result = await this.errorHandler.withRetry(
        () => this.tools[toolName].execute(enhancedParams),
        `amazon-${toolName}`,
        { correlationId }
      );

      // Calculate response time
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime, true);

      // Track analytics if enabled
      if (this.config.analytics.enabled) {
        await this.analytics.trackOperation(toolName, params, result, responseTime);
      }

      logger.info('Amazon tool execution completed', {
        correlationId,
        tool: toolName,
        success: result.success,
        responseTime,
        marketplace: params.marketplaceId
      });

      return {
        ...result,
        performance: {
          responseTime,
          correlationId
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.performance.errorCount++;
      this.updatePerformanceMetrics(responseTime, false);

      logger.error('Amazon tool execution failed', {
        correlationId,
        tool: toolName,
        error: error.message,
        stack: error.stack,
        responseTime,
        params: this.sanitizeParams(params)
      });

      return {
        success: false,
        error: error.message,
        correlationId,
        performance: {
          responseTime,
          correlationId
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get cross-marketplace analytics
   */
  async getCrossMarketplaceAnalytics(params = {}) {
    const correlationId = `cross-analytics-${Date.now()}`;

    try {
      logger.info('Generating cross-marketplace analytics', {
        correlationId,
        marketplaces: params.marketplaces || 'all'
      });

      const marketplaces = params.marketplaces || Object.keys(this.config.marketplaces);
      const analytics = await this.analytics.generateCrossMarketplaceReport(
        marketplaces,
        params.dateRange,
        correlationId
      );

      return {
        success: true,
        analytics,
        marketplaces,
        correlationId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Cross-marketplace analytics failed', {
        correlationId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        correlationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get system health and status
   */
  async getSystemHealth() {
    const correlationId = `health-${Date.now()}`;

    try {
      // Test authentication for all marketplaces
      const authStatus = await this.auth.testAllConnections();

      // Get cache health
      const cacheHealth = await this.cache.healthCheck();

      // Get error handler stats
      const errorStats = this.errorHandler.getErrorStats();

      // Get analytics status
      const analyticsStatus = this.analytics.getStatus();

      // Get compliance status
      const complianceStatus = this.compliance.getStatus();

      const health = {
        overall: 'healthy',
        components: {
          authentication: {
            status: authStatus.summary.successful === authStatus.summary.total ? 'healthy' : 'degraded',
            details: authStatus
          },
          cache: {
            status: cacheHealth.healthy ? 'healthy' : 'unhealthy',
            details: cacheHealth
          },
          errorHandling: {
            status: 'healthy',
            details: errorStats
          },
          analytics: {
            status: analyticsStatus.enabled ? 'healthy' : 'disabled',
            details: analyticsStatus
          },
          compliance: {
            status: complianceStatus.enabled ? 'healthy' : 'disabled',
            details: complianceStatus
          }
        },
        performance: this.performance,
        marketplaces: this.getMarketplaceStatus(),
        tools: this.getToolStatus(),
        timestamp: new Date().toISOString(),
        correlationId
      };

      // Determine overall health
      const componentStatuses = Object.values(health.components).map(c => c.status);
      if (componentStatuses.includes('unhealthy')) {
        health.overall = 'unhealthy';
      } else if (componentStatuses.includes('degraded')) {
        health.overall = 'degraded';
      }

      return health;

    } catch (error) {
      logger.error('System health check failed', {
        correlationId,
        error: error.message
      });

      return {
        overall: 'unhealthy',
        error: error.message,
        correlationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get marketplace status
   */
  getMarketplaceStatus() {
    const status = {};

    Object.entries(this.config.marketplaces).forEach(([key, marketplace]) => {
      status[key] = {
        id: marketplace.id,
        name: marketplace.name,
        region: marketplace.region,
        currency: marketplace.currency,
        endpoint: marketplace.endpoint,
        configured: true
      };
    });

    return status;
  }

  /**
   * Get tool status
   */
  getToolStatus() {
    const status = {};

    Object.entries(this.tools).forEach(([toolName, tool]) => {
      status[toolName] = {
        available: true,
        schema: tool.getSchema ? tool.getSchema() : null
      };
    });

    return status;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(responseTime, success) {
    // Update average response time (simple moving average)
    const alpha = 0.1; // Smoothing factor
    if (this.performance.averageResponseTime === 0) {
      this.performance.averageResponseTime = responseTime;
    } else {
      this.performance.averageResponseTime = 
        (alpha * responseTime) + ((1 - alpha) * this.performance.averageResponseTime);
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools() {
    return Object.keys(this.tools).map(toolName => ({
      name: toolName,
      schema: this.tools[toolName].getSchema ? this.tools[toolName].getSchema() : null
    }));
  }

  /**
   * Get supported marketplaces
   */
  getSupportedMarketplaces() {
    return Object.entries(this.config.marketplaces).map(([key, marketplace]) => ({
      key,
      ...marketplace
    }));
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    try {
      const result = await this.cache.clear();
      
      logger.info('All Amazon caches cleared', {
        clearedKeys: result.clearedKeys
      });

      return {
        success: true,
        message: 'All caches cleared',
        clearedKeys: result.clearedKeys
      };
    } catch (error) {
      logger.error('Failed to clear caches', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    return {
      performance: this.performance,
      cache: this.cache.getStats ? this.cache.getStats() : null,
      errorHandler: this.errorHandler.getErrorStats(),
      analytics: this.analytics.getStats ? this.analytics.getStats() : null,
      marketplaces: Object.keys(this.config.marketplaces).length,
      tools: Object.keys(this.tools).length
    };
  }

  /**
   * Sanitize parameters for logging (remove sensitive data)
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    
    // Remove sensitive information
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    delete sanitized.clientSecret;
    
    return sanitized;
  }

  /**
   * Shutdown integration gracefully
   */
  async shutdown() {
    logger.info('Shutting down Amazon integration');

    try {
      // Disconnect authentication
      await this.auth.disconnect();

      // Clear caches
      if (this.cache.clear) {
        await this.cache.clear();
      }

      // Reset performance tracking
      this.performance = {
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        lastActivity: null
      };

      logger.info('Amazon integration shutdown completed');

      return {
        success: true,
        message: 'Amazon integration shutdown completed'
      };

    } catch (error) {
      logger.error('Error during Amazon integration shutdown', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}
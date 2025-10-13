/**
 * Shopify E-commerce Integration
 * 
 * Comprehensive Shopify integration for UK and USA stores with full e-commerce
 * data access, business intelligence, and real-time webhook support.
 * 
 * @version 1.0.0
 */

import { shopifyApi } from '@shopify/shopify-api';
import { createLogger } from '../../utils/logger.js';
import { ShopifyAuth } from './auth/shopify-auth.js';
import { ShopifyCache } from './utils/cache.js';
import { ShopifyErrorHandler } from './utils/error-handler.js';
import { ShopifyAnalytics } from './utils/analytics.js';
import { ShopifyWebhooks } from './webhooks/webhook-handler.js';

// Import Shopify tools
import { OrdersTool } from './tools/orders.js';
import { ProductsTool } from './tools/products.js';
import { CustomersTool } from './tools/customers.js';
import { InventoryTool } from './tools/inventory.js';
import { AnalyticsTool } from './tools/analytics.js';
import { ProductManagementTool } from './tools/product-management.js';

const logger = createLogger();

/**
 * Main Shopify Integration Class
 */
export class ShopifyIntegration {
  constructor(config = {}) {
    this.config = {
      // Multi-store configuration
      stores: {
        uk: {
          shopDomain: config.ukShopDomain || process.env.SHOPIFY_UK_SHOP_DOMAIN,
          accessToken: config.ukAccessToken || process.env.SHOPIFY_UK_ACCESS_TOKEN,
          apiVersion: config.apiVersion || process.env.SHOPIFY_API_VERSION || '2024-01',
          region: 'UK'
        },
        usa: {
          shopDomain: config.usaShopDomain || process.env.SHOPIFY_USA_SHOP_DOMAIN,
          accessToken: config.usaAccessToken || process.env.SHOPIFY_USA_ACCESS_TOKEN,
          apiVersion: config.apiVersion || process.env.SHOPIFY_API_VERSION || '2024-01',
          region: 'USA'
        }
      },
      
      // Rate limiting configuration
      rateLimiting: {
        enabled: config.rateLimiting?.enabled !== false,
        maxRequests: config.rateLimiting?.maxRequests || 40,
        timeWindow: config.rateLimiting?.timeWindow || 1000, // 1 second
        restoreRate: config.rateLimiting?.restoreRate || 2 // requests per second
      },
      
      // Caching configuration
      caching: {
        enabled: config.caching?.enabled !== false,
        defaultTTL: config.caching?.defaultTTL || 300, // 5 minutes
        ordersTTL: config.caching?.ordersTTL || 60, // 1 minute
        productsTTL: config.caching?.productsTTL || 900, // 15 minutes
        customersTTL: config.caching?.customersTTL || 1800, // 30 minutes
        inventoryTTL: config.caching?.inventoryTTL || 300 // 5 minutes
      },
      
      // Webhook configuration
      webhooks: {
        enabled: config.webhooks?.enabled !== false,
        secret: config.webhooks?.secret || process.env.SHOPIFY_WEBHOOK_SECRET,
        endpoints: config.webhooks?.endpoints || []
      },
      
      ...config
    };

    // Initialize core components
    this.auth = new ShopifyAuth(this.config);
    this.cache = new ShopifyCache(this.config.caching);
    this.errorHandler = new ShopifyErrorHandler();
    this.analytics = new ShopifyAnalytics();
    this.webhooks = new ShopifyWebhooks(this.config.webhooks);

    // Initialize Shopify API clients for each store
    this.clients = {};
    this.initializeClients();

    // Initialize tools
    this.tools = {};
    this.initializeTools();

    logger.info('Shopify Integration initialized', {
      storesConfigured: Object.keys(this.config.stores).length,
      rateLimitingEnabled: this.config.rateLimiting.enabled,
      cachingEnabled: this.config.caching.enabled,
      webhooksEnabled: this.config.webhooks.enabled
    });
  }

  /**
   * Initialize Shopify API clients for each store
   */
  initializeClients() {
    try {
      // Log environment variable status for debugging
      logger.info('Shopify environment variables check', {
        hasApiKey: !!process.env.SHOPIFY_API_KEY,
        hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
        hasApiSecretKey: !!process.env.SHOPIFY_API_SECRET_KEY,
        hasAppUrl: !!process.env.SHOPIFY_APP_URL
      });
      
      Object.entries(this.config.stores).forEach(([storeKey, storeConfig]) => {
        if (storeConfig.shopDomain && storeConfig.accessToken) {
          this.clients[storeKey] = shopifyApi({
            apiKey: process.env.SHOPIFY_API_KEY,
            apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_API_SECRET,
            scopes: ['read_products', 'read_orders', 'read_customers', 'read_inventory', 'read_analytics'],
            hostName: process.env.SHOPIFY_APP_URL || 'localhost',
            apiVersion: storeConfig.apiVersion || 'UNSTABLE',
            isEmbeddedApp: false,
            logger: {
              log: (severity, message) => {
                logger.debug('Shopify SDK', { severity, message, store: storeKey });
              }
            }
          });

          logger.info('Shopify client initialized', {
            store: storeKey,
            region: storeConfig.region,
            shopDomain: storeConfig.shopDomain,
            apiVersion: storeConfig.apiVersion
          });
        } else {
          logger.warn('Shopify store configuration incomplete', {
            store: storeKey,
            hasShopDomain: !!storeConfig.shopDomain,
            hasAccessToken: !!storeConfig.accessToken
          });
        }
      });
    } catch (error) {
      logger.error('Failed to initialize Shopify clients', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize Shopify tools
   */
  initializeTools() {
    try {
      this.tools = {
        orders: new OrdersTool(this),
        products: new ProductsTool(this),
        customers: new CustomersTool(this),
        inventory: new InventoryTool(this),
        analytics: new AnalyticsTool(this),
        productManagement: new ProductManagementTool(this)
      };

      logger.info('Shopify tools initialized', {
        toolCount: Object.keys(this.tools).length,
        tools: Object.keys(this.tools)
      });
    } catch (error) {
      logger.error('Failed to initialize Shopify tools', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute a Shopify tool
   */
  async executeTool(toolName, params = {}) {
    const correlationId = params.correlationId || this.generateCorrelationId();
    const startTime = Date.now();

    try {
      logger.info('Executing Shopify tool', {
        correlationId,
        toolName,
        storeId: params.storeId || 'all',
        hasParams: Object.keys(params).length > 0
      });

      // Validate tool exists
      const tool = this.tools[toolName];
      if (!tool) {
        throw new Error(`Shopify tool '${toolName}' not found`);
      }

      // Execute tool with error handling and caching
      const result = await this.errorHandler.withRetry(
        async () => {
          // Check cache first if enabled
          if (tool.cacheEnabled && this.config.caching.enabled) {
            const cacheKey = this.cache.generateKey(toolName, params);
            const cachedResult = await this.cache.get(cacheKey);
            
            if (cachedResult) {
              logger.debug('Cache hit for Shopify tool', {
                correlationId,
                toolName,
                cacheKey: this.cache.sanitizeKey(cacheKey)
              });
              return cachedResult;
            }
          }

          // Execute the tool
          const toolResult = await tool.execute(params);

          // Cache the result if caching is enabled
          if (tool.cacheEnabled && this.config.caching.enabled) {
            const cacheKey = this.cache.generateKey(toolName, params);
            const ttl = this.cache.getTTL(toolName);
            await this.cache.set(cacheKey, toolResult, ttl);
          }

          return toolResult;
        },
        `shopify-${toolName}`,
        { correlationId }
      );

      const executionTime = Date.now() - startTime;

      logger.info('Shopify tool executed successfully', {
        correlationId,
        toolName,
        executionTime,
        success: result.success
      });

      return {
        ...result,
        metadata: {
          ...result.metadata,
          correlationId,
          executionTime,
          tool: toolName,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const enhancedError = this.errorHandler.handleError(error, `shopify-${toolName}`, {
        correlationId,
        toolName,
        params: this.sanitizeParams(params)
      });

      logger.error('Shopify tool execution failed', {
        correlationId,
        toolName,
        error: enhancedError.message,
        executionTime
      });

      throw enhancedError;
    }
  }

  /**
   * Get REST API client for a specific store
   */
  getRestClient(storeId) {
    const storeConfig = this.config.stores[storeId];
    if (!storeConfig) {
      throw new Error(`Store '${storeId}' not configured`);
    }

    const client = this.clients[storeId];
    if (!client) {
      throw new Error(`Client for store '${storeId}' not initialized`);
    }

    return new client.rest.RestClient({
      session: {
        shop: storeConfig.shopDomain,
        accessToken: storeConfig.accessToken
      }
    });
  }

  /**
   * Get GraphQL client for a specific store
   */
  getGraphQLClient(storeId) {
    const storeConfig = this.config.stores[storeId];
    if (!storeConfig) {
      throw new Error(`Store '${storeId}' not configured`);
    }

    const client = this.clients[storeId];
    if (!client) {
      throw new Error(`Client for store '${storeId}' not initialized`);
    }

    return new client.rest.GraphqlClient({
      session: {
        shop: storeConfig.shopDomain,
        accessToken: storeConfig.accessToken
      }
    });
  }

  /**
   * Execute cross-store analytics
   */
  async getCrossStoreAnalytics(params = {}) {
    const correlationId = params.correlationId || this.generateCorrelationId();

    try {
      logger.info('Executing cross-store analytics', { correlationId });

      const storeResults = {};
      const configuredStores = Object.keys(this.config.stores).filter(
        storeId => this.config.stores[storeId].shopDomain && this.config.stores[storeId].accessToken
      );

      // Get analytics from each configured store
      for (const storeId of configuredStores) {
        try {
          const storeParams = { ...params, storeId, correlationId };
          storeResults[storeId] = await this.executeTool('analytics', storeParams);
        } catch (error) {
          logger.warn('Failed to get analytics for store', {
            correlationId,
            storeId,
            error: error.message
          });
          storeResults[storeId] = { error: error.message };
        }
      }

      // Perform cross-store analysis
      const crossStoreInsights = this.analytics.analyzeCrossStorePerformance(storeResults);

      return {
        success: true,
        data: {
          individual: storeResults,
          crossStore: crossStoreInsights
        },
        metadata: {
          correlationId,
          storesAnalyzed: configuredStores.length,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Cross-store analytics failed', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get system status for all stores
   */
  async getSystemStatus() {
    const status = {
      integration: {
        status: 'operational',
        version: '1.0.0',
        uptime: process.uptime()
      },
      stores: {},
      cache: await this.cache.getStats(),
      errorHandler: this.errorHandler.getErrorStats()
    };

    // Check each store's connectivity
    for (const [storeId, storeConfig] of Object.entries(this.config.stores)) {
      try {
        if (storeConfig.shopDomain && storeConfig.accessToken) {
          const client = this.getRestClient(storeId);
          const shop = await client.get({ path: 'shop' });
          
          status.stores[storeId] = {
            status: 'connected',
            region: storeConfig.region,
            shopName: shop.body.shop.name,
            planName: shop.body.shop.plan_name,
            lastChecked: new Date().toISOString()
          };
        } else {
          status.stores[storeId] = {
            status: 'not_configured',
            region: storeConfig.region,
            reason: 'Missing credentials'
          };
        }
      } catch (error) {
        status.stores[storeId] = {
          status: 'error',
          region: storeConfig.region,
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    }

    return status;
  }

  /**
   * Generate correlation ID for request tracking
   */
  generateCorrelationId() {
    return `shopify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize parameters for logging (remove sensitive data)
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    delete sanitized.accessToken;
    delete sanitized.apiKey;
    delete sanitized.password;
    return sanitized;
  }

  /**
   * Clear cache for specific store or all stores
   */
  async clearCache(storeId = null) {
    if (storeId) {
      return await this.cache.clearStore(storeId);
    } else {
      return await this.cache.clear();
    }
  }

  /**
   * Get available tools information
   */
  getToolsInfo() {
    return Object.entries(this.tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      category: tool.category,
      requiresAuth: tool.requiresAuth,
      cacheEnabled: tool.cacheEnabled,
      inputSchema: tool.inputSchema
    }));
  }
}
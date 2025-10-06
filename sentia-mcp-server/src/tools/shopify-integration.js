/**
 * Shopify MCP Integration
 * 
 * Main integration file for registering Shopify tools with the MCP server.
 * Provides comprehensive e-commerce tools for both UK and USA stores.
 * 
 * @version 1.0.0
 */

import { ShopifyIntegration } from './shopify/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

/**
 * Initialize and register Shopify tools with MCP server
 */
export function registerShopifyTools(server) {
  try {
    logger.info('Registering Shopify integration tools');

    // Initialize Shopify integration
    const shopifyIntegration = new ShopifyIntegration({
      // Multi-store configuration
      stores: {
        uk: {
          shopDomain: process.env.SHOPIFY_UK_SHOP_DOMAIN,
          accessToken: process.env.SHOPIFY_UK_ACCESS_TOKEN,
          apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
          region: 'UK'
        },
        usa: {
          shopDomain: process.env.SHOPIFY_USA_SHOP_DOMAIN,
          accessToken: process.env.SHOPIFY_USA_ACCESS_TOKEN,
          apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
          region: 'USA'
        }
      },
      
      // Rate limiting configuration
      rateLimiting: {
        enabled: true,
        maxRequests: 40,
        timeWindow: 1000,
        restoreRate: 2
      },
      
      // Caching configuration
      caching: {
        enabled: true,
        defaultTTL: 300,
        ordersTTL: 60,
        productsTTL: 900,
        customersTTL: 1800,
        inventoryTTL: 300
      },
      
      // Webhook configuration
      webhooks: {
        enabled: true,
        secret: process.env.SHOPIFY_WEBHOOK_SECRET,
        endpoints: []
      }
    });

    // Register main Shopify tools

    // 1. Shopify Authentication Tool
    server.addTool({
      name: 'shopify-auth',
      description: 'Manage Shopify store authentication and authorization',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['generate_auth_url', 'exchange_token', 'validate_token', 'revoke_token', 'get_status'],
            description: 'Authentication action to perform'
          },
          storeId: {
            type: 'string',
            enum: ['uk', 'usa'],
            description: 'Store to authenticate'
          },
          code: {
            type: 'string',
            description: 'Authorization code for token exchange'
          },
          state: {
            type: 'string',
            description: 'State parameter for OAuth flow'
          },
          scopes: {
            type: 'array',
            items: { type: 'string' },
            description: 'OAuth scopes to request'
          },
          redirectUri: {
            type: 'string',
            description: 'OAuth redirect URI'
          }
        },
        required: ['action'],
        additionalProperties: false
      },
      handler: async (params) => {
        const correlationId = shopifyIntegration.generateCorrelationId();
        
        try {
          switch (params.action) {
            case 'generate_auth_url':
              if (!params.storeId) throw new Error('Store ID required for auth URL generation');
              return shopifyIntegration.auth.generateAuthUrl(params.storeId, params);
              
            case 'exchange_token':
              if (!params.storeId || !params.code) throw new Error('Store ID and code required for token exchange');
              return await shopifyIntegration.auth.exchangeCodeForToken(params.storeId, params.code, params.state);
              
            case 'validate_token':
              if (!params.storeId) throw new Error('Store ID required for token validation');
              return await shopifyIntegration.auth.validateToken(params.storeId);
              
            case 'revoke_token':
              if (!params.storeId) throw new Error('Store ID required for token revocation');
              return await shopifyIntegration.auth.revokeToken(params.storeId);
              
            case 'get_status':
              return await shopifyIntegration.auth.getAuthStatus();
              
            default:
              throw new Error(`Unsupported auth action: ${params.action}`);
          }
        } catch (error) {
          logger.error('Shopify auth operation failed', {
            correlationId,
            action: params.action,
            error: error.message
          });
          throw error;
        }
      }
    });

    // 2. Shopify Execute Tool (main tool execution interface)
    server.addTool({
      name: 'shopify-execute',
      description: 'Execute Shopify e-commerce operations across UK and USA stores',
      inputSchema: {
        type: 'object',
        properties: {
          tool: {
            type: 'string',
            enum: ['orders', 'products', 'customers', 'inventory', 'analytics', 'productManagement'],
            description: 'Shopify tool to execute'
          },
          action: {
            type: 'string',
            description: 'Specific action to perform within the tool'
          },
          params: {
            type: 'object',
            description: 'Parameters for the tool execution'
          }
        },
        required: ['tool', 'params'],
        additionalProperties: false
      },
      handler: async (params) => {
        const correlationId = shopifyIntegration.generateCorrelationId();
        
        try {
          logger.info('Executing Shopify tool', {
            correlationId,
            tool: params.tool,
            action: params.action
          });

          // Add correlation ID to params
          const toolParams = {
            ...params.params,
            correlationId
          };

          const result = await shopifyIntegration.executeTool(params.tool, toolParams);
          
          return {
            success: true,
            tool: params.tool,
            result,
            metadata: {
              correlationId,
              executedAt: new Date().toISOString()
            }
          };

        } catch (error) {
          logger.error('Shopify tool execution failed', {
            correlationId,
            tool: params.tool,
            error: error.message
          });
          
          return {
            success: false,
            tool: params.tool,
            error: error.message,
            metadata: {
              correlationId,
              failedAt: new Date().toISOString()
            }
          };
        }
      }
    });

    // 3. Shopify System Tool (system management and monitoring)
    server.addTool({
      name: 'shopify-system',
      description: 'Manage Shopify integration system, monitoring, and configuration',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['status', 'stats', 'health', 'clear_cache', 'test_connection', 'webhook_test'],
            description: 'System management action'
          },
          storeId: {
            type: 'string',
            enum: ['uk', 'usa', 'all'],
            description: 'Store to perform action on'
          },
          params: {
            type: 'object',
            description: 'Additional parameters for the action'
          }
        },
        required: ['action'],
        additionalProperties: false
      },
      handler: async (params) => {
        const correlationId = shopifyIntegration.generateCorrelationId();
        
        try {
          switch (params.action) {
            case 'status':
              return await shopifyIntegration.getSystemStatus();
              
            case 'stats':
              return {
                cache: await shopifyIntegration.cache.getStats(),
                errorHandler: shopifyIntegration.errorHandler.getErrorStats(),
                webhooks: shopifyIntegration.webhooks.getStats(),
                tools: shopifyIntegration.getToolsInfo()
              };
              
            case 'health':
              const cacheHealth = await shopifyIntegration.cache.healthCheck();
              const systemStatus = await shopifyIntegration.getSystemStatus();
              
              return {
                overall: cacheHealth.healthy && Object.values(systemStatus.stores).some(store => store.status === 'connected'),
                cache: cacheHealth,
                stores: systemStatus.stores,
                timestamp: new Date().toISOString()
              };
              
            case 'clear_cache':
              return await shopifyIntegration.clearCache(params.storeId);
              
            case 'test_connection':
              if (!params.storeId || params.storeId === 'all') {
                return await shopifyIntegration.getSystemStatus();
              } else {
                return await shopifyIntegration.auth.validateToken(params.storeId);
              }
              
            case 'webhook_test':
              const testData = params.params?.testData || { id: 'test-webhook' };
              const topic = params.params?.topic || 'orders/create';
              return await shopifyIntegration.webhooks.testWebhook(topic, testData);
              
            default:
              throw new Error(`Unsupported system action: ${params.action}`);
          }
        } catch (error) {
          logger.error('Shopify system operation failed', {
            correlationId,
            action: params.action,
            error: error.message
          });
          throw error;
        }
      }
    });

    // 4. Shopify Analytics Tool (business intelligence and insights)
    server.addTool({
      name: 'shopify-analytics',
      description: 'Advanced Shopify analytics and business intelligence across stores',
      inputSchema: {
        type: 'object',
        properties: {
          analysisType: {
            type: 'string',
            enum: ['cross_store', 'sales_trends', 'forecast', 'customer_clv', 'product_performance'],
            description: 'Type of analytics to perform'
          },
          storeId: {
            type: 'string',
            enum: ['uk', 'usa', 'all'],
            description: 'Store(s) to analyze',
            default: 'all'
          },
          dateRange: {
            type: 'object',
            properties: {
              from: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
              to: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }
            },
            description: 'Date range for analysis'
          },
          options: {
            type: 'object',
            description: 'Additional analysis options'
          }
        },
        required: ['analysisType'],
        additionalProperties: false
      },
      handler: async (params) => {
        const correlationId = shopifyIntegration.generateCorrelationId();
        
        try {
          logger.info('Executing Shopify analytics', {
            correlationId,
            analysisType: params.analysisType,
            storeId: params.storeId
          });

          switch (params.analysisType) {
            case 'cross_store':
              return await shopifyIntegration.getCrossStoreAnalytics({
                correlationId,
                ...params.options
              });
              
            case 'sales_trends':
              // Get sales data first, then analyze trends
              const salesParams = {
                storeId: params.storeId,
                dateRange: params.dateRange,
                includeAnalytics: true,
                correlationId
              };
              const salesResult = await shopifyIntegration.executeTool('analytics', salesParams);
              
              if (salesResult.success && salesResult.data.analytics) {
                const trends = shopifyIntegration.analytics.analyzeSalesTrends(
                  salesResult.data.analytics.summary.dailyBreakdown,
                  params.options
                );
                return { success: true, trends, sourceData: salesResult };
              }
              throw new Error('Failed to retrieve sales data for trend analysis');
              
            case 'forecast':
              // Similar to trends but for forecasting
              const forecastParams = {
                storeId: params.storeId,
                dateRange: params.dateRange,
                includeForecasting: true,
                correlationId
              };
              const forecastResult = await shopifyIntegration.executeTool('analytics', forecastParams);
              
              if (forecastResult.success && forecastResult.data.analytics) {
                return {
                  success: true,
                  forecast: forecastResult.data.analytics.forecasting,
                  sourceData: forecastResult
                };
              }
              throw new Error('Failed to generate sales forecast');
              
            case 'customer_clv':
              const customerParams = {
                storeId: params.storeId,
                includeAnalytics: true,
                correlationId
              };
              const customersResult = await shopifyIntegration.executeTool('customers', customerParams);
              
              if (customersResult.success && customersResult.data.customers) {
                const clvAnalysis = shopifyIntegration.analytics.analyzeCustomerLifetimeValue(
                  Object.values(customersResult.data.customers).flatMap(store => 
                    store.success ? store.customers : []
                  )
                );
                return { success: true, clvAnalysis, sourceData: customersResult };
              }
              throw new Error('Failed to retrieve customer data for CLV analysis');
              
            case 'product_performance':
              const productParams = {
                storeId: params.storeId,
                includeAnalytics: true,
                correlationId
              };
              const orderParams = {
                storeId: params.storeId,
                dateRange: params.dateRange,
                includeLineItems: true,
                correlationId
              };
              
              const [productsResult, ordersResult] = await Promise.all([
                shopifyIntegration.executeTool('products', productParams),
                shopifyIntegration.executeTool('orders', orderParams)
              ]);
              
              if (productsResult.success && ordersResult.success) {
                const products = Object.values(productsResult.data.products).flatMap(store => 
                  store.success ? store.products : []
                );
                const orders = Object.values(ordersResult.data.orders).flatMap(store => 
                  store.success ? store.orders : []
                );
                
                const performance = shopifyIntegration.analytics.analyzeProductPerformance(products, orders);
                return { 
                  success: true, 
                  performance, 
                  sourceData: { products: productsResult, orders: ordersResult }
                };
              }
              throw new Error('Failed to retrieve data for product performance analysis');
              
            default:
              throw new Error(`Unsupported analysis type: ${params.analysisType}`);
          }
          
        } catch (error) {
          logger.error('Shopify analytics failed', {
            correlationId,
            analysisType: params.analysisType,
            error: error.message
          });
          
          return {
            success: false,
            analysisType: params.analysisType,
            error: error.message,
            metadata: {
              correlationId,
              failedAt: new Date().toISOString()
            }
          };
        }
      }
    });

    logger.info('Shopify integration tools registered successfully', {
      toolsRegistered: 4,
      stores: Object.keys(shopifyIntegration.config.stores),
      features: ['orders', 'products', 'customers', 'inventory', 'analytics', 'webhooks']
    });

    return shopifyIntegration;

  } catch (error) {
    logger.error('Failed to register Shopify integration tools', {
      error: error.message
    });
    throw error;
  }
}
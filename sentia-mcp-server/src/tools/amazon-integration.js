/**
 * Amazon MCP Integration
 * 
 * Main integration file for registering Amazon tools with the MCP server.
 * Provides comprehensive marketplace management across UK, USA, EU, and Canada.
 * 
 * @version 1.0.0
 */

import { AmazonIntegration } from './amazon/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

/**
 * Initialize and register Amazon tools with MCP server
 */
export function registerAmazonTools(server) {
  try {
    logger.info('Registering Amazon integration tools');

    // Initialize Amazon integration
    const amazonIntegration = new AmazonIntegration({
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
      
      // Rate limiting configuration (SP-API has strict limits)
      rateLimiting: {
        enabled: true,
        maxRequests: 10, // Lower than Shopify due to SP-API limits
        timeWindow: 1000,
        burstLimit: 20
      },
      
      // Caching configuration
      caching: {
        enabled: true,
        defaultTTL: 600, // 10 minutes
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
      }
    });

    // Register Amazon authentication tool
    server.addTool({
      name: 'amazon-auth',
      description: 'Manage Amazon SP-API authentication across multiple marketplaces (UK, USA, EU, Canada)',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['status', 'test', 'refresh', 'disconnect'],
            default: 'status',
            description: 'Authentication action to perform'
          },
          marketplaceId: {
            type: 'string',
            enum: ['UK', 'USA', 'EU', 'CANADA', 'all'],
            description: 'Marketplace to authenticate with (or all for status)'
          },
          sandbox: {
            type: 'boolean',
            default: false,
            description: 'Use sandbox environment'
          }
        }
      },
      handler: async (params) => {
        const correlationId = `amazon-auth-${Date.now()}`;
        
        try {
          switch (params.action) {
            case 'status':
              return await amazonIntegration.auth.getAuthStatus();
            case 'test':
              if (params.marketplaceId === 'all') {
                return await amazonIntegration.auth.testAllConnections({
                  sandbox: params.sandbox,
                  correlationId
                });
              } else {
                return await amazonIntegration.auth.testConnection(params.marketplaceId, {
                  sandbox: params.sandbox,
                  correlationId
                });
              }
            case 'refresh':
              return await amazonIntegration.auth.refreshAllTokens({
                sandbox: params.sandbox,
                correlationId
              });
            case 'disconnect':
              return await amazonIntegration.auth.disconnect();
            default:
              throw new Error(`Unknown authentication action: ${params.action}`);
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            correlationId
          };
        }
      }
    });

    // Register Amazon execute tool
    server.addTool({
      name: 'amazon-execute',
      description: 'Execute Amazon marketplace operations across UK, USA, EU, and Canada with comprehensive business intelligence',
      inputSchema: {
        type: 'object',
        properties: {
          tool: {
            type: 'string',
            enum: ['orders', 'products', 'inventory', 'reports', 'listings', 'advertising'],
            description: 'Amazon tool to execute'
          },
          marketplaceId: {
            type: 'string',
            enum: ['UK', 'USA', 'EU', 'CANADA', 'A1F83G8C2ARO7P', 'ATVPDKIKX0DER', 'A1PA6795UKMFR9', 'A2EUQ1WTGCTBG2'],
            description: 'Amazon marketplace ID or name'
          },
          params: {
            type: 'object',
            description: 'Tool-specific parameters'
          }
        },
        required: ['tool', 'marketplaceId']
      },
      handler: async (params) => {
        try {
          const toolParams = {
            ...params.params,
            marketplaceId: params.marketplaceId
          };
          
          return await amazonIntegration.executeTool(params.tool, toolParams);
        } catch (error) {
          return {
            success: false,
            error: error.message,
            tool: params.tool,
            marketplace: params.marketplaceId
          };
        }
      }
    });

    // Register Amazon system tool
    server.addTool({
      name: 'amazon-system',
      description: 'Amazon system management and health monitoring',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['health', 'status', 'stats', 'clear-cache', 'marketplaces', 'tools'],
            default: 'health',
            description: 'System action to perform'
          },
          target: {
            type: 'string',
            description: 'Specific target for action (e.g., marketplace ID for cache clearing)'
          }
        }
      },
      handler: async (params) => {
        try {
          switch (params.action) {
            case 'health':
              return await amazonIntegration.getSystemHealth();
            case 'status':
              return {
                success: true,
                integration: 'amazon',
                marketplaces: amazonIntegration.getSupportedMarketplaces(),
                tools: amazonIntegration.getAvailableTools(),
                timestamp: new Date().toISOString()
              };
            case 'stats':
              return {
                success: true,
                stats: amazonIntegration.getSystemStats(),
                timestamp: new Date().toISOString()
              };
            case 'clear-cache':
              if (params.target) {
                return await amazonIntegration.cache.clearMarketplace(params.target);
              } else {
                return await amazonIntegration.clearAllCaches();
              }
            case 'marketplaces':
              return {
                success: true,
                marketplaces: amazonIntegration.getSupportedMarketplaces(),
                timestamp: new Date().toISOString()
              };
            case 'tools':
              return {
                success: true,
                tools: amazonIntegration.getAvailableTools(),
                timestamp: new Date().toISOString()
              };
            default:
              throw new Error(`Unknown system action: ${params.action}`);
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            action: params.action
          };
        }
      }
    });

    // Register Amazon analytics tool
    server.addTool({
      name: 'amazon-analytics',
      description: 'Advanced cross-marketplace analytics and business intelligence for Amazon',
      inputSchema: {
        type: 'object',
        properties: {
          analysisType: {
            type: 'string',
            enum: ['cross-marketplace', 'performance', 'compliance', 'optimization'],
            default: 'cross-marketplace',
            description: 'Type of analysis to perform'
          },
          marketplaces: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['UK', 'USA', 'EU', 'CANADA']
            },
            description: 'Marketplaces to include in analysis'
          },
          dateRange: {
            type: 'object',
            properties: {
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' }
            },
            description: 'Date range for analysis'
          },
          productData: {
            type: 'object',
            description: 'Product data for compliance analysis'
          }
        }
      },
      handler: async (params) => {
        try {
          switch (params.analysisType) {
            case 'cross-marketplace':
              return await amazonIntegration.getCrossMarketplaceAnalytics({
                marketplaces: params.marketplaces,
                dateRange: params.dateRange
              });
            case 'performance':
              return {
                success: true,
                performance: amazonIntegration.getSystemStats(),
                timestamp: new Date().toISOString()
              };
            case 'compliance':
              if (!params.productData || !params.marketplaces) {
                throw new Error('Product data and marketplaces required for compliance analysis');
              }
              const complianceResults = {};
              for (const marketplace of params.marketplaces) {
                complianceResults[marketplace] = await amazonIntegration.compliance.validateProductCompliance(
                  params.productData,
                  marketplace
                );
              }
              return {
                success: true,
                compliance: complianceResults,
                timestamp: new Date().toISOString()
              };
            case 'optimization':
              return await amazonIntegration.analytics.generateOptimizationReport(
                amazonIntegration.analytics.operationHistory
              );
            default:
              throw new Error(`Unknown analysis type: ${params.analysisType}`);
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            analysisType: params.analysisType
          };
        }
      }
    });

    logger.info('Amazon integration tools registered successfully', {
      tools: ['amazon-auth', 'amazon-execute', 'amazon-system', 'amazon-analytics'],
      marketplaces: Object.keys(amazonIntegration.config.marketplaces),
      features: {
        multiMarketplace: true,
        businessIntelligence: true,
        compliance: true,
        caching: true,
        errorHandling: true
      }
    });

    return {
      success: true,
      integration: amazonIntegration,
      tools: ['amazon-auth', 'amazon-execute', 'amazon-system', 'amazon-analytics']
    };

  } catch (error) {
    logger.error('Failed to register Amazon integration tools', {
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}
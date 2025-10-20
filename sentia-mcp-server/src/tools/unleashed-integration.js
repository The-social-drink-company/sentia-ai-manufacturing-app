/**
 * Unleashed ERP Integration for MCP Server
 * 
 * Comprehensive manufacturing operations integration with Unleashed Software API.
 * Provides enterprise-grade tools for production, inventory, and supply chain management.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../utils/logger.js';
import { SERVER_CONFIG } from '../config/server-config.js';
import { UnleashedAuth } from './unleashed/auth/unleashed-auth.js';
import { UnleashedAPIClient } from './unleashed/auth/api-client.js';
import { UnleashedAnalytics } from './unleashed/utils/analytics.js';
import { UnleashedCache } from './unleashed/utils/cache.js';
import { UnleashedErrorHandler } from './unleashed/utils/error-handler.js';
import { UnleashedRateLimiter } from './unleashed/utils/rate-limiter.js';
import { UnleashedDataValidator } from './unleashed/utils/data-validator.js';

// Import manufacturing tools
import { GetProductsTool } from './unleashed/tools/get-products.js';
import { GetInventoryTool } from './unleashed/tools/get-inventory.js';
import { GetProductionOrdersTool } from './unleashed/tools/get-production-orders.js';
import { GetPurchaseOrdersTool } from './unleashed/tools/get-purchase-orders.js';
import { GetSalesOrdersTool } from './unleashed/tools/get-sales-orders.js';
import { GetSuppliersTool } from './unleashed/tools/get-suppliers.js';
import { GetCustomersTool } from './unleashed/tools/get-customers.js';

const logger = createLogger();

/**
 * Unleashed ERP Integration Manager
 * Handles initialization, authentication, and tool registration
 */
export class UnleashedIntegration {
  constructor(server) {
    this.server = server;
    this.config = SERVER_CONFIG.integrations?.unleashed || this.getDefaultConfig();
    this.isInitialized = false;
    this.tools = new Map();
    
    // Initialize components
    this.auth = new UnleashedAuth(this.config);
    this.apiClient = new UnleashedAPIClient(this.config, this.auth);
    this.analytics = new UnleashedAnalytics();
    this.cache = new UnleashedCache(this.config.caching);
    this.errorHandler = new UnleashedErrorHandler();
    this.rateLimiter = new UnleashedRateLimiter(this.config.rateLimiting);
    this.dataValidator = new UnleashedDataValidator();
  }

  /**
   * Get default configuration if not provided in server config
   */
  getDefaultConfig() {
    return {
      apiKey: process.env.UNLEASHED_API_KEY,
      apiSecret: process.env.UNLEASHED_API_SECRET,
      baseUrl: process.env.UNLEASHED_BASE_URL || 'https://api.unleashedsoftware.com',
      apiVersion: process.env.UNLEASHED_API_VERSION || 'v1',
      timeout: 30000,
      maxRetries: 3,
      rateLimiting: {
        enabled: true,
        maxRequests: 40,
        timeWindow: 60000,
        retryAfter: 2000
      },
      caching: {
        enabled: true,
        defaultTTL: 300,
        productsTTL: 900,
        inventoryTTL: 60,
        ordersTTL: 180,
        suppliersTTL: 1800,
        customersTTL: 1800
      },
      manufacturing: {
        enableWIPTracking: true,
        enableCostAnalysis: true,
        enableQualityMetrics: true,
        enableEfficiencyAnalysis: true
      }
    };
  }

  /**
   * Initialize the Unleashed integration
   */
  async initialize() {
    try {
      logger.info('Initializing Unleashed ERP integration...');
      
      // Validate authentication
      await this.auth.validateCredentials();
      
      // Initialize components
      await this.apiClient.initialize();
      await this.analytics.initialize();
      await this.cache.initialize();
      await this.errorHandler.initialize();
      await this.rateLimiter.initialize();
      await this.dataValidator.initialize();
      
      // Create manufacturing tools
      await this.createManufacturingTools();
      
      this.isInitialized = true;
      logger.info('Unleashed ERP integration initialized successfully', {
        toolCount: this.tools.size,
        apiVersion: this.config.apiVersion,
        baseUrl: this.config.baseUrl
      });

      return true;

    } catch (error) {
      logger.error('Failed to initialize Unleashed integration', { error: error.message });
      throw error;
    }
  }

  /**
   * Create and register manufacturing tools
   */
  async createManufacturingTools() {
    const toolInstances = [
      new GetProductsTool(this.apiClient, this.cache, this.dataValidator),
      new GetInventoryTool(this.apiClient, this.cache, this.dataValidator),
      new GetProductionOrdersTool(this.apiClient, this.cache, this.dataValidator),
      new GetPurchaseOrdersTool(this.apiClient, this.cache, this.dataValidator),
      new GetSalesOrdersTool(this.apiClient, this.cache, this.dataValidator),
      new GetSuppliersTool(this.apiClient, this.cache, this.dataValidator),
      new GetCustomersTool(this.apiClient, this.cache, this.dataValidator)
    ];

    for (const tool of toolInstances) {
      try {
        await tool.initialize();
        this.tools.set(tool.name, tool);
        
        logger.info('Manufacturing tool created', {
          toolName: tool.name,
          category: tool.category,
          description: tool.description
        });
      } catch (error) {
        logger.error('Failed to create manufacturing tool', {
          toolName: tool.name,
          error: error.message
        });
      }
    }

    logger.info('Manufacturing tools creation completed', {
      successfulTools: this.tools.size,
      totalAttempted: toolInstances.length
    });
  }

  /**
   * Register all tools with the MCP server
   */
  async registerTools(server) {
    for (const [name, tool] of this.tools) {
      try {
        server.registerTool(name, {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          execute: tool.execute.bind(tool),
          category: 'unleashed',
          version: '1.0.0'
        });

        logger.info('Tool registered with MCP server', { toolName: name });
      } catch (error) {
        logger.error('Failed to register tool', {
          toolName: name,
          error: error.message
        });
      }
    }
  }

  /**
   * Get integration status and statistics
   */
  getStatus() {
    return {
      name: 'Unleashed ERP Integration',
      version: '1.0.0',
      initialized: this.isInitialized,
      toolCount: this.tools.size,
      availableTools: Array.from(this.tools.keys()),
      authentication: this.auth.getStatus(),
      cache: this.cache.getStatus(),
      rateLimiting: this.rateLimiter.getStatus(),
      analytics: this.analytics.getStatus()
    };
  }

  /**
   * Health check for the integration
   */
  async healthCheck() {
    try {
      const authStatus = await this.auth.validateCredentials();
      const apiStatus = await this.apiClient.healthCheck();
      
      return {
        status: 'healthy',
        authentication: authStatus,
        apiConnection: apiStatus,
        toolsRegistered: this.tools.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      logger.info('Cleaning up Unleashed integration...');
      
      await this.analytics.cleanup();
      await this.cache.cleanup();
      await this.rateLimiter.cleanup();
      
      this.tools.clear();
      this.isInitialized = false;
      
      logger.info('Unleashed integration cleanup completed');
      
    } catch (error) {
      logger.error('Error during Unleashed integration cleanup', { error: error.message });
    }
  }
}

/**
 * Register Unleashed tools with the MCP server
 * Main entry point for server integration
 */
export async function registerUnleashedTools(server) {
  try {
    logger.info('Registering Unleashed ERP tools...');

    // Initialize Unleashed integration
    const unleashedIntegration = new UnleashedIntegration(server);
    await unleashedIntegration.initialize();

    // Register tools with server
    await unleashedIntegration.registerTools(server);

    logger.info('Unleashed ERP tools registered successfully', {
      toolCount: unleashedIntegration.tools.size,
      tools: Array.from(unleashedIntegration.tools.keys())
    });

    return unleashedIntegration;

  } catch (error) {
    logger.error('Failed to register Unleashed tools', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
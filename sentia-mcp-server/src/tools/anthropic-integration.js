/**
 * Anthropic Claude AI Integration for MCP Server
 * 
 * Advanced business intelligence capabilities using Claude AI models for manufacturing operations.
 * Provides comprehensive analysis, reporting, and strategic planning tools.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../utils/logger.js';
import { SERVER_CONFIG } from '../config/server-config.js';
import { ClaudeAuth } from './anthropic/auth/claude-auth.js';
import { ClaudeClient } from './anthropic/utils/claude-client.js';
import { PromptBuilder } from './anthropic/utils/prompt-builder.js';
import { ResponseParser } from './anthropic/utils/response-parser.js';
import { CostOptimizer } from './anthropic/utils/cost-optimizer.js';
import { AnthropicAnalytics } from './anthropic/utils/analytics.js';

// Import business intelligence tools
import { FinancialAnalysisTool } from './anthropic/tools/financial-analysis.js';
import { SalesPerformanceTool } from './anthropic/tools/sales-performance.js';
import { BusinessReportsTool } from './anthropic/tools/business-reports.js';
import { InventoryOptimizationTool } from './anthropic/tools/inventory-optimization.js';
import { CompetitiveAnalysisTool } from './anthropic/tools/competitive-analysis.js';
import { StrategicPlanningTool } from './anthropic/tools/strategic-planning.js';

const logger = createLogger();

/**
 * Anthropic Claude Integration Manager
 * Handles initialization, authentication, and tool registration
 */
export class AnthropicIntegration {
  constructor(server) {
    this.server = server;
    this.config = SERVER_CONFIG.integrations.anthropic;
    this.isInitialized = false;
    this.tools = new Map();
    
    // Initialize components
    this.auth = new ClaudeAuth(this.config);
    this.client = new ClaudeClient(this.config, this.auth);
    this.promptBuilder = new PromptBuilder();
    this.responseParser = new ResponseParser();
    this.costOptimizer = new CostOptimizer();
    this.analytics = new AnthropicAnalytics();
  }

  /**
   * Initialize Anthropic integration
   */
  async initialize() {
    try {
      logger.info('Initializing Anthropic Claude integration...');

      // Validate API key
      await this.auth.validateApiKey();
      
      // Test client connection
      await this.client.testConnection();
      
      // Initialize analytics
      await this.analytics.initialize();
      
      this.isInitialized = true;
      
      logger.info('Anthropic integration initialized successfully', {
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      return true;

    } catch (error) {
      logger.error('Failed to initialize Anthropic integration', {
        error: error.message,
        stack: error.stack
      });
      
      throw new Error(`Anthropic initialization failed: ${error.message}`);
    }
  }

  /**
   * Get available Claude tools
   */
  getAvailableTools() {
    return [
      {
        name: 'claude-analyze-financial-data',
        description: 'Comprehensive financial statement analysis with trend identification and forecasting',
        category: 'financial',
        tool: FinancialAnalysisTool
      },
      {
        name: 'claude-analyze-sales-performance',
        description: 'Sales trend analysis with customer behavior patterns and revenue optimization',
        category: 'sales',
        tool: SalesPerformanceTool
      },
      {
        name: 'claude-generate-business-reports',
        description: 'Executive dashboard summaries and strategic planning documents',
        category: 'reporting',
        tool: BusinessReportsTool
      },
      {
        name: 'claude-inventory-optimization',
        description: 'Demand forecasting analysis with inventory level optimization',
        category: 'operations',
        tool: InventoryOptimizationTool
      },
      {
        name: 'claude-competitive-analysis',
        description: 'Market positioning analysis with competitor insights and pricing strategies',
        category: 'strategy',
        tool: CompetitiveAnalysisTool
      },
      {
        name: 'claude-strategic-planning',
        description: 'Business strategy development with growth opportunity identification',
        category: 'strategy',
        tool: StrategicPlanningTool
      }
    ];
  }

  /**
   * Register all Anthropic tools with the MCP server
   */
  async registerTools() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const availableTools = this.getAvailableTools();
    
    for (const toolConfig of availableTools) {
      try {
        // Create tool instance with dependencies
        const toolInstance = new toolConfig.tool({
          client: this.client,
          promptBuilder: this.promptBuilder,
          responseParser: this.responseParser,
          costOptimizer: this.costOptimizer,
          analytics: this.analytics,
          server: this.server,
          logger: logger
        });

        // Initialize tool
        await toolInstance.initialize();

        // Register with MCP server
        this.server.tools.set(toolConfig.name, {
          name: toolConfig.name,
          description: toolConfig.description,
          category: toolConfig.category,
          version: '1.0.0',
          inputSchema: toolInstance.getInputSchema(),
          execute: toolInstance.execute.bind(toolInstance)
        });

        this.tools.set(toolConfig.name, toolInstance);

        logger.info('Anthropic tool registered', {
          toolName: toolConfig.name,
          category: toolConfig.category
        });

      } catch (error) {
        logger.error('Failed to register Anthropic tool', {
          toolName: toolConfig.name,
          error: error.message
        });
      }
    }

    logger.info('Anthropic tools registration completed', {
      totalTools: this.tools.size,
      registeredTools: Array.from(this.tools.keys())
    });
  }

  /**
   * Get integration health status
   */
  async getHealthStatus() {
    try {
      const status = {
        name: 'Anthropic Claude',
        status: 'healthy',
        initialized: this.isInitialized,
        tools: {
          registered: this.tools.size,
          available: this.getAvailableTools().length
        },
        config: {
          model: this.config.model,
          maxTokens: this.config.maxTokens,
          temperature: this.config.temperature
        }
      };

      // Test API connectivity
      if (this.isInitialized) {
        const connectionTest = await this.client.testConnection();
        status.connectivity = connectionTest ? 'connected' : 'disconnected';
        
        // Get usage analytics
        const analytics = await this.analytics.getUsageStats();
        status.usage = analytics;
      }

      return status;

    } catch (error) {
      return {
        name: 'Anthropic Claude',
        status: 'unhealthy',
        error: error.message,
        initialized: this.isInitialized
      };
    }
  }

  /**
   * Execute tool with enhanced monitoring
   */
  async executeTool(toolName, params) {
    const startTime = Date.now();
    
    try {
      if (!this.tools.has(toolName)) {
        throw new Error(`Tool ${toolName} not found`);
      }

      const tool = this.tools.get(toolName);
      
      // Track execution
      this.analytics.trackExecution(toolName, 'started');
      
      const result = await tool.execute(params);
      
      const executionTime = Date.now() - startTime;
      
      // Track success
      this.analytics.trackExecution(toolName, 'completed', {
        executionTime,
        tokensUsed: result.metadata?.tokensUsed || 0
      });

      logger.info('Anthropic tool executed successfully', {
        toolName,
        executionTime,
        tokensUsed: result.metadata?.tokensUsed
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Track error
      this.analytics.trackExecution(toolName, 'failed', {
        executionTime,
        error: error.message
      });

      logger.error('Anthropic tool execution failed', {
        toolName,
        executionTime,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      if (this.analytics) {
        await this.analytics.cleanup();
      }
      
      this.tools.clear();
      this.isInitialized = false;
      
      logger.info('Anthropic integration cleaned up');
      
    } catch (error) {
      logger.error('Error during Anthropic cleanup', {
        error: error.message
      });
    }
  }
}

/**
 * Register Anthropic tools with MCP server
 * @param {Object} server - MCP server instance
 */
export async function registerAnthropicTools(server) {
  try {
    logger.info('Starting Anthropic integration registration...');

    // Check if API key is configured
    if (!SERVER_CONFIG.integrations.anthropic.apiKey) {
      logger.warn('Anthropic API key not configured, skipping integration');
      return;
    }

    // Create integration instance
    const integration = new AnthropicIntegration(server);
    
    // Store integration reference on server
    server.anthropicIntegration = integration;
    
    // Register tools
    await integration.registerTools();
    
    logger.info('Anthropic integration registered successfully', {
      toolsRegistered: integration.tools.size
    });

    return integration;

  } catch (error) {
    logger.error('Failed to register Anthropic integration', {
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

/**
 * Export default integration for standalone usage
 */
export default AnthropicIntegration;
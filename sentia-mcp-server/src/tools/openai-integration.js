/**
 * OpenAI GPT Integration for MCP Server
 * 
 * Comprehensive business intelligence capabilities using OpenAI GPT models for manufacturing operations.
 * Provides complementary AI analysis, content generation, and operational optimization tools.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../utils/logger.js';
import { SERVER_CONFIG } from '../config/server-config.js';
import { OpenAIAuth } from './openai/auth/openai-auth.js';
import { OpenAIClient } from './openai/utils/openai-client.js';
import { FunctionCalling } from './openai/utils/function-calling.js';
import { PromptOptimizer } from './openai/utils/prompt-optimizer.js';
import { ResponseValidator } from './openai/utils/response-validator.js';
import { CostTracker } from './openai/utils/cost-tracker.js';
import { OpenAIAnalytics } from './openai/utils/analytics.js';

// Import business intelligence tools
import { DataAnalysisTool } from './openai/tools/data-analysis.js';
import { ContentGenerationTool } from './openai/tools/content-generation.js';
import { CustomerInsightsTool } from './openai/tools/customer-insights.js';
import { OperationalOptimizationTool } from './openai/tools/operational-optimization.js';
import { ForecastingTool } from './openai/tools/forecasting.js';
import { AutomatedReportingTool } from './openai/tools/automated-reporting.js';

const logger = createLogger();

/**
 * OpenAI GPT Integration Manager
 * Handles initialization, authentication, and tool registration
 */
export class OpenAIIntegration {
  constructor(server) {
    this.server = server;
    this.config = SERVER_CONFIG.integrations?.openai || this.getDefaultConfig();
    this.isInitialized = false;
    this.tools = new Map();
    
    // Initialize components
    this.auth = new OpenAIAuth(this.config);
    this.client = new OpenAIClient(this.config, this.auth);
    this.functionCalling = new FunctionCalling();
    this.promptOptimizer = new PromptOptimizer();
    this.responseValidator = new ResponseValidator();
    this.costTracker = new CostTracker();
    this.analytics = new OpenAIAnalytics();
  }

  /**
   * Get default configuration if not provided in server config
   */
  getDefaultConfig() {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      organizationId: process.env.OPENAI_ORGANIZATION_ID,
      projectId: process.env.OPENAI_PROJECT_ID,
      model: 'gpt-4o',
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      timeout: 30000,
      maxRetries: 3,
      enableFunctionCalling: true,
      enableStreaming: true,
      costOptimization: true
    };
  }

  /**
   * Initialize the OpenAI integration
   */
  async initialize() {
    try {
      logger.info('Initializing OpenAI GPT integration...');
      
      // Validate authentication
      await this.auth.validateApiKey();
      
      // Initialize components
      await this.client.initialize();
      await this.functionCalling.initialize();
      await this.promptOptimizer.initialize();
      await this.responseValidator.initialize();
      await this.costTracker.initialize();
      await this.analytics.initialize();
      
      // Create business intelligence tools
      await this.createBusinessTools();
      
      this.isInitialized = true;
      logger.info('OpenAI GPT integration initialized successfully', {
        toolCount: this.tools.size,
        model: this.config.model,
        functionCalling: this.config.enableFunctionCalling
      });
      
      return true;

    } catch (error) {
      logger.error('Failed to initialize OpenAI GPT integration', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create and configure business intelligence tools
   */
  async createBusinessTools() {
    const dependencies = {
      client: this.client,
      functionCalling: this.functionCalling,
      promptOptimizer: this.promptOptimizer,
      responseValidator: this.responseValidator,
      costTracker: this.costTracker,
      analytics: this.analytics,
      server: this.server,
      logger: logger
    };

    // Data Analysis Tool
    const dataAnalysis = new DataAnalysisTool(dependencies);
    await dataAnalysis.initialize();
    this.tools.set('openai-data-analysis', dataAnalysis);

    // Content Generation Tool
    const contentGeneration = new ContentGenerationTool(dependencies);
    await contentGeneration.initialize();
    this.tools.set('openai-content-generation', contentGeneration);

    // Customer Insights Tool
    const customerInsights = new CustomerInsightsTool(dependencies);
    await customerInsights.initialize();
    this.tools.set('openai-customer-insights', customerInsights);

    // Operational Optimization Tool
    const operationalOptimization = new OperationalOptimizationTool(dependencies);
    await operationalOptimization.initialize();
    this.tools.set('openai-operational-optimization', operationalOptimization);

    // Forecasting Tool
    const forecasting = new ForecastingTool(dependencies);
    await forecasting.initialize();
    this.tools.set('openai-forecasting', forecasting);

    // Automated Reporting Tool
    const automatedReporting = new AutomatedReportingTool(dependencies);
    await automatedReporting.initialize();
    this.tools.set('openai-automated-reporting', automatedReporting);

    logger.info('OpenAI business intelligence tools created', {
      toolCount: this.tools.size,
      tools: Array.from(this.tools.keys())
    });
  }

  /**
   * Register all OpenAI tools with the MCP server
   */
  async registerTools() {
    try {
      for (const [toolName, tool] of this.tools) {
        // Create tool wrapper for server registration
        const toolWrapper = {
          name: toolName,
          description: tool.getDescription ? tool.getDescription() : tool.description || `OpenAI ${toolName}`,
          category: tool.category || 'openai',
          version: tool.version || '1.0.0',
          inputSchema: tool.getInputSchema ? tool.getInputSchema() : tool.inputSchema || { type: 'object', properties: {} },
          execute: async (params) => {
            // Track usage
            if (this.analytics && this.analytics.trackToolUsage) {
              this.analytics.trackToolUsage(toolName);
            }
            
            // Validate input if validator available
            if (this.responseValidator && this.responseValidator.validateInput) {
              const validationResult = this.responseValidator.validateInput(params, tool.getInputSchema ? tool.getInputSchema() : tool.inputSchema);
              if (validationResult && !validationResult.valid) {
                throw new Error(`Invalid input: ${validationResult.errors.join(', ')}`);
              }
            }
            
            // Execute tool
            const startTime = Date.now();
            try {
              const result = await tool.execute(params);
              
              // Track metrics if available
              if (this.costTracker && this.costTracker.trackUsage) {
                const duration = Date.now() - startTime;
                this.costTracker.trackUsage(toolName, {
                  duration,
                  inputTokens: result.usage?.prompt_tokens || 0,
                  outputTokens: result.usage?.completion_tokens || 0,
                  model: this.config.model
                });
              }
              
              return result;
              
            } catch (error) {
              if (this.analytics && this.analytics.trackError) {
                this.analytics.trackError(toolName, error);
              }
              throw error;
            }
          }
        };

        // Register tool with server using addTool method
        const registered = this.server.addTool(toolWrapper);
        
        if (registered) {
          logger.info('OpenAI tool registered', {
            tool: toolName,
            category: toolWrapper.category,
            version: toolWrapper.version
          });
        } else {
          logger.warn('Failed to register OpenAI tool', { tool: toolName });
        }
      }

      logger.info('All OpenAI tools registration completed', {
        registeredTools: Array.from(this.tools.keys())
      });

    } catch (error) {
      logger.error('Failed to register OpenAI tools', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get integration status and health information
   */
  getStatus() {
    return {
      name: 'OpenAI GPT Integration',
      version: '1.0.0',
      initialized: this.isInitialized,
      model: this.config.model,
      toolCount: this.tools.size,
      tools: Array.from(this.tools.keys()),
      functionCalling: this.config.enableFunctionCalling,
      streaming: this.config.enableStreaming,
      costOptimization: this.config.costOptimization,
      usage: this.costTracker.getUsageStats(),
      analytics: this.analytics.getStats()
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      logger.info('Cleaning up OpenAI integration...');
      
      // Cleanup components
      await this.analytics.cleanup();
      await this.costTracker.cleanup();
      await this.client.cleanup();
      
      this.tools.clear();
      this.isInitialized = false;
      
      logger.info('OpenAI integration cleanup completed');
      
    } catch (error) {
      logger.error('Error during OpenAI integration cleanup', {
        error: error.message
      });
    }
  }
}

/**
 * Register OpenAI tools with the MCP server
 * Main entry point for server integration
 */
export async function registerOpenAITools(server) {
  try {
    logger.info('Starting OpenAI tools registration...');
    
    // Create integration instance
    const integration = new OpenAIIntegration(server);
    
    // Initialize and register tools
    await integration.initialize();
    await integration.registerTools();
    
    // Store integration reference for cleanup
    server.openaiIntegration = integration;
    
    logger.info('OpenAI tools registration completed successfully', {
      toolCount: integration.tools.size,
      model: integration.config.model
    });
    
    return integration;

  } catch (error) {
    logger.error('Failed to register OpenAI tools', {
      error: error.message,
      stack: error.stack
    });
    
    // Don't throw the error to prevent server startup failure
    // Log it and continue with other integrations
    return null;
  }
}
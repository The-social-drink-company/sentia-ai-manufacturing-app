/**
 * OpenAI Integration Test Suite
 * 
 * Comprehensive tests for OpenAI GPT integration with MCP server.
 * Tests authentication, tools, utilities, and overall integration.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { strict as assert } from 'assert';
import { test } from 'node:test';
import { OpenAIIntegration, registerOpenAITools } from '../src/tools/openai-integration.js';

// Mock server for testing
const mockServer = {
  tools: new Map(),
  setRequestHandler: (name, handler) => {
    console.log(`Request handler registered: ${name}`);
  },
  registerTool: (name, tool) => {
    mockServer.tools.set(name, tool);
    console.log(`Tool registered: ${name} (${tool.category})`);
  }
};

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'sk-test-key-for-validation-only';

test('OpenAI Integration Test Suite', async (t) => {
  
  await t.test('Main Integration Class', async (subTest) => {
    
    await subTest.test('should initialize correctly with proper dependencies', async () => {
      const integration = new OpenAIIntegration(mockServer);
      
      assert(integration !== undefined, 'Integration should be defined');
      assert(integration.server === mockServer, 'Server reference should be set');
      assert(integration.config !== undefined, 'Config should be defined');
      assert(integration.tools instanceof Map, 'Tools should be a Map');
      assert(integration.isInitialized === false, 'Should not be initialized yet');
    });

    await subTest.test('should have correct default configuration', async () => {
      const integration = new OpenAIIntegration(mockServer);
      
      assert(integration.config.model === 'gpt-4o', 'Default model should be gpt-4o');
      assert(integration.config.maxTokens === 4096, 'Default max tokens should be 4096');
      assert(integration.config.temperature === 0.7, 'Default temperature should be 0.7');
      assert(integration.config.enableFunctionCalling === true, 'Function calling should be enabled');
      assert(integration.config.enableStreaming === true, 'Streaming should be enabled');
    });

  });

  await t.test('Authentication Module', async (subTest) => {
    
    const { OpenAIAuth } = await import('../src/tools/openai/auth/openai-auth.js');
    
    await subTest.test('should initialize with API key', async () => {
      const config = { apiKey: 'sk-test-key' };
      const auth = new OpenAIAuth(config);
      
      assert(auth.apiKey === 'sk-test-key', 'API key should be set');
      assert(auth.isValidated === false, 'Should not be validated initially');
    });

    await subTest.test('should validate environment configuration', async () => {
      const validation = OpenAIAuth.validateEnvironment();
      
      assert(typeof validation === 'object', 'Validation should return an object');
      assert('valid' in validation, 'Validation should have valid property');
      assert('issues' in validation, 'Validation should have issues property');
    });

    await subTest.test('should create auth headers', async () => {
      const config = { apiKey: 'sk-test-key' };
      const auth = new OpenAIAuth(config);
      auth.isValidated = true; // Mock validation
      
      const headers = auth.getAuthHeaders();
      
      assert(headers.Authorization === 'Bearer sk-test-key', 'Authorization header should be correct');
      assert(headers['Content-Type'] === 'application/json', 'Content-Type should be set');
    });

  });

  await t.test('OpenAI Client Wrapper', async (subTest) => {
    
    const { OpenAIClient } = await import('../src/tools/openai/utils/openai-client.js');
    
    await subTest.test('should initialize with configuration', async () => {
      const config = { model: 'gpt-4o', maxTokens: 2048 };
      const mockAuth = { isValidated: false };
      const client = new OpenAIClient(config, mockAuth);
      
      assert(client.config.model === 'gpt-4o', 'Model should be set from config');
      assert(client.config.maxTokens === 2048, 'Max tokens should be set from config');
      assert(client.isInitialized === false, 'Should not be initialized');
    });

    await subTest.test('should have model configurations', async () => {
      const config = {};
      const mockAuth = {};
      const client = new OpenAIClient(config, mockAuth);
      
      assert(client.modelConfigs.has('gpt-4o'), 'Should have gpt-4o config');
      assert(client.modelConfigs.has('gpt-4o-mini'), 'Should have gpt-4o-mini config');
      assert(client.modelConfigs.has('gpt-3.5-turbo'), 'Should have gpt-3.5-turbo config');
      
      const gpt4oConfig = client.modelConfigs.get('gpt-4o');
      assert(gpt4oConfig.maxTokens === 128000, 'GPT-4o should have correct max tokens');
      assert(gpt4oConfig.costPer1KInputTokens > 0, 'Should have input cost');
      assert(gpt4oConfig.costPer1KOutputTokens > 0, 'Should have output cost');
    });

    await subTest.test('should optimize parameters for cost', async () => {
      const config = { costOptimization: true };
      const mockAuth = {};
      const client = new OpenAIClient(config, mockAuth);
      
      const params = { messages: [{ role: 'user', content: 'test' }] };
      const optimized = client.optimizeParameters(params);
      
      assert(optimized.model === 'gpt-4o-mini', 'Should choose cost-effective model');
      assert(optimized.max_tokens <= 1024, 'Should limit tokens for cost optimization');
      assert(optimized.temperature === 0.3, 'Should use deterministic temperature');
    });

  });

  await t.test('Function Calling System', async (subTest) => {
    
    const { FunctionCalling } = await import('../src/tools/openai/utils/function-calling.js');
    
    await subTest.test('should initialize with core functions', async () => {
      const functionCalling = new FunctionCalling();
      await functionCalling.initialize();
      
      assert(functionCalling.isInitialized === true, 'Should be initialized');
      assert(functionCalling.functions.size > 0, 'Should have registered functions');
      assert(functionCalling.workflows.size > 0, 'Should have registered workflows');
    });

    await subTest.test('should have manufacturing-specific functions', async () => {
      const functionCalling = new FunctionCalling();
      await functionCalling.initialize();
      
      assert(functionCalling.functions.has('calculate_manufacturing_metrics'), 'Should have manufacturing metrics function');
      assert(functionCalling.functions.has('analyze_inventory_levels'), 'Should have inventory analysis function');
      assert(functionCalling.functions.has('calculate_financial_ratios'), 'Should have financial ratios function');
    });

    await subTest.test('should provide function definitions for OpenAI', async () => {
      const functionCalling = new FunctionCalling();
      await functionCalling.initialize();
      
      const definitions = functionCalling.getFunctionDefinitions();
      
      assert(Array.isArray(definitions), 'Should return array of definitions');
      assert(definitions.length > 0, 'Should have function definitions');
      assert(definitions[0].name, 'Should have function name');
      assert(definitions[0].description, 'Should have function description');
      assert(definitions[0].parameters, 'Should have function parameters');
    });

  });

  await t.test('Business Intelligence Tools', async (subTest) => {
    
    await subTest.test('Data Analysis Tool', async () => {
      const { DataAnalysisTool } = await import('../src/tools/openai/tools/data-analysis.js');
      
      const mockDependencies = {
        client: { createChatCompletion: async () => ({ choices: [{ message: { content: 'test analysis' } }] }) },
        functionCalling: { getFunctionDefinitions: () => [] },
        promptOptimizer: {},
        responseValidator: { validateInput: () => ({ valid: true }) },
        costTracker: {},
        analytics: {},
        server: mockServer,
        logger: { info: () => {}, error: () => {} }
      };
      
      const tool = new DataAnalysisTool(mockDependencies);
      const initialized = await tool.initialize();
      
      assert(initialized === true, 'Tool should initialize successfully');
      assert(tool.toolName === 'openai-data-analysis', 'Tool name should be correct');
      assert(tool.category === 'analytics', 'Tool category should be analytics');
      assert(tool.version === '1.0.0', 'Tool version should be set');
    });

    await subTest.test('Content Generation Tool', async () => {
      const { ContentGenerationTool } = await import('../src/tools/openai/tools/content-generation.js');
      
      const mockDependencies = {
        client: { createChatCompletion: async () => ({ choices: [{ message: { content: 'test content' } }] }) },
        functionCalling: {},
        promptOptimizer: {},
        responseValidator: { validateInput: () => ({ valid: true }) },
        costTracker: {},
        analytics: {},
        server: mockServer,
        logger: { info: () => {}, error: () => {} }
      };
      
      const tool = new ContentGenerationTool(mockDependencies);
      const initialized = await tool.initialize();
      
      assert(initialized === true, 'Tool should initialize successfully');
      assert(tool.toolName === 'openai-content-generation', 'Tool name should be correct');
      assert(tool.category === 'content', 'Tool category should be content');
    });

    await subTest.test('Customer Insights Tool', async () => {
      const { CustomerInsightsTool } = await import('../src/tools/openai/tools/customer-insights.js');
      
      const mockDependencies = {
        client: { createChatCompletion: async () => ({ choices: [{ message: { content: 'test insights' } }] }) },
        functionCalling: {},
        promptOptimizer: {},
        responseValidator: { validateInput: () => ({ valid: true }) },
        costTracker: {},
        analytics: {},
        server: mockServer,
        logger: { info: () => {}, error: () => {} }
      };
      
      const tool = new CustomerInsightsTool(mockDependencies);
      const initialized = await tool.initialize();
      
      assert(initialized === true, 'Tool should initialize successfully');
      assert(tool.toolName === 'openai-customer-insights', 'Tool name should be correct');
      assert(tool.category === 'customer_analytics', 'Tool category should be customer_analytics');
    });

    await subTest.test('All tools should have required methods', async () => {
      const tools = [
        '../src/tools/openai/tools/data-analysis.js',
        '../src/tools/openai/tools/content-generation.js',
        '../src/tools/openai/tools/customer-insights.js',
        '../src/tools/openai/tools/operational-optimization.js',
        '../src/tools/openai/tools/forecasting.js',
        '../src/tools/openai/tools/automated-reporting.js'
      ];
      
      for (const toolPath of tools) {
        const toolModule = await import(toolPath);
        const ToolClass = Object.values(toolModule)[0];
        
        const mockDependencies = {
          client: {},
          functionCalling: {},
          promptOptimizer: {},
          responseValidator: { validateInput: () => ({ valid: true }) },
          costTracker: {},
          analytics: {},
          server: mockServer,
          logger: { info: () => {}, error: () => {} }
        };
        
        const tool = new ToolClass(mockDependencies);
        
        assert(typeof tool.initialize === 'function', `${toolPath} should have initialize method`);
        assert(typeof tool.getDescription === 'function', `${toolPath} should have getDescription method`);
        assert(typeof tool.getInputSchema === 'function', `${toolPath} should have getInputSchema method`);
        assert(typeof tool.execute === 'function', `${toolPath} should have execute method`);
        assert(typeof tool.validateDependencies === 'function', `${toolPath} should have validateDependencies method`);
      }
    });

  });

  await t.test('Utility Modules', async (subTest) => {
    
    await subTest.test('Prompt Optimizer', async () => {
      const { PromptOptimizer } = await import('../src/tools/openai/utils/prompt-optimizer.js');
      
      const optimizer = new PromptOptimizer();
      await optimizer.initialize();
      
      assert(optimizer.isInitialized === true, 'Should be initialized');
      assert(optimizer.templates.size > 0, 'Should have prompt templates');
      assert(optimizer.optimizationStrategies.size > 0, 'Should have optimization strategies');
      
      // Test prompt optimization
      const testPrompt = 'This is a very very long test prompt that needs optimization';
      const result = optimizer.optimizePrompt(testPrompt, { strategy: 'token_efficiency' });
      
      assert(result.optimized_prompt, 'Should return optimized prompt');
      assert(result.optimized_length <= result.original_length, 'Should reduce length');
      assert(result.token_info, 'Should provide token information');
    });

    await subTest.test('Response Validator', async () => {
      const { ResponseValidator } = await import('../src/tools/openai/utils/response-validator.js');
      
      const validator = new ResponseValidator();
      await validator.initialize();
      
      assert(validator.isInitialized === true, 'Should be initialized');
      assert(validator.validationRules.size > 0, 'Should have validation rules');
      
      // Test response validation
      const testResponse = 'This is a comprehensive manufacturing analysis with proper business recommendations and ROI considerations.';
      const result = validator.validateResponse(testResponse);
      
      assert(result.valid === true, 'Should validate successful response');
      assert(result.score > 0, 'Should have quality score');
      assert(Array.isArray(result.errors), 'Should have errors array');
      assert(Array.isArray(result.warnings), 'Should have warnings array');
    });

    await subTest.test('Cost Tracker', async () => {
      const { CostTracker } = await import('../src/tools/openai/utils/cost-tracker.js');
      
      const tracker = new CostTracker();
      await tracker.initialize();
      
      assert(tracker.isInitialized === true, 'Should be initialized');
      assert(tracker.modelPricing.size > 0, 'Should have model pricing');
      
      // Test usage tracking
      const usage = tracker.trackUsage('test-tool', {
        model: 'gpt-4o',
        inputTokens: 100,
        outputTokens: 200,
        duration: 1000
      });
      
      assert(usage !== null, 'Should track usage successfully');
      assert(usage.cost.total > 0, 'Should calculate cost');
      assert(usage.tokens.total === 300, 'Should sum tokens correctly');
    });

    await subTest.test('Analytics Module', async () => {
      const { OpenAIAnalytics } = await import('../src/tools/openai/utils/analytics.js');
      
      const analytics = new OpenAIAnalytics();
      await analytics.initialize();
      
      assert(analytics.isInitialized === true, 'Should be initialized');
      
      // Test analytics tracking
      analytics.trackToolUsage('test-tool', { responseTime: 1000, tokens: 100 });
      analytics.trackPerformance('test-tool', { 
        responseTime: 1000, 
        tokensUsed: 100, 
        cost: 0.01, 
        success: true 
      });
      
      const stats = analytics.getStats();
      
      assert(stats.total_requests > 0, 'Should track requests');
      assert(stats.tool_breakdown, 'Should provide tool breakdown');
      assert(stats.performance, 'Should provide performance metrics');
    });

  });

  await t.test('Integration Registration', async (subTest) => {
    
    await subTest.test('should register all tools with mock server', async () => {
      const initialToolCount = mockServer.tools.size;
      
      const integration = await registerOpenAITools(mockServer);
      
      assert(integration !== null, 'Registration should return integration instance');
      assert(mockServer.tools.size > initialToolCount, 'Should register new tools');
      
      // Check that specific OpenAI tools are registered
      const expectedTools = [
        'openai-data-analysis',
        'openai-content-generation',
        'openai-customer-insights',
        'openai-operational-optimization',
        'openai-forecasting',
        'openai-automated-reporting'
      ];
      
      for (const toolName of expectedTools) {
        assert(mockServer.tools.has(toolName), `Should register ${toolName} tool`);
        
        const tool = mockServer.tools.get(toolName);
        assert(tool.name === toolName, 'Tool name should match');
        assert(tool.description, 'Tool should have description');
        assert(tool.category, 'Tool should have category');
        assert(typeof tool.execute === 'function', 'Tool should have execute function');
      }
    });

    await subTest.test('should handle registration errors gracefully', async () => {
      // Mock server that throws errors
      const errorServer = {
        registerTool: () => { throw new Error('Registration failed'); }
      };
      
      // Should not throw error, but return null
      const integration = await registerOpenAITools(errorServer);
      assert(integration === null, 'Should return null on registration failure');
    });

  });

  await t.test('Tool Schemas and Validation', async (subTest) => {
    
    await subTest.test('all tools should have valid input schemas', async () => {
      const tools = [
        '../src/tools/openai/tools/data-analysis.js',
        '../src/tools/openai/tools/content-generation.js',
        '../src/tools/openai/tools/customer-insights.js',
        '../src/tools/openai/tools/operational-optimization.js',
        '../src/tools/openai/tools/forecasting.js',
        '../src/tools/openai/tools/automated-reporting.js'
      ];
      
      for (const toolPath of tools) {
        const toolModule = await import(toolPath);
        const ToolClass = Object.values(toolModule)[0];
        
        const mockDependencies = {
          client: {},
          functionCalling: {},
          promptOptimizer: {},
          responseValidator: {},
          costTracker: {},
          analytics: {},
          server: mockServer,
          logger: { info: () => {}, error: () => {} }
        };
        
        const tool = new ToolClass(mockDependencies);
        const schema = tool.getInputSchema();
        
        assert(schema.type === 'object', `${toolPath} schema should be object type`);
        assert(schema.properties, `${toolPath} should have properties`);
        assert(Array.isArray(schema.required), `${toolPath} should have required array`);
        assert(schema.required.length > 0, `${toolPath} should have required parameters`);
      }
    });

  });

});

console.log('OpenAI Integration Test Suite completed. All core components validated.');
/**
 * Anthropic Claude AI Integration Tests
 * 
 * Comprehensive test suite for all Anthropic integration components
 * including authentication, tools, utilities, and error handling.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';

// Import integration components
import { AnthropicIntegration, registerAnthropicTools } from '../src/tools/anthropic-integration.js';
import { ClaudeAuth } from '../src/tools/anthropic/auth/claude-auth.js';
import { ClaudeClient } from '../src/tools/anthropic/utils/claude-client.js';
import { PromptBuilder } from '../src/tools/anthropic/utils/prompt-builder.js';
import { ResponseParser } from '../src/tools/anthropic/utils/response-parser.js';
import { CostOptimizer } from '../src/tools/anthropic/utils/cost-optimizer.js';
import { Analytics } from '../src/tools/anthropic/utils/analytics.js';

// Import business intelligence tools
import { FinancialAnalysisTool } from '../src/tools/anthropic/tools/financial-analysis.js';
import { SalesPerformanceTool } from '../src/tools/anthropic/tools/sales-performance.js';
import { BusinessReportsTool } from '../src/tools/anthropic/tools/business-reports.js';
import { InventoryOptimizationTool } from '../src/tools/anthropic/tools/inventory-optimization.js';
import { CompetitiveAnalysisTool } from '../src/tools/anthropic/tools/competitive-analysis.js';
import { StrategicPlanningTool } from '../src/tools/anthropic/tools/strategic-planning.js';

// Mock server for testing
const mockServer = {
  setRequestHandler: jest.fn(),
  tools: new Map(),
  registerTool: jest.fn((name, tool) => {
    mockServer.tools.set(name, tool);
  })
};

// Mock configuration
const mockConfig = {
  anthropic: {
    apiKey: 'test-api-key-sk-ant-api03-test',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    temperature: 0.7,
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 40000
    },
    costOptimization: {
      enabled: true,
      dailyBudget: 100,
      monthlyBudget: 2000
    }
  }
};

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('Anthropic Integration', () => {
  let integration;
  let mockAnthropicSDK;

  beforeAll(() => {
    // Mock Anthropic SDK
    mockAnthropicSDK = {
      messages: {
        create: jest.fn().mockResolvedValue({
          id: 'msg_test123',
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              analysis: 'Test analysis result',
              recommendations: ['Test recommendation'],
              confidence: 0.95
            })
          }],
          usage: {
            input_tokens: 100,
            output_tokens: 200,
            total_tokens: 300
          }
        })
      }
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    integration = new AnthropicIntegration(mockServer);
  });

  describe('Main Integration Class', () => {
    it('should initialize correctly with proper dependencies', async () => {
      expect(integration).toBeDefined();
      expect(integration.server).toBe(mockServer);
      expect(integration.config).toBeDefined();
    });

    it('should register all tools successfully', async () => {
      await registerAnthropicTools(mockServer);
      
      expect(mockServer.registerTool).toHaveBeenCalledTimes(6);
      expect(mockServer.tools.size).toBe(6);
    });

    it('should handle initialization errors gracefully', async () => {
      const faultyServer = { ...mockServer, registerTool: jest.fn().mockRejectedValue(new Error('Registration failed')) };
      
      await expect(registerAnthropicTools(faultyServer)).rejects.toThrow('Failed to register Anthropic tools');
    });
  });

  describe('Authentication Module', () => {
    let auth;

    beforeEach(() => {
      auth = new ClaudeAuth(mockConfig.anthropic);
    });

    it('should validate API key format correctly', async () => {
      const validKey = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890';
      const invalidKey = 'invalid-key';

      expect(await auth.validateApiKey(validKey)).toBe(true);
      expect(await auth.validateApiKey(invalidKey)).toBe(false);
    });

    it('should cache validation results', async () => {
      const key = 'sk-ant-api03-test-key';
      
      await auth.validateApiKey(key);
      await auth.validateApiKey(key); // Second call should use cache
      
      // Should only make one actual validation call
      expect(auth.validationCache.has(key)).toBe(true);
    });

    it('should handle authentication errors', async () => {
      const auth = new ClaudeAuth({ ...mockConfig.anthropic, apiKey: '' });
      
      await expect(auth.validateApiKey('')).resolves.toBe(false);
    });
  });

  describe('Claude Client', () => {
    let client;

    beforeEach(() => {
      client = new ClaudeClient(mockConfig.anthropic, new ClaudeAuth(mockConfig.anthropic));
      client.anthropic = mockAnthropicSDK; // Inject mock
    });

    it('should send messages successfully', async () => {
      const result = await client.sendMessage({
        messages: [{ role: 'user', content: 'Test message' }],
        maxTokens: 1000
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.usage.total_tokens).toBe(300);
      expect(mockAnthropicSDK.messages.create).toHaveBeenCalledOnce();
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      mockAnthropicSDK.messages.create.mockRejectedValueOnce(rateLimitError);

      await expect(client.sendMessage({
        messages: [{ role: 'user', content: 'Test' }]
      })).rejects.toThrow('Rate limit exceeded');
    });

    it('should retry on transient failures', async () => {
      // First call fails, second succeeds
      mockAnthropicSDK.messages.create
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: 'Success' }],
          usage: { total_tokens: 50 }
        });

      const result = await client.sendMessage({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(result).toBeDefined();
      expect(mockAnthropicSDK.messages.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Prompt Builder', () => {
    let promptBuilder;

    beforeEach(() => {
      promptBuilder = new PromptBuilder();
    });

    it('should build financial analysis prompts', () => {
      const data = { revenue: 1000000, expenses: 800000 };
      const options = { timeframe: '1_year', audience: 'executives' };

      const prompt = promptBuilder.buildPrompt('financial-analysis', data, options);

      expect(prompt.system).toContain('financial analyst');
      expect(prompt.messages).toHaveLength(1);
      expect(prompt.messages[0].content).toContain('revenue');
    });

    it('should build inventory optimization prompts', () => {
      const data = { currentLevels: { productA: 100 }, demandHistory: [] };
      const options = { analysisScope: 'minimize_costs', timeframe: '3_months' };

      const prompt = promptBuilder.buildPrompt('inventory-optimization', data, options);

      expect(prompt.system).toContain('supply chain');
      expect(prompt.messages[0].content).toContain('inventory');
    });

    it('should handle unknown analysis types', () => {
      expect(() => {
        promptBuilder.buildPrompt('unknown-type', {}, {});
      }).toThrow('Unknown analysis type');
    });
  });

  describe('Response Parser', () => {
    let parser;

    beforeEach(() => {
      parser = new ResponseParser();
    });

    it('should parse JSON responses correctly', async () => {
      const response = {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            analysis: 'Test analysis',
            recommendations: ['Recommendation 1'],
            confidence: 0.95
          })
        }]
      };

      const parsed = await parser.parseResponse(response, 'financial-analysis');

      expect(parsed.analysis).toBe('Test analysis');
      expect(parsed.recommendations).toHaveLength(1);
      expect(parsed.confidence).toBe(0.95);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = {
        content: [{ type: 'text', text: 'Invalid JSON {' }]
      };

      const parsed = await parser.parseResponse(response, 'financial-analysis');

      expect(parsed.rawText).toBe('Invalid JSON {');
      expect(parsed.analysis).toBe('Unable to parse structured response');
    });

    it('should extract key insights from text responses', async () => {
      const response = {
        content: [{ 
          type: 'text', 
          text: 'Based on the analysis, revenue increased by 15%. Key recommendations include: 1) Cost reduction 2) Market expansion.'
        }]
      };

      const parsed = await parser.parseResponse(response, 'sales-performance');

      expect(parsed.keyInsights).toContain('revenue increased by 15%');
      expect(parsed.recommendations).toHaveLength(2);
    });
  });

  describe('Cost Optimizer', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new CostOptimizer(mockConfig.anthropic.costOptimization);
    });

    it('should optimize request parameters', async () => {
      const request = {
        messages: [{ role: 'user', content: 'Analyze this data: ' + 'x'.repeat(10000) }],
        maxTokens: 8000,
        analysisType: 'financial-analysis'
      };

      const result = await optimizer.optimizeRequest(request);

      expect(result.optimizedParams.maxTokens).toBeLessThan(8000);
      expect(result.costAnalysis.estimatedCost).toBeDefined();
      expect(result.costAnalysis.optimizedCost).toBeLessThanOrEqual(result.costAnalysis.originalCost);
    });

    it('should respect daily budget limits', async () => {
      // Set up scenario where daily budget is exceeded
      optimizer.usage.daily.cost = 95; // Close to $100 daily limit

      const request = {
        messages: [{ role: 'user', content: 'Test' }],
        maxTokens: 4000,
        analysisType: 'strategic-planning'
      };

      await expect(optimizer.optimizeRequest(request)).rejects.toThrow('Daily budget exceeded');
    });

    it('should select appropriate model based on complexity', async () => {
      const simpleRequest = {
        messages: [{ role: 'user', content: 'Simple question?' }],
        analysisType: 'financial-analysis'
      };

      const complexRequest = {
        messages: [{ role: 'user', content: 'Complex analysis: ' + 'x'.repeat(5000) }],
        analysisType: 'strategic-planning'
      };

      const simpleResult = await optimizer.optimizeRequest(simpleRequest);
      const complexResult = await optimizer.optimizeRequest(complexRequest);

      expect(simpleResult.optimizedParams.model).toBe('claude-3-haiku-20240307');
      expect(complexResult.optimizedParams.model).toBe('claude-3-5-sonnet-20241022');
    });
  });

  describe('Analytics Module', () => {
    let analytics;

    beforeEach(() => {
      analytics = new Analytics();
    });

    it('should track tool executions', () => {
      analytics.trackExecution('claude-financial-analysis', 'started', {
        correlationId: 'test-123'
      });

      analytics.trackExecution('claude-financial-analysis', 'completed', {
        correlationId: 'test-123',
        executionTime: 1500,
        tokensUsed: 300
      });

      const metrics = analytics.getMetrics();
      expect(metrics.totalExecutions).toBe(2);
      expect(metrics.completedExecutions).toBe(1);
      expect(metrics.averageExecutionTime).toBe(1500);
    });

    it('should calculate quality scores', () => {
      analytics.trackQuality('claude-financial-analysis', {
        confidence: 0.95,
        relevance: 0.90,
        completeness: 0.85
      });

      const score = analytics.calculateQualityScore('claude-financial-analysis');
      expect(score).toBeCloseTo(0.90, 2);
    });

    it('should track usage costs', () => {
      analytics.trackUsage('claude-3-5-sonnet-20241022', {
        inputTokens: 100,
        outputTokens: 200,
        cost: 0.05
      });

      const usage = analytics.getUsageStats();
      expect(usage.totalCost).toBe(0.05);
      expect(usage.totalTokens).toBe(300);
    });
  });

  describe('Business Intelligence Tools', () => {
    let mockDependencies;

    beforeEach(() => {
      mockDependencies = {
        client: new ClaudeClient(mockConfig.anthropic, new ClaudeAuth(mockConfig.anthropic)),
        promptBuilder: new PromptBuilder(),
        responseParser: new ResponseParser(),
        costOptimizer: new CostOptimizer(mockConfig.anthropic.costOptimization),
        analytics: new Analytics(),
        server: mockServer,
        logger: mockLogger
      };
      mockDependencies.client.anthropic = mockAnthropicSDK;
    });

    describe('Financial Analysis Tool', () => {
      let tool;

      beforeEach(async () => {
        tool = new FinancialAnalysisTool(mockDependencies);
        await tool.initialize();
      });

      it('should initialize successfully', () => {
        expect(tool.toolName).toBe('claude-analyze-financial-data');
        expect(tool.category).toBe('finance');
      });

      it('should execute financial analysis', async () => {
        const params = {
          financialData: {
            revenue: 1000000,
            expenses: 800000,
            assets: 2000000,
            liabilities: 1200000
          },
          analysisType: 'comprehensive',
          timeframe: '1_year'
        };

        const result = await tool.execute(params);

        expect(result).toBeDefined();
        expect(result.financialScore).toBeDefined();
        expect(mockLogger.info).toHaveBeenCalledWith('Starting financial analysis', expect.any(Object));
      });

      it('should validate required parameters', async () => {
        const invalidParams = { analysisType: 'comprehensive' };

        await expect(tool.execute(invalidParams)).rejects.toThrow('financialData and analysisType are required');
      });
    });

    describe('Inventory Optimization Tool', () => {
      let tool;

      beforeEach(async () => {
        tool = new InventoryOptimizationTool(mockDependencies);
        await tool.initialize();
      });

      it('should execute inventory optimization', async () => {
        const params = {
          inventoryData: {
            currentLevels: { productA: 100 },
            demandHistory: [{ date: '2024-01-01', demand: 50 }],
            costs: { carrying: 0.2 }
          },
          optimizationGoals: ['minimize_costs'],
          serviceLevel: 0.95
        };

        const result = await tool.execute(params);

        expect(result).toBeDefined();
        expect(result.optimizationScore).toBeDefined();
        expect(result.reorderPoints).toBeDefined();
      });
    });

    describe('Strategic Planning Tool', () => {
      let tool;

      beforeEach(async () => {
        tool = new StrategicPlanningTool(mockDependencies);
        await tool.initialize();
      });

      it('should execute strategic planning analysis', async () => {
        const params = {
          strategicContext: {
            currentPosition: { marketShare: 0.15 },
            marketEnvironment: { growth: 0.08 }
          },
          planningHorizon: '3_years',
          strategicFocus: ['growth', 'efficiency'],
          objectives: [
            { category: 'financial', description: 'Increase revenue', priority: 'high' }
          ]
        };

        const result = await tool.execute(params);

        expect(result).toBeDefined();
        expect(result.strategicScore).toBeDefined();
        expect(result.implementationRoadmap).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API authentication failures', async () => {
      const invalidConfig = { ...mockConfig.anthropic, apiKey: 'invalid-key' };
      const auth = new ClaudeAuth(invalidConfig);

      const isValid = await auth.validateApiKey('invalid-key');
      expect(isValid).toBe(false);
    });

    it('should handle network failures gracefully', async () => {
      const client = new ClaudeClient(mockConfig.anthropic, new ClaudeAuth(mockConfig.anthropic));
      client.anthropic = {
        messages: {
          create: jest.fn().mockRejectedValue(new Error('Network error'))
        }
      };

      await expect(client.sendMessage({
        messages: [{ role: 'user', content: 'Test' }]
      })).rejects.toThrow('Network error');
    });

    it('should handle malformed responses', async () => {
      const parser = new ResponseParser();
      const malformedResponse = {
        content: [{ type: 'text', text: null }]
      };

      const result = await parser.parseResponse(malformedResponse, 'financial-analysis');
      expect(result.analysis).toBe('Unable to parse structured response');
    });
  });

  describe('Integration Performance', () => {
    it('should complete tool execution within reasonable time', async () => {
      const tool = new FinancialAnalysisTool({
        ...mockDependencies,
        client: new ClaudeClient(mockConfig.anthropic, new ClaudeAuth(mockConfig.anthropic))
      });
      tool.client.anthropic = mockAnthropicSDK;

      const startTime = Date.now();
      await tool.execute({
        financialData: { revenue: 100000 },
        analysisType: 'quick'
      });
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent tool executions', async () => {
      const tool = new SalesPerformanceTool(mockDependencies);
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(tool.execute({
          salesData: { totalSales: 100000 * i },
          analysisType: 'performance'
        }));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toBeDefined());
    });
  });
});

// Integration test with mock server
describe('Full Integration Test', () => {
  let server;

  beforeEach(() => {
    server = {
      tools: new Map(),
      setRequestHandler: jest.fn(),
      registerTool: jest.fn((name, tool) => {
        server.tools.set(name, tool);
      })
    };
  });

  it('should register and execute all tools successfully', async () => {
    await registerAnthropicTools(server);

    expect(server.tools.size).toBe(6);
    expect(server.tools.has('claude-analyze-financial-data')).toBe(true);
    expect(server.tools.has('claude-analyze-sales-performance')).toBe(true);
    expect(server.tools.has('claude-generate-business-reports')).toBe(true);
    expect(server.tools.has('claude-inventory-optimization')).toBe(true);
    expect(server.tools.has('claude-competitive-analysis')).toBe(true);
    expect(server.tools.has('claude-strategic-planning')).toBe(true);
  });

  it('should maintain tool metadata correctly', async () => {
    await registerAnthropicTools(server);

    const financialTool = server.tools.get('claude-analyze-financial-data');
    expect(financialTool.description).toContain('comprehensive financial analysis');
    expect(financialTool.inputSchema).toBeDefined();
    expect(financialTool.category).toBe('finance');
  });
});
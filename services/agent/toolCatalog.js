/**
 * Tool Catalog - Adapters over existing APIs for Agentic Orchestration
 */

import { logInfo, logError, logDebug } from '../observability/structuredLogger.js';
import crypto from 'crypto';

export class ToolCatalog {
  constructor() {
    this.tools = new Map();
    this.schemas = new Map();
    this.initializeTools();
  }

  initializeTools() {
    // Forecasting tools
    this.registerTool({
      id: 'forecast.run',
      name: 'Run Forecast',
      description: 'Execute demand forecasting for specified products and time range',
      category: 'forecasting',
      inputSchema: {
        type: 'object',
        properties: {
          productIds: { type: 'array', items: { type: 'string' } },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          method: { type: 'string', enum: ['arima', 'exponential', 'ensemble', 'ml'] },
          seasonality: { type: 'boolean', default: true },
          confidenceLevel: { type: 'number', default: 0.95 }
        },
        required: ['startDate', 'endDate']
      },
      outputSchema: {
        type: 'object',
        properties: {
          forecasts: { type: 'array' },
          accuracy: { type: 'object' },
          confidence_intervals: { type: 'object' }
        }
      },
      executor: this.executeForecastRun.bind(this),
      mutating: false,
      requiresApproval: false
    });

    this.registerTool({
      id: 'forecast.diagnostics',
      name: 'Forecast Diagnostics',
      description: 'Analyze forecast accuracy and identify drift',
      category: 'forecasting',
      inputSchema: {
        type: 'object',
        properties: {
          forecastId: { type: 'string' },
          compareActuals: { type: 'boolean', default: true }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          mape: { type: 'number' },
          mae: { type: 'number' },
          driftDetected: { type: 'boolean' },
          recommendations: { type: 'array' }
        }
      },
      executor: this.executeForecastDiagnostics.bind(this),
      mutating: false,
      requiresApproval: false
    });

    this.registerTool({
      id: 'forecast.accuracyTrend',
      name: 'Forecast Accuracy Trend',
      description: 'Track forecast accuracy over time',
      category: 'forecasting',
      inputSchema: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          lookback: { type: 'number', default: 30 }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          trend: { type: 'array' },
          averageAccuracy: { type: 'number' },
          improving: { type: 'boolean' }
        }
      },
      executor: this.executeForecastAccuracyTrend.bind(this),
      mutating: false,
      requiresApproval: false
    });

    // Scenario generation tools
    this.registerTool({
      id: 'scenarios.generate',
      name: 'Generate Scenarios',
      description: 'Create what-if scenarios for planning',
      category: 'planning',
      inputSchema: {
        type: 'object',
        properties: {
          scenarioType: { type: 'string', enum: ['fx_shock', 'promo', 'price_elasticity', 'supply_disruption'] },
          parameters: { type: 'object' },
          scope: {
            type: 'object',
            properties: {
              entity: { type: 'string' },
              region: { type: 'string', enum: ['UK', 'EU', 'USA'] }
            }
          }
        },
        required: ['scenarioType', 'parameters']
      },
      outputSchema: {
        type: 'object',
        properties: {
          baseline: { type: 'object' },
          scenario: { type: 'object' },
          impact: { type: 'object' },
          recommendations: { type: 'array' }
        }
      },
      executor: this.executeScenariosGenerate.bind(this),
      mutating: false,
      requiresApproval: false
    });

    // Stock optimization tools
    this.registerTool({
      id: 'stock.optimize',
      name: 'Optimize Stock',
      description: 'Optimize inventory levels with working capital constraints',
      category: 'optimization',
      inputSchema: {
        type: 'object',
        properties: {
          products: { type: 'array', items: { type: 'string' } },
          workingCapitalCap: { type: 'number' },
          serviceTarget: { type: 'number', default: 0.95 },
          leadTimes: { type: 'object' },
          constraints: { type: 'object' }
        },
        required: ['workingCapitalCap']
      },
      outputSchema: {
        type: 'object',
        properties: {
          recommendations: { type: 'array' },
          currentWC: { type: 'number' },
          optimizedWC: { type: 'number' },
          serviceLevel: { type: 'number' },
          savingsOpportunity: { type: 'number' }
        }
      },
      executor: this.executeStockOptimize.bind(this),
      mutating: false,
      requiresApproval: true
    });

    this.registerTool({
      id: 'stock.explain',
      name: 'Explain Stock Levels',
      description: 'Explain current stock position and drivers',
      category: 'optimization',
      inputSchema: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          warehouseId: { type: 'string' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          currentLevel: { type: 'number' },
          optimalLevel: { type: 'number' },
          drivers: { type: 'array' },
          risks: { type: 'array' }
        }
      },
      executor: this.executeStockExplain.bind(this),
      mutating: false,
      requiresApproval: false
    });

    // Working capital tools
    this.registerTool({
      id: 'wc.project',
      name: 'Project Working Capital',
      description: 'Project working capital requirements',
      category: 'finance',
      inputSchema: {
        type: 'object',
        properties: {
          horizon: { type: 'number', default: 90 },
          scenarios: { type: 'array', items: { type: 'string' } },
          includeSeasonality: { type: 'boolean', default: true }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          projection: { type: 'array' },
          peakRequirement: { type: 'number' },
          averageRequirement: { type: 'number' },
          recommendations: { type: 'array' }
        }
      },
      executor: this.executeWCProject.bind(this),
      mutating: false,
      requiresApproval: false
    });

    this.registerTool({
      id: 'wc.diagnostics',
      name: 'Working Capital Diagnostics',
      description: 'Analyze working capital health and opportunities',
      category: 'finance',
      inputSchema: {
        type: 'object',
        properties: {
          compareToTarget: { type: 'boolean', default: true },
          includeBenchmarks: { type: 'boolean', default: true }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          dio: { type: 'number' },
          dso: { type: 'number' },
          dpo: { type: 'number' },
          ccc: { type: 'number' },
          opportunities: { type: 'array' },
          benchmarkComparison: { type: 'object' }
        }
      },
      executor: this.executeWCDiagnostics.bind(this),
      mutating: false,
      requiresApproval: false
    });

    this.registerTool({
      id: 'wc.exposure',
      name: 'Working Capital Exposure',
      description: 'Analyze FX and counterparty exposure',
      category: 'finance',
      inputSchema: {
        type: 'object',
        properties: {
          currencies: { type: 'array', items: { type: 'string' } },
          includeHedging: { type: 'boolean', default: true }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          exposures: { type: 'object' },
          hedgedPercentage: { type: 'number' },
          recommendations: { type: 'array' }
        }
      },
      executor: this.executeWCExposure.bind(this),
      mutating: false,
      requiresApproval: false
    });

    // Integration tools
    this.registerTool({
      id: 'integrations.health',
      name: 'Integration Health Check',
      description: 'Check health of all integrations',
      category: 'system',
      inputSchema: {
        type: 'object',
        properties: {
          services: { type: 'array', items: { type: 'string' } }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'object' },
          errors: { type: 'array' },
          recommendations: { type: 'array' }
        }
      },
      executor: this.executeIntegrationsHealth.bind(this),
      mutating: false,
      requiresApproval: false
    });

    this.registerTool({
      id: 'imports.qualitySummary',
      name: 'Import Quality Summary',
      description: 'Analyze data import quality and completeness',
      category: 'data',
      inputSchema: {
        type: 'object',
        properties: {
          lookback: { type: 'number', default: 7 },
          sources: { type: 'array', items: { type: 'string' } }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          totalImports: { type: 'number' },
          successRate: { type: 'number' },
          dataQualityScore: { type: 'number' },
          issues: { type: 'array' }
        }
      },
      executor: this.executeImportsQualitySummary.bind(this),
      mutating: false,
      requiresApproval: false
    });

    // Export tools
    this.registerTool({
      id: 'exports.boardPack',
      name: 'Generate Board Pack',
      description: 'Generate executive board pack with all KPIs',
      category: 'reporting',
      inputSchema: {
        type: 'object',
        properties: {
          period: { type: 'string' },
          includeCommentary: { type: 'boolean', default: true },
          format: { type: 'string', enum: ['pdf', 'pptx', 'xlsx'], default: 'pdf' }
        },
        required: ['period']
      },
      outputSchema: {
        type: 'object',
        properties: {
          fileUrl: { type: 'string' },
          sections: { type: 'array' },
          keyHighlights: { type: 'array' }
        }
      },
      executor: this.executeExportsBoardPack.bind(this),
      mutating: false,
      requiresApproval: false
    });

    this.registerTool({
      id: 'exports.varianceAppendix',
      name: 'Generate Variance Appendix',
      description: 'Generate detailed variance analysis appendix',
      category: 'reporting',
      inputSchema: {
        type: 'object',
        properties: {
          compareToTarget: { type: 'boolean', default: true },
          compareToPrior: { type: 'boolean', default: true },
          threshold: { type: 'number', default: 0.05 }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          variances: { type: 'array' },
          topDrivers: { type: 'array' },
          recommendations: { type: 'array' }
        }
      },
      executor: this.executeExportsVarianceAppendix.bind(this),
      mutating: false,
      requiresApproval: false
    });

    logInfo('Tool catalog initialized', { toolCount: this.tools.size });
  }

  registerTool(toolConfig) {
    this.tools.set(toolConfig.id, toolConfig);
    this.schemas.set(toolConfig.id, {
      input: toolConfig.inputSchema,
      output: toolConfig.outputSchema
    });
  }

  getTool(toolId) {
    return this.tools.get(toolId);
  }

  getAllTools() {
    return Array.from(this.tools.values()).map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      mutating: tool.mutating,
      requiresApproval: tool.requiresApproval
    }));
  }

  getToolsByCategory(category) {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category)
      .map(tool => tool.id);
  }

  validateToolInput(toolId, input) {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Basic validation against schema
    const schema = tool.inputSchema;
    const errors = [];

    if (schema.required) {
      for (const field of schema.required) {
        if (!input[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Input validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  async executeTool(toolId, input, context = {}) {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Validate input
    this.validateToolInput(toolId, input);

    // Generate invocation ID
    const invocationId = crypto.randomUUID();

    logDebug(`Executing tool ${toolId}`, {
      invocationId,
      input: this.redactSensitive(input)
    });

    try {
      const startTime = Date.now();
      const result = await tool.executor(input, context);
      const duration = Date.now() - startTime;

      logInfo(`Tool execution completed`, {
        toolId,
        invocationId,
        duration,
        success: true
      });

      return {
        invocationId,
        toolId,
        input,
        output: result,
        duration,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError(`Tool execution failed`, error, {
        toolId,
        invocationId
      });

      return {
        invocationId,
        toolId,
        input,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  redactSensitive(obj) {
    const sensitive = ['password', 'token', 'secret', 'key'];
    const redacted = { ...obj };

    for (const key in redacted) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = this.redactSensitive(redacted[key]);
      }
    }

    return redacted;
  }

  // Tool executor implementations (wrap existing API calls)
  async executeForecastRun(input, context) {
    // Wrapper around existing forecast API
    const response = await fetch(`${context.baseUrl}/api/forecast/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return response.json();
  }

  async executeForecastDiagnostics(input, context) {
    const response = await fetch(`${context.baseUrl}/api/forecast/diagnostics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return response.json();
  }

  async executeForecastAccuracyTrend(input, context) {
    const response = await fetch(`${context.baseUrl}/api/forecast/accuracy-trend`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }

  async executeScenariosGenerate(input, context) {
    const response = await fetch(`${context.baseUrl}/api/scenarios/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return response.json();
  }

  async executeStockOptimize(input, context) {
    const response = await fetch(`${context.baseUrl}/api/optimize/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return response.json();
  }

  async executeStockExplain(input, context) {
    const response = await fetch(`${context.baseUrl}/api/stock/explain`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }

  async executeWCProject(input, context) {
    const response = await fetch(`${context.baseUrl}/api/working-capital/project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return response.json();
  }

  async executeWCDiagnostics(input, context) {
    const response = await fetch(`${context.baseUrl}/api/working-capital/diagnostics`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }

  async executeWCExposure(input, context) {
    const response = await fetch(`${context.baseUrl}/api/working-capital/exposure`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }

  async executeIntegrationsHealth(input, context) {
    const response = await fetch(`${context.baseUrl}/api/integrations/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }

  async executeImportsQualitySummary(input, context) {
    const response = await fetch(`${context.baseUrl}/api/imports/quality`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }

  async executeExportsBoardPack(input, context) {
    const response = await fetch(`${context.baseUrl}/api/exports/board-pack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return response.json();
  }

  async executeExportsVarianceAppendix(input, context) {
    const response = await fetch(`${context.baseUrl}/api/exports/variance-appendix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return response.json();
  }
}

// Singleton instance
export const toolCatalog = new ToolCatalog();

export default {
  ToolCatalog,
  toolCatalog
};
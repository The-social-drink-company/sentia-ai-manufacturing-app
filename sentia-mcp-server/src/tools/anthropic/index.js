/**
 * Anthropic Claude Integration - Main Module Exports
 * 
 * Central export point for all Anthropic Claude AI integration components.
 * Provides business intelligence capabilities for manufacturing operations.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

// Authentication and client
export { ClaudeAuth } from './auth/claude-auth.js';
export { ClaudeClient } from './utils/claude-client.js';

// Core utilities
export { PromptBuilder } from './utils/prompt-builder.js';
export { ResponseParser } from './utils/response-parser.js';
export { CostOptimizer } from './utils/cost-optimizer.js';
export { AnthropicAnalytics } from './utils/analytics.js';

// Business Intelligence Tools
export { FinancialAnalysisTool } from './tools/financial-analysis.js';
export { SalesPerformanceTool } from './tools/sales-performance.js';
export { BusinessReportsTool } from './tools/business-reports.js';
export { InventoryOptimizationTool } from './tools/inventory-optimization.js';
export { CompetitiveAnalysisTool } from './tools/competitive-analysis.js';
export { StrategicPlanningTool } from './tools/strategic-planning.js';

// Webhook handler (for future use)
export { WebhookHandler } from './webhooks/webhook-handler.js';

/**
 * Tool configurations for easy registration
 */
export const ANTHROPIC_TOOLS = [
  {
    name: 'claude-analyze-financial-data',
    description: 'Comprehensive financial statement analysis with trend identification and forecasting',
    category: 'financial',
    version: '1.0.0'
  },
  {
    name: 'claude-analyze-sales-performance',
    description: 'Sales trend analysis with customer behavior patterns and revenue optimization',
    category: 'sales',
    version: '1.0.0'
  },
  {
    name: 'claude-generate-business-reports',
    description: 'Executive dashboard summaries and strategic planning documents',
    category: 'reporting',
    version: '1.0.0'
  },
  {
    name: 'claude-inventory-optimization',
    description: 'Demand forecasting analysis with inventory level optimization',
    category: 'operations',
    version: '1.0.0'
  },
  {
    name: 'claude-competitive-analysis',
    description: 'Market positioning analysis with competitor insights and pricing strategies',
    category: 'strategy',
    version: '1.0.0'
  },
  {
    name: 'claude-strategic-planning',
    description: 'Business strategy development with growth opportunity identification',
    category: 'strategy',
    version: '1.0.0'
  }
];

/**
 * Integration metadata
 */
export const INTEGRATION_INFO = {
  name: 'Anthropic Claude AI',
  version: '1.0.0',
  description: 'Advanced business intelligence and analysis capabilities using Claude AI',
  author: 'Sentia Manufacturing Team',
  toolCount: ANTHROPIC_TOOLS.length,
  categories: ['financial', 'sales', 'reporting', 'operations', 'strategy'],
  requiredConfig: ['apiKey', 'model'],
  supportedModels: [
    'claude-3-5-sonnet-20241022',
    'claude-3-sonnet-20240229', 
    'claude-3-haiku-20240307',
    'claude-3-opus-20240229'
  ]
};
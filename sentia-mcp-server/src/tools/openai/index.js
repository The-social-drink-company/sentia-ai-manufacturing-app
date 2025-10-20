/**
 * OpenAI Integration - Main Export Module
 * 
 * Central export point for all OpenAI integration components.
 * Provides convenient access to authentication, tools, utilities, and configuration.
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

// Authentication
export { OpenAIAuth } from './auth/openai-auth.js';

// Core utilities
export { OpenAIClient } from './utils/openai-client.js';
export { FunctionCalling } from './utils/function-calling.js';
export { PromptOptimizer } from './utils/prompt-optimizer.js';
export { ResponseValidator } from './utils/response-validator.js';
export { CostTracker } from './utils/cost-tracker.js';
export { OpenAIAnalytics } from './utils/analytics.js';

// Business intelligence tools
export { DataAnalysisTool } from './tools/data-analysis.js';
export { ContentGenerationTool } from './tools/content-generation.js';
export { CustomerInsightsTool } from './tools/customer-insights.js';
export { OperationalOptimizationTool } from './tools/operational-optimization.js';
export { ForecastingTool } from './tools/forecasting.js';
export { AutomatedReportingTool } from './tools/automated-reporting.js';

// Webhooks (future)
export { WebhookHandler } from './webhooks/webhook-handler.js';
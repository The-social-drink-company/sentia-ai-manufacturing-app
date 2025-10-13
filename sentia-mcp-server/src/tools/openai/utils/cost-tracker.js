/**
 * Cost Tracker - OpenAI Integration
 * 
 * Token usage tracking, cost calculation, and optimization monitoring.
 * Provides detailed cost analytics for OpenAI API usage.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class CostTracker {
  constructor() {
    this.usageData = [];
    this.modelPricing = new Map();
    this.budgetLimits = new Map();
    this.alertThresholds = new Map();
    this.isInitialized = false;
    
    logger.info('Cost Tracker initialized');
  }

  async initialize() {
    try {
      logger.info('Initializing Cost Tracker...');
      
      this.loadModelPricing();
      this.configureBudgetLimits();
      this.setupAlertThresholds();
      
      this.isInitialized = true;
      logger.info('Cost Tracker initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Cost Tracker', { error: error.message });
      throw error;
    }
  }

  loadModelPricing() {
    // OpenAI pricing as of 2024 (per 1K tokens)
    this.modelPricing.set('gpt-4o', {
      input_cost: 0.0025,
      output_cost: 0.01,
      context_window: 128000
    });

    this.modelPricing.set('gpt-4o-mini', {
      input_cost: 0.00015,
      output_cost: 0.0006,
      context_window: 128000
    });

    this.modelPricing.set('gpt-4-turbo', {
      input_cost: 0.01,
      output_cost: 0.03,
      context_window: 128000
    });

    this.modelPricing.set('gpt-3.5-turbo', {
      input_cost: 0.0005,
      output_cost: 0.0015,
      context_window: 16385
    });

    logger.info('Model pricing loaded', { modelCount: this.modelPricing.size });
  }

  configureBudgetLimits() {
    this.budgetLimits.set('daily', 50.00);   // $50 per day
    this.budgetLimits.set('weekly', 300.00); // $300 per week
    this.budgetLimits.set('monthly', 1000.00); // $1000 per month
    
    logger.info('Budget limits configured');
  }

  setupAlertThresholds() {
    this.alertThresholds.set('daily_warning', 0.8);   // 80% of daily budget
    this.alertThresholds.set('daily_critical', 0.95); // 95% of daily budget
    this.alertThresholds.set('weekly_warning', 0.75); // 75% of weekly budget
    this.alertThresholds.set('monthly_warning', 0.7); // 70% of monthly budget
    
    logger.info('Alert thresholds configured');
  }

  trackUsage(toolName, usageData) {
    try {
      const {
        model,
        inputTokens = 0,
        outputTokens = 0,
        duration = 0,
        timestamp = new Date().toISOString()
      } = usageData;

      if (!this.modelPricing.has(model)) {
        logger.warn('Unknown model for cost tracking', { model });
        return null;
      }

      const pricing = this.modelPricing.get(model);
      const inputCost = (inputTokens / 1000) * pricing.input_cost;
      const outputCost = (outputTokens / 1000) * pricing.output_cost;
      const totalCost = inputCost + outputCost;

      const usage = {
        tool: toolName,
        model,
        timestamp,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens
        },
        cost: {
          input: inputCost,
          output: outputCost,
          total: totalCost
        },
        duration,
        cost_per_second: duration > 0 ? totalCost / (duration / 1000) : 0
      };

      this.usageData.push(usage);

      // Check for budget alerts
      this.checkBudgetAlerts();

      logger.debug('Usage tracked', {
        tool: toolName,
        model,
        totalTokens: usage.tokens.total,
        totalCost: totalCost.toFixed(6)
      });

      return usage;

    } catch (error) {
      logger.error('Failed to track usage', { error: error.message });
      return null;
    }
  }

  getUsageStats(timeframe = 'all') {
    try {
      const now = new Date();
      let filteredData = this.usageData;

      // Filter by timeframe
      if (timeframe !== 'all') {
        const cutoffDate = this.getTimeframeCutoff(now, timeframe);
        filteredData = this.usageData.filter(usage => 
          new Date(usage.timestamp) >= cutoffDate
        );
      }

      if (filteredData.length === 0) {
        return {
          timeframe,
          total_requests: 0,
          total_tokens: 0,
          total_cost: 0,
          average_cost_per_request: 0,
          models_used: [],
          tools_used: []
        };
      }

      // Calculate aggregated stats
      const totalTokens = filteredData.reduce((sum, usage) => sum + usage.tokens.total, 0);
      const totalCost = filteredData.reduce((sum, usage) => sum + usage.cost.total, 0);
      const modelsUsed = [...new Set(filteredData.map(usage => usage.model))];
      const toolsUsed = [...new Set(filteredData.map(usage => usage.tool))];

      // Model breakdown
      const modelBreakdown = {};
      modelsUsed.forEach(model => {
        const modelData = filteredData.filter(usage => usage.model === model);
        modelBreakdown[model] = {
          requests: modelData.length,
          tokens: modelData.reduce((sum, usage) => sum + usage.tokens.total, 0),
          cost: modelData.reduce((sum, usage) => sum + usage.cost.total, 0)
        };
      });

      // Tool breakdown
      const toolBreakdown = {};
      toolsUsed.forEach(tool => {
        const toolData = filteredData.filter(usage => usage.tool === tool);
        toolBreakdown[tool] = {
          requests: toolData.length,
          tokens: toolData.reduce((sum, usage) => sum + usage.tokens.total, 0),
          cost: toolData.reduce((sum, usage) => sum + usage.cost.total, 0)
        };
      });

      return {
        timeframe,
        period: timeframe !== 'all' ? this.formatTimeframePeriod(now, timeframe) : 'All time',
        total_requests: filteredData.length,
        total_tokens: totalTokens,
        total_cost: totalCost,
        average_cost_per_request: totalCost / filteredData.length,
        average_tokens_per_request: totalTokens / filteredData.length,
        models_used: modelsUsed,
        tools_used: toolsUsed,
        model_breakdown: modelBreakdown,
        tool_breakdown: toolBreakdown,
        cost_trend: this.calculateCostTrend(filteredData, timeframe),
        budget_status: this.getBudgetStatus(timeframe, totalCost)
      };

    } catch (error) {
      logger.error('Failed to get usage stats', { error: error.message });
      return null;
    }
  }

  getTimeframeCutoff(now, timeframe) {
    const cutoff = new Date(now);
    
    switch (timeframe) {
      case 'daily':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        cutoff.setDate(cutoff.getDate() - 7);
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        cutoff.setMonth(cutoff.getMonth() - 1);
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'hourly':
        cutoff.setHours(cutoff.getHours() - 1);
        cutoff.setMinutes(0, 0, 0);
        break;
      default:
        cutoff.setFullYear(2020); // Far in the past for 'all'
    }
    
    return cutoff;
  }

  formatTimeframePeriod(now, timeframe) {
    switch (timeframe) {
      case 'daily':
        return now.toDateString();
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return `${weekAgo.toDateString()} - ${now.toDateString()}`;
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return `${monthAgo.toDateString()} - ${now.toDateString()}`;
      case 'hourly':
        return `${now.getHours()}:00 - ${now.getHours() + 1}:00`;
      default:
        return 'All time';
    }
  }

  calculateCostTrend(data, timeframe) {
    if (data.length < 2) return 'insufficient_data';

    // Group by time periods and calculate trend
    const periods = this.groupByTimePeriod(data, timeframe);
    const periodKeys = Object.keys(periods).sort();
    
    if (periodKeys.length < 2) return 'insufficient_data';

    const firstPeriod = periods[periodKeys[0]];
    const lastPeriod = periods[periodKeys[periodKeys.length - 1]];
    
    const firstCost = firstPeriod.reduce((sum, usage) => sum + usage.cost.total, 0);
    const lastCost = lastPeriod.reduce((sum, usage) => sum + usage.cost.total, 0);
    
    if (firstCost === 0) return 'no_baseline';
    
    const changePercent = ((lastCost - firstCost) / firstCost) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  groupByTimePeriod(data, timeframe) {
    const periods = {};
    
    data.forEach(usage => {
      const date = new Date(usage.timestamp);
      let periodKey;
      
      switch (timeframe) {
        case 'daily':
          periodKey = date.toDateString();
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toDateString();
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${date.getMonth()}`;
          break;
        case 'hourly':
          periodKey = `${date.toDateString()}-${date.getHours()}`;
          break;
        default:
          periodKey = 'all';
      }
      
      if (!periods[periodKey]) {
        periods[periodKey] = [];
      }
      periods[periodKey].push(usage);
    });
    
    return periods;
  }

  getBudgetStatus(timeframe, currentCost) {
    const budgetLimit = this.budgetLimits.get(timeframe);
    if (!budgetLimit) return null;

    const utilization = (currentCost / budgetLimit) * 100;
    const remaining = budgetLimit - currentCost;

    let status = 'normal';
    if (utilization >= 95) status = 'critical';
    else if (utilization >= 80) status = 'warning';

    return {
      budget_limit: budgetLimit,
      current_cost: currentCost,
      remaining: remaining,
      utilization_percent: utilization,
      status: status,
      days_remaining: this.getDaysRemainingInPeriod(timeframe)
    };
  }

  getDaysRemainingInPeriod(timeframe) {
    const now = new Date();
    
    switch (timeframe) {
      case 'daily':
        return 1;
      case 'weekly':
        return 7 - now.getDay();
      case 'monthly':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
      default:
        return null;
    }
  }

  checkBudgetAlerts() {
    const dailyStats = this.getUsageStats('daily');
    const weeklyStats = this.getUsageStats('weekly');
    
    if (dailyStats?.budget_status?.status === 'critical') {
      logger.warn('CRITICAL: Daily budget nearly exceeded', {
        current: dailyStats.total_cost,
        limit: dailyStats.budget_status.budget_limit,
        utilization: dailyStats.budget_status.utilization_percent
      });
    }
    
    if (weeklyStats?.budget_status?.status === 'warning') {
      logger.warn('WARNING: Weekly budget threshold reached', {
        current: weeklyStats.total_cost,
        limit: weeklyStats.budget_status.budget_limit,
        utilization: weeklyStats.budget_status.utilization_percent
      });
    }
  }

  estimateCost(model, inputTokens, outputTokens) {
    if (!this.modelPricing.has(model)) {
      return null;
    }

    const pricing = this.modelPricing.get(model);
    const inputCost = (inputTokens / 1000) * pricing.input_cost;
    const outputCost = (outputTokens / 1000) * pricing.output_cost;

    return {
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      input_cost: inputCost,
      output_cost: outputCost,
      total_cost: inputCost + outputCost
    };
  }

  getCostOptimizationRecommendations() {
    const stats = this.getUsageStats('weekly');
    const recommendations = [];

    if (stats.total_cost > 100) {
      // Analyze model usage for optimization
      const modelCosts = Object.entries(stats.model_breakdown)
        .sort(([,a], [,b]) => b.cost - a.cost);

      if (modelCosts.length > 0) {
        const mostExpensive = modelCosts[0];
        if (mostExpensive[0] !== 'gpt-4o-mini') {
          recommendations.push({
            type: 'model_optimization',
            description: `Consider using gpt-4o-mini for simpler tasks. ${mostExpensive[0]} is your most expensive model.`,
            potential_savings: '60-85%'
          });
        }
      }

      // Check for high-frequency, low-value operations
      const toolCosts = Object.entries(stats.tool_breakdown)
        .sort(([,a], [,b]) => b.requests - a.requests);

      if (toolCosts.length > 0) {
        const mostUsed = toolCosts[0];
        recommendations.push({
          type: 'caching_optimization',
          description: `${mostUsed[0]} is heavily used. Consider implementing response caching.`,
          potential_savings: '20-40%'
        });
      }
    }

    return recommendations;
  }

  async cleanup() {
    try {
      logger.info('Cleaning up Cost Tracker...');
      
      // Keep last 30 days of data
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      
      this.usageData = this.usageData.filter(usage => 
        new Date(usage.timestamp) >= cutoff
      );
      
      logger.info('Cost Tracker cleanup completed', {
        recordsRetained: this.usageData.length
      });
      
    } catch (error) {
      logger.error('Error during Cost Tracker cleanup', { error: error.message });
    }
  }
}
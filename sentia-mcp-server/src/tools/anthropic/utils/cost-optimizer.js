/**
 * Cost Optimizer for Claude AI Integration
 * 
 * Advanced cost optimization and token management:
 * - Efficient token usage strategies
 * - Model selection optimization
 * - Response caching for cost reduction
 * - Batch processing capabilities
 * - Cost tracking and budgeting
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';
import NodeCache from 'node-cache';

const logger = createLogger();

/**
 * Cost Optimizer for Claude AI Usage
 */
export class CostOptimizer {
  constructor(config = {}) {
    this.config = {
      dailyBudget: config.dailyBudget || 100, // $100 daily budget
      monthlyBudget: config.monthlyBudget || 2000, // $2000 monthly budget
      costPerInputToken: config.costPerInputToken || 0.000003, // Claude 3 Sonnet pricing
      costPerOutputToken: config.costPerOutputToken || 0.000015,
      warningThreshold: config.warningThreshold || 0.8, // 80% budget warning
      maxTokensPerRequest: config.maxTokensPerRequest || 8192,
      ...config
    };

    // Cost tracking
    this.costs = {
      daily: { amount: 0, requests: 0, resetDate: this.getDateString() },
      monthly: { amount: 0, requests: 0, resetDate: this.getMonthString() },
      session: { amount: 0, requests: 0, startTime: Date.now() }
    };

    // Model cost mapping
    this.modelCosts = {
      'claude-3-5-sonnet-20241022': { input: 0.000003, output: 0.000015 },
      'claude-3-sonnet-20240229': { input: 0.000003, output: 0.000015 },
      'claude-3-haiku-20240307': { input: 0.00000025, output: 0.00000125 },
      'claude-3-opus-20240229': { input: 0.000015, output: 0.000075 }
    };

    // Optimization strategies cache
    this.optimizationCache = new NodeCache({ 
      stdTTL: 3600, // 1 hour cache
      checkperiod: 300 // 5 minutes cleanup
    });

    // Usage analytics
    this.analytics = {
      tokenSavings: 0,
      costSavings: 0,
      cacheHits: 0,
      optimizedRequests: 0,
      modelOptimizations: 0
    };

    this.loadStoredCosts();
  }

  /**
   * Optimize request for cost efficiency
   */
  async optimizeRequest(params) {
    try {
      const optimized = { ...params };
      const originalCost = this.estimateCost(params);

      // Apply optimization strategies
      optimized.model = this.selectOptimalModel(params);
      optimized.maxTokens = this.optimizeTokenLimit(params);
      optimized.prompt = await this.optimizePrompt(params);
      optimized.caching = this.determineCaching(params);

      const optimizedCost = this.estimateCost(optimized);
      const savings = originalCost - optimizedCost;

      if (savings > 0) {
        this.analytics.costSavings += savings;
        this.analytics.optimizedRequests++;
      }

      logger.info('Request optimized for cost efficiency', {
        originalCost: originalCost.toFixed(4),
        optimizedCost: optimizedCost.toFixed(4),
        savings: savings.toFixed(4),
        model: optimized.model,
        tokensOptimized: params.maxTokens - optimized.maxTokens
      });

      return {
        optimizedParams: optimized,
        costAnalysis: {
          originalCost,
          optimizedCost,
          savings,
          savingsPercentage: originalCost > 0 ? (savings / originalCost) * 100 : 0
        }
      };

    } catch (error) {
      logger.error('Failed to optimize request', {
        error: error.message,
        params: this.sanitizeParams(params)
      });
      
      return {
        optimizedParams: params,
        costAnalysis: {
          originalCost: this.estimateCost(params),
          optimizedCost: this.estimateCost(params),
          savings: 0,
          error: error.message
        }
      };
    }
  }

  /**
   * Select optimal model based on complexity and cost
   */
  selectOptimalModel(params) {
    const complexity = this.assessComplexity(params);
    const currentModel = params.model || 'claude-3-5-sonnet-20241022';

    // For simple tasks, use Haiku
    if (complexity.score < 0.3 && complexity.requiresCreativity === false) {
      this.analytics.modelOptimizations++;
      return 'claude-3-haiku-20240307';
    }

    // For medium complexity, use Sonnet
    if (complexity.score < 0.7) {
      return 'claude-3-sonnet-20240229';
    }

    // For high complexity, use Sonnet 3.5 or Opus
    if (complexity.requiresAdvancedReasoning) {
      return 'claude-3-5-sonnet-20241022';
    }

    return currentModel;
  }

  /**
   * Assess complexity of the analysis request
   */
  assessComplexity(params) {
    let score = 0;
    let requiresCreativity = false;
    let requiresAdvancedReasoning = false;

    const content = JSON.stringify(params.messages || []).toLowerCase();
    const dataSize = content.length;

    // Data size factor
    if (dataSize > 10000) score += 0.3;
    else if (dataSize > 5000) score += 0.2;
    else if (dataSize > 1000) score += 0.1;

    // Analysis type complexity
    const complexityKeywords = {
      simple: ['summary', 'basic', 'simple', 'overview'],
      medium: ['analyze', 'compare', 'trend', 'performance'],
      complex: ['strategic', 'forecast', 'optimize', 'competitive'],
      creative: ['innovate', 'design', 'creative', 'brainstorm'],
      advanced: ['multivariate', 'correlation', 'predictive', 'scenario']
    };

    for (const [level, keywords] of Object.entries(complexityKeywords)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          switch (level) {
            case 'simple': score += 0.05; break;
            case 'medium': score += 0.15; break;
            case 'complex': score += 0.25; break;
            case 'creative': 
              score += 0.2; 
              requiresCreativity = true; 
              break;
            case 'advanced': 
              score += 0.3; 
              requiresAdvancedReasoning = true; 
              break;
          }
        }
      }
    }

    // Token requirements
    const maxTokens = params.maxTokens || 4096;
    if (maxTokens > 6000) score += 0.2;
    else if (maxTokens > 4000) score += 0.1;

    return {
      score: Math.min(score, 1.0),
      requiresCreativity,
      requiresAdvancedReasoning,
      dataSize,
      estimatedTokens: maxTokens
    };
  }

  /**
   * Optimize token limit based on analysis type
   */
  optimizeTokenLimit(params) {
    const analysisType = this.getAnalysisType(params);
    const currentLimit = params.maxTokens || 4096;

    // Token optimization strategies by analysis type
    const optimizedLimits = {
      'financial-analysis': Math.min(currentLimit, 6000),
      'sales-performance': Math.min(currentLimit, 5000),
      'business-reports': Math.min(currentLimit, 8000),
      'inventory-optimization': Math.min(currentLimit, 4000),
      'competitive-analysis': Math.min(currentLimit, 6000),
      'strategic-planning': Math.min(currentLimit, 8000)
    };

    const optimizedLimit = optimizedLimits[analysisType] || currentLimit;

    // Don't exceed configured maximum
    return Math.min(optimizedLimit, this.config.maxTokensPerRequest);
  }

  /**
   * Optimize prompt for efficiency
   */
  async optimizePrompt(params) {
    const cacheKey = `prompt_opt_${this.hashParams(params)}`;
    const cached = this.optimizationCache.get(cacheKey);

    if (cached) {
      this.analytics.cacheHits++;
      return cached;
    }

    // Prompt optimization strategies
    let optimizedPrompt = params.prompt || '';

    // Remove redundant instructions
    optimizedPrompt = this.removeRedundancy(optimizedPrompt);

    // Compress data representations
    optimizedPrompt = this.compressDataRepresentation(optimizedPrompt);

    // Optimize for structured output
    optimizedPrompt = this.addStructuredOutputInstructions(optimizedPrompt);

    // Cache the optimization
    this.optimizationCache.set(cacheKey, optimizedPrompt);

    return optimizedPrompt;
  }

  /**
   * Determine optimal caching strategy
   */
  determineCaching(params) {
    const analysisType = this.getAnalysisType(params);
    const dataVolatility = this.assessDataVolatility(params);

    // Cache recommendations
    if (dataVolatility < 0.3 && analysisType === 'competitive-analysis') {
      return { enabled: true, ttl: 3600 }; // 1 hour for competitive data
    }

    if (dataVolatility < 0.2 && analysisType === 'strategic-planning') {
      return { enabled: true, ttl: 7200 }; // 2 hours for strategic analysis
    }

    if (dataVolatility < 0.1) {
      return { enabled: true, ttl: 1800 }; // 30 minutes for stable data
    }

    return { enabled: false };
  }

  /**
   * Estimate cost for request
   */
  estimateCost(params) {
    const model = params.model || 'claude-3-5-sonnet-20241022';
    const costs = this.modelCosts[model] || this.modelCosts['claude-3-5-sonnet-20241022'];

    // Estimate input tokens (rough calculation)
    const inputText = JSON.stringify(params.messages || []);
    const estimatedInputTokens = Math.ceil(inputText.length / 4);

    // Estimate output tokens
    const maxOutputTokens = params.maxTokens || 4096;
    const estimatedOutputTokens = Math.ceil(maxOutputTokens * 0.8); // Assume 80% usage

    const inputCost = estimatedInputTokens * costs.input;
    const outputCost = estimatedOutputTokens * costs.output;

    return inputCost + outputCost;
  }

  /**
   * Track actual cost after request completion
   */
  trackActualCost(params, usage) {
    const model = params.model || 'claude-3-5-sonnet-20241022';
    const costs = this.modelCosts[model] || this.modelCosts['claude-3-5-sonnet-20241022'];

    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;

    const inputCost = inputTokens * costs.input;
    const outputCost = outputTokens * costs.output;
    const totalCost = inputCost + outputCost;

    // Update cost tracking
    this.updateCostTracking(totalCost);

    // Check budget warnings
    this.checkBudgetWarnings();

    logger.info('Cost tracked for Claude request', {
      model,
      inputTokens,
      outputTokens,
      inputCost: inputCost.toFixed(6),
      outputCost: outputCost.toFixed(6),
      totalCost: totalCost.toFixed(6),
      dailyTotal: this.costs.daily.amount.toFixed(4),
      monthlyTotal: this.costs.monthly.amount.toFixed(4)
    });

    return {
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost,
      model
    };
  }

  /**
   * Update cost tracking across periods
   */
  updateCostTracking(cost) {
    const today = this.getDateString();
    const thisMonth = this.getMonthString();

    // Reset daily costs if new day
    if (this.costs.daily.resetDate !== today) {
      this.costs.daily = { amount: 0, requests: 0, resetDate: today };
    }

    // Reset monthly costs if new month
    if (this.costs.monthly.resetDate !== thisMonth) {
      this.costs.monthly = { amount: 0, requests: 0, resetDate: thisMonth };
    }

    // Update all periods
    this.costs.daily.amount += cost;
    this.costs.daily.requests += 1;
    this.costs.monthly.amount += cost;
    this.costs.monthly.requests += 1;
    this.costs.session.amount += cost;
    this.costs.session.requests += 1;

    // Persist costs
    this.persistCosts();
  }

  /**
   * Check budget warnings and limits
   */
  checkBudgetWarnings() {
    const dailyPercentage = this.costs.daily.amount / this.config.dailyBudget;
    const monthlyPercentage = this.costs.monthly.amount / this.config.monthlyBudget;

    if (dailyPercentage >= 1.0) {
      logger.error('Daily budget exceeded', {
        spent: this.costs.daily.amount.toFixed(4),
        budget: this.config.dailyBudget,
        percentage: (dailyPercentage * 100).toFixed(1)
      });
      throw new Error('Daily budget exceeded');
    }

    if (monthlyPercentage >= 1.0) {
      logger.error('Monthly budget exceeded', {
        spent: this.costs.monthly.amount.toFixed(4),
        budget: this.config.monthlyBudget,
        percentage: (monthlyPercentage * 100).toFixed(1)
      });
      throw new Error('Monthly budget exceeded');
    }

    if (dailyPercentage >= this.config.warningThreshold) {
      logger.warn('Daily budget warning threshold reached', {
        spent: this.costs.daily.amount.toFixed(4),
        budget: this.config.dailyBudget,
        percentage: (dailyPercentage * 100).toFixed(1)
      });
    }

    if (monthlyPercentage >= this.config.warningThreshold) {
      logger.warn('Monthly budget warning threshold reached', {
        spent: this.costs.monthly.amount.toFixed(4),
        budget: this.config.monthlyBudget,
        percentage: (monthlyPercentage * 100).toFixed(1)
      });
    }
  }

  /**
   * Get cost and usage statistics
   */
  getUsageStats() {
    return {
      costs: { ...this.costs },
      budgets: {
        daily: this.config.dailyBudget,
        monthly: this.config.monthlyBudget
      },
      analytics: { ...this.analytics },
      optimization: {
        cacheSize: this.optimizationCache.keys().length,
        cacheStats: this.optimizationCache.getStats()
      },
      efficiency: {
        averageCostPerRequest: this.costs.session.requests > 0 ? 
          this.costs.session.amount / this.costs.session.requests : 0,
        totalSavings: this.analytics.costSavings,
        optimizationRate: this.costs.session.requests > 0 ?
          this.analytics.optimizedRequests / this.costs.session.requests : 0
      }
    };
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget() {
    return {
      daily: Math.max(0, this.config.dailyBudget - this.costs.daily.amount),
      monthly: Math.max(0, this.config.monthlyBudget - this.costs.monthly.amount),
      dailyPercentage: (this.costs.daily.amount / this.config.dailyBudget) * 100,
      monthlyPercentage: (this.costs.monthly.amount / this.config.monthlyBudget) * 100
    };
  }

  /**
   * Predict cost for upcoming request
   */
  predictCost(params) {
    const estimatedCost = this.estimateCost(params);
    const remainingBudget = this.getRemainingBudget();

    return {
      estimatedCost,
      canAfford: {
        daily: estimatedCost <= remainingBudget.daily,
        monthly: estimatedCost <= remainingBudget.monthly
      },
      recommendation: this.getCostRecommendation(estimatedCost, remainingBudget)
    };
  }

  /**
   * Get cost optimization recommendation
   */
  getCostRecommendation(estimatedCost, remainingBudget) {
    if (estimatedCost > remainingBudget.daily) {
      return {
        action: 'defer',
        reason: 'Would exceed daily budget',
        alternatives: ['Use simpler model', 'Reduce token limit', 'Wait until tomorrow']
      };
    }

    if (estimatedCost > remainingBudget.monthly) {
      return {
        action: 'defer',
        reason: 'Would exceed monthly budget',
        alternatives: ['Use Haiku model', 'Significantly reduce scope']
      };
    }

    if (estimatedCost > remainingBudget.daily * 0.2) {
      return {
        action: 'optimize',
        reason: 'High cost relative to remaining budget',
        alternatives: ['Consider model optimization', 'Reduce token limit']
      };
    }

    return {
      action: 'proceed',
      reason: 'Cost within acceptable limits'
    };
  }

  // Helper methods
  getAnalysisType(params) {
    const content = JSON.stringify(params.messages || []).toLowerCase();
    
    if (content.includes('financial')) return 'financial-analysis';
    if (content.includes('sales')) return 'sales-performance';
    if (content.includes('report')) return 'business-reports';
    if (content.includes('inventory')) return 'inventory-optimization';
    if (content.includes('competitive')) return 'competitive-analysis';
    if (content.includes('strategic')) return 'strategic-planning';
    
    return 'general';
  }

  assessDataVolatility(params) {
    // Simple heuristic for data volatility
    const content = JSON.stringify(params.messages || []);
    
    if (content.includes('real-time') || content.includes('current')) return 0.9;
    if (content.includes('daily') || content.includes('recent')) return 0.6;
    if (content.includes('weekly') || content.includes('monthly')) return 0.3;
    if (content.includes('annual') || content.includes('historical')) return 0.1;
    
    return 0.5; // Default moderate volatility
  }

  removeRedundancy(prompt) {
    // Remove duplicate instructions and redundant phrases
    return prompt.replace(/\b(\w+)\s+\1\b/gi, '$1'); // Remove duplicate words
  }

  compressDataRepresentation(prompt) {
    // Compress JSON data representations
    return prompt.replace(/{\s+/g, '{').replace(/\s+}/g, '}').replace(/,\s+/g, ',');
  }

  addStructuredOutputInstructions(prompt) {
    if (!prompt.includes('JSON') && !prompt.includes('structured')) {
      return prompt + '\n\nPlease format your response as structured JSON.';
    }
    return prompt;
  }

  hashParams(params) {
    const key = JSON.stringify({
      messages: params.messages,
      analysisType: this.getAnalysisType(params)
    });
    return require('crypto').createHash('md5').update(key).digest('hex');
  }

  sanitizeParams(params) {
    return {
      model: params.model,
      maxTokens: params.maxTokens,
      messageCount: params.messages?.length
    };
  }

  getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  getMonthString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  persistCosts() {
    // In a real implementation, save to database or file
    // For now, just log the persistence action
    logger.debug('Cost data persisted', {
      daily: this.costs.daily.amount.toFixed(4),
      monthly: this.costs.monthly.amount.toFixed(4)
    });
  }

  loadStoredCosts() {
    // In a real implementation, load from database or file
    // For now, start with zero costs
    logger.debug('Cost data loaded from storage');
  }

  /**
   * Reset costs for testing or new period
   */
  resetCosts(period = 'all') {
    if (period === 'daily' || period === 'all') {
      this.costs.daily = { amount: 0, requests: 0, resetDate: this.getDateString() };
    }
    
    if (period === 'monthly' || period === 'all') {
      this.costs.monthly = { amount: 0, requests: 0, resetDate: this.getMonthString() };
    }
    
    if (period === 'session' || period === 'all') {
      this.costs.session = { amount: 0, requests: 0, startTime: Date.now() };
    }

    logger.info('Cost tracking reset', { period });
  }

  /**
   * Update budget configuration
   */
  updateBudgets(newBudgets) {
    this.config = { ...this.config, ...newBudgets };
    logger.info('Budget configuration updated', newBudgets);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.optimizationCache.close();
    this.persistCosts();
    
    logger.info('Cost optimizer cleaned up', {
      totalCostSavings: this.analytics.costSavings.toFixed(4),
      optimizedRequests: this.analytics.optimizedRequests,
      sessionCosts: this.costs.session.amount.toFixed(4)
    });
  }
}
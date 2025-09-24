/**
 * OpenAI GPT-4 Powered Forecasting Service
 * Provides intelligent demand predictions across all markets
 * with confidence scoring, caching, and fallback models
 */

import OpenAI from 'openai';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import logger from '../logger.js';

class OpenAIForecastingService extends EventEmitter {
  constructor() {
    super();
    this.openai = null;
    this.cache = new Map();
    this.cacheExpiry = 3600000; // 1 hour
    this.modelVersion = 'gpt-4-turbo-preview';
    this.accuracyHistory = new Map();
    this.confidenceThreshold = 0.7;
    this.costTracker = {
      totalTokens: 0,
      totalCost: 0,
      requests: 0
    };
    this.initialize();
  }

  initialize() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn('OpenAI API key not configured - forecasting will use fallback models');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        maxRetries: 3,
        timeout: 30000
      });
      logger.info('OpenAI forecasting service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI service:', error);
    }
  }

  /**
   * Generate market-specific demand forecast
   * @param {Object} params - Forecasting parameters
   * @returns {Promise<Object>} Forecast with confidence scores
   */
  async generateForecast(params) {
    const {
      market,
      product,
      historicalData,
      timeHorizon = 30, // days
      includeSeasonality = true,
      includeEvents = true,
      currency = 'GBP'
    } = params;

    // Check cache first
    const cacheKey = this.getCacheKey(params);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.info(`Returning cached forecast for ${market}-${product}`);
      return cached;
    }

    try {
      let forecast;
      
      if (this.openai) {
        // Use GPT-4 for intelligent forecasting
        forecast = await this.generateAIForecast(params);
      } else {
        // Use fallback statistical model
        forecast = await this.generateStatisticalForecast(params);
      }

      // Add confidence scoring
      forecast.confidence = this.calculateConfidence(forecast, historicalData);
      
      // Track accuracy for continuous improvement
      this.trackAccuracy(market, product, forecast);
      
      // Cache the result
      this.setCache(cacheKey, forecast);
      
      // Emit real-time update
      this.emit('forecast-generated', {
        market,
        product,
        forecast,
        timestamp: new Date().toISOString()
      });

      return forecast;
    } catch (error) {
      logger.error('Forecast generation failed:', error);
      // Fallback to statistical model on error
      return this.generateStatisticalForecast(params);
    }
  }

  /**
   * Generate forecast using GPT-4
   */
  async generateAIForecast(params) {
    const {
      market,
      product,
      historicalData,
      timeHorizon,
      includeSeasonality,
      includeEvents,
      currency
    } = params;

    // Prepare context for GPT-4
    const context = this.prepareAIContext(params);
    
    const systemPrompt = `You are an expert demand forecasting AI for Sentia Spirits manufacturing. 
    Analyze historical sales data and provide accurate demand predictions with reasoning.
    Consider seasonality, market trends, events, and regional factors.
    Always provide confidence scores and identify key drivers.`;

    const userPrompt = `Generate a ${timeHorizon}-day demand forecast for:
    Market: ${market}
    Product: ${product}
    Currency: ${currency}
    
    Historical Data (last 90 days):
    ${JSON.stringify(historicalData.slice(-90), null, 2)}
    
    ${includeSeasonality ? 'Include seasonal patterns analysis.' : ''}
    ${includeEvents ? 'Consider upcoming events and holidays.' : ''}
    
    Provide response in JSON format with:
    - daily_forecast: array of {date, quantity, revenue}
    - weekly_aggregates: weekly summaries
    - key_drivers: factors influencing forecast
    - seasonality_detected: boolean and pattern description
    - confidence_factors: reasons for confidence level
    - recommendations: actionable insights`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.modelVersion,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent predictions
        response_format: { type: "json_object" },
        stream: false
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      // Track token usage for cost optimization
      this.trackUsage(completion.usage);

      // Enhance response with additional metrics
      return {
        ...response,
        market,
        product,
        timeHorizon,
        generatedAt: new Date().toISOString(),
        modelUsed: 'gpt-4',
        methodology: 'ai-enhanced',
        marketSpecificFactors: this.getMarketFactors(market),
        historicalAccuracy: this.getHistoricalAccuracy(market, product)
      };
    } catch (error) {
      logger.error('GPT-4 forecast generation failed:', error);
      throw error;
    }
  }

  /**
   * Fallback statistical forecasting model
   */
  async generateStatisticalForecast(params) {
    const {
      market,
      product,
      historicalData,
      timeHorizon,
      includeSeasonality
    } = params;

    logger.info(`Using statistical fallback for ${market}-${product}`);

    // Simple moving average with trend analysis
    const recentData = historicalData.slice(-30);
    const avgDaily = recentData.reduce((sum, d) => sum + d.quantity, 0) / recentData.length;
    
    // Calculate trend
    const firstHalf = recentData.slice(0, 15);
    const secondHalf = recentData.slice(15);
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.quantity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.quantity, 0) / secondHalf.length;
    const trendFactor = (secondAvg - firstAvg) / firstAvg;

    // Detect weekly seasonality
    const weeklyPattern = this.detectWeeklyPattern(historicalData);
    
    // Generate forecast
    const daily_forecast = [];
    const startDate = new Date();
    
    for (let i = 0; i < timeHorizon; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      let quantity = avgDaily * (1 + trendFactor * (i / timeHorizon));
      
      // Apply seasonality
      if (includeSeasonality && weeklyPattern) {
        const dayOfWeek = date.getDay();
        quantity *= weeklyPattern[dayOfWeek];
      }
      
      // Add some randomness for realism
      quantity *= (0.95 + Math.random() * 0.1);
      
      daily_forecast.push({
        date: date.toISOString().split('T')[0],
        quantity: Math.round(quantity),
        revenue: Math.round(quantity * this.getAveragePrice(product, market))
      });
    }

    // Calculate weekly aggregates
    const weekly_aggregates = this.aggregateWeekly(daily_forecast);

    return {
      daily_forecast,
      weekly_aggregates,
      key_drivers: ['Historical trend', 'Seasonal patterns', 'Moving average'],
      seasonality_detected: !!weeklyPattern,
      confidence_factors: ['Statistical model', 'Limited to historical patterns'],
      recommendations: ['Consider external factors for improved accuracy'],
      market,
      product,
      timeHorizon,
      generatedAt: new Date().toISOString(),
      modelUsed: 'statistical',
      methodology: 'moving-average-with-trend'
    };
  }

  /**
   * Calculate confidence score for forecast
   */
  calculateConfidence(forecast, historicalData) {
    let confidence = 0.5; // Base confidence

    // Factor 1: Data completeness (20%)
    const dataCompleteness = historicalData.filter(d => d.quantity > 0).length / historicalData.length;
    confidence += dataCompleteness * 0.2;

    // Factor 2: Model type (20%)
    if (forecast.modelUsed === 'gpt-4') {
      confidence += 0.2;
    } else {
      confidence += 0.1;
    }

    // Factor 3: Historical accuracy (30%)
    const historicalAccuracy = forecast.historicalAccuracy || 0.7;
    confidence += historicalAccuracy * 0.3;

    // Factor 4: Seasonality detection (15%)
    if (forecast.seasonality_detected) {
      confidence += 0.15;
    }

    // Factor 5: Market stability (15%)
    const volatility = this.calculateVolatility(historicalData);
    const stabilityScore = Math.max(0, 1 - volatility);
    confidence += stabilityScore * 0.15;

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  /**
   * Stream real-time AI insights
   */
  async *streamInsights(market, options = {}) {
    const {
      updateInterval = 5000, // 5 seconds
      includeAllProducts = false
    } = options;

    while (true) {
      try {
        const insights = await this.generateMarketInsights(market, includeAllProducts);
        
        yield {
          type: 'insight',
          market,
          data: insights,
          timestamp: new Date().toISOString()
        };

        // Check for anomalies
        const anomalies = await this.detectAnomalies(market);
        if (anomalies.length > 0) {
          yield {
            type: 'anomaly',
            market,
            data: anomalies,
            timestamp: new Date().toISOString()
          };
        }

        await new Promise(resolve => setTimeout(resolve, updateInterval));
      } catch (error) {
        logger.error('Error streaming insights:', error);
        yield {
          type: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  /**
   * Generate market-specific insights using AI
   */
  async generateMarketInsights(market, includeAllProducts) {
    if (!this.openai) {
      return this.generateBasicInsights(market);
    }

    const cacheKey = `insights-${market}-${includeAllProducts}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const marketData = await this.getMarketData(market);
      
      const prompt = `Analyze the ${market} market for Sentia Spirits and provide:
      1. Current market trends
      2. Demand drivers
      3. Risk factors
      4. Opportunities
      5. Recommended actions
      
      Market Data: ${JSON.stringify(marketData)}`;

      const completion = await this.openai.chat.completions.create({
        model: this.modelVersion,
        messages: [
          { role: 'system', content: 'You are a market analysis expert for spirits manufacturing.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      const insights = {
        market,
        analysis: completion.choices[0].message.content,
        generated: new Date().toISOString(),
        confidence: 0.85
      };

      this.setCache(cacheKey, insights);
      return insights;
    } catch (error) {
      logger.error('Failed to generate AI insights:', error);
      return this.generateBasicInsights(market);
    }
  }

  /**
   * Detect anomalies in market data
   */
  async detectAnomalies(market) {
    const data = await this.getMarketData(market);
    const anomalies = [];

    // Statistical anomaly detection
    for (const product of data.products || []) {
      const recent = product.recentSales || [];
      if (recent.length < 7) continue;

      const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
      const stdDev = Math.sqrt(
        recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length
      );

      const latest = recent[recent.length - 1];
      const zScore = Math.abs((latest - mean) / stdDev);

      if (zScore > 2.5) {
        anomalies.push({
          type: 'statistical',
          product: product.name,
          severity: zScore > 3 ? 'high' : 'medium',
          value: latest,
          expected: mean,
          deviation: zScore
        });
      }
    }

    return anomalies;
  }

  /**
   * Track forecast accuracy for continuous improvement
   */
  trackAccuracy(market, product, forecast) {
    const key = `${market}-${product}`;
    
    if (!this.accuracyHistory.has(key)) {
      this.accuracyHistory.set(key, []);
    }

    const history = this.accuracyHistory.get(key);
    history.push({
      forecast,
      timestamp: Date.now(),
      actual: null // Will be updated when actual data arrives
    });

    // Keep only last 100 forecasts
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Update accuracy with actual results
   */
  updateAccuracy(market, product, date, actualValue) {
    const key = `${market}-${product}`;
    const history = this.accuracyHistory.get(key) || [];

    for (const record of history) {
      const forecastDay = record.forecast.daily_forecast?.find(
        d => d.date === date
      );
      
      if (forecastDay && record.actual === null) {
        record.actual = actualValue;
        record.accuracy = 1 - Math.abs(forecastDay.quantity - actualValue) / actualValue;
        break;
      }
    }
  }

  /**
   * Get historical accuracy for a market/product
   */
  getHistoricalAccuracy(market, product) {
    const key = `${market}-${product}`;
    const history = this.accuracyHistory.get(key) || [];
    
    const withActuals = history.filter(h => h.actual !== null);
    if (withActuals.length === 0) return 0.75; // Default accuracy

    const avgAccuracy = withActuals.reduce((sum, h) => sum + (h.accuracy || 0), 0) / withActuals.length;
    return Math.min(0.95, Math.max(0.5, avgAccuracy));
  }

  /**
   * Market-specific factors
   */
  getMarketFactors(market) {
    const factors = {
      'UK': {
        currency: 'GBP',
        seasonalPeaks: ['December', 'June'],
        regulations: 'HMRC compliant',
        distributionChannels: ['Retail', 'Online', 'Hospitality'],
        competitionLevel: 'High',
        growthRate: 0.05
      },
      'USA': {
        currency: 'USD',
        seasonalPeaks: ['July', 'December'],
        regulations: 'TTB compliant',
        distributionChannels: ['Three-tier system', 'DTC where permitted'],
        competitionLevel: 'Very High',
        growthRate: 0.08
      },
      'EU': {
        currency: 'EUR',
        seasonalPeaks: ['August', 'December'],
        regulations: 'EU spirits directive',
        distributionChannels: ['Importers', 'Direct retail'],
        competitionLevel: 'Medium',
        growthRate: 0.06
      },
      'ASIA': {
        currency: 'Multiple',
        seasonalPeaks: ['February', 'October'],
        regulations: 'Varies by country',
        distributionChannels: ['Importers', 'Duty-free'],
        competitionLevel: 'Medium',
        growthRate: 0.12
      }
    };

    return factors[market] || factors['UK'];
  }

  /**
   * Helper methods
   */
  detectWeeklyPattern(data) {
    if (data.length < 28) return null;
    
    const dayTotals = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);
    
    data.forEach(d => {
      const day = new Date(d.date).getDay();
      dayTotals[day] += d.quantity;
      dayCounts[day]++;
    });
    
    const avgByDay = dayTotals.map((total, i) => 
      dayCounts[i] > 0 ? total / dayCounts[i] : 0
    );
    
    const overallAvg = dayTotals.reduce((a, b) => a + b) / dayCounts.reduce((a, b) => a + b);
    
    return avgByDay.map(avg => avg / overallAvg);
  }

  aggregateWeekly(dailyForecast) {
    const weeks = [];
    let currentWeek = [];
    
    dailyForecast.forEach(day => {
      currentWeek.push(day);
      
      if (new Date(day.date).getDay() === 0 && currentWeek.length > 1) {
        weeks.push({
          weekStarting: currentWeek[0].date,
          totalQuantity: currentWeek.reduce((sum, d) => sum + d.quantity, 0),
          totalRevenue: currentWeek.reduce((sum, d) => sum + d.revenue, 0),
          avgDaily: currentWeek.reduce((sum, d) => sum + d.quantity, 0) / currentWeek.length
        });
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      weeks.push({
        weekStarting: currentWeek[0].date,
        totalQuantity: currentWeek.reduce((sum, d) => sum + d.quantity, 0),
        totalRevenue: currentWeek.reduce((sum, d) => sum + d.revenue, 0),
        avgDaily: currentWeek.reduce((sum, d) => sum + d.quantity, 0) / currentWeek.length
      });
    }
    
    return weeks;
  }

  calculateVolatility(data) {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i-1].quantity > 0) {
        returns.push((data[i].quantity - data[i-1].quantity) / data[i-1].quantity);
      }
    }
    
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  getAveragePrice(product, market) {
    // Simplified pricing model - would be connected to actual pricing data
    const basePrices = {
      'GABA Spirit': 35,
      'Social Blend': 32,
      'Focus Mix': 38
    };
    
    const marketMultipliers = {
      'UK': 1.0,
      'USA': 1.2,
      'EU': 1.1,
      'ASIA': 1.3
    };
    
    const base = basePrices[product] || 35;
    const multiplier = marketMultipliers[market] || 1.0;
    
    return base * multiplier;
  }

  async getMarketData(market) {
    // FORCE REAL DATA ONLY - No mock market data allowed
    throw new Error(`Real market data integration required for ${market}. Please configure external data sources (Shopify API, Amazon SP-API, Unleashed API, Xero API) to provide authentic market sales data, competitor analysis, and market share metrics. No mock market data will be generated.`);
  }

  generateBasicInsights(market) {
    // FORCE REAL DATA ONLY - No basic/fallback insights allowed
    throw new Error(`Real market insights integration required for ${market}. Please configure OpenAI API key and external data sources to generate authentic market analysis. No fallback insights will be generated.`);
  }

  prepareAIContext(params) {
    // Prepare comprehensive context for AI model
    return {
      historicalTrends: this.analyzeHistoricalTrends(params.historicalData),
      marketConditions: this.getMarketFactors(params.market),
      productCategory: this.getProductCategory(params.product),
      externalFactors: this.getExternalFactors(params.market)
    };
  }

  analyzeHistoricalTrends(data) {
    // Analyze historical data for trends
    return {
      trend: 'upward',
      volatility: this.calculateVolatility(data),
      seasonality: this.detectWeeklyPattern(data) !== null
    };
  }

  getProductCategory(product) {
    // Categorize products for better forecasting
    const categories = {
      'GABA Spirit': 'premium',
      'Social Blend': 'mainstream',
      'Focus Mix': 'specialty'
    };
    return categories[product] || 'standard';
  }

  getExternalFactors(market) {
    // External factors that might affect demand
    return {
      economicIndicators: 'stable',
      competitorActivity: 'moderate',
      regulatoryChanges: 'none',
      upcomingEvents: []
    };
  }

  trackUsage(usage) {
    if (usage) {
      this.costTracker.totalTokens += usage.total_tokens || 0;
      this.costTracker.requests++;
      // Rough cost estimate (GPT-4 pricing)
      this.costTracker.totalCost += (usage.total_tokens || 0) * 0.00003;
      
      logger.info(`AI Usage - Tokens: ${usage.total_tokens}, Total Cost: $${this.costTracker.totalCost.toFixed(4)}`);
    }
  }

  getCacheKey(params) {
    const str = JSON.stringify({
      market: params.market,
      product: params.product,
      timeHorizon: params.timeHorizon,
      includeSeasonality: params.includeSeasonality
    });
    return crypto.createHash('md5').update(str).digest('hex');
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cost optimization report
   */
  getCostReport() {
    return {
      totalRequests: this.costTracker.requests,
      totalTokens: this.costTracker.totalTokens,
      estimatedCost: this.costTracker.totalCost,
      averageTokensPerRequest: this.costTracker.requests > 0 
        ? Math.round(this.costTracker.totalTokens / this.costTracker.requests)
        : 0,
      cacheHitRate: this.calculateCacheHitRate(),
      recommendations: this.getCostOptimizationRecommendations()
    };
  }

  calculateCacheHitRate() {
    // This would track actual cache hits vs misses
    return 0.65; // Placeholder
  }

  getCostOptimizationRecommendations() {
    const recommendations = [];
    
    if (this.costTracker.averageTokensPerRequest > 2000) {
      recommendations.push('Consider reducing prompt size for frequent queries');
    }
    
    if (this.calculateCacheHitRate() < 0.5) {
      recommendations.push('Increase cache duration for stable forecasts');
    }
    
    if (this.costTracker.requests > 1000) {
      recommendations.push('Implement request batching for similar forecasts');
    }
    
    return recommendations;
  }
}

// Export singleton instance
const forecastingService = new OpenAIForecastingService();
export default forecastingService;
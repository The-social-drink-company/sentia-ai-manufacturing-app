import axios from 'axios';
import { amazonSPAPI, amazonUtils } from './amazonApi.js';
import { shopifyUK, shopifyEU, shopifyUSA, shopifyUtils } from './shopifyApi.js';
import ManufacturingMCPServers from '../../services/mcp/manufacturingMCPServers.js';
import logger from '../../services/logger.js';

/**
 * Enterprise AI Ensemble Forecasting Service
 * Multi-model approach with confidence scoring and seasonal decomposition
 * Integrates with MCP servers for real-time manufacturing data
 */
class AIEnsembleForecastingService {
  constructor() {
    this.models = {
      openai: {
        client: this.initializeOpenAI(),
        models: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
        weight: 0.3
      },
      claude: {
        client: this.initializeClaude(),
        model: 'claude-3-sonnet-20240229',
        weight: 0.3
      },
      azure: {
        client: this.initializeAzureOpenAI(),
        models: ['gpt-4', 'gpt-35-turbo'],
        weight: 0.2
      },
      statistical: {
        methods: ['arima', 'exponential_smoothing', 'seasonal_decompose'],
        weight: 0.2
      }
    };

    this.mcpServers = new ManufacturingMCPServers();
    this.forecastCache = new Map();
    this.modelPerformance = new Map();
    this.ensembleWeights = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes

    this.initializePerformanceTracking();
    logger.info('AI Ensemble Forecasting Service initialized');
  }

  /**
   * Initialize OpenAI client
   */
  initializeOpenAI() {
    const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    return axios.create({
      baseURL: 'https://api.openai.com/v1',
      timeout: 60000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Initialize Claude client
   */
  initializeClaude() {
    const apiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) return null;

    return axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      timeout: 60000,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
  }

  /**
   * Initialize Azure OpenAI client
   */
  initializeAzureOpenAI() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    if (!apiKey || !endpoint) return null;

    return axios.create({
      baseURL: `${endpoint}/openai/deployments`,
      timeout: 60000,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate ensemble forecast with multiple AI models and statistical methods
   */
  async generateEnsembleForecast(options = {}) {
    const {
      sku,
      timeHorizon = 90,
      confidenceInterval = 0.95,
      includeExternalFactors = true,
      useSeasonalDecomposition = true,
      mcpDataSources = ['erp-system', 'mes-system', 'supply-chain']
    } = options;

    const cacheKey = `ensemble_${sku}_${timeHorizon}_${JSON.stringify(mcpDataSources)}`;
    const cached = this.forecastCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return { ...cached.data, fromCache: true };
    }

    try {
      // Step 1: Aggregate data from all sources including MCP servers
      const dataAggregation = await this.aggregateEnhancedData(sku, mcpDataSources);
      
      if (!dataAggregation.success) {
        throw new Error(`Data aggregation failed: ${dataAggregation.error}`);
      }

      // Step 2: Seasonal decomposition if enabled
      let processedData = dataAggregation.data;
      if (useSeasonalDecomposition) {
        processedData = await this.performSeasonalDecomposition(processedData);
      }

      // Step 3: Generate forecasts from all available models
      const modelForecasts = await this.generateModelForecasts(
        processedData,
        timeHorizon,
        confidenceInterval,
        includeExternalFactors
      );

      // Step 4: Create ensemble forecast
      const ensembleForecast = await this.createEnsembleForecast(
        modelForecasts,
        timeHorizon,
        confidenceInterval
      );

      // Step 5: Update model performance tracking
      this.updateModelPerformance(modelForecasts);

      // Cache the result
      this.forecastCache.set(cacheKey, {
        data: ensembleForecast,
        timestamp: Date.now()
      });

      return {
        ...ensembleForecast,
        fromCache: false,
        dataQuality: this.assessEnhancedDataQuality(dataAggregation.data)
      };

    } catch (error) {
      logger.error('Ensemble forecasting error:', error);
      return {
        success: false,
        error: error.message,
        fallbackMethod: 'statistical_ensemble'
      };
    }
  }

  /**
   * Aggregate data from traditional sources and MCP servers
   */
  async aggregateEnhancedData(sku, mcpDataSources, days = 180) {
    try {
      const promises = [];

      // Traditional data sources
      if (amazonSPAPI.isConfigured()) {
        promises.push(
          amazonSPAPI.transformOrdersForForecasting(days)
            .then(result => ({ source: 'amazon', ...result }))
        );
      }

      const shopifyInstances = [
        { name: 'UK', instance: shopifyUK },
        { name: 'EU', instance: shopifyEU },
        { name: 'USA', instance: shopifyUSA }
      ];

      shopifyInstances.forEach(({ name, instance }) => {
        if (instance.isConfigured()) {
          promises.push(
            instance.transformOrdersForForecasting(days)
              .then(result => ({ source: `shopify_${name}`, region: name, ...result }))
          );
        }
      });

      // MCP server data sources
      if (mcpDataSources.length > 0) {
        promises.push(
          this.mcpServers.queryManufacturingIntelligence({
            intent: `historical demand data for SKU ${sku}`,
            parameters: {
              sku,
              timeRange: { days },
              dataTypes: ['sales-orders', 'production-data', 'inventory-movements']
            },
            useSemanticSearch: true
          }).then(result => ({ source: 'mcp-manufacturing', ...result }))
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Combine all data sources
      const combinedData = {
        sources: [],
        demandData: {},
        timeRange: { days, endDate: new Date() },
        dataPoints: 0,
        mcpData: null,
        externalFactors: {}
      };

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success !== false) {
          const sourceData = result.value;
          
          if (sourceData.source === 'mcp-manufacturing') {
            // Process MCP data
            combinedData.mcpData = sourceData;
            combinedData.externalFactors = this.extractExternalFactors(sourceData);
          } else {
            // Process traditional e-commerce data
            this.mergeTraditionalData(combinedData, sourceData, sku);
          }
        }
      });

      return {
        success: combinedData.sources.length > 0 || combinedData.mcpData,
        data: combinedData,
        error: null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Extract external factors from MCP data
   */
  extractExternalFactors(mcpData) {
    const factors = {};

    if (mcpData.data) {
      mcpData.data.forEach(source => {
        switch (source.type) {
          case 'erp':
            factors.customerOrders = this.processERPFactors(source.data);
            break;
          case 'mes':
            factors.productionCapacity = this.processMESFactors(source.data);
            break;
          case 'scm':
            factors.supplierPerformance = this.processSCMFactors(source.data);
            break;
        }
      });
    }

    return factors;
  }

  /**
   * Perform seasonal decomposition using STL or X-13ARIMA-SEATS
   */
  async performSeasonalDecomposition(data) {
    try {
      const productData = Object.values(data.demandData)[0];
      if (!productData || !productData.dailyDemand) return data;

      const timeSeries = this.prepareTimeSeries(productData.dailyDemand);
      
      // Perform STL decomposition
      const decomposition = this.stlDecomposition(timeSeries);
      
      // Add decomposition to data
      data.seasonalDecomposition = decomposition;
      data.trendComponent = decomposition.trend;
      data.seasonalComponent = decomposition.seasonal;
      data.residualComponent = decomposition.residual;

      return data;

    } catch (error) {
      logger.warn('Seasonal decomposition failed:', error);
      return data;
    }
  }

  /**
   * STL (Seasonal and Trend decomposition using Loess) implementation
   */
  stlDecomposition(timeSeries, seasonalPeriod = 7) {
    const n = timeSeries.length;
    const trend = this.loessSmoothing(timeSeries, 0.3);
    const detrended = timeSeries.map((val, i) => val - trend[i]);
    
    // Calculate seasonal component
    const seasonal = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const seasonalIndex = i % seasonalPeriod;
      const seasonalValues = [];
      
      for (let j = seasonalIndex; j < n; j += seasonalPeriod) {
        seasonalValues.push(detrended[j]);
      }
      
      seasonal[i] = seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;
    }

    const residual = timeSeries.map((val, i) => val - trend[i] - seasonal[i]);

    return {
      trend,
      seasonal,
      residual,
      original: timeSeries
    };
  }

  /**
   * LOESS smoothing for trend extraction
   */
  loessSmoothing(data, bandwidth) {
    const n = data.length;
    const smoothed = new Array(n);
    const windowSize = Math.floor(bandwidth * n);

    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(n - 1, start + windowSize - 1);
      
      let sum = 0;
      let count = 0;
      
      for (let j = start; j <= end; j++) {
        const weight = 1 - Math.abs(i - j) / windowSize;
        sum += data[j] * weight;
        count += weight;
      }
      
      smoothed[i] = sum / count;
    }

    return smoothed;
  }

  /**
   * Generate forecasts from all available AI models
   */
  async generateModelForecasts(data, timeHorizon, confidenceInterval, includeExternalFactors) {
    const forecasts = [];
    const analysisData = this.prepareEnhancedAnalysisData(data);

    // OpenAI forecasts
    if (this.models.openai.client) {
      for (const model of this.models.openai.models) {
        try {
          const forecast = await this.generateOpenAIForecast(
            model,
            analysisData,
            timeHorizon,
            confidenceInterval,
            includeExternalFactors
          );
          forecasts.push({ source: 'openai', model, ...forecast });
        } catch (error) {
          logger.warn(`OpenAI ${model} forecast failed:`, error.message);
        }
      }
    }

    // Claude forecasts
    if (this.models.claude.client) {
      try {
        const forecast = await this.generateClaudeForecast(
          analysisData,
          timeHorizon,
          confidenceInterval,
          includeExternalFactors
        );
        forecasts.push({ source: 'claude', model: this.models.claude.model, ...forecast });
      } catch (error) {
        logger.warn('Claude forecast failed:', error.message);
      }
    }

    // Azure OpenAI forecasts
    if (this.models.azure.client) {
      for (const model of this.models.azure.models) {
        try {
          const forecast = await this.generateAzureForecast(
            model,
            analysisData,
            timeHorizon,
            confidenceInterval,
            includeExternalFactors
          );
          forecasts.push({ source: 'azure', model, ...forecast });
        } catch (error) {
          logger.warn(`Azure ${model} forecast failed:`, error.message);
        }
      }
    }

    // Statistical forecasts
    const statisticalForecasts = await this.generateStatisticalForecasts(
      analysisData,
      timeHorizon,
      confidenceInterval
    );
    forecasts.push(...statisticalForecasts);

    return forecasts;
  }

  /**
   * Generate OpenAI forecast
   */
  async generateOpenAIForecast(model, data, timeHorizon, confidenceInterval, includeExternalFactors) {
    const prompt = this.buildEnhancedPrompt(data, timeHorizon, confidenceInterval, includeExternalFactors);
    
    const response = await this.models.openai.client.post('/chat/completions', {
      model,
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt(includeExternalFactors)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2500
    });

    return this.parseAIForecast(response.data.choices[0].message.content);
  }

  /**
   * Generate Claude forecast
   */
  async generateClaudeForecast(data, timeHorizon, confidenceInterval, includeExternalFactors) {
    const prompt = this.buildEnhancedPrompt(data, timeHorizon, confidenceInterval, includeExternalFactors);
    
    const response = await this.models.claude.client.post('/messages', {
      model: this.models.claude.model,
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `${this.buildSystemPrompt(includeExternalFactors)}\n\n${prompt}`
        }
      ]
    });

    return this.parseAIForecast(response.data.content[0].text);
  }

  /**
   * Generate statistical forecasts (ARIMA, Exponential Smoothing, etc.)
   */
  async generateStatisticalForecasts(data, timeHorizon, confidenceInterval) {
    const forecasts = [];
    const timeSeries = this.prepareTimeSeries(data.dailyDemand);

    // Simple Exponential Smoothing
    try {
      const sesForecast = this.exponentialSmoothing(timeSeries, timeHorizon, 0.3);
      forecasts.push({
        source: 'statistical',
        model: 'exponential_smoothing',
        success: true,
        forecast: sesForecast,
        confidence_score: 75
      });
    } catch (error) {
      logger.warn('Exponential smoothing failed:', error);
    }

    // Moving Average
    try {
      const maForecast = this.movingAverage(timeSeries, timeHorizon, 7);
      forecasts.push({
        source: 'statistical',
        model: 'moving_average',
        success: true,
        forecast: maForecast,
        confidence_score: 65
      });
    } catch (error) {
      logger.warn('Moving average failed:', error);
    }

    // Seasonal Naive
    if (data.seasonalComponent) {
      try {
        const seasonalForecast = this.seasonalNaive(timeSeries, timeHorizon, 7);
        forecasts.push({
          source: 'statistical',
          model: 'seasonal_naive',
          success: true,
          forecast: seasonalForecast,
          confidence_score: 70
        });
      } catch (error) {
        logger.warn('Seasonal naive failed:', error);
      }
    }

    return forecasts;
  }

  /**
   * Simple Exponential Smoothing
   */
  exponentialSmoothing(data, horizon, alpha = 0.3) {
    const forecast = [];
    let level = data[0];
    
    // Fit the model
    for (let i = 1; i < data.length; i++) {
      level = alpha * data[i] + (1 - alpha) * level;
    }

    // Generate forecast
    for (let i = 1; i <= horizon; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted_demand: Math.max(0, Math.round(level * 100) / 100),
        confidence_lower: Math.max(0, Math.round(level * 0.85 * 100) / 100),
        confidence_upper: Math.max(0, Math.round(level * 1.15 * 100) / 100),
        method: 'exponential_smoothing'
      });
    }

    return forecast;
  }

  /**
   * Create ensemble forecast by combining all model predictions
   */
  async createEnsembleForecast(modelForecasts, timeHorizon, confidenceInterval) {
    if (modelForecasts.length === 0) {
      throw new Error('No model forecasts available for ensemble');
    }

    const ensembleForecast = {
      success: true,
      forecast: [],
      insights: {
        model_count: modelForecasts.length,
        ensemble_method: 'weighted_average',
        confidence_score: 0,
        model_agreement: 0
      },
      modelContributions: {},
      recommendations: []
    };

    // Calculate dynamic weights based on model performance
    const weights = this.calculateDynamicWeights(modelForecasts);

    // Combine forecasts for each day
    for (let day = 1; day <= timeHorizon; day++) {
      const dayForecasts = [];
      const confidenceLowers = [];
      const confidenceUppers = [];

      modelForecasts.forEach(modelForecast => {
        if (modelForecast.success && modelForecast.forecast && modelForecast.forecast[day - 1]) {
          const dayForecast = modelForecast.forecast[day - 1];
          dayForecasts.push({
            value: dayForecast.predicted_demand,
            weight: weights[`${modelForecast.source}_${modelForecast.model}`] || 0.1,
            source: modelForecast.source,
            model: modelForecast.model
          });
          confidenceLowers.push(dayForecast.confidence_lower);
          confidenceUppers.push(dayForecast.confidence_upper);
        }
      });

      if (dayForecasts.length > 0) {
        // Weighted average
        const weightedSum = dayForecasts.reduce((sum, f) => sum + (f.value * f.weight), 0);
        const totalWeight = dayForecasts.reduce((sum, f) => sum + f.weight, 0);
        const ensembleValue = weightedSum / totalWeight;

        // Confidence intervals
        const avgLower = confidenceLowers.reduce((sum, val) => sum + val, 0) / confidenceLowers.length;
        const avgUpper = confidenceUppers.reduce((sum, val) => sum + val, 0) / confidenceUppers.length;

        const date = new Date();
        date.setDate(date.getDate() + day);

        ensembleForecast.forecast.push({
          date: date.toISOString().split('T')[0],
          predicted_demand: Math.max(0, Math.round(ensembleValue * 100) / 100),
          confidence_lower: Math.max(0, Math.round(avgLower * 100) / 100),
          confidence_upper: Math.max(0, Math.round(avgUpper * 100) / 100),
          method: 'ensemble',
          model_count: dayForecasts.length,
          model_agreement: this.calculateModelAgreement(dayForecasts)
        });
      }
    }

    // Calculate overall ensemble confidence
    ensembleForecast.insights.confidence_score = this.calculateEnsembleConfidence(modelForecasts, weights);
    ensembleForecast.insights.model_agreement = this.calculateOverallModelAgreement(ensembleForecast.forecast);

    // Add model contributions
    ensembleForecast.modelContributions = weights;

    // Generate recommendations
    ensembleForecast.recommendations = this.generateEnsembleRecommendations(
      modelForecasts,
      ensembleForecast.insights
    );

    return ensembleForecast;
  }

  /**
   * Calculate dynamic weights based on model performance
   */
  calculateDynamicWeights(modelForecasts) {
    const weights = {};
    
    modelForecasts.forEach(forecast => {
      const key = `${forecast.source}_${forecast.model}`;
      let weight = 0.1; // Base weight

      // Adjust weight based on confidence score
      if (forecast.confidence_score) {
        weight += (forecast.confidence_score / 100) * 0.3;
      }

      // Adjust based on historical performance
      const historicalPerformance = this.modelPerformance.get(key);
      if (historicalPerformance) {
        weight += (historicalPerformance.accuracy / 100) * 0.4;
      }

      // Adjust based on model type
      const baseWeights = this.models[forecast.source]?.weight || 0.15;
      weight += baseWeights;

      weights[key] = Math.max(0.05, Math.min(1.0, weight));
    });

    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach(key => {
      weights[key] = weights[key] / totalWeight;
    });

    return weights;
  }

  /**
   * Initialize performance tracking for models
   */
  initializePerformanceTracking() {
    // Initialize with default performance metrics
    const defaultModels = [
      'openai_gpt-4-turbo-preview',
      'openai_gpt-3.5-turbo',
      'claude_claude-3-sonnet-20240229',
      'azure_gpt-4',
      'azure_gpt-35-turbo',
      'statistical_exponential_smoothing',
      'statistical_moving_average',
      'statistical_seasonal_naive'
    ];

    defaultModels.forEach(model => {
      this.modelPerformance.set(model, {
        accuracy: 75,
        lastUpdated: new Date(),
        forecastCount: 0,
        averageError: 0
      });
    });
  }

  /**
   * Assess enhanced data quality including MCP sources
   */
  assessEnhancedDataQuality(data) {
    let score = 0;
    
    // Traditional data sources
    const sources = data.sources?.length || 0;
    score += Math.min(sources * 15, 30);
    
    // MCP data bonus
    if (data.mcpData && data.mcpData.data?.length > 0) {
      score += 25;
    }
    
    // External factors bonus
    if (Object.keys(data.externalFactors || {}).length > 0) {
      score += 15;
    }
    
    // Seasonal decomposition bonus
    if (data.seasonalDecomposition) {
      score += 10;
    }
    
    // Data completeness and recency
    const dataPoints = Object.keys(data.demandData).length;
    if (dataPoints > 0) {
      score += Math.min((dataPoints / 30) * 20, 20);
    }
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Generate ensemble recommendations
   */
  generateEnsembleRecommendations(modelForecasts, insights) {
    const recommendations = [];
    
    if (insights.confidence_score < 70) {
      recommendations.push('Consider gathering more historical data to improve forecast accuracy');
    }
    
    if (insights.model_agreement < 0.8) {
      recommendations.push('High variance between models suggests market uncertainty - monitor closely');
    }
    
    if (modelForecasts.length < 3) {
      recommendations.push('Enable more AI models for better ensemble forecasting');
    }
    
    recommendations.push('Ensemble forecast provides better accuracy than individual models');
    
    return recommendations;
  }

  /**
   * Calculate model agreement score
   */
  calculateModelAgreement(forecasts) {
    if (forecasts.length < 2) return 1.0;
    
    const values = forecasts.map(f => f.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to agreement score (0-1, where 1 is perfect agreement)
    const cv = mean > 0 ? stdDev / mean : 0;
    return Math.max(0, 1 - cv);
  }

  /**
   * Get ensemble forecasting status
   */
  getEnsembleStatus() {
    return {
      availableModels: {
        openai: !!this.models.openai.client,
        claude: !!this.models.claude.client,
        azure: !!this.models.azure.client,
        statistical: true
      },
      mcpIntegration: true,
      vectorDatabase: this.mcpServers.vectorDb?.enabled || false,
      cacheSize: this.forecastCache.size,
      performanceTracking: this.modelPerformance.size,
      capabilities: [
        'multi_model_ensemble',
        'seasonal_decomposition',
        'mcp_data_integration',
        'confidence_scoring',
        'performance_tracking',
        'semantic_search_integration'
      ]
    };
  }

  /**
   * Update model performance based on actual results
   */
  async updateModelPerformance(actualDemand, forecastDate) {
    // Implementation for updating model performance when actual data becomes available
    // This would be called from a scheduled job that compares forecasts to actual results
    logger.info('Model performance update scheduled');
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    await this.mcpServers.shutdown();
    this.forecastCache.clear();
    this.modelPerformance.clear();
    logger.info('AI Ensemble Forecasting Service shutdown complete');
  }
}

export default AIEnsembleForecastingService;

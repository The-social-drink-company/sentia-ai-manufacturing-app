import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  SimpleMovingAverageModel,
  HoltWintersModel,
  LinearRegressionModel,
  ARIMAModel
} from './models/index.js';
import CacheService from './CacheService.js';
import BatchProcessor from './BatchProcessor.js';
import FXService from './FXService.js';
import RegionalCalendarService from './RegionalCalendarService.js';

class ForecastingService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      backtestFolds: options.backtestFolds || 5,
      minTrainingDays: options.minTrainingDays || 90,
      maxTrainingDays: options.maxTrainingDays || 365,
      stepSizeDays: options.stepSizeDays || 7,
      ensembleMinWeight: options.ensembleMinWeight || 0.05,
      ensembleMaxWeight: options.ensembleMaxWeight || 0.70,
      predictionIntervalCoverage: options.predictionIntervalCoverage || 0.95,
      batchSize: options.batchSize || 100
    };
    
    this.models = {
      SMA: new SimpleMovingAverageModel(),
      HoltWinters: new HoltWintersModel(),
      ARIMA: new ARIMAModel(),
      Linear: new LinearRegressionModel()
    };
    
    this.jobs = new Map();
    
    // Initialize caching and batching
    this.cache = new CacheService({
      maxSize: options.cacheMaxSize || 500,
      ttl: options.cacheTTL || 1800000, // 30 minutes
    });
    
    this.batchProcessor = new BatchProcessor({
      maxBatchSize: options.maxBatchSize || 25,
      batchTimeout: options.batchTimeout || 3000,
      maxConcurrency: options.maxConcurrency || 2
    });
    
    // Setup batch processor events
    this.batchProcessor.on('batchStarted', (data) => {
      this.emit('batchStarted', data);
    });
    
    this.batchProcessor.on('batchCompleted', (data) => {
      this.emit('batchCompleted', data);
    });
    
    // Initialize FX and calendar services
    this.fxService = new FXService({
      baseCurrency: options.baseCurrency || 'GBP',
      supportedCurrencies: options.supportedCurrencies || ['GBP', 'EUR', 'USD']
    });
    
    this.calendarService = new RegionalCalendarService({
      supportedRegions: options.supportedRegions || ['UK', 'EU', 'USA']
    });
  }

  // Main forecast entry point with idempotency
  async generateForecast(request, idempotentKey = null) {
    const jobId = idempotentKey || this.generateJobId(request);
    
    // Check for existing job
    if (this.jobs.has(jobId)) {
      const existingJob = this.jobs.get(jobId);
      if (existingJob.status !== 'FAILED') {
        return { jobId, status: existingJob.status };
      }
    }

    // Create new forecast job
    const job = {
      id: jobId,
      status: 'QUEUED',
      request,
      progress: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      results: null,
      error: null
    };

    this.jobs.set(jobId, job);
    
    // Start processing asynchronously
    setImmediate(() => this.processForecastJob(jobId));
    
    return { jobId, status: 'QUEUED' };
  }

  async processForecastJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'RUNNING';
      job.startedAt = new Date().toISOString();
      this.emit('jobStatusChanged', { jobId, status: 'RUNNING' });

      const { series_filter, horizon, models, currency_mode } = job.request;
      const seriesIds = series_filter.series_ids || [];
      
      const results = [];
      let processedCount = 0;

      for (const seriesId of seriesIds) {
        if (job.status === 'CANCELLED') break;

        const seriesResult = await this.forecastSeries(seriesId, horizon, models);
        results.push(seriesResult);
        
        processedCount++;
        job.progress = (processedCount / seriesIds.length) * 100;
        this.emit('jobProgress', { jobId, progress: job.progress });
      }

      job.results = {
        forecasts: results,
        metadata: {
          totalSeries: seriesIds.length,
          processedSeries: processedCount,
          modelsUsed: models,
          currencyMode: currency_mode
        }
      };
      
      job.status = 'COMPLETED';
      job.completedAt = new Date().toISOString();
      this.emit('jobStatusChanged', { jobId, status: 'COMPLETED' });

    } catch (error) {
      job.status = 'FAILED';
      job.error = error.message;
      job.completedAt = new Date().toISOString();
      this.emit('jobStatusChanged', { jobId, status: 'FAILED', error: error.message });
    }
  }

  async forecastSeries(seriesId, horizon, requestedModels = ['Ensemble'], options = {}) {
    // Check cache first
    const cacheKey = this.cache.generateKey({
      seriesId,
      horizon,
      models: requestedModels.sort(),
      options: options,
      type: 'forecast'
    });
    
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      this.emit('cacheHit', { seriesId, cacheKey });
      return cachedResult;
    }
    
    // Load time series data
    const timeSeriesData = await this.loadTimeSeriesData(seriesId);
    
    if (timeSeriesData.length < this.config.minTrainingDays) {
      throw new Error(`Insufficient data: ${timeSeriesData.length} days, minimum ${this.config.minTrainingDays} required`);
    }

    // Perform rolling-origin backtesting for all models
    const backtestResults = await this.performRollingBacktest(timeSeriesData, horizon);
    
    // Calculate ensemble weights
    const ensembleWeights = this.calculateEnsembleWeights(backtestResults);
    
    // Generate forecasts with best models
    const forecasts = await this.generateModelForecasts(timeSeriesData, horizon, requestedModels);
    
    // Apply ensemble if requested
    if (requestedModels.includes('Ensemble')) {
      forecasts['Ensemble'] = this.calculateEnsembleForecast(forecasts, ensembleWeights);
    }

    // Calculate prediction intervals
    const predictionIntervals = await this.calibratePredictionIntervals(
      timeSeriesData, 
      backtestResults,
      forecasts,
      this.config.predictionIntervalCoverage
    );

    let result = {
      seriesId,
      forecasts,
      predictionIntervals,
      backtestMetrics: backtestResults.metrics,
      ensembleWeights,
      metadata: {
        dataPoints: timeSeriesData.length,
        trainingPeriod: `${timeSeriesData.length} days`,
        backtestFolds: this.config.backtestFolds,
        horizon: `${horizon} days`,
        baseCurrency: options.baseCurrency || 'GBP',
        region: options.region || 'UK'
      }
    };

    // Apply regional calendar adjustments if specified
    if (options.region && options.applyRegionalAdjustments !== false) {
      const forecastStartDate = new Date().toISOString().split('T')[0];
      result = this.calendarService.applyRegionalAdjustments(
        result,
        options.region,
        forecastStartDate,
        horizon
      );
      
      // Add calendar insights
      result.metadata.calendarInsights = this.calendarService.generateCalendarInsights(
        options.region,
        horizon
      );
    }

    // Apply FX conversion if specified
    if (options.currencyMode === 'converted' && options.targetCurrency && 
        options.targetCurrency !== (options.baseCurrency || 'GBP')) {
      
      result = await this.fxService.convertForecast(
        result,
        options.baseCurrency || 'GBP',
        options.targetCurrency,
        options.fxScenario
      );
      
      // Add FX volatility insights
      const volatilityData = this.fxService.calculateFXVolatilityAdjustment(
        options.baseCurrency || 'GBP',
        options.targetCurrency,
        horizon
      );
      
      result.metadata.fxInsights = {
        volatilityData,
        hedgingRecommendations: this.fxService.generateHedgingRecommendations(
          Math.max(...Object.values(forecasts).flat()),
          options.baseCurrency || 'GBP',
          options.targetCurrency,
          horizon
        )
      };
    }
    
    // Cache the result
    this.cache.set(cacheKey, result);
    this.emit('cacheMiss', { seriesId, cacheKey });
    
    return result;
  }

  async performRollingBacktest(timeSeries, horizon) {
    const folds = this.generateBacktestFolds(timeSeries, horizon);
    const modelResults = {};
    
    // Initialize results for each model
    Object.keys(this.models).forEach(modelName => {
      modelResults[modelName] = { predictions: [], errors: [], metrics: {} };
    });

    // Run backtesting for each fold
    for (let foldIndex = 0; foldIndex < folds.length; foldIndex++) {
      const fold = folds[foldIndex];
      const trainData = timeSeries.slice(fold.trainStart, fold.trainEnd);
      const testData = timeSeries.slice(fold.testStart, fold.testEnd);

      for (const [modelName, model] of Object.entries(this.models)) {
        try {
          // Fit model on training data
          await model.fit(trainData);
          
          // Generate predictions for test period
          const predictions = await model.forecast(testData.length);
          
          // Calculate fold errors
          const foldErrors = testData.map((actual, i) => ({
            actual: actual.value,
            predicted: predictions[i],
            error: actual.value - predictions[i],
            date: actual.date
          }));

          modelResults[modelName].predictions.push(...foldErrors);
        } catch (error) {
          console.warn(`Model ${modelName} failed on fold ${foldIndex}: ${error.message}`);
        }
      }
    }

    // Calculate aggregate metrics for each model
    Object.keys(modelResults).forEach(modelName => {
      const predictions = modelResults[modelName].predictions;
      if (predictions.length > 0) {
        modelResults[modelName].metrics = this.calculateMetrics(predictions);
      }
    });

    return { 
      folds,
      modelResults,
      metrics: modelResults
    };
  }

  generateBacktestFolds(timeSeries, horizon) {
    const folds = [];
    const totalDays = timeSeries.length;
    const testPeriodDays = Math.min(horizon, 30); // Cap test period at 30 days
    
    for (let fold = 0; fold < this.config.backtestFolds; fold++) {
      const daysBack = (this.config.backtestFolds - fold) * this.config.stepSizeDays;
      const testEnd = totalDays - daysBack;
      const testStart = testEnd - testPeriodDays;
      const trainEnd = testStart;
      const trainStart = Math.max(0, trainEnd - this.config.maxTrainingDays);

      if (trainEnd - trainStart >= this.config.minTrainingDays && testStart >= 0) {
        folds.push({
          foldNumber: fold + 1,
          trainStart,
          trainEnd, 
          testStart,
          testEnd,
          trainSize: trainEnd - trainStart,
          testSize: testEnd - testStart
        });
      }
    }
    
    return folds;
  }

  calculateMetrics(predictions) {
    if (predictions.length === 0) return {};

    const n = predictions.length;
    
    // MAPE (Mean Absolute Percentage Error)
    const mape = (predictions.reduce((sum, p) => 
      sum + Math.abs((p.actual - p.predicted) / p.actual), 0) / n) * 100;
    
    // sMAPE (Symmetric MAPE)
    const smape = (predictions.reduce((sum, p) => 
      sum + Math.abs(p.actual - p.predicted) / ((Math.abs(p.actual) + Math.abs(p.predicted)) / 2), 0) / n) * 100;
    
    // RMSE (Root Mean Square Error)
    const mse = predictions.reduce((sum, p) => sum + Math.pow(p.error, 2), 0) / n;
    const rmse = Math.sqrt(mse);
    
    // MAE (Mean Absolute Error)
    const mae = predictions.reduce((sum, p) => sum + Math.abs(p.error), 0) / n;

    return { mape, smape, rmse, mae };
  }

  calculateEnsembleWeights(backtestResults) {
    const weights = {};
    const modelNames = Object.keys(backtestResults.modelResults);
    
    // Calculate inverse MAPE weights
    const inverseMapes = {};
    let totalInverseMape = 0;
    
    modelNames.forEach(modelName => {
      const mape = backtestResults.modelResults[modelName].metrics.mape;
      if (mape && mape > 0) {
        inverseMapes[modelName] = 1 / mape;
        totalInverseMape += inverseMapes[modelName];
      }
    });

    // Normalize weights with constraints
    modelNames.forEach(modelName => {
      if (inverseMapes[modelName]) {
        let weight = inverseMapes[modelName] / totalInverseMape;
        
        // Apply weight constraints
        weight = Math.max(this.config.ensembleMinWeight, weight);
        weight = Math.min(this.config.ensembleMaxWeight, weight);
        
        weights[modelName] = weight;
      } else {
        weights[modelName] = this.config.ensembleMinWeight;
      }
    });

    // Renormalize to sum to 1.0
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach(modelName => {
      weights[modelName] = weights[modelName] / totalWeight;
    });

    return weights;
  }

  async generateModelForecasts(timeSeries, horizon, requestedModels) {
    const forecasts = {};
    
    for (const modelName of requestedModels) {
      if (modelName === 'Ensemble') continue; // Handle ensemble separately
      
      if (this.models[modelName]) {
        try {
          await this.models[modelName].fit(timeSeries);
          const predictions = await this.models[modelName].forecast(horizon);
          forecasts[modelName] = predictions;
        } catch (error) {
          console.warn(`Failed to generate forecast for ${modelName}: ${error.message}`);
        }
      }
    }
    
    return forecasts;
  }

  calculateEnsembleForecast(forecasts, weights) {
    if (Object.keys(forecasts).length === 0) return [];
    
    const modelNames = Object.keys(forecasts);
    const forecastLength = Math.max(...modelNames.map(name => forecasts[name].length));
    const ensemble = [];

    for (let i = 0; i < forecastLength; i++) {
      let weightedSum = 0;
      let totalWeight = 0;

      modelNames.forEach(modelName => {
        if (forecasts[modelName][i] !== undefined && weights[modelName]) {
          weightedSum += forecasts[modelName][i] * weights[modelName];
          totalWeight += weights[modelName];
        }
      });

      ensemble[i] = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    return ensemble;
  }

  async calibratePredictionIntervals(timeSeries, backtestResults, forecasts, coverage = 0.95) {
    const intervals = {};
    
    // Z-scores for different coverage levels
    const zScores = {
      0.80: 1.282,
      0.90: 1.645,
      0.95: 1.960,
      0.99: 2.576
    };
    
    const zScore = zScores[coverage] || 1.960;
    
    Object.keys(forecasts).forEach(modelName => {
      const modelResults = backtestResults.modelResults[modelName];
      if (modelResults && modelResults.predictions.length > 0) {
        // Calculate residual standard deviation
        const residuals = modelResults.predictions.map(p => p.error);
        const residualVariance = this.calculateVariance(residuals);
        const residualStdDev = Math.sqrt(residualVariance);
        
        // Generate prediction intervals
        const lowerBounds = forecasts[modelName].map(forecast => 
          forecast - (zScore * residualStdDev)
        );
        const upperBounds = forecasts[modelName].map(forecast => 
          forecast + (zScore * residualStdDev)
        );

        // Calculate achieved coverage
        const achievedCoverage = residuals.filter(r => 
          Math.abs(r) <= zScore * residualStdDev
        ).length / residuals.length;

        intervals[modelName] = {
          lower: lowerBounds,
          upper: upperBounds,
          targetCoverage: coverage,
          achievedCoverage: achievedCoverage,
          residualStdDev: residualStdDev
        };
      }
    });

    return intervals;
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Job management methods
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error
    };
  }

  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (['QUEUED', 'RUNNING'].includes(job.status)) {
      job.status = 'CANCELLED';
      job.completedAt = new Date().toISOString();
      this.emit('jobStatusChanged', { jobId, status: 'CANCELLED' });
      return true;
    }
    
    return false;
  }

  generateJobId(request) {
    const content = JSON.stringify({
      ...request,
      timestamp: Math.floor(Date.now() / 60000) // 1-minute idempotency window
    });
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  async loadTimeSeriesData(seriesId) {
    // This would typically load from database
    // For now, return sample data
    const days = 180;
    const data = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      const trend = 100 + Math.sin(i * 0.05) * 20;
      const seasonal = Math.sin(i * 0.3) * 15;  
      const noise = (Math.random() - 0.5) * 10;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, trend + seasonal + noise)
      });
    }
    
    return data;
  }

  // Batch processing methods
  async processBatch(requests) {
    const results = [];
    
    for (const request of requests) {
      try {
        const result = await this.forecastSeries(
          request.data.seriesId,
          request.data.horizon,
          request.data.models
        );
        
        results.push({
          id: request.id,
          data: result
        });
      } catch (error) {
        results.push({
          id: request.id,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Bulk forecast for multiple series
  async forecastBulk(seriesIds, horizon, models = ['Ensemble']) {
    const processor = {
      process: async (data) => {
        return await this.forecastSeries(data.seriesId, data.horizon, data.models);
      },
      processBatch: this.processBatch.bind(this)
    };

    const requests = seriesIds.map(seriesId => ({
      seriesId,
      horizon,
      models
    }));

    const promises = requests.map((data, index) => 
      this.batchProcessor.addRequest(`bulk_${Date.now()}_${index}`, processor, data)
    );

    return Promise.all(promises);
  }

  // Cache management methods
  getCacheStats() {
    return this.cache.getStats();
  }

  getBatchStats() {
    return this.batchProcessor.getStats();
  }

  clearCache() {
    return this.cache.clear();
  }

  invalidateCachePattern(pattern) {
    return this.cache.invalidatePattern(pattern);
  }

  // Warm cache for frequently accessed series
  async warmCache(seriesIds, horizon = 30) {
    const warmupFunction = async (cacheKey) => {
      const params = JSON.parse(cacheKey);
      if (params.seriesId && params.horizon) {
        return await this.forecastSeries(params.seriesId, params.horizon, params.models);
      }
      return null;
    };

    const keys = seriesIds.map(seriesId => 
      this.cache.generateKey({
        seriesId,
        horizon,
        models: ['Ensemble'],
        type: 'forecast'
      })
    );

    await this.cache.warmCache(warmupFunction, keys);
  }

  // Performance monitoring
  getPerformanceMetrics() {
    return {
      cache: this.getCacheStats(),
      batch: this.getBatchStats(),
      activeJobs: this.jobs.size,
      totalJobs: this.jobs.size
    };
  }

  // FX and regional methods
  async getFXRate(baseCurrency, quoteCurrency) {
    return await this.fxService.getFXRate(baseCurrency, quoteCurrency);
  }

  async generateFXScenarios(baseCurrency, targetCurrencies, scenarios) {
    return await this.fxService.generateMultiCurrencyScenarios(baseCurrency, targetCurrencies, scenarios);
  }

  getRegionalEvents(region, startDate, endDate) {
    return this.calendarService.getRegionalEvents(region, startDate, endDate);
  }

  getUpcomingHighImpactEvents(region, days = 30) {
    return this.calendarService.getUpcomingHighImpactEvents(region, days);
  }

  getSupportedRegions() {
    return this.calendarService.getSupportedRegions();
  }

  getSupportedCurrencies() {
    return this.fxService.config.supportedCurrencies;
  }

  // Enhanced forecast with full options support
  async forecastWithOptions(seriesId, options = {}) {
    const {
      horizon = 30,
      models = ['Ensemble'],
      region = 'UK',
      baseCurrency = 'GBP',
      targetCurrency = null,
      currencyMode = 'local',
      fxScenario = null,
      applyRegionalAdjustments = true
    } = options;

    return await this.forecastSeries(seriesId, horizon, models, {
      region,
      baseCurrency,
      targetCurrency,
      currencyMode,
      fxScenario,
      applyRegionalAdjustments
    });
  }

  // Generate comprehensive scenario analysis
  async generateScenarioAnalysis(seriesId, baseOptions = {}) {
    const scenarios = ['base', 'stress_up', 'stress_down', 'high_volatility'];
    const regions = baseOptions.regions || ['UK', 'EU', 'USA'];
    const targetCurrency = baseOptions.targetCurrency || 'USD';
    
    const scenarioResults = {};
    
    for (const region of regions) {
      scenarioResults[region] = {};
      
      for (const scenarioType of scenarios) {
        const options = {
          ...baseOptions,
          region,
          currencyMode: 'converted',
          targetCurrency,
          fxScenario: scenarioType === 'base' ? null : { type: scenarioType, shock: 10 }
        };
        
        try {
          const result = await this.forecastWithOptions(seriesId, options);
          scenarioResults[region][scenarioType] = {
            forecast: result.forecasts.Ensemble || result.forecasts[Object.keys(result.forecasts)[0]],
            metadata: result.metadata
          };
        } catch (error) {
          scenarioResults[region][scenarioType] = {
            error: error.message
          };
        }
      }
    }
    
    return {
      seriesId,
      scenarios: scenarioResults,
      analysisMetadata: {
        generatedAt: new Date().toISOString(),
        baseCurrency: baseOptions.baseCurrency || 'GBP',
        targetCurrency,
        regions,
        scenarioTypes: scenarios
      }
    };
  }

  // Cleanup resources
  destroy() {
    if (this.cache) {
      this.cache.destroy();
    }
    if (this.batchProcessor) {
      this.batchProcessor.clearQueue();
    }
    if (this.fxService) {
      this.fxService.clearCache();
    }
    this.jobs.clear();
  }
}

export default ForecastingService;
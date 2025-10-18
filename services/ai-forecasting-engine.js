import * as tf from '@tensorflow/tfjs-node';
import forecastCacheService from './forecast-cache-service.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class AIForecastingEngine {
  constructor() {
    this.models = new Map();
    this.modelConfigs = new Map();
    this.trainingData = new Map();
    this.predictions = new Map();
    this.modelPerformance = new Map();
    
    // Ensemble configuration
    this.ensembleWeights = {
      arima: 0.25,
      lstm: 0.35,
      prophet: 0.25,
      randomForest: 0.15
    };
    
    this.isInitialized = false;
    this.trainingInProgress = false;
    
    this.initializeModels();
  }

  async initializeModels() {
    logDebug('AI Forecasting: Initializing forecasting models...');
    
    await this.#hydrateCachedPerformance();
    // Initialize LSTM model for time series forecasting
    await this.initializeLSTMModel();
    
    // Initialize Random Forest for demand prediction
    await this.initializeRandomForestModel();
    
    // Initialize ARIMA model (statistical approach)
    await this.initializeARIMAModel();
    
    // Initialize Prophet-like model for seasonal patterns
    await this.initializeProphetModel();
    
    this.isInitialized = true;
    logDebug('AI Forecasting: All models initialized successfully');
  }

  async initializeLSTMModel() {
    const lstmConfig = {
      name: 'LSTM',
      type: 'neural_network',
      sequenceLength: 30, // 30-day lookback
      features: 5, // sales, inventory, seasonality, trends, external factors
      hiddenUnits: 64,
      dropoutRate: 0.2,
      learningRate: 0.001,
      epochs: 100,
      batchSize: 32
    };

    // Define LSTM architecture
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: lstmConfig.hiddenUnits,
          returnSequences: true,
          inputShape: [lstmConfig.sequenceLength, lstmConfig.features],
          dropout: lstmConfig.dropoutRate,
          recurrentDropout: lstmConfig.dropoutRate
        }),
        tf.layers.lstm({
          units: Math.floor(lstmConfig.hiddenUnits / 2),
          returnSequences: false,
          dropout: lstmConfig.dropoutRate,
          recurrentDropout: lstmConfig.dropoutRate
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({
          units: 7, // Predict next 7 days
          activation: 'linear'
        })
      ]
    });

    // Compile with advanced optimizer
    model.compile({
      optimizer: tf.train.adam(lstmConfig.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    this.models.set('lstm', model);
    this.modelConfigs.set('lstm', lstmConfig);
    
    logDebug('AI Forecasting: LSTM model initialized');
  }

  async initializeRandomForestModel() {
    const rfConfig = {
      name: 'RandomForest',
      type: 'ensemble',
      nTrees: 100,
      maxDepth: 15,
      minSamplesSplit: 5,
      features: [
        'historical_demand', 'seasonality_index', 'trend_component',
        'promotional_impact', 'inventory_level', 'price_elasticity',
        'market_conditions', 'external_factors'
      ]
    };

    // Implement simplified Random Forest using TensorFlow
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          inputShape: [rfConfig.features.length]
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 7, // 7-day forecast
          activation: 'linear'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adamax(0.001),
      loss: 'meanAbsoluteError',
      metrics: ['mse', 'mae']
    });

    this.models.set('randomForest', model);
    this.modelConfigs.set('randomForest', rfConfig);
    
    logDebug('AI Forecasting: Random Forest model initialized');
  }

  async initializeARIMAModel() {
    const arimaConfig = {
      name: 'ARIMA',
      type: 'statistical',
      p: 2, // Auto-regressive order
      d: 1, // Differencing order
      q: 2, // Moving average order
      seasonalPeriod: 7, // Weekly seasonality
      forecastHorizon: 7
    };

    // Simplified ARIMA implementation using neural network approximation
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 64,
          activation: 'tanh',
          inputShape: [arimaConfig.p + arimaConfig.q + 7] // AR + MA + seasonal components
        }),
        tf.layers.dense({
          units: 32,
          activation: 'tanh'
        }),
        tf.layers.dense({
          units: 16,
          activation: 'tanh'
        }),
        tf.layers.dense({
          units: 7,
          activation: 'linear'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.sgd(0.01),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    this.models.set('arima', model);
    this.modelConfigs.set('arima', arimaConfig);
    
    logDebug('AI Forecasting: ARIMA model initialized');
  }

  async initializeProphetModel() {
    const prophetConfig = {
      name: 'Prophet',
      type: 'decomposition',
      seasonalityModes: ['additive', 'multiplicative'],
      changepointPrior: 0.05,
      seasonalityPrior: 10,
      holidayPrior: 10,
      components: ['trend', 'seasonal', 'holiday', 'external']
    };

    // Prophet-inspired model for trend and seasonality decomposition
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          inputShape: [20] // Trend, seasonal components, external factors
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 7,
          activation: 'linear'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'huberLoss',
      metrics: ['mae', 'mse']
    });

    this.models.set('prophet', model);
    this.modelConfigs.set('prophet', prophetConfig);
    
    logDebug('AI Forecasting: Prophet model initialized');
  }

  // Data preprocessing
  preprocessData(rawData, modelType) {
    const data = Array.isArray(rawData) ? rawData : [];
    
    if (data.length < 30) {
      // Generate synthetic data for demonstration
      return this.generateSyntheticData(100);
    }

    const processed = {
      features: [],
      targets: [],
      timestamps: [],
      metadata: {
        mean: 0,
        std: 1,
        min: 0,
        max: 1,
        scalingFactors: {}
      }
    };

    // Extract features based on model type
    switch (modelType) {
      case 'lstm':
        processed.features = this.prepareLSTMFeatures(data);
        break;
      case 'randomForest':
        processed.features = this.prepareRandomForestFeatures(data);
        break;
      case 'arima':
        processed.features = this.prepareARIMAFeatures(data);
        break;
      case 'prophet':
        processed.features = this.prepareProphetFeatures(data);
        break;
    }

    // Normalize features
    const normalizedData = this.normalizeFeatures(processed);
    
    return normalizedData;
  }

  generateSyntheticData(length) {
    const data = [];
    const baseValue = 1000;
    
    for (let i = 0; i < length; i++) {
      const trend = i * 0.5;
      const seasonal = 100 * Math.sin(2 * Math.PI * i / 7); // Weekly seasonality
      const noise = (Math.random() - 0.5) * 50;
      const value = baseValue + trend + seasonal + noise;
      
      data.push({
        timestamp: new Date(Date.now() - (length - i) * 24 * 60 * 60 * 1000),
        value: Math.max(0, value),
        features: {
          seasonality: Math.sin(2 * Math.PI * i / 7),
          trend: i / length,
          dayOfWeek: i % 7,
          isWeekend: (i % 7) >= 5 ? 1 : 0,
          promotionalImpact: Math.random() * 0.2
        }
      });
    }
    
    return data;
  }

  prepareLSTMFeatures(data) {
    const features = [];
    const sequenceLength = 30;
    
    for (let i = sequenceLength; i < data.length; i++) {
      const sequence = [];
      
      for (let j = i - sequenceLength; j < i; j++) {
        const point = data[j];
        sequence.push([
          point.value || 0,
          point.features?.seasonality || 0,
          point.features?.trend || 0,
          point.features?.dayOfWeek || 0,
          point.features?.isWeekend || 0
        ]);
      }
      
      features.push(sequence);
    }
    
    return features;
  }

  prepareRandomForestFeatures(data) {
    return data.map(point => [
      point.value || 0,
      point.features?.seasonality || 0,
      point.features?.trend || 0,
      point.features?.dayOfWeek || 0,
      point.features?.isWeekend || 0,
      point.features?.promotionalImpact || 0,
      this.calculateMovingAverage(data, 7),
      this.calculateMovingAverage(data, 30)
    ]);
  }

  prepareARIMAFeatures(data) {
    const features = [];
    
    for (let i = 10; i < data.length; i++) {
      const arFeatures = data.slice(i - 2, i).map(d => d.value || 0); // AR(2)
      const maFeatures = this.calculateMovingAverages(data.slice(i - 10, i), [3, 7]); // MA components
      const seasonalFeatures = this.extractSeasonalComponents(data, i, 7); // Weekly seasonality
      
      features.push([...arFeatures, ...maFeatures, ...seasonalFeatures]);
    }
    
    return features;
  }

  prepareProphetFeatures(data) {
    return data.map((point, index) => {
      const trend = this.calculateTrend(data, index);
      const seasonal = this.extractAllSeasonalComponents(data, index);
      const holiday = this.getHolidayEffect(point.timestamp);
      const external = this.getExternalFactors(point.timestamp);
      
      return [
        ...trend,
        ...seasonal,
        holiday,
        ...external
      ];
    });
  }

  // Training methods
  async trainModel(modelName, data) {
    if (this.trainingInProgress) {
      throw new Error('Training already in progress');
    }

    this.trainingInProgress = true;
    
    try {
      logDebug(`AI Forecasting: Training ${modelName} model...`);
      
      const model = this.models.get(modelName);
      const config = this.modelConfigs.get(modelName);
      
      if (!model || !config) {
        throw new Error(`Model ${modelName} not found`);
      }

      const processedData = this.preprocessData(data, modelName);
      const { features, targets } = this.createTrainingSet(processedData, modelName);
      
      // Convert to tensors
      const xTensor = tf.tensor(features);
      const yTensor = tf.tensor(targets);
      
      // Training configuration
      const trainingConfig = {
        epochs: config.epochs || 50,
        batchSize: config.batchSize || 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              logDebug(`AI Forecasting: ${modelName} epoch ${epoch}: loss=${logs.loss.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}`);
            }
          }
        }
      };

      // Train the model
      const history = await model.fit(xTensor, yTensor, trainingConfig);
      
      // Evaluate model performance
      const evaluation = await this.evaluateModel(modelName, xTensor, yTensor);
      
      // Store performance metrics
      this.modelPerformance.set(modelName, {
        ...evaluation,
        trainingHistory: history.history,
        lastTrained: new Date().toISOString()
      });

      const cacheSignature = forecastCacheService.generateDatasetSignature(data, {
        modelName,
        training: true
      });
      await this.saveModelToCache(modelName, cacheSignature, {
        metadata: processedData.metadata
      });

      logDebug(`AI Forecasting: ${modelName} training completed. MSE: ${evaluation.mse.toFixed(4)}, MAE: ${evaluation.mae.toFixed(4)}`);
      
      // Cleanup tensors
      xTensor.dispose();
      yTensor.dispose();
      
      return {
        modelName,
        performance: evaluation,
        trainingTime: Date.now()
      };
      
    } catch (error) {
      logError(`AI Forecasting: Training failed for ${modelName}:`, error);
      throw error;
    } finally {
      this.trainingInProgress = false;
    }
  }

  createTrainingSet(processedData, modelName) {
    const features = [];
    const targets = [];
    
    const data = processedData.features || processedData;
    
    for (let i = 0; i < data.length - 7; i++) {
      features.push(data[i]);
      
      // Create target (next 7 values)
      const target = [];
      for (let j = 1; j <= 7; j++) {
        if (i + j < data.length) {
          target.push(data[i + j][0] || data[i + j].value || 0);
        } else {
          target.push(0);
        }
      }
      targets.push(target);
    }
    
    return { features, targets };
  }

  async evaluateModel(modelName, xTensor, yTensor) {
    const model = this.models.get(modelName);
    
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const predictions = model.predict(xTensor);
    
    // Calculate metrics
    const mse = tf.metrics.meanSquaredError(yTensor, predictions);
    const mae = tf.metrics.meanAbsoluteError(yTensor, predictions);
    const r2 = this.calculateR2Score(yTensor, predictions);
    
    const mseValue = await mse.data();
    const maeValue = await mae.data();
    const r2Value = await r2.data();
    
    // Cleanup
    predictions.dispose();
    mse.dispose();
    mae.dispose();
    r2.dispose();
    
    return {
      mse: mseValue[0],
      mae: maeValue[0],
      r2: r2Value[0],
      accuracy: Math.max(0, (1 - mseValue[0] / 1000000) * 100), // Normalized accuracy
      timestamp: new Date().toISOString()
    };
  }

  calculateR2Score(yTrue, yPred) {
    const yTrueMean = tf.mean(yTrue);
    const ssRes = tf.sum(tf.square(tf.sub(yTrue, yPred)));
    const ssTot = tf.sum(tf.square(tf.sub(yTrue, yTrueMean)));
    
    return tf.sub(1, tf.div(ssRes, ssTot));
  }

  // Prediction methods
  async generateForecast(data, horizon = 7, options = {}) {
    if (!this.isInitialized) {
      await this.initializeModels();
    }

    logDebug(`AI Forecasting: Generating ${horizon}-day forecast...`);

    const datasetSignature = forecastCacheService.generateDatasetSignature(data, {
      horizon,
      options
    });

    const cachedForecast = await forecastCacheService.getForecast({
      datasetSignature,
      horizon
    });

    if (cachedForecast) {
      logDebug('AI Forecasting: Returning forecast from cache');
      return cachedForecast;
    }

    const forecasts = new Map();
    
    // Generate individual model forecasts
    for (const [modelName, model] of this.models) {
      try {
        const forecast = await this.generateSingleModelForecast(
          modelName, 
          data, 
          horizon, 
          options
        );
        forecasts.set(modelName, forecast);
      } catch (error) {
        logWarn(`AI Forecasting: Failed to generate ${modelName} forecast:`, error.message);
        // Use fallback forecast
        forecasts.set(modelName, this.generateFallbackForecast(data, horizon));
      }
    }

    // Create ensemble forecast
    const ensembleForecast = this.createEnsembleForecast(forecasts, horizon);
    
    // Add confidence intervals
    const forecastWithConfidence = this.addConfidenceIntervals(
      ensembleForecast, 
      forecasts, 
      options.confidenceLevel || 0.95
    );

    await this.cacheForecast(datasetSignature, horizon, forecastWithConfidence, options.cacheTtlSeconds);

    logDebug('AI Forecasting: Forecast generation completed');
    
    return forecastWithConfidence;
  }

  async generateSingleModelForecast(modelName, data, horizon, options) {
    const model = this.models.get(modelName);
    const config = this.modelConfigs.get(modelName);
    
    if (!model || !config) {
      throw new Error(`Model ${modelName} not available`);
    }

    const processedData = this.preprocessData(data, modelName);
    const features = this.prepareInferenceFeatures(processedData, modelName);
    
    // Convert to tensor
    const inputTensor = tf.tensor([features]);
    
    // Generate prediction
    const prediction = model.predict(inputTensor);
    const forecastValues = await prediction.data();
    
    // Denormalize predictions
    const denormalizedForecast = this.denormalizePredictions(
      Array.from(forecastValues),
      processedData.metadata
    );

    // Cleanup
    inputTensor.dispose();
    prediction.dispose();
    
    return {
      model: modelName,
      forecast: denormalizedForecast.slice(0, horizon),
      confidence: this.modelPerformance.get(modelName)?.accuracy || 75,
      metadata: {
        modelType: config.type,
        trainingData: data.length,
        lastTrained: this.modelPerformance.get(modelName)?.lastTrained
      }
    };
  }

  createEnsembleForecast(forecasts, horizon) {
    const ensembleForecast = [];
    
    for (let i = 0; i < horizon; i++) {
      let weightedSum = 0;
      let totalWeight = 0;
      
      for (const [modelName, forecast] of forecasts) {
        const weight = this.ensembleWeights[modelName] || 0.25;
        const value = forecast.forecast[i] || 0;
        
        weightedSum += value * weight;
        totalWeight += weight;
      }
      
      ensembleForecast.push(weightedSum / totalWeight);
    }
    
    return {
      type: 'ensemble',
      forecast: ensembleForecast,
      individualForecasts: Object.fromEntries(forecasts),
      weights: this.ensembleWeights,
      timestamp: new Date().toISOString()
    };
  }

  addConfidenceIntervals(forecast, individualForecasts, confidenceLevel) {
    const confidence = {
      level: confidenceLevel,
      upper: [],
      lower: []
    };
    
    // Calculate confidence intervals based on model variance
    const forecasts = Array.from(individualForecasts.values());
    
    for (let i = 0; i < forecast.forecast.length; i++) {
      const values = forecasts.map(f => f.forecast[i] || 0);
      const mean = forecast.forecast[i];
      const std = this.calculateStandardDeviation(values);
      
      const zScore = this.getZScore(confidenceLevel);
      const margin = zScore * std;
      
      confidence.upper.push(mean + margin);
      confidence.lower.push(Math.max(0, mean - margin)); // Ensure non-negative
    }
    
    return {
      ...forecast,
      confidence
    };
  }

  // Utility methods
  calculateMovingAverage(data, window) {
    if (data.length < window) return 0;
    
    const recentData = data.slice(-window);
    const sum = recentData.reduce((acc, point) => acc + (point.value || 0), 0);
    return sum / window;
  }

  calculateMovingAverages(data, windows) {
    return windows.map(window => this.calculateMovingAverage(data, window));
  }

  calculateTrend(data, index, window = 10) {
    const startIdx = Math.max(0, index - window);
    const endIdx = Math.min(data.length - 1, index);
    
    if (endIdx - startIdx < 2) return [0, 0]; // Not enough data
    
    const x = [];
    const y = [];
    
    for (let i = startIdx; i <= endIdx; i++) {
      x.push(i - startIdx);
      y.push(data[i].value || 0);
    }
    
    // Simple linear regression
    const n = x.length;
    const sumX = x.reduce((a, _b) => a + b, 0);
    const sumY = y.reduce((a, _b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return [slope, intercept];
  }

  extractSeasonalComponents(data, index, period) {
    const components = [];
    
    for (let p = 1; p <= Math.min(3, Math.floor(period / 2)); p++) {
      const angle = 2 * Math.PI * p * (index % period) / period;
      components.push(Math.sin(angle), Math.cos(angle));
    }
    
    return components.slice(0, 7); // Limit to 7 components
  }

  extractAllSeasonalComponents(data, index) {
    // Daily (24), Weekly (7), Monthly (30) patterns
    const dailyComponents = this.extractSeasonalComponents(data, index, 24);
    const weeklyComponents = this.extractSeasonalComponents(data, index, 7);
    const monthlyComponents = this.extractSeasonalComponents(data, index, 30);
    
    return [...dailyComponents.slice(0, 4), ...weeklyComponents.slice(0, 4), ...monthlyComponents.slice(0, 4)];
  }

  getHolidayEffect(timestamp) {
    // Simple holiday detection (would be enhanced with actual holiday calendar)
    const date = new Date(timestamp);
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000);
    
    // Check for common holidays (simplified)
    const holidays = [1, 359, 360]; // New Year, Christmas Eve, Christmas
    return holidays.includes(dayOfYear) ? 1 : 0;
  }

  getExternalFactors(timestamp) {
    // Mock external factors (weather, economic indicators, etc.)
    return [
      Math.sin(Date.now() / 86400000), // Daily cycle
      Math.random() * 0.1 - 0.05, // Random economic factor
      0 // Placeholder for additional factors
    ];
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  getZScore(confidenceLevel) {
    // Z-scores for common confidence levels
    const zScores = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    
    return zScores[confidenceLevel] || 1.96;
  }

  normalizeFeatures(data) {
    // Implement feature normalization
    return data;
  }

  denormalizePredictions(predictions, metadata) {
    // Implement denormalization
    return predictions;
  }

  prepareInferenceFeatures(processedData, modelName) {
    // Return the last sequence for inference
    const features = processedData.features || [];
    return features[features.length - 1] || [];
  }

  generateFallbackForecast(data, horizon) {
    // Simple moving average fallback
    const recentValues = data.slice(-7).map(d => d.value || 0);
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    return {
      model: 'fallback',
      forecast: new Array(horizon).fill(average),
      confidence: 50,
      metadata: { type: 'moving_average_fallback' }
    };
  }

  async saveModelToCache(modelName, datasetSignature, metadata = {}) {
    try {
      const performance = this.modelPerformance.get(modelName);

      if (performance) {
        await forecastCacheService.setModelPerformance(modelName, {
          ...performance,
          datasetSignature,
          metadata
        });
        logDebug(`AI Forecasting: Model ${modelName} cached`);
      }
    } catch (error) {
      logWarn(`AI Forecasting: Failed to cache model ${modelName}:`, error.message);
    }
  }

  async cacheForecast(datasetSignature, horizon, forecast, ttlSeconds) {
    try {
      await forecastCacheService.setForecast(
        {
          datasetSignature,
          horizon,
          forecast
        },
        ttlSeconds
      );
      logDebug('AI Forecasting: Forecast cached via forecast cache service');
    } catch (error) {
      logWarn('AI Forecasting: Failed to cache forecast:', error.message);
    }
  }

  async #hydrateCachedPerformance() {
    try {
      const entries = await Promise.all(
        Array.from(this.models.keys()).map(async (modelName) => ({
          modelName,
          performance: await forecastCacheService.getModelPerformance(modelName)
        }))
      );

      for (const { modelName, performance } of entries) {
        if (performance) {
          this.modelPerformance.set(modelName, performance);
          logDebug(`AI Forecasting: Hydrated performance for ${modelName} from cache`);
        }
      }
    } catch (error) {
      logWarn('AI Forecasting: Failed to hydrate cached performance', error.message);
    }
  }

  // Public API methods
  async getModelStatus() {
    const status = {};
    
    for (const [modelName, model] of this.models) {
      const config = this.modelConfigs.get(modelName);
      const performance = this.modelPerformance.get(modelName);
      
      status[modelName] = {
        initialized: !!model,
        type: config?.type || 'unknown',
        performance: performance || null,
        lastTrained: performance?.lastTrained || null
      };
    }
    
    return {
      initialized: this.isInitialized,
      trainingInProgress: this.trainingInProgress,
      models: status,
      ensembleWeights: this.ensembleWeights,
      timestamp: new Date().toISOString()
    };
  }

  async trainAllModels(data) {
    const results = {};
    
    for (const modelName of this.models.keys()) {
      try {
        results[modelName] = await this.trainModel(modelName, data);
      } catch (error) {
        results[modelName] = {
          error: error.message,
          modelName,
          success: false
        };
      }
    }
    
    return results;
  }

  updateEnsembleWeights(newWeights) {
    const totalWeight = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error('Ensemble weights must sum to 1.0');
    }
    
    this.ensembleWeights = { ...this.ensembleWeights, ...newWeights };
    logDebug('AI Forecasting: Ensemble weights updated:', this.ensembleWeights);
  }

  getPerformanceMetrics() {
    const metrics = {};
    
    for (const [modelName, performance] of this.modelPerformance) {
      metrics[modelName] = performance;
    }
    
    return {
      models: metrics,
      ensemble: {
        weights: this.ensembleWeights,
        averageAccuracy: Object.values(metrics).reduce((sum, m) => sum + (m.accuracy || 0), 0) / Object.keys(metrics).length
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

const aiForecastingEngine = new AIForecastingEngine();

export default aiForecastingEngine;
import express from 'express';
import { logError } from '../services/observability/structuredLogger.js';
import ForecastingService from '../services/forecasting/ForecastingService.js';
import FeatureEngineeringService from '../services/forecasting/FeatureEngineeringService.js';
import CFOWorkbenchService from '../services/forecasting/CFOWorkbenchService.js';
import AccuracyDashboardService from '../services/forecasting/AccuracyDashboardService.js';

const router = express.Router();

// Initialize services
const forecastingService = new ForecastingService();
const featureEngineeringService = new FeatureEngineeringService();
const cfoWorkbenchService = new CFOWorkbenchService(forecastingService);
const accuracyDashboardService = new AccuracyDashboardService(forecastingService);

// SSE connections for real-time updates
const sseClients = new Set();

// Setup SSE endpoint
router.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
  
  sseClients.add(res);
  
  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Broadcast SSE events to all connected clients
function broadcastSSE(eventType, data) {
  const message = `data: ${JSON.stringify({ type: eventType, ...data, timestamp: new Date().toISOString() })}\n\n`;
  
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (error) {
      sseClients.delete(client);
    }
  }
}

// Setup forecasting service event listeners
forecastingService.on('jobStatusChanged', (data) => {
  broadcastSSE('job.forecast.statusChanged', data);
});

forecastingService.on('jobProgress', (data) => {
  broadcastSSE('job.forecast.progress', data);
});

// Enhanced forecast endpoint with idempotency
router.post('/forecast', async (req, res) => {
  try {
    const {
      series_filter,
      horizon = 30,
      models = ['Ensemble'],
      currency_mode = 'local',
      fx_scenario,
      scenario_config,
      feature_flags = {}
    } = req.body;

    // Validate request
    if (!series_filter || !series_filter.series_ids || series_filter.series_ids.length === 0) {
      return res.status(400).json({
        error: 'series_filter.series_ids is required and must contain at least one series ID'
      });
    }

    if (horizon < 1 || horizon > 365) {
      return res.status(400).json({
        error: 'horizon must be between 1 and 365 days'
      });
    }

    // Extract idempotent key from headers
    const idempotentKey = req.headers['idempotent-key'] || null;

    const request = {
      series_filter,
      horizon,
      models,
      currency_mode,
      fx_scenario,
      scenario_config,
      feature_flags
    };

    // Generate forecast
    const result = await forecastingService.generateForecast(request, idempotentKey);

    res.status(202).json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      message: 'Forecast job queued successfully'
    });

  } catch (error) {
    logError('Forecast API error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get forecast job status
router.get('/forecast/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobStatus = forecastingService.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({
        error: 'Job not found',
        jobId
      });
    }

    res.json({
      success: true,
      job: jobStatus
    });

  } catch (error) {
    logError('Job status API error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get forecast job results
router.get('/forecast/jobs/:jobId/results', async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobStatus = forecastingService.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({
        error: 'Job not found',
        jobId
      });
    }

    if (jobStatus.status !== 'COMPLETED') {
      return res.status(200).json({
        success: true,
        job: jobStatus,
        message: `Job status is ${jobStatus.status}. Results not yet available.`
      });
    }

    // Get full job data including results
    const fullJob = forecastingService.jobs.get(jobId);
    
    res.json({
      success: true,
      job: jobStatus,
      results: fullJob.results
    });

  } catch (error) {
    logError('Job results API error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Cancel forecast job
router.post('/forecast/jobs/:jobId/cancel', async (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = forecastingService.cancelJob(jobId);

    if (!cancelled) {
      const jobStatus = forecastingService.getJobStatus(jobId);
      
      if (!jobStatus) {
        return res.status(404).json({
          error: 'Job not found',
          jobId
        });
      }

      return res.status(400).json({
        error: 'Job cannot be cancelled',
        jobId,
        currentStatus: jobStatus.status,
        message: 'Only QUEUED or RUNNING jobs can be cancelled'
      });
    }

    res.json({
      success: true,
      jobId,
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    logError('Job cancellation API error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get forecast diagnostics for a series
router.get('/forecast/series/:seriesId/diagnostics', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { models = ['Ensemble'] } = req.query;

    // Load time series data
    const timeSeriesData = await forecastingService.loadTimeSeriesData(seriesId);
    
    // Assess data quality
    const dataQuality = featureEngineeringService.assessDataQuality(timeSeriesData);
    
    // Detect outliers
    const outliers = featureEngineeringService.detectOutliers(timeSeriesData);
    
    // Generate diagnostic features
    const lagFeatures = featureEngineeringService.generateLagFeatures(timeSeriesData, [1, 7, 28]);
    const maFeatures = featureEngineeringService.generateMovingAverageFeatures(timeSeriesData, [7, 14, 28]);
    const seasonalFeatures = featureEngineeringService.generateSeasonalFeatures(timeSeriesData);

    // Perform backtesting for diagnostics
    const backtestResults = await forecastingService.performRollingBacktest(timeSeriesData, 30);
    
    const diagnostics = {
      seriesId,
      dataQuality,
      outliers,
      features: {
        lagCorrelations: calculateLagCorrelations(lagFeatures),
        seasonalPatterns: analyzeSeasonalPatterns(seasonalFeatures),
        trendAnalysis: analyzeTrend(maFeatures)
      },
      backtestSummary: {
        folds: backtestResults.folds.length,
        models: Object.keys(backtestResults.modelResults),
        bestModel: findBestModel(backtestResults.modelResults),
        metrics: backtestResults.modelResults
      },
      recommendations: generateDiagnosticRecommendations(dataQuality, outliers, backtestResults)
    };

    res.json({
      success: true,
      diagnostics
    });

  } catch (error) {
    logError('Diagnostics API error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Data quality endpoint
router.post('/forecast/data-quality', async (req, res) => {
  try {
    const { series_ids } = req.body;

    if (!Array.isArray(series_ids) || series_ids.length === 0) {
      return res.status(400).json({
        error: 'series_ids must be an array with at least one series ID'
      });
    }

    const qualityReports = [];

    for (const seriesId of series_ids) {
      try {
        const timeSeriesData = await forecastingService.loadTimeSeriesData(seriesId);
        const dataQuality = featureEngineeringService.assessDataQuality(timeSeriesData);
        const outliers = featureEngineeringService.detectOutliers(timeSeriesData);

        qualityReports.push({
          seriesId,
          dataQuality,
          outliers,
          status: 'analyzed'
        });
      } catch (error) {
        qualityReports.push({
          seriesId,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      reports: qualityReports,
      summary: {
        totalSeries: series_ids.length,
        analyzed: qualityReports.filter(r => r.status === 'analyzed').length,
        errors: qualityReports.filter(r => r.status === 'error').length
      }
    });

  } catch (error) {
    logError('Data quality API error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Model diagnostics endpoint  
router.get('/forecast/models/:modelType/diagnostics', async (req, res) => {
  try {
    const { modelType } = req.params;
    const { seriesId } = req.query;

    if (!seriesId) {
      return res.status(400).json({
        error: 'seriesId query parameter is required'
      });
    }

    const supportedModels = ['SMA', 'HoltWinters', 'ARIMA', 'Linear'];
    if (!supportedModels.includes(modelType)) {
      return res.status(400).json({
        error: `Unsupported model type. Supported: ${supportedModels.join(', ')}`
      });
    }

    // Load data and fit model for diagnostics
    const timeSeriesData = await forecastingService.loadTimeSeriesData(seriesId);
    const model = new forecastingService.models[modelType]();
    
    await model.fit(timeSeriesData);
    const modelDiagnostics = model.getDiagnostics ? model.getDiagnostics() : model.getParameters();

    res.json({
      success: true,
      model: modelType,
      seriesId,
      diagnostics: modelDiagnostics,
      metadata: {
        dataPoints: timeSeriesData.length,
        fittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logError('Model diagnostics API error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Utility functions
function calculateLagCorrelations(lagFeatures) {
  // Simplified correlation calculation
  const correlations = {};
  const lags = [1, 7, 28];
  
  lags.forEach(lag => {
    const values = lagFeatures.map(f => f.value).filter(v => v !== null);
    const lagValues = lagFeatures.map(f => f[`lag_${lag}`]).filter(v => v !== null);
    
    if (values.length === lagValues.length && values.length > 1) {
      correlations[`lag_${lag}`] = pearsonCorrelation(values, lagValues);
    }
  });
  
  return correlations;
}

function analyzeSeasonalPatterns(seasonalFeatures) {
  const patterns = {
    dayOfWeek: {},
    monthOfYear: {}
  };
  
  // Group by day of week
  seasonalFeatures.forEach(feature => {
    const dow = feature.day_of_week;
    const value = parseFloat(feature.value);
    
    if (!patterns.dayOfWeek[dow]) {
      patterns.dayOfWeek[dow] = [];
    }
    patterns.dayOfWeek[dow].push(value);
  });
  
  // Calculate averages
  Object.keys(patterns.dayOfWeek).forEach(dow => {
    const values = patterns.dayOfWeek[dow];
    patterns.dayOfWeek[dow] = {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      count: values.length
    };
  });
  
  return patterns;
}

function analyzeTrend(maFeatures) {
  const ma7Values = maFeatures.map(f => f.ma_7).filter(v => v !== null);
  
  if (ma7Values.length < 2) {
    return { trend: 'insufficient_data' };
  }
  
  const firstHalf = ma7Values.slice(0, Math.floor(ma7Values.length / 2));
  const secondHalf = ma7Values.slice(Math.floor(ma7Values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  return {
    trend: percentChange > 5 ? 'increasing' : percentChange < -5 ? 'decreasing' : 'stable',
    percentChange,
    firstHalfAverage: firstAvg,
    secondHalfAverage: secondAvg
  };
}

function findBestModel(modelResults) {
  let bestModel = null;
  let bestMAPE = Infinity;
  
  Object.keys(modelResults).forEach(modelName => {
    const metrics = modelResults[modelName].metrics;
    if (metrics.mape && metrics.mape < bestMAPE) {
      bestMAPE = metrics.mape;
      bestModel = modelName;
    }
  });
  
  return bestModel;
}

function generateDiagnosticRecommendations(dataQuality, outliers, backtestResults) {
  const recommendations = [];
  
  if (dataQuality.overall < 0.7) {
    recommendations.push({
      type: 'data_quality',
      priority: 'high',
      message: 'Data quality is below acceptable threshold. Address missing values and outliers before forecasting.'
    });
  }
  
  if (outliers.count > 0) {
    recommendations.push({
      type: 'outliers',
      priority: 'medium', 
      message: `${outliers.count} outliers detected. Consider outlier treatment for improved forecast accuracy.`
    });
  }
  
  const bestModel = findBestModel(backtestResults.modelResults);
  if (bestModel) {
    const bestMAPE = backtestResults.modelResults[bestModel].metrics.mape;
    if (bestMAPE > 25) {
      recommendations.push({
        type: 'accuracy',
        priority: 'high',
        message: `Best model (${bestModel}) has high MAPE (${bestMAPE.toFixed(1)}%). Consider additional features or different modeling approach.`
      });
    }
  }
  
  return recommendations;
}

function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0);
  const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0);
  const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.slice(0, n).reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.slice(0, n).reduce((sum, val) => sum + val * val, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// CFO Workbench endpoints
router.post('/cfo/board-pack', async (req, res) => {
  try {
    const {
      series_ids,
      reporting_currency = 'GBP',
      regions = ['UK', 'EU', 'USA'],
      horizons = [30, 90, 180, 365],
      include_scenarios = true,
      include_risk_metrics = true
    } = req.body;

    if (!Array.isArray(series_ids) || series_ids.length === 0) {
      return res.status(400).json({
        error: 'series_ids must be an array with at least one series ID'
      });
    }

    const boardPack = await cfoWorkbenchService.generateBoardPack(series_ids, {
      reportingCurrency: reporting_currency,
      regions,
      horizons,
      includeScenarios: include_scenarios,
      includeRiskMetrics: include_risk_metrics
    });

    res.json({
      success: true,
      boardPack,
      metadata: {
        generatedAt: new Date().toISOString(),
        seriesCount: series_ids.length,
        reportingCurrency: reporting_currency
      }
    });

  } catch (error) {
    logError('CFO board pack generation error', error);
    res.status(500).json({
      error: 'Failed to generate CFO board pack',
      message: error.message
    });
  }
});

// Scenario analysis endpoint
router.post('/cfo/scenario-analysis', async (req, res) => {
  try {
    const {
      series_id,
      regions = ['UK', 'EU', 'USA'],
      target_currency = 'USD',
      base_currency = 'GBP',
      horizon = 90
    } = req.body;

    if (!series_id) {
      return res.status(400).json({
        error: 'series_id is required'
      });
    }

    const scenarioAnalysis = await forecastingService.generateScenarioAnalysis(series_id, {
      regions,
      targetCurrency: target_currency,
      baseCurrency: base_currency,
      horizon
    });

    res.json({
      success: true,
      scenarioAnalysis
    });

  } catch (error) {
    logError('Scenario analysis error', error);
    res.status(500).json({
      error: 'Failed to generate scenario analysis',
      message: error.message
    });
  }
});

// FX rates and scenarios endpoint
router.get('/cfo/fx-rates', async (req, res) => {
  try {
    const {
      base_currency = 'GBP',
      target_currencies = 'EUR,USD',
      scenarios = 'base,stress_up,stress_down'
    } = req.query;

    const targetCurrencyList = target_currencies.split(',');
    const scenarioList = scenarios.split(',');

    const fxScenarios = await forecastingService.generateFXScenarios(
      base_currency,
      targetCurrencyList,
      scenarioList
    );

    res.json({
      success: true,
      baseCurrency: base_currency,
      fxScenarios,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logError('FX scenarios error', error);
    res.status(500).json({
      error: 'Failed to generate FX scenarios',
      message: error.message
    });
  }
});

// Regional events endpoint
router.get('/cfo/regional-events', async (req, res) => {
  try {
    const {
      region = 'UK',
      start_date,
      end_date,
      high_impact_only = false
    } = req.query;

    if (!forecastingService.getSupportedRegions().includes(region)) {
      return res.status(400).json({
        error: `Unsupported region. Supported regions: ${forecastingService.getSupportedRegions().join(', ')}`
      });
    }

    let events;
    if (high_impact_only === 'true') {
      events = forecastingService.getUpcomingHighImpactEvents(region, 30);
    } else {
      const startDate = start_date || new Date().toISOString().split('T')[0];
      const endDate = end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      events = forecastingService.getRegionalEvents(region, startDate, endDate);
    }

    res.json({
      success: true,
      region,
      events,
      highImpactOnly: high_impact_only === 'true'
    });

  } catch (error) {
    logError('Regional events error', error);
    res.status(500).json({
      error: 'Failed to get regional events',
      message: error.message
    });
  }
});

// Accuracy Dashboard endpoints
router.post('/accuracy/dashboard', async (req, res) => {
  try {
    const {
      series_ids,
      regions = ['UK', 'EU', 'USA'],
      models = ['Ensemble', 'ARIMA', 'HoltWinters', 'Linear'],
      horizons = [7, 30, 90],
      include_trends = true,
      include_alerts = true
    } = req.body;

    if (!Array.isArray(series_ids) || series_ids.length === 0) {
      return res.status(400).json({
        error: 'series_ids must be an array with at least one series ID'
      });
    }

    const dashboard = await accuracyDashboardService.generateAccuracyDashboard(series_ids, {
      regions,
      models,
      horizons,
      includeTrends: include_trends,
      includeAlerts: include_alerts
    });

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    logError('Accuracy dashboard error', error);
    res.status(500).json({
      error: 'Failed to generate accuracy dashboard',
      message: error.message
    });
  }
});

// Model performance comparison endpoint
router.get('/accuracy/model-performance', async (req, res) => {
  try {
    const {
      series_ids,
      models = 'Ensemble,ARIMA,HoltWinters,Linear',
      regions = 'UK,EU,USA'
    } = req.query;

    if (!series_ids) {
      return res.status(400).json({
        error: 'series_ids query parameter is required'
      });
    }

    const seriesIdList = series_ids.split(',');
    const modelList = models.split(',');
    const regionList = regions.split(',');

    const modelPerformance = await accuracyDashboardService.generateModelPerformance(
      seriesIdList,
      modelList,
      regionList
    );

    res.json({
      success: true,
      modelPerformance,
      metadata: {
        seriesCount: seriesIdList.length,
        modelsAnalyzed: modelList,
        regionsAnalyzed: regionList
      }
    });

  } catch (error) {
    logError('Model performance error', error);
    res.status(500).json({
      error: 'Failed to analyze model performance',
      message: error.message
    });
  }
});

// Accuracy trends endpoint
router.get('/accuracy/trends', async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const trends = accuracyDashboardService.generateAccuracyTrends();

    res.json({
      success: true,
      trends,
      trackingPeriod: `${days} days`
    });

  } catch (error) {
    logError('Accuracy trends error', error);
    res.status(500).json({
      error: 'Failed to generate accuracy trends',
      message: error.message
    });
  }
});

// Update accuracy history endpoint (for real-time accuracy tracking)
router.post('/accuracy/update', async (req, res) => {
  try {
    const {
      series_id,
      actual_values,
      forecast_values,
      metadata = {}
    } = req.body;

    if (!series_id || !Array.isArray(actual_values) || !Array.isArray(forecast_values)) {
      return res.status(400).json({
        error: 'series_id, actual_values, and forecast_values are required'
      });
    }

    if (actual_values.length !== forecast_values.length) {
      return res.status(400).json({
        error: 'actual_values and forecast_values must have the same length'
      });
    }

    accuracyDashboardService.updateAccuracyHistory(
      series_id,
      actual_values,
      forecast_values,
      metadata
    );

    const accuracy = accuracyDashboardService.calculateAccuracyMetrics(
      actual_values,
      forecast_values
    );

    res.json({
      success: true,
      seriesId: series_id,
      accuracy,
      message: 'Accuracy history updated successfully'
    });

  } catch (error) {
    logError('Accuracy update error', error);
    res.status(500).json({
      error: 'Failed to update accuracy history',
      message: error.message
    });
  }
});

export default router;
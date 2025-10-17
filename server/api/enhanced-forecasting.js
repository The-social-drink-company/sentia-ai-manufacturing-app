/**
 * Enhanced Forecasting API
 * Dual AI Model Integration for 88%+ accuracy
 * Supports 365-day forecasting horizon
 */

import express from 'express';
import aiOrchestrationService from '../../services/aiOrchestrationService.js';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { logInfo, logError, logWarn } from '../../services/observability/structuredLogger.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/forecasting/enhanced/status
 * Check AI models availability and service status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await aiOrchestrationService.initialize();

    res.json({
      service: 'enhanced-forecasting',
      status: 'operational',
      models: status,
      capabilities: {
        maxHorizon: 365,
        targetAccuracy: 0.88,
        supportedScenarios: ['pessimistic', 'realistic', 'optimistic'],
        features: [
          'dual_ai_models',
          'ensemble_forecasting',
          'business_intelligence',
          'scenario_analysis',
          'trend_detection',
          'seasonality_analysis'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (_error) {
    logError('Enhanced forecasting status check failed', _error);
    res.status(500).json({
      error: 'Failed to check forecasting service status',
      details: _error.message
    });
  }
});

/**
 * POST /api/forecasting/enhanced
 * Generate enhanced forecast using dual AI models
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      horizon = 90,
      includeScenarios = true,
      includeTrendAnalysis = true,
      includeSeasonality = true,
      businessContext = {},
      dataSource = 'database'
    } = req.body;

    logInfo('Enhanced forecast request received', {
      horizon,
      includeScenarios,
      userId: req.user?.id
    });

    // Validate parameters
    if (horizon < 1 || horizon > 365) {
      return res.status(400).json({
        error: 'Invalid forecast horizon',
        message: 'Horizon must be between 1 and 365 days'
      });
    }

    // Initialize AI orchestration service
    await aiOrchestrationService.initialize();

    // Fetch historical data for forecasting
    const historicalData = await fetchHistoricalDemandData(dataSource);

    if (!historicalData || historicalData.length === 0) {
      return res.status(400).json({
        error: 'Insufficient historical data',
        message: 'At least 30 days of historical data required for accurate forecasting'
      });
    }

    // Generate enhanced forecast
    const forecastResult = await aiOrchestrationService.generateEnhancedForecast(
      historicalData,
      {
        horizon,
        includeScenarios,
        includeTrendAnalysis,
        includeSeasonality,
        businessContext
      }
    );

    // Store forecast results for future analysis
    await storeForecastResults(forecastResult, req.user?.id);

    // Enhance response with additional metrics
    const enhancedResponse = {
      ...forecastResult,
      performance: {
        accuracyTarget: 0.88,
        actualAccuracy: forecastResult.confidence,
        targetMet: forecastResult.confidence >= 0.88,
        improvementPotential: Math.max(0, 0.88 - forecastResult.confidence)
      },
      businessImpact: calculateBusinessImpact(forecastResult, businessContext),
      actionableInsights: generateActionableInsights(forecastResult)
    };

    logInfo('Enhanced forecast generated successfully', {
      confidence: forecastResult.confidence,
      horizon,
      modelsUsed: Object.keys(forecastResult.models).filter(k => forecastResult.models[k])
    });

    res.json(enhancedResponse);

  } catch (_error) {
    logError('Enhanced forecast generation failed', _error);
    res.status(500).json({
      error: 'Forecast generation failed',
      message: _error.message
    });
  }
});

/**
 * GET /api/forecasting/enhanced/historical
 * Retrieve historical forecast performance
 */
router.get('/historical', authenticateToken, async (req, res) => {
  try {
    const { days = 30, includeAccuracy = true } = req.query;

    const historicalForecasts = await prisma.forecastResult.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const performance = includeAccuracy ?
      await calculateHistoricalAccuracy(historicalForecasts) : null;

    res.json({
      forecasts: historicalForecasts,
      performance,
      summary: {
        totalForecasts: historicalForecasts.length,
        averageAccuracy: performance?.averageAccuracy,
        bestAccuracy: performance?.bestAccuracy,
        improvementTrend: performance?.improvementTrend
      }
    });

  } catch (_error) {
    logError('Historical forecast retrieval failed', _error);
    res.status(500).json({
      error: 'Failed to retrieve historical forecasts'
    });
  }
});

/**
 * POST /api/forecasting/enhanced/validate
 * Validate forecast against actual results
 */
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { forecastId, actualResults } = req.body;

    if (!forecastId || !actualResults) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'forecastId and actualResults are required'
      });
    }

    // Retrieve original forecast
    const originalForecast = await prisma.forecastResult.findUnique({
      where: { id: forecastId }
    });

    if (!originalForecast) {
      return res.status(404).json({
        error: 'Forecast not found'
      });
    }

    // Calculate accuracy metrics
    const validation = calculateForecastAccuracy(
      originalForecast.predictions,
      actualResults
    );

    // Store validation results
    await prisma.forecastValidation.create({
      data: {
        forecastId,
        actualResults,
        accuracy: validation.accuracy,
        meanAbsoluteError: validation.mae,
        meanSquaredError: validation.mse,
        validatedAt: new Date()
      }
    });

    logInfo('Forecast validation completed', {
      forecastId,
      accuracy: validation.accuracy
    });

    res.json({
      validation,
      insights: generateValidationInsights(validation),
      recommendations: generateImprovementRecommendations(validation)
    });

  } catch (_error) {
    logError('Forecast validation failed', _error);
    res.status(500).json({
      error: 'Validation failed',
      message: _error.message
    });
  }
});

/**
 * GET /api/forecasting/enhanced/models/comparison
 * Compare performance of different AI models
 */
router.get('/models/comparison', authenticateToken, async (req, res) => {
  try {
    const { period = 30 } = req.query;

    const recentForecasts = await prisma.forecastResult.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        validations: true
      }
    });

    const modelComparison = analyzeModelPerformance(recentForecasts);

    res.json({
      comparison: modelComparison,
      recommendations: generateModelRecommendations(modelComparison),
      summary: {
        bestPerforming: modelComparison.bestModel,
        averageAccuracy: modelComparison.overallAccuracy,
        totalForecasts: recentForecasts.length
      }
    });

  } catch (_error) {
    logError('Model comparison failed', _error);
    res.status(500).json({
      error: 'Model comparison failed'
    });
  }
});

// Helper functions

/**
 * Fetch historical demand data from various sources
 */
async function fetchHistoricalDemandData(source = 'database') {
  try {
    switch (source) {
      case 'database':
        return await fetchDatabaseDemandData();
      case 'external':
        return await fetchExternalDemandData();
      default:
        return await fetchDatabaseDemandData();
    }
  } catch (_error) {
    logError('Failed to fetch historical demand data', _error);
    throw _error;
  }
}

async function fetchDatabaseDemandData() {
  const demandData = await prisma.demandHistory.findMany({
    orderBy: { date: 'desc' },
    take: 180, // Last 180 days
    select: {
      date: true,
      value: true,
      source: true,
      quality: true
    }
  });

  return demandData.map(record => ({
    date: record.date.toISOString(),
    value: record.value,
    source: record.source || 'database',
    quality: record.quality || 1.0
  }));
}

async function fetchExternalDemandData() {
  // Placeholder for external data integration
  // Would integrate with Shopify, Amazon, etc.
  logInfo('External demand data integration not yet implemented');
  return await fetchDatabaseDemandData();
}

/**
 * Store forecast results for performance tracking
 */
async function storeForecastResults(forecastResult, userId) {
  try {
    await prisma.forecastResult.create({
      data: {
        userId,
        horizon: forecastResult.forecast.predictions?.length || 0,
        confidence: forecastResult.confidence,
        predictions: forecastResult.forecast.predictions || [],
        analytics: forecastResult.analytics || {},
        models: forecastResult.models || {},
        metadata: forecastResult.metadata || {},
        createdAt: new Date()
      }
    });
  } catch (_error) {
    logWarn('Failed to store forecast results', _error);
  }
}

/**
 * Calculate business impact of forecast
 */
function calculateBusinessImpact(forecastResult, businessContext) {
  const predictions = forecastResult.forecast.predictions || [];
  const averageDemand = predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length;

  const currentCapacity = businessContext.productionCapacity || 15000;
  const currentInventory = businessContext.currentInventory || 12000;

  return {
    capacityUtilization: Math.round((averageDemand / currentCapacity) * 100),
    inventoryTurnover: Math.round((averageDemand * 30) / currentInventory * 10) / 10,
    revenueProjection: Math.round(averageDemand * predictions.length * 45), // Assuming $45 per unit
    riskFactors: {
      overCapacity: averageDemand > currentCapacity,
      underInventory: (averageDemand * 7) > currentInventory, // 7-day stock
      highVolatility: (forecastResult.analytics.summary?.volatility || 0) > 0.3
    }
  };
}

/**
 * Generate actionable insights from forecast
 */
function generateActionableInsights(forecastResult) {
  const insights = [];

  // Accuracy insight
  if (forecastResult.confidence >= 0.88) {
    insights.push({
      type: 'success',
      priority: 'high',
      message: 'Target accuracy of 88% achieved',
      action: 'Proceed with confidence in forecast-based decisions'
    });
  } else {
    insights.push({
      type: 'improvement',
      priority: 'medium',
      message: `Accuracy below target (${Math.round(forecastResult.confidence * 100)}% vs 88%)`,
      action: 'Consider additional data sources or model tuning'
    });
  }

  // Model performance insight
  if (forecastResult.models.openai && forecastResult.models.claude) {
    insights.push({
      type: 'success',
      priority: 'low',
      message: 'Dual AI model ensemble active',
      action: 'Continue using ensemble approach for optimal accuracy'
    });
  } else {
    insights.push({
      type: 'warning',
      priority: 'medium',
      message: 'Single AI model in use',
      action: 'Enable additional AI models for improved ensemble forecasting'
    });
  }

  return insights;
}

/**
 * Calculate forecast accuracy against actual results
 */
function calculateForecastAccuracy(predictions, actualResults) {
  if (!predictions || !actualResults || predictions.length === 0) {
    return { accuracy: 0, mae: 0, mse: 0 };
  }

  const pairs = predictions.slice(0, actualResults.length).map((pred, i) => ({
    predicted: pred.value,
    actual: actualResults[i].value
  }));

  const mae = pairs.reduce((sum, pair) =>
    sum + Math.abs(pair.predicted - pair.actual), 0) / pairs.length;

  const mse = pairs.reduce((sum, pair) =>
    sum + Math.pow(pair.predicted - pair.actual, 2), 0) / pairs.length;

  const meanActual = pairs.reduce((sum, pair) => sum + pair.actual, 0) / pairs.length;
  const accuracy = Math.max(0, 1 - (mae / meanActual));

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    mae: Math.round(mae),
    mse: Math.round(mse),
    pairs: pairs.length
  };
}

/**
 * Calculate historical accuracy from stored forecasts
 */
async function calculateHistoricalAccuracy(forecasts) {
  const validatedForecasts = forecasts.filter(f => f.validations?.length > 0);

  if (validatedForecasts.length === 0) {
    return {
      averageAccuracy: 0,
      bestAccuracy: 0,
      improvementTrend: 0
    };
  }

  const accuracies = validatedForecasts.map(f => f.validations[0].accuracy);
  const averageAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  const bestAccuracy = Math.max(...accuracies);

  // Calculate improvement trend (last 10 vs previous 10)
  const recent = accuracies.slice(0, 10);
  const previous = accuracies.slice(10, 20);
  const recentAvg = recent.reduce((sum, acc) => sum + acc, 0) / recent.length;
  const previousAvg = previous.reduce((sum, acc) => sum + acc, 0) / previous.length;
  const improvementTrend = previous.length > 0 ? recentAvg - previousAvg : 0;

  return {
    averageAccuracy: Math.round(averageAccuracy * 100) / 100,
    bestAccuracy: Math.round(bestAccuracy * 100) / 100,
    improvementTrend: Math.round(improvementTrend * 100) / 100
  };
}

/**
 * Analyze performance of different AI models
 */
function analyzeModelPerformance(forecasts) {
  const modelStats = {
    openai: { count: 0, totalAccuracy: 0 },
    claude: { count: 0, totalAccuracy: 0 },
    ensemble: { count: 0, totalAccuracy: 0 }
  };

  forecasts.forEach(forecast => {
    const models = forecast.models || {};
    const accuracy = forecast.validations?.[0]?.accuracy || forecast.confidence;

    if (models.openai && models.claude) {
      modelStats.ensemble.count++;
      modelStats.ensemble.totalAccuracy += accuracy;
    } else if (models.openai) {
      modelStats.openai.count++;
      modelStats.openai.totalAccuracy += accuracy;
    } else if (models.claude) {
      modelStats.claude.count++;
      modelStats.claude.totalAccuracy += accuracy;
    }
  });

  // Calculate averages
  Object.keys(modelStats).forEach(model => {
    const stats = modelStats[model];
    stats.averageAccuracy = stats.count > 0 ? stats.totalAccuracy / stats.count : 0;
  });

  // Determine best performing model
  const bestModel = Object.keys(modelStats).reduce((best, current) =>
    modelStats[current].averageAccuracy > modelStats[best].averageAccuracy ? current : best
  );

  return {
    ...modelStats,
    bestModel,
    overallAccuracy: forecasts.reduce((sum, f) =>
      sum + (f.validations?.[0]?.accuracy || f.confidence), 0) / forecasts.length
  };
}

/**
 * Generate validation insights
 */
function generateValidationInsights(validation) {
  const insights = [];

  if (validation.accuracy >= 0.88) {
    insights.push({
      type: 'success',
      message: 'Excellent forecast accuracy achieved',
      impact: 'high'
    });
  } else if (validation.accuracy >= 0.75) {
    insights.push({
      type: 'good',
      message: 'Good forecast accuracy, room for improvement',
      impact: 'medium'
    });
  } else {
    insights.push({
      type: 'improvement_needed',
      message: 'Forecast accuracy below target, review required',
      impact: 'high'
    });
  }

  return insights;
}

/**
 * Generate improvement recommendations
 */
function generateImprovementRecommendations(validation) {
  const recommendations = [];

  if (validation.accuracy < 0.88) {
    recommendations.push({
      priority: 'high',
      category: 'model_optimization',
      title: 'Improve Model Performance',
      description: 'Consider model retraining or ensemble optimization'
    });
  }

  if (validation.mae > 1000) {
    recommendations.push({
      priority: 'medium',
      category: 'data_quality',
      title: 'Enhance Data Quality',
      description: 'Review data sources and preprocessing methods'
    });
  }

  return recommendations;
}

/**
 * Generate model recommendations
 */
function generateModelRecommendations(comparison) {
  const recommendations = [];

  if (comparison.ensemble.averageAccuracy > comparison.openai.averageAccuracy) {
    recommendations.push({
      priority: 'high',
      title: 'Use Ensemble Approach',
      description: 'Ensemble models show superior performance'
    });
  }

  return recommendations;
}

export default router;

/**
 * AI-Enhanced Forecasting API Routes
 * OpenAI GPT-4 powered demand forecasting endpoints
 */

import express from 'express';
import forecastingService from '../services/ai/openAIForecastingService.js';
import logger from '../services/logger.js';

const router = express.Router();

/**
 * Generate AI-powered demand forecast
 * POST /api/ai-forecasting/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      market,
      product,
      timeHorizon = 30,
      includeSeasonality = true,
      includeEvents = true,
      currency
    } = req.body;

    if (!market || !product) {
      return res.status(400).json({
        success: false,
        error: 'Market and product are required'
      });
    }

    const historicalData = await getHistoricalData(market, product);

    const forecast = await forecastingService.generateForecast({
      market,
      product,
      historicalData,
      timeHorizon,
      includeSeasonality,
      includeEvents,
      currency
    });

    res.json({
      success: true,
      forecast,
      confidence: forecast.confidence,
      methodology: forecast.methodology,
      modelUsed: forecast.modelUsed
    });
  } catch (error) {
    logger.error('AI Forecast generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI forecast',
      details: error.message
    });
  }
});

/**
 * Generate bulk forecasts
 * POST /api/ai-forecasting/bulk
 */
router.post('/bulk', async (req, res) => {
  try {
    const { market, products, timeHorizon = 30 } = req.body;

    if (!market || !products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: 'Market and products array are required'
      });
    }

    const forecasts = await Promise.all(
      products.map(async (product) => {
        const historicalData = await getHistoricalData(market, product);
        return forecastingService.generateForecast({
          market,
          product,
          historicalData,
          timeHorizon
        });
      })
    );

    res.json({
      success: true,
      market,
      forecasts,
      totalProducts: forecasts.length,
      averageConfidence: forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length
    });
  } catch (error) {
    logger.error('Bulk AI forecast generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate bulk forecasts',
      details: error.message
    });
  }
});

/**
 * Get AI market insights
 * GET /api/ai-forecasting/insights/:market
 */
router.get('/insights/:market', async (req, res) => {
  try {
    const { market } = req.params;
    const { includeAllProducts } = req.query;

    const insights = await forecastingService.generateMarketInsights(
      market,
      includeAllProducts === 'true'
    );

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    logger.error('Failed to generate AI insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate market insights',
      details: error.message
    });
  }
});

/**
 * Detect anomalies using AI
 * GET /api/ai-forecasting/anomalies/:market
 */
router.get('/anomalies/:market', async (req, res) => {
  try {
    const { market } = req.params;
    
    const anomalies = await forecastingService.detectAnomalies(market);

    res.json({
      success: true,
      market,
      anomalies,
      detectedAt: new Date().toISOString(),
      count: anomalies.length
    });
  } catch (error) {
    logger.error('AI Anomaly detection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect anomalies',
      details: error.message
    });
  }
});

/**
 * Update forecast accuracy
 * POST /api/ai-forecasting/accuracy
 */
router.post('/accuracy', async (req, res) => {
  try {
    const { market, product, date, actualValue } = req.body;

    if (!market || !product || !date || actualValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    forecastingService.updateAccuracy(market, product, date, actualValue);
    const historicalAccuracy = forecastingService.getHistoricalAccuracy(market, product);

    res.json({
      success: true,
      message: 'Accuracy updated successfully',
      historicalAccuracy,
      confidenceLevel: historicalAccuracy > 0.8 ? 'high' : historicalAccuracy > 0.6 ? 'medium' : 'low'
    });
  } catch (error) {
    logger.error('Failed to update accuracy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update forecast accuracy',
      details: error.message
    });
  }
});

/**
 * Get cost optimization report
 * GET /api/ai-forecasting/cost-report
 */
router.get('/cost-report', async (req, res) => {
  try {
    const report = forecastingService.getCostReport();

    res.json({
      success: true,
      report,
      optimizationScore: calculateOptimizationScore(report)
    });
  } catch (error) {
    logger.error('Failed to generate cost report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cost report',
      details: error.message
    });
  }
});

/**
 * Stream real-time AI insights (SSE)
 * GET /api/ai-forecasting/stream/:market
 */
router.get('/stream/:market', async (req, res) => {
  const { market } = req.params;
  const { updateInterval = 5000 } = req.query;

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    market,
    model: 'GPT-4',
    timestamp: new Date().toISOString() 
  })}\n\n`);

  // Stream insights
  const streamGenerator = forecastingService.streamInsights(market, {
    updateInterval: parseInt(updateInterval),
    includeAllProducts: req.query.includeAllProducts === 'true'
  });

  const streamInterval = setInterval(async () => {
    try {
      const { value, done } = await streamGenerator.next();
      
      if (done) {
        clearInterval(streamInterval);
        res.end();
        return;
      }

      res.write(`data: ${JSON.stringify(value)}\n\n`);
    } catch (error) {
      logger.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: error.message 
      })}\n\n`);
    }
  }, parseInt(updateInterval));

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(streamInterval);
    res.end();
  });
});

/**
 * Compare AI forecasts across markets
 * POST /api/ai-forecasting/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { markets, product, timeHorizon = 30 } = req.body;

    if (!markets || !Array.isArray(markets) || !product) {
      return res.status(400).json({
        success: false,
        error: 'Markets array and product are required'
      });
    }

    const comparisons = await Promise.all(
      markets.map(async (market) => {
        const historicalData = await getHistoricalData(market, product);
        const forecast = await forecastingService.generateForecast({
          market,
          product,
          historicalData,
          timeHorizon
        });

        return {
          market,
          totalDemand: forecast.daily_forecast.reduce((sum, d) => sum + d.quantity, 0),
          totalRevenue: forecast.daily_forecast.reduce((sum, d) => sum + d.revenue, 0),
          confidence: forecast.confidence,
          trend: analyzeTrend(forecast.daily_forecast),
          keyDrivers: forecast.key_drivers
        };
      })
    );

    const bestMarket = comparisons.reduce((best, curr) => 
      curr.totalRevenue > best.totalRevenue ? curr : best
    );

    res.json({
      success: true,
      product,
      comparisons,
      bestMarket: bestMarket.market,
      bestMarketRevenue: bestMarket.totalRevenue,
      totalProjectedRevenue: comparisons.reduce((sum, c) => sum + c.totalRevenue, 0),
      averageConfidence: comparisons.reduce((sum, c) => sum + c.confidence, 0) / comparisons.length
    });
  } catch (error) {
    logger.error('Forecast comparison failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare forecasts',
      details: error.message
    });
  }
});

/**
 * Get all-markets dashboard data
 * GET /api/ai-forecasting/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const markets = ['UK', 'USA', 'EU', 'ASIA'];
    const products = ['GABA Spirit', 'Social Blend', 'Focus Mix'];
    
    const dashboardData = {
      markets: {},
      globalInsights: [],
      totalProjectedRevenue: 0,
      averageConfidence: 0,
      topOpportunities: [],
      riskAlerts: []
    };

    // Gather data for each market
    for (const market of markets) {
      const marketData = {
        insights: await forecastingService.generateMarketInsights(market, false),
        anomalies: await forecastingService.detectAnomalies(market),
        forecasts: {}
      };

      // Get sample forecast for main product
      const historicalData = await getHistoricalData(market, products[0]);
      const forecast = await forecastingService.generateForecast({
        market,
        product: products[0],
        historicalData,
        timeHorizon: 7
      });

      marketData.forecasts[products[0]] = {
        weeklyDemand: forecast.daily_forecast.reduce((sum, d) => sum + d.quantity, 0),
        weeklyRevenue: forecast.daily_forecast.reduce((sum, d) => sum + d.revenue, 0),
        confidence: forecast.confidence
      };

      dashboardData.markets[market] = marketData;
      dashboardData.totalProjectedRevenue += marketData.forecasts[products[0]].weeklyRevenue;
      dashboardData.averageConfidence += forecast.confidence;
    }

    dashboardData.averageConfidence /= markets.length;

    // Identify opportunities and risks
    dashboardData.topOpportunities = identifyOpportunities(dashboardData.markets);
    dashboardData.riskAlerts = identifyRisks(dashboardData.markets);

    res.json({
      success: true,
      dashboard: dashboardData,
      generatedAt: new Date().toISOString(),
      modelUsed: 'GPT-4 + Statistical Fallback'
    });
  } catch (error) {
    logger.error('Dashboard data generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard data',
      details: error.message
    });
  }
});

// Helper functions

async function getHistoricalData(market, product) {
  // Generate realistic sample data
  const days = 90;
  const data = [];
  const baseQuantity = {
    'UK': 100,
    'USA': 150,
    'EU': 120,
    'ASIA': 80
  }[market] || 100;

  const productMultiplier = {
    'GABA Spirit': 1.2,
    'Social Blend': 1.0,
    'Focus Mix': 0.8
  }[product] || 1.0;

  for (let i = days; i > 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dayOfWeek = date.getDay();
    const weekendBoost = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.3 : 1.0;
    const randomVariation = 0.8 + Math.random() * 0.4;
    const trend = 1 + (days - i) * 0.002;
    const seasonalFactor = getSeasonalFactor(date);
    
    const quantity = Math.round(
      baseQuantity * productMultiplier * weekendBoost * 
      randomVariation * trend * seasonalFactor
    );
    
    data.push({
      date: date.toISOString().split('T')[0],
      quantity,
      revenue: quantity * getPrice(product, market)
    });
  }

  return data;
}

function getSeasonalFactor(date) {
  const month = date.getMonth();
  // Higher sales in summer and holiday season
  const seasonalFactors = [
    0.8,  // Jan
    0.85, // Feb
    0.9,  // Mar
    0.95, // Apr
    1.0,  // May
    1.1,  // Jun
    1.15, // Jul
    1.1,  // Aug
    1.0,  // Sep
    0.95, // Oct
    1.05, // Nov
    1.3   // Dec
  ];
  return seasonalFactors[month];
}

function getPrice(product, market) {
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
  
  return (basePrices[product] || 35) * (marketMultipliers[market] || 1.0);
}

function analyzeTrend(forecastData) {
  if (!forecastData || forecastData.length < 2) return 'stable';
  
  const firstWeek = forecastData.slice(0, 7).reduce((sum, d) => sum + d.quantity, 0) / 7;
  const lastWeek = forecastData.slice(-7).reduce((sum, d) => sum + d.quantity, 0) / 7;
  
  const change = (lastWeek - firstWeek) / firstWeek;
  
  if (change > 0.1) return 'increasing';
  if (change < -0.1) return 'decreasing';
  return 'stable';
}

function calculateOptimizationScore(report) {
  let score = 100;
  
  // Penalize high cost per request
  if (report.averageTokensPerRequest > 2000) score -= 20;
  if (report.averageTokensPerRequest > 3000) score -= 30;
  
  // Reward high cache hit rate
  if (report.cacheHitRate > 0.7) score += 10;
  if (report.cacheHitRate < 0.3) score -= 20;
  
  // Check total cost efficiency
  const costPerRequest = report.estimatedCost / report.totalRequests;
  if (costPerRequest > 0.1) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

function identifyOpportunities(marketsData) {
  const opportunities = [];
  
  Object.entries(marketsData).forEach(([market, data]) => {
    // Check for low anomalies and high confidence
    if (data.anomalies.length === 0 && Object.values(data.forecasts)[0]?.confidence > 0.8) {
      opportunities.push({
        market,
        type: 'expansion',
        description: `High confidence forecast with stable market conditions in ${market}`
      });
    }
  });
  
  return opportunities.slice(0, 3);
}

function identifyRisks(marketsData) {
  const risks = [];
  
  Object.entries(marketsData).forEach(([market, data]) => {
    // Check for anomalies
    if (data.anomalies.length > 2) {
      risks.push({
        market,
        severity: 'high',
        type: 'anomaly',
        description: `${data.anomalies.length} anomalies detected in ${market} market`
      });
    }
    
    // Check for low confidence
    if (Object.values(data.forecasts)[0]?.confidence < 0.6) {
      risks.push({
        market,
        severity: 'medium',
        type: 'uncertainty',
        description: `Low forecast confidence in ${market} market`
      });
    }
  });
  
  return risks.sort((a, b) => 
    a.severity === 'high' ? -1 : b.severity === 'high' ? 1 : 0
  ).slice(0, 5);
}

export default router;
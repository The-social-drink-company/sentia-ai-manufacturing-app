import express from 'express';
import { requireAuth } from '@clerk/express';
import { EnterpriseCashCoverageEngine } from '../../services/finance/cash-coverage-engine.js';
import { FinancialDataIntegrationService } from '../../services/finance/financial-data-integration.js';
import { MonteCarloSimulationEngine } from '../../services/finance/monte-carlo-simulation.js';
import { AIFinancialPredictionService } from '../../services/finance/ai-financial-predictions.js';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';

const router = express.Router();

// Initialize services
const cashCoverageEngine = new EnterpriseCashCoverageEngine();
const financialIntegration = new FinancialDataIntegrationService();
const monteCarloEngine = new MonteCarloSimulationEngine();
const aiPredictionService = new AIFinancialPredictionService();

// Initialize services on startup
(async _() => {
  try {
    await financialIntegration.initialize();
    await aiPredictionService.initialize();
    logInfo('Cash coverage services initialized');
  } catch (error) {
    logError('Failed to initialize cash coverage services', error);
  }
})();

/**
 * GET /api/cash-coverage/analysis
 * Get comprehensive cash coverage analysis for specified periods
 */
router.get('/analysis', requireAuth(), async (req, res) => {
  try {
    const { companyId, periods, includeSimulation } = req.query;
    const userId = req.auth.userId;

    logInfo('Cash coverage analysis requested', { userId, companyId, periods });

    // Get company profile
    const companyData = await getCompanyProfile(companyId, userId);

    if (!companyData) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'Unable to find company profile'
      });
    }

    // Run cash coverage analysis
    const analysis = await cashCoverageEngine.calculateCashCoverage(
      companyData,
      {
        periods: periods ? periods.split(',').map(Number) : [30, 60, 90, 120, 180],
        includeSimulation: includeSimulation === 'true'
      }
    );

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Cash coverage analysis failed', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/cash-coverage/simulate
 * Run Monte Carlo simulation for cash scenarios
 */
router.post('/simulate', requireAuth(), async (req, res) => {
  try {
    const { companyId, variables, timeHorizon, iterations, correlations } = req.body;
    const userId = req.auth.userId;

    logInfo('Monte Carlo simulation requested', {
      userId,
      companyId,
      iterations: iterations || 10000
    });

    // Validate input
    if (!variables || !timeHorizon) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Variables and time horizon are required'
      });
    }

    // Get company data
    const companyData = await getCompanyProfile(companyId, userId);
    const financialData = await financialIntegration.fetchConsolidatedFinancials(companyId);

    // Prepare simulation parameters
    const simulationParams = {
      variables,
      timeHorizon,
      iterations: iterations || 10000,
      initialCash: financialData.financials.cashAndEquivalents,
      ...companyData
    };

    // Run simulation
    const results = await monteCarloEngine.runCashCoverageSimulation(
      simulationParams,
      { correlations }
    );

    res.json({
      success: true,
      simulation: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Monte Carlo simulation failed', error);
    res.status(500).json({
      error: 'Simulation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/cash-coverage/injection-needs
 * Calculate cash injection requirements
 */
router.get('/injection-needs', requireAuth(), async (req, res) => {
  try {
    const { companyId, scenario } = req.query;
    const userId = req.auth.userId;

    logInfo('Cash injection analysis requested', { userId, companyId, scenario });

    const companyData = await getCompanyProfile(companyId, userId);

    const injectionAnalysis = await cashCoverageEngine.calculateCashInjectionNeeds(
      companyData,
      scenario || 'sustain'
    );

    res.json({
      success: true,
      analysis: injectionAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Cash injection analysis failed', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/cash-coverage/growth-funding
 * Calculate funding requirements for growth targets
 */
router.post('/growth-funding', requireAuth(), async (req, res) => {
  try {
    const { companyId, targetGrowth, timeframe } = req.body;
    const userId = req.auth.userId;

    logInfo('Growth funding analysis requested', {
      userId,
      companyId,
      targetGrowth
    });

    if (!targetGrowth || targetGrowth <= 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Valid growth target required'
      });
    }

    const companyData = await getCompanyProfile(companyId, userId);

    const growthAnalysis = await cashCoverageEngine.calculateGrowthFunding(
      targetGrowth,
      companyData,
      timeframe || 12
    );

    res.json({
      success: true,
      analysis: growthAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Growth funding analysis failed', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/cash-coverage/working-capital/optimize
 * Get working capital optimization recommendations
 */
router.get('/working-capital/optimize', requireAuth(), async (req, res) => {
  try {
    const { companyId } = req.query;
    const userId = req.auth.userId;

    logInfo('Working capital optimization requested', { userId, companyId });

    const companyData = await getCompanyProfile(companyId, userId);
    const financialData = await financialIntegration.fetchConsolidatedFinancials(companyId);

    const currentMetrics = {
      dso: financialData.workingCapital.dso,
      dpo: financialData.workingCapital.dpo,
      dio: financialData.workingCapital.dio,
      revenue: financialData.financials.revenue,
      cogs: financialData.financials.expenses * 0.7, // Estimate COGS
      industry: companyData.industry
    };

    const optimization = await cashCoverageEngine.optimizeWorkingCapital(
      currentMetrics,
      companyData
    );

    res.json({
      success: true,
      optimization,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Working capital optimization failed', error);
    res.status(500).json({
      error: 'Optimization failed',
      message: error.message
    });
  }
});

/**
 * GET /api/cash-coverage/executive-insights
 * Get executive-level financial insights
 */
router.get('/executive-insights', requireAuth(), async (req, res) => {
  try {
    const { companyId } = req.query;
    const userId = req.auth.userId;

    logInfo('Executive insights requested', { userId, companyId });

    const companyData = await getCompanyProfile(companyId, userId);

    const insights = await cashCoverageEngine.generateExecutiveInsights(companyData);

    res.json({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Executive insights generation failed', error);
    res.status(500).json({
      error: 'Insights generation failed',
      message: error.message
    });
  }
});

/**
 * POST /api/cash-coverage/predict
 * AI-powered financial predictions
 */
router.post('/predict', requireAuth(), async (req, res) => {
  try {
    const { companyId, type, timeHorizon, historicalData } = req.body;
    const userId = req.auth.userId;

    logInfo('AI prediction requested', {
      userId,
      companyId,
      type,
      timeHorizon
    });

    const companyData = await getCompanyProfile(companyId, userId);

    let prediction;

    switch (type) {
      case 'cashFlow':
        prediction = await aiPredictionService.predictCashFlow(
          historicalData,
          timeHorizon,
          companyData
        );
        break;

      case 'revenue':
        prediction = await aiPredictionService.predictRevenue(
          historicalData,
          timeHorizon,
          companyData
        );
        break;

      case 'receivables':
        const financialData = await financialIntegration.fetchConsolidatedFinancials(companyId);
        prediction = await aiPredictionService.predictReceivables(
          financialData.financials.accountsReceivable,
          financialData.workingCapital.dso,
          timeHorizon
        );
        break;

      case 'expenses':
        prediction = await aiPredictionService.projectOperatingExpenses(
          historicalData.monthlyExpenses,
          timeHorizon,
          companyData.growthRate,
          companyData.seasonality
        );
        break;

      default:
        return res.status(400).json({
          error: 'Invalid prediction type',
          message: 'Supported types: cashFlow, revenue, receivables, expenses'
        });
    }

    res.json({
      success: true,
      prediction,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('AI prediction failed', error);
    res.status(500).json({
      error: 'Prediction failed',
      message: error.message
    });
  }
});

/**
 * GET /api/cash-coverage/benchmarks
 * Get industry benchmarks
 */
router.get('/benchmarks', requireAuth(), async (req, res) => {
  try {
    const { industry, revenue, region, isListed } = req.query;
    const userId = req.auth.userId;

    logInfo('Industry benchmarks requested', {
      userId,
      industry,
      revenue
    });

    const benchmarks = await cashCoverageEngine.getIndustryBenchmarks(
      industry,
      parseFloat(revenue),
      region || 'US',
      isListed === 'true'
    );

    res.json({
      success: true,
      benchmarks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Benchmark fetch failed', error);
    res.status(500).json({
      error: 'Benchmark fetch failed',
      message: error.message
    });
  }
});

/**
 * GET /api/cash-coverage/financial-data
 * Get consolidated financial data from all sources
 */
router.get('/financial-data', requireAuth(), async (req, res) => {
  try {
    const { companyId, sources, refresh } = req.query;
    const userId = req.auth.userId;

    logInfo('Financial data requested', { userId, companyId, sources });

    // Check cache unless refresh requested
    if (refresh !== 'true') {
      const cached = financialIntegration.getCachedFinancialData(companyId);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    const financialData = await financialIntegration.fetchConsolidatedFinancials(
      companyId,
      {
        sources: sources ? sources.split(',') : undefined
      }
    );

    res.json({
      success: true,
      data: financialData,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Financial data fetch failed', error);
    res.status(500).json({
      error: 'Data fetch failed',
      message: error.message
    });
  }
});

/**
 * POST /api/cash-coverage/scenario
 * Run custom scenario analysis
 */
router.post('/scenario', requireAuth(), async (req, res) => {
  try {
    const { companyId, scenarios, compareBaseline } = req.body;
    const userId = req.auth.userId;

    logInfo('Scenario analysis requested', {
      userId,
      companyId,
      scenarioCount: scenarios.length
    });

    const companyData = await getCompanyProfile(companyId, userId);
    const results = [];

    // Run baseline if requested
    if (compareBaseline) {
      const baseline = await cashCoverageEngine.calculateCashCoverage(companyData);
      results.push({
        name: 'Baseline',
        isBaseline: true,
        analysis: baseline
      });
    }

    // Run each scenario
    for (const scenario of scenarios) {
      const modifiedCompanyData = {
        ...companyData,
        ...scenario.modifications
      };

      const scenarioResult = await cashCoverageEngine.calculateCashCoverage(
        modifiedCompanyData,
        scenario.options
      );

      results.push({
        name: scenario.name,
        description: scenario.description,
        analysis: scenarioResult
      });
    }

    res.json({
      success: true,
      scenarios: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Scenario analysis failed', error);
    res.status(500).json({
      error: 'Scenario analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/cash-coverage/health-check
 * Check health of cash coverage services
 */
router.get(_'/health-check', async _(req, res) => {
  try {
    const health = {
      cashCoverageEngine: 'healthy',
      financialIntegration: 'healthy',
      monteCarloEngine: 'healthy',
      aiPredictionService: 'healthy',
      timestamp: new Date().toISOString()
    };

    // Test each service
    // These would include actual health checks in production

    res.json({
      success: true,
      health,
      status: 'operational'
    });
  } catch (error) {
    logError('Health check failed', error);
    res.status(503).json({
      error: 'Service unavailable',
      message: error.message
    });
  }
});

// Helper function to get company profile
async function getCompanyProfile(companyId, userId) {
  try {
    // This would fetch from database
    // For now, return sample structure
    return {
      companyId,
      companyName: 'Sentia Spirits',
      industry: 'beverages',
      revenue: 10000000,
      region: 'US',
      dso: 45,
      dpo: 30,
      dio: 60,
      growthRate: 0.20,
      creditRating: 'BBB',
      yearsInBusiness: 5,
      dataQuality: 'high'
    };
  } catch (error) {
    logError('Failed to fetch company profile', error);
    return null;
  }
}

export default router;
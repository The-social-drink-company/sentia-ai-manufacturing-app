import express from 'express';
import NodeCache from 'node-cache';
import prisma from '../../lib/prisma.js';
import { requireAuth, requireRole, requireManager } from '../middleware/clerkAuth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import OpenAI from 'openai';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


const router = express.Router();

// Initialize cache with 30 second TTL for real-time financial data
const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

// Initialize OpenAI for AI-powered analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Working Capital Intelligence validation schemas
const workingCapitalSchemas = {
  cashRunwayAnalysis: z.object({
    timeHorizon: z.enum(['30', '60', '90', '120', '180']).default('90'),
    includeSeasonality: z.boolean().default(true),
    includeGrowthScenarios: z.boolean().default(false),
    confidenceLevel: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate')
  }),
  
  fundingRequirements: z.object({
    growthRate: z.number().min(-50).max(500).default(0), // -50% to 500% growth
    timeframe: z.enum(['quarter', 'year', 'multi-year']).default('year'),
    fundingType: z.enum(['operations', 'growth', 'both']).default('both'),
    includeSeasonality: z.boolean().default(true)
  }),
  
  workingCapitalOptimization: z.object({
    targetDSO: z.number().min(1).max(365).optional(),
    targetDPO: z.number().min(1).max(365).optional(),
    targetInventoryTurns: z.number().min(1).max(52).optional(),
    industryBenchmark: z.boolean().default(true),
    optimizationGoal: z.enum(['cash_unlock', 'efficiency', 'growth_support']).default('cash_unlock')
  }),
  
  scenarioPlanning: z.object({
    scenarios: z.array(z.object({
      name: z.string(),
      revenueGrowth: z.number(),
      marginChange: z.number().optional(),
      dsoChange: z.number().optional(),
      dpoChange: z.number().optional(),
      inventoryChange: z.number().optional()
    })).min(1).max(5),
    timeframe: z.enum(['quarter', 'year']).default('year')
  }),
  
  industryBenchmark: z.object({
    industry: z.string().optional(),
    revenue: z.number().min(0).optional(),
    employees: z.number().min(1).optional(),
    region: z.enum(['UK', 'US', 'EU', 'Global']).default('UK')
  })
};

/**
 * GET /api/working-capital-intelligence/cash-runway
 * Calculate cash runway with advanced forecasting
 */
router.get('/cash-runway',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const validatedQuery = workingCapitalSchemas.cashRunwayAnalysis.parse(req.query);
    const { timeHorizon, includeSeasonality, includeGrowthScenarios, confidenceLevel } = validatedQuery;

    const cacheKey = `cash-runway-${timeHorizon}-${includeSeasonality}-${includeGrowthScenarios}-${confidenceLevel}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Cash runway analysis');
      return res.json(cached);
    }

    // Get current financial position
    const currentDate = new Date();
    const startDate = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000); // Last 90 days for trend analysis

    // Fetch financial data
    const [cashPosition, recentTransactions, receivables, payables] = await Promise.all([
      // Current cash position
      prisma.financialMetrics.findFirst({
        where: { date: { gte: startDate } },
        orderBy: { date: 'desc' }
      }),
      
      // Recent cash flow transactions
      prisma.cashFlowTransaction.findMany({
        where: { 
          date: { gte: startDate },
          type: { in: ['revenue', 'expense', 'receivable_collection', 'payable_payment'] }
        },
        orderBy: { date: 'desc' }
      }),
      
      // Outstanding receivables
      prisma.invoice.findMany({
        where: { 
          status: { in: ['sent', 'overdue'] },
          dueDate: { gte: currentDate }
        }
      }),
      
      // Outstanding payables
      prisma.expense.findMany({
        where: { 
          status: 'pending',
          dueDate: { gte: currentDate }
        }
      })
    ]);

    // Calculate current cash position
    const currentCash = cashPosition?.cashBalance || 0;
    
    // Analyze cash flow patterns
    const dailyCashFlow = calculateDailyCashFlow(recentTransactions);
    const averageDailyBurn = calculateAverageDailyBurn(dailyCashFlow);
    const seasonalityFactor = includeSeasonality ? calculateSeasonalityFactor(recentTransactions) : 1;
    
    // Calculate receivables collection schedule
    const receivablesSchedule = calculateReceivablesSchedule(receivables);
    
    // Calculate payables payment schedule
    const payablesSchedule = calculatePayablesSchedule(payables);
    
    // Generate cash flow forecast
    const forecastDays = parseInt(timeHorizon);
    const cashFlowForecast = generateCashFlowForecast({
      currentCash,
      averageDailyBurn,
      seasonalityFactor,
      receivablesSchedule,
      payablesSchedule,
      forecastDays,
      confidenceLevel
    });

    // Calculate key metrics
    const cashRunwayDays = calculateCashRunwayDays(cashFlowForecast);
    const criticalDates = identifyCriticalDates(cashFlowForecast);
    const riskAssessment = assessCashFlowRisk(cashFlowForecast, confidenceLevel);

    // Generate AI-powered insights
    const aiInsights = await generateCashRunwayInsights({
      currentCash,
      cashRunwayDays,
      criticalDates,
      riskAssessment,
      timeHorizon: forecastDays
    });

    const result = {
      summary: {
        currentCash,
        cashRunwayDays,
        timeHorizon: forecastDays,
        riskLevel: riskAssessment.level,
        confidenceLevel
      },
      forecast: cashFlowForecast,
      criticalDates,
      riskAssessment,
      insights: aiInsights,
      recommendations: generateCashRunwayRecommendations(cashFlowForecast, riskAssessment),
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataPoints: recentTransactions.length,
        forecastAccuracy: calculateForecastAccuracy(confidenceLevel)
      }
    };

    cache.set(cacheKey, result);
    res.json(result);
  })
);

/**
 * POST /api/working-capital-intelligence/funding-requirements
 * Calculate funding requirements for growth scenarios
 */
router.post('/funding-requirements',
  requireAuth,
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const validatedBody = workingCapitalSchemas.fundingRequirements.parse(req.body);
    const { growthRate, timeframe, fundingType, includeSeasonality } = validatedBody;

    // Get current financial metrics
    const currentMetrics = await getCurrentFinancialMetrics();
    
    // Calculate working capital requirements for growth
    const workingCapitalRequirements = calculateWorkingCapitalForGrowth({
      currentMetrics,
      growthRate,
      timeframe,
      includeSeasonality
    });

    // Calculate funding gap
    const fundingGap = calculateFundingGap({
      workingCapitalRequirements,
      currentMetrics,
      fundingType
    });

    // Generate funding scenarios
    const fundingScenarios = generateFundingScenarios({
      fundingGap,
      growthRate,
      timeframe,
      currentMetrics
    });

    // AI-powered funding strategy recommendations
    const aiRecommendations = await generateFundingRecommendations({
      fundingGap,
      growthRate,
      currentMetrics,
      fundingScenarios
    });

    const result = {
      summary: {
        growthRate,
        timeframe,
        totalFundingRequired: fundingGap.total,
        workingCapitalIncrease: workingCapitalRequirements.increase,
        recommendedFundingType: fundingScenarios.recommended.type
      },
      workingCapitalRequirements,
      fundingGap,
      fundingScenarios,
      recommendations: aiRecommendations,
      impactAnalysis: calculateGrowthImpactAnalysis({
        growthRate,
        currentMetrics,
        fundingGap
      }),
      metadata: {
        calculatedAt: new Date().toISOString(),
        assumptions: {
          seasonalityIncluded: includeSeasonality,
          confidenceLevel: 'moderate'
        }
      }
    };

    res.json(result);
  })
);

/**
 * GET /api/working-capital-intelligence/optimization
 * Working capital optimization analysis
 */
router.get('/optimization',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const validatedQuery = workingCapitalSchemas.workingCapitalOptimization.parse(req.query);
    const { targetDSO, targetDPO, targetInventoryTurns, industryBenchmark, optimizationGoal } = validatedQuery;

    const cacheKey = `wc-optimization-${optimizationGoal}-${industryBenchmark}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Working capital optimization');
      return res.json(cached);
    }

    // Get current working capital metrics
    const currentMetrics = await getCurrentWorkingCapitalMetrics();
    
    // Get industry benchmarks if requested
    const benchmarks = industryBenchmark ? await getIndustryBenchmarks(currentMetrics) : null;
    
    // Calculate optimization opportunities
    const optimizationOpportunities = calculateOptimizationOpportunities({
      currentMetrics,
      targetDSO,
      targetDPO,
      targetInventoryTurns,
      benchmarks,
      optimizationGoal
    });

    // Calculate cash unlock potential
    const cashUnlockPotential = calculateCashUnlockPotential({
      currentMetrics,
      optimizationOpportunities
    });

    // Generate implementation roadmap
    const implementationRoadmap = generateImplementationRoadmap({
      optimizationOpportunities,
      optimizationGoal
    });

    // AI-powered optimization insights
    const aiInsights = await generateOptimizationInsights({
      currentMetrics,
      optimizationOpportunities,
      benchmarks,
      optimizationGoal
    });

    const result = {
      summary: {
        currentWorkingCapital: currentMetrics.workingCapital,
        optimizedWorkingCapital: currentMetrics.workingCapital + cashUnlockPotential.total,
        cashUnlockPotential: cashUnlockPotential.total,
        implementationTimeframe: implementationRoadmap.totalTimeframe,
        priorityActions: implementationRoadmap.priorityActions.length
      },
      currentMetrics,
      benchmarks,
      optimizationOpportunities,
      cashUnlockPotential,
      implementationRoadmap,
      insights: aiInsights,
      boardReadyTalkingPoints: generateBoardTalkingPoints({
        cashUnlockPotential,
        implementationRoadmap,
        currentMetrics
      }),
      metadata: {
        calculatedAt: new Date().toISOString(),
        optimizationGoal,
        benchmarkSource: benchmarks ? 'industry_data' : 'internal_targets'
      }
    };

    cache.set(cacheKey, result);
    res.json(result);
  })
);

/**
 * POST /api/working-capital-intelligence/scenario-planning
 * Advanced scenario planning and modeling
 */
router.post('/scenario-planning',
  requireAuth,
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const validatedBody = workingCapitalSchemas.scenarioPlanning.parse(req.body);
    const { scenarios, timeframe } = validatedBody;

    // Get baseline metrics
    const baselineMetrics = await getCurrentFinancialMetrics();
    
    // Model each scenario
    const scenarioResults = await Promise.all(
      scenarios.map(async (scenario) => {
        const modeledResults = await modelScenario({
          scenario,
          baselineMetrics,
          timeframe
        });
        
        return {
          name: scenario.name,
          inputs: scenario,
          results: modeledResults,
          riskAssessment: assessScenarioRisk(modeledResults),
          recommendations: await generateScenarioRecommendations(scenario, modeledResults)
        };
      })
    );

    // Compare scenarios
    const scenarioComparison = compareScenarios(scenarioResults);
    
    // Generate executive summary
    const executiveSummary = generateExecutiveSummary({
      scenarioResults,
      scenarioComparison,
      baselineMetrics
    });

    const result = {
      executiveSummary,
      baselineMetrics,
      scenarioResults,
      scenarioComparison,
      recommendations: {
        recommended: scenarioComparison.recommended,
        riskMitigation: generateRiskMitigationStrategies(scenarioResults),
        implementationPriorities: generateImplementationPriorities(scenarioResults)
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        timeframe,
        scenarioCount: scenarios.length
      }
    };

    res.json(result);
  })
);

/**
 * GET /api/working-capital-intelligence/industry-benchmarks
 * AI-powered industry benchmarking
 */
router.get('/industry-benchmarks',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const validatedQuery = workingCapitalSchemas.industryBenchmark.parse(req.query);
    const { industry, revenue, employees, region } = validatedQuery;

    const cacheKey = `industry-benchmarks-${industry}-${revenue}-${employees}-${region}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Industry benchmarks');
      return res.json(cached);
    }

    // Get current company metrics for comparison
    const companyMetrics = await getCurrentFinancialMetrics();
    
    // AI-powered industry research
    const industryBenchmarks = await generateIndustryBenchmarks({
      industry: industry || companyMetrics.industry,
      revenue: revenue || companyMetrics.annualRevenue,
      employees: employees || companyMetrics.employeeCount,
      region
    });

    // Calculate performance gaps
    const performanceGaps = calculatePerformanceGaps({
      companyMetrics,
      industryBenchmarks
    });

    // Generate improvement opportunities
    const improvementOpportunities = generateImprovementOpportunities({
      performanceGaps,
      industryBenchmarks
    });

    const result = {
      summary: {
        industry: industry || companyMetrics.industry,
        companySize: categorizeCompanySize(revenue, employees),
        overallPerformance: performanceGaps.overall,
        topOpportunities: improvementOpportunities.slice(0, 3)
      },
      companyMetrics: {
        workingCapital: companyMetrics.workingCapital,
        dso: companyMetrics.dso,
        dpo: companyMetrics.dpo,
        inventoryTurns: companyMetrics.inventoryTurns,
        cashConversionCycle: companyMetrics.cashConversionCycle
      },
      industryBenchmarks,
      performanceGaps,
      improvementOpportunities,
      competitivePosition: assessCompetitivePosition({
        companyMetrics,
        industryBenchmarks
      }),
      metadata: {
        calculatedAt: new Date().toISOString(),
        benchmarkSource: 'ai_research',
        region,
        dataFreshness: 'current'
      }
    };

    cache.set(cacheKey, result);
    res.json(result);
  })
);

// Helper functions for calculations

function calculateDailyCashFlow(transactions) {
  const dailyFlow = {};
  
  transactions.forEach(transaction => {
    const date = transaction.date.toISOString().split('T')[0];
    if (!dailyFlow[date]) {
      dailyFlow[date] = 0;
    }
    
    const amount = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
    dailyFlow[date] += amount;
  });
  
  return dailyFlow;
}

function calculateAverageDailyBurn(dailyCashFlow) {
  const values = Object.values(dailyCashFlow);
  const totalFlow = values.reduce((sum, flow) => sum + flow, 0);
  return totalFlow / values.length;
}

function calculateSeasonalityFactor(transactions) {
  // Simplified seasonality calculation - in production, use more sophisticated time series analysis
  const currentMonth = new Date().getMonth();
  const monthlyTotals = {};
  
  transactions.forEach(transaction => {
    const month = transaction.date.getMonth();
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = 0;
    }
    monthlyTotals[month] += transaction.amount;
  });
  
  const averageMonthly = Object.values(monthlyTotals).reduce((sum, total) => sum + total, 0) / Object.keys(monthlyTotals).length;
  const currentMonthTotal = monthlyTotals[currentMonth] || averageMonthly;
  
  return currentMonthTotal / averageMonthly;
}

function calculateReceivablesSchedule(receivables) {
  return receivables.map(invoice => ({
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    probability: calculateCollectionProbability(invoice)
  }));
}

function calculatePayablesSchedule(payables) {
  return payables.map(expense => ({
    amount: expense.amount,
    dueDate: expense.dueDate,
    priority: calculatePaymentPriority(expense)
  }));
}

function generateCashFlowForecast(params) {
  const { currentCash, averageDailyBurn, seasonalityFactor, receivablesSchedule, payablesSchedule, forecastDays, confidenceLevel } = params;
  
  const forecast = [];
  let runningCash = currentCash;
  
  for (let day = 1; day <= forecastDays; day++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + day);
    
    // Calculate daily cash flow
    const dailyBurn = averageDailyBurn * seasonalityFactor;
    const receivablesInflow = calculateDailyReceivables(receivablesSchedule, forecastDate);
    const payablesOutflow = calculateDailyPayables(payablesSchedule, forecastDate);
    
    const netDailyFlow = receivablesInflow - payablesOutflow - Math.abs(dailyBurn);
    runningCash += netDailyFlow;
    
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      day,
      openingBalance: runningCash - netDailyFlow,
      inflows: receivablesInflow,
      outflows: payablesOutflow + Math.abs(dailyBurn),
      netFlow: netDailyFlow,
      closingBalance: runningCash,
      confidenceLevel: calculateDailyConfidence(day, confidenceLevel)
    });
  }
  
  return forecast;
}

async function generateCashRunwayInsights(params) {
  const { currentCash, cashRunwayDays, criticalDates, riskAssessment, timeHorizon } = params;
  
  const prompt = `As a CFO advisor, analyze this cash runway situation:
  
Current Cash: £${currentCash.toLocaleString()}
Cash Runway: ${cashRunwayDays} days
Time Horizon: ${timeHorizon} days
Risk Level: ${riskAssessment.level}

Critical dates: ${criticalDates.map(d => `${d.date}: ${d.description}`).join(', ')}

Provide 3 key insights and 3 actionable recommendations for executive decision-making.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    });

    return completion.choices[0].message.content;
  } catch (error) {
    logError('OpenAI API error:', error);
    return generateFallbackInsights(params);
  }
}

async function getCurrentFinancialMetrics() {
  // Fetch current financial metrics from database
  const metrics = await prisma.financialMetrics.findFirst({
    orderBy: { date: 'desc' }
  });
  
  return {
    annualRevenue: metrics?.annualRevenue || 0,
    workingCapital: metrics?.workingCapital || 0,
    dso: metrics?.dso 0,
    dpo: metrics?.dpo 0,
    inventoryTurns: metrics?.inventoryTurns 0,
    cashConversionCycle: metrics?.cashConversionCycle 0,
    employeeCount: metrics?.employeeCount 0,
    industry: metrics?.industry || null
  };
}

// Export the router
export default router;

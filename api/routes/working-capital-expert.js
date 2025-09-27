import express from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/clerkAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


const router = express.Router();

// Working Capital Expert validation schema
const workingCapitalSchema = z.object({
  annualRevenue: z.number().min(0),
  averageDebtorDays: z.number().min(0).max(365),
  averageCreditorDays: z.number().min(0).max(365),
  currentDebtors: z.number().min(0),
  currentCreditors: z.number().min(0),
  currentInventory: z.number().min(0),
  grossMargin: z.number().min(0).max(100),
  netMargin: z.number().min(0).max(100),
  currentCashOnHand: z.number().min(0),
  averageBankBalance: z.number().min(0),
  industry: z.enum(['manufacturing', 'retail', 'services', 'technology', 'healthcare']),
  numberOfEmployees: z.number().min(1),
  inventoryTurnsPerYear: z.number().min(0).max(50),
  expectedGrowthRate: z.number().min(-100).max(500),
  debtorDaysReduction: z.number().min(0).max(365),
  creditorDaysExtension: z.number().min(0).max(365),
  monthlyFixedCosts: z.number().min(0),
  monthlyVariableCosts: z.number().min(0),
  seasonalityFactor: z.number().min(0).max(2)
});

/**
 * POST /api/working-capital-expert/calculate
 * Calculate comprehensive working capital metrics with AI benchmarking
 */
router.post(_'/calculate',
  requireAuth,
  asyncHandler(async (req, res) => {
    logDebug('[Working Capital Expert] Calculation request received');

    // Validate input
    const params = workingCapitalSchema.parse(req.body);

    try {
      // Call MCP server for AI-powered calculations
      const mcpResponse = await axios.post(
        `${process.env.MCP_SERVER_URL || 'http://localhost:3001'}/api/working-capital/expert`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MCP_API_KEY || 'sentia-mcp-key'}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      logDebug('[Working Capital Expert] Calculation successful');

      res.json({
        success: true,
        data: mcpResponse.data
      });

    } catch (mcpError) {
      logError('[Working Capital Expert] MCP server error:', mcpError.message);

      // Fallback to local calculations if MCP server is unavailable
      const fallbackData = calculateLocally(params);

      res.json({
        success: true,
        data: fallbackData,
        fallback: true,
        message: 'Using local calculations (AI features unavailable)'
      });
    }
  })
);

/**
 * GET /api/working-capital-expert/benchmarks/:industry
 * Get industry benchmarks
 */
router.get(_'/benchmarks/:industry',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { industry } = req.params;
    const { revenue } = req.query;

    logDebug(`[Working Capital Expert] Fetching benchmarks for ${industry}`);

    try {
      // Try to get AI-powered benchmarks from MCP server
      const mcpResponse = await axios.get(
        `${process.env.MCP_SERVER_URL || 'http://localhost:3001'}/api/benchmarks/${industry}`,
        {
          params: { revenue },
          headers: {
            'Authorization': `Bearer ${process.env.MCP_API_KEY || 'sentia-mcp-key'}`
          },
          timeout: 10000
        }
      );

      res.json({
        success: true,
        data: mcpResponse.data
      });

    } catch (error) {
      // Return default benchmarks on error
      const benchmarks = getDefaultBenchmarks(industry);

      res.json({
        success: true,
        data: benchmarks,
        fallback: true
      });
    }
  })
);

/**
 * GET /api/working-capital-expert/recommendations
 * Get AI-powered recommendations based on current metrics
 */
router.get(_'/recommendations',
  requireAuth,
  asyncHandler(async (req, res) => {
    logDebug('[Working Capital Expert] Generating recommendations');

    try {
      // Get current working capital data
      const wcResponse = await axios.get('/api/financial/working-capital');
      const currentData = wcResponse.data;

      // Get AI recommendations from MCP server
      const mcpResponse = await axios.post(
        `${process.env.MCP_SERVER_URL || 'http://localhost:3001'}/api/ai/recommendations`,
        {
          type: 'working_capital',
          data: currentData
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.MCP_API_KEY || 'sentia-mcp-key'}`
          },
          timeout: 15000
        }
      );

      res.json({
        success: true,
        recommendations: mcpResponse.data.recommendations
      });

    } catch (error) {
      // Return generic recommendations on error
      res.json({
        success: true,
        recommendations: getDefaultRecommendations(),
        fallback: true
      });
    }
  })
);

// Local calculation fallback
function calculateLocally(params) {
  const {
    annualRevenue,
    averageDebtorDays,
    averageCreditorDays,
    currentDebtors,
    currentCreditors,
    currentInventory,
    grossMargin,
    netMargin,
    currentCashOnHand,
    monthlyFixedCosts,
    monthlyVariableCosts,
    expectedGrowthRate,
    debtorDaysReduction,
    creditorDaysExtension,
    inventoryTurnsPerYear,
    numberOfEmployees,
    industry
  } = params;

  const dailyRevenue = annualRevenue / 365;
  const monthlyRevenue = annualRevenue / 12;

  // Core Question 1: Cash Requirements
  const cashRequirements = {};
  [30, 60, 90, 120, 180].forEach(days => {
    const periods = days / 30;
    const totalExpenses = (monthlyFixedCosts + monthlyVariableCosts) * periods;
    const expectedInflows = dailyRevenue * Math.max(0, days - averageDebtorDays);
    const expectedOutflows = totalExpenses * (averageCreditorDays / 30);
    const netCashRequired = totalExpenses - expectedInflows + expectedOutflows;
    const bufferRequired = netCashRequired * 0.15;

    cashRequirements[`days${days}`] = {
      totalExpenses,
      expectedInflows,
      expectedOutflows,
      netCashRequired: Math.max(0, netCashRequired),
      recommendedCash: Math.max(0, netCashRequired + bufferRequired),
      currentSurplus: currentCashOnHand - Math.max(0, netCashRequired)
    };
  });

  // Core Question 2: Current Operations
  const currentWorkingCapital = currentDebtors + currentInventory + currentCashOnHand - currentCreditors;
  const optimalWorkingCapital = annualRevenue * 0.15;
  const cashInjectionNeeded = Math.max(0, optimalWorkingCapital - currentWorkingCapital);

  const currentOperations = {
    currentWorkingCapital,
    optimalWorkingCapital,
    cashInjectionNeeded,
    workingCapitalRatio: ((currentWorkingCapital / annualRevenue) * 100).toFixed(1),
    liquidityStatus: currentCashOnHand > cashInjectionNeeded ? 'healthy' : 'needs_attention'
  };

  // Core Question 3: Growth Funding
  const targetRevenue = annualRevenue * (1 + expectedGrowthRate / 100);
  const revenueIncrease = targetRevenue - annualRevenue;
  const additionalDebtors = (revenueIncrease / 365) * averageDebtorDays;
  const additionalInventory = (revenueIncrease * (1 - grossMargin / 100)) / inventoryTurnsPerYear;
  const additionalCreditors = (revenueIncrease * (1 - grossMargin / 100) / 365) * averageCreditorDays;
  const growthWorkingCapital = additionalDebtors + additionalInventory - additionalCreditors;
  const rampUpCosts = (monthlyFixedCosts + monthlyVariableCosts * 1.2) * 3;

  const growthFunding = {
    targetRevenue,
    revenueIncrease,
    additionalDebtors,
    additionalInventory,
    additionalCreditors,
    growthWorkingCapital,
    rampUpCosts,
    totalGrowthFunding: growthWorkingCapital + rampUpCosts
  };

  // Optimization Levers
  const debtorImprovement = dailyRevenue * debtorDaysReduction;
  const creditorImprovement = (dailyRevenue * (1 - grossMargin / 100)) * creditorDaysExtension;
  const inventoryReduction = currentInventory * 0.1;
  const totalCashUnlock = debtorImprovement + creditorImprovement + inventoryReduction;

  const optimization = {
    debtorImprovement,
    creditorImprovement,
    inventoryReduction,
    totalCashUnlock,
    unlock90Days: totalCashUnlock * 0.4,
    unlock180Days: totalCashUnlock * 0.7,
    unlock365Days: totalCashUnlock,
    cashConversionCycleCurrent: averageDebtorDays + (365 / inventoryTurnsPerYear) - averageCreditorDays,
    cashConversionCycleOptimized: (averageDebtorDays - debtorDaysReduction) +
      (365 / inventoryTurnsPerYear * 0.9) - (averageCreditorDays + creditorDaysExtension)
  };

  // Benchmarks (static without AI)
  const benchmarks = getDefaultBenchmarks(industry);

  const benchmarkAnalysis = {
    debtorDaysVsBenchmark: averageDebtorDays - benchmarks.avgDebtorDays,
    creditorDaysVsBenchmark: averageCreditorDays - benchmarks.avgCreditorDays,
    marginVsBenchmark: netMargin - benchmarks.avgNetMargin,
    revenuePerEmployee: annualRevenue / numberOfEmployees,
    revenuePerEmployeeVsBenchmark: (annualRevenue / numberOfEmployees) - benchmarks.revenuePerEmployee,
    performanceScore: Math.round(
      ((benchmarks.avgDebtorDays / averageDebtorDays) * 25) +
      ((averageCreditorDays / benchmarks.avgCreditorDays) * 25) +
      ((netMargin / benchmarks.avgNetMargin) * 25) +
      ((annualRevenue / numberOfEmployees / benchmarks.revenuePerEmployee) * 25)
    )
  };

  // Key Metrics
  const currentAssets = currentDebtors + currentInventory + currentCashOnHand;
  const keyMetrics = {
    currentRatio: (currentAssets / currentCreditors).toFixed(2),
    quickRatio: ((currentDebtors + currentCashOnHand) / currentCreditors).toFixed(2),
    workingCapitalTurnover: (annualRevenue / currentWorkingCapital).toFixed(2),
    daysWorkingCapital: (currentWorkingCapital / dailyRevenue).toFixed(0)
  };

  // Talking Points
  const talkingPoints = [];
  if (optimization.unlock90Days > 50000) {
    talkingPoints.push({
      type: 'opportunity',
      title: 'Quick Win Cash Unlock',
      message: `Potential to unlock £${(optimization.unlock90Days / 1000).toFixed(0)}K in working capital within 90 days`,
      impact: optimization.unlock90Days
    });
  }

  if (optimization.unlock365Days > 200000) {
    talkingPoints.push({
      type: 'strategic',
      title: '12-Month Improvement Opportunity',
      message: `12-month cash flow improvement of £${(optimization.unlock365Days / 1000).toFixed(0)}K without new debt`,
      impact: optimization.unlock365Days
    });
  }

  return {
    cashRequirements,
    currentOperations,
    growthFunding,
    optimization,
    benchmarkAnalysis,
    benchmarks,
    keyMetrics,
    talkingPoints,
    aiRecommendations: getDefaultRecommendations()
  };
}

function getDefaultBenchmarks(industry) {
  const benchmarks = {
    manufacturing: {
      avgDebtorDays: 48,
      avgCreditorDays: 35,
      avgInventoryTurns: 7.5,
      avgGrossMargin: 38,
      avgNetMargin: 18,
      revenuePerEmployee: 120000,
      cashConversionCycle: 55
    },
    retail: {
      avgDebtorDays: 15,
      avgCreditorDays: 40,
      avgInventoryTurns: 12,
      avgGrossMargin: 45,
      avgNetMargin: 15,
      revenuePerEmployee: 180000,
      cashConversionCycle: 25
    },
    services: {
      avgDebtorDays: 30,
      avgCreditorDays: 25,
      avgInventoryTurns: 0,
      avgGrossMargin: 60,
      avgNetMargin: 25,
      revenuePerEmployee: 250000,
      cashConversionCycle: 30
    },
    technology: {
      avgDebtorDays: 35,
      avgCreditorDays: 30,
      avgInventoryTurns: 0,
      avgGrossMargin: 70,
      avgNetMargin: 20,
      revenuePerEmployee: 300000,
      cashConversionCycle: 35
    },
    healthcare: {
      avgDebtorDays: 60,
      avgCreditorDays: 45,
      avgInventoryTurns: 8,
      avgGrossMargin: 55,
      avgNetMargin: 15,
      revenuePerEmployee: 200000,
      cashConversionCycle: 60
    }
  };

  return benchmarks[industry] || benchmarks.manufacturing;
}

function getDefaultRecommendations() {
  return [
    {
      action: 'Implement automated invoice collection system to reduce debtor days by 5-10 days',
      priority: 'high',
      timeline: '30 days',
      estimatedImpact: 'Unlock £50-100K in working capital'
    },
    {
      action: 'Negotiate extended payment terms with top 3 suppliers',
      priority: 'high',
      timeline: '60 days',
      estimatedImpact: 'Improve cash flow by £30-50K monthly'
    },
    {
      action: 'Optimize inventory levels using demand forecasting',
      priority: 'medium',
      timeline: '90 days',
      estimatedImpact: 'Reduce inventory carrying costs by 10-15%'
    },
    {
      action: 'Introduce early payment discounts for customers',
      priority: 'medium',
      timeline: '30 days',
      estimatedImpact: 'Accelerate collections by 7-10 days'
    },
    {
      action: 'Review and renegotiate credit insurance policies',
      priority: 'low',
      timeline: '90 days',
      estimatedImpact: 'Reduce bad debt risk by 20-30%'
    }
  ];
}

export default router;
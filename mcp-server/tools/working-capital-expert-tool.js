/**
 * Working Capital Expert Tool for MCP Server
 * Provides AI-powered working capital calculations and industry benchmarking
 */

import axios from 'axios';

export class WorkingCapitalExpertTool {
  constructor(aiSystem, apiInterface) {
    this.aiSystem = aiSystem;
    this.apiInterface = apiInterface;
  }

  async calculateWorkingCapital(params) {
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

    // Get AI-powered industry benchmarks
    const benchmarks = await this.getIndustryBenchmarks(industry, annualRevenue);

    // Calculate core metrics
    const dailyRevenue = annualRevenue / 365;
    const monthlyRevenue = annualRevenue / 12;

    // Core Question 1: Cash Requirements (30-180 days)
    const cashRequirements = this.calculateCashRequirements(params);

    // Core Question 2: Current Operations Cash Injection
    const currentOperations = this.calculateCurrentOperations(params);

    // Core Question 3: Growth Funding Requirements
    const growthFunding = this.calculateGrowthFunding(params);

    // Working Capital Optimization Levers
    const optimization = this.calculateOptimization(params);

    // Benchmark Analysis
    const benchmarkAnalysis = this.analyzeBenchmarks(params, benchmarks);

    // Generate AI-powered recommendations
    const aiRecommendations = await this.generateAIRecommendations({
      params,
      cashRequirements,
      currentOperations,
      growthFunding,
      optimization,
      benchmarkAnalysis
    });

    // Board-Ready Talking Points
    const talkingPoints = this.generateTalkingPoints({
      optimization,
      growthFunding,
      benchmarkAnalysis,
      dailyRevenue
    });

    return {
      cashRequirements,
      currentOperations,
      growthFunding,
      optimization,
      benchmarkAnalysis,
      aiRecommendations,
      talkingPoints,
      benchmarks,
      keyMetrics: this.calculateKeyMetrics(params)
    };
  }

  calculateCashRequirements(params) {
    const {
      annualRevenue,
      averageDebtorDays,
      averageCreditorDays,
      monthlyFixedCosts,
      monthlyVariableCosts,
      currentCashOnHand
    } = params;

    const dailyRevenue = annualRevenue / 365;
    const results = {};

    [30, 60, 90, 120, 180].forEach(days => {
      const periods = days / 30;
      const totalExpenses = (monthlyFixedCosts + monthlyVariableCosts) * periods;
      const expectedInflows = dailyRevenue * Math.max(0, days - averageDebtorDays);
      const expectedOutflows = totalExpenses * (averageCreditorDays / 30);
      const netCashRequired = totalExpenses - expectedInflows + expectedOutflows;
      const bufferRequired = netCashRequired * 0.15; // 15% safety buffer

      results[`days${days}`] = {
        totalExpenses,
        expectedInflows,
        expectedOutflows,
        netCashRequired: Math.max(0, netCashRequired),
        recommendedCash: Math.max(0, netCashRequired + bufferRequired),
        currentSurplus: currentCashOnHand - Math.max(0, netCashRequired)
      };
    });

    return results;
  }

  calculateCurrentOperations(params) {
    const {
      annualRevenue,
      currentDebtors,
      currentCreditors,
      currentInventory,
      currentCashOnHand
    } = params;

    const currentWorkingCapital = currentDebtors + currentInventory + currentCashOnHand - currentCreditors;
    const optimalWorkingCapital = annualRevenue * 0.15; // 15% of revenue as optimal WC
    const cashInjectionNeeded = Math.max(0, optimalWorkingCapital - currentWorkingCapital);

    return {
      currentWorkingCapital,
      optimalWorkingCapital,
      cashInjectionNeeded,
      workingCapitalRatio: ((currentWorkingCapital / annualRevenue) * 100).toFixed(1),
      liquidityStatus: currentCashOnHand > cashInjectionNeeded ? 'healthy' : 'needs_attention'
    };
  }

  calculateGrowthFunding(params) {
    const {
      annualRevenue,
      expectedGrowthRate,
      averageDebtorDays,
      averageCreditorDays,
      grossMargin,
      inventoryTurnsPerYear,
      monthlyFixedCosts,
      monthlyVariableCosts
    } = params;

    const targetRevenue = annualRevenue * (1 + expectedGrowthRate / 100);
    const revenueIncrease = targetRevenue - annualRevenue;

    // Additional working capital needed for growth
    const additionalDebtors = (revenueIncrease / 365) * averageDebtorDays;
    const additionalInventory = (revenueIncrease * (1 - grossMargin / 100)) / inventoryTurnsPerYear;
    const additionalCreditors = (revenueIncrease * (1 - grossMargin / 100) / 365) * averageCreditorDays;
    const growthWorkingCapital = additionalDebtors + additionalInventory - additionalCreditors;

    // Operating cash needed during ramp-up (3 months)
    const rampUpCosts = (monthlyFixedCosts + monthlyVariableCosts * 1.2) * 3;

    return {
      targetRevenue,
      revenueIncrease,
      additionalDebtors,
      additionalInventory,
      additionalCreditors,
      growthWorkingCapital,
      rampUpCosts,
      totalGrowthFunding: growthWorkingCapital + rampUpCosts
    };
  }

  calculateOptimization(params) {
    const {
      annualRevenue,
      debtorDaysReduction,
      creditorDaysExtension,
      currentInventory,
      grossMargin,
      averageDebtorDays,
      averageCreditorDays,
      inventoryTurnsPerYear
    } = params;

    const dailyRevenue = annualRevenue / 365;

    // Debtor Days Reduction Impact
    const debtorImprovement = dailyRevenue * debtorDaysReduction;

    // Creditor Days Extension Impact
    const creditorImprovement = (dailyRevenue * (1 - grossMargin / 100)) * creditorDaysExtension;

    // Inventory Optimization (10% reduction)
    const inventoryReduction = currentInventory * 0.1;

    // Total Cash Unlock Potential
    const totalCashUnlock = debtorImprovement + creditorImprovement + inventoryReduction;

    // Timeline for improvements
    const unlock90Days = totalCashUnlock * 0.4;  // 40% in 90 days
    const unlock180Days = totalCashUnlock * 0.7;  // 70% in 180 days
    const unlock365Days = totalCashUnlock;        // 100% in 365 days

    return {
      debtorImprovement,
      creditorImprovement,
      inventoryReduction,
      totalCashUnlock,
      unlock90Days,
      unlock180Days,
      unlock365Days,
      cashConversionCycleCurrent: averageDebtorDays + (365 / inventoryTurnsPerYear) - averageCreditorDays,
      cashConversionCycleOptimized: (averageDebtorDays - debtorDaysReduction) +
        (365 / inventoryTurnsPerYear * 0.9) - (averageCreditorDays + creditorDaysExtension)
    };
  }

  async getIndustryBenchmarks(industry, annualRevenue) {
    // Use AI to get industry-specific benchmarks
    const prompt = `
      Provide industry benchmarks for a ${industry} company with annual revenue of £${(annualRevenue / 1000000).toFixed(1)}M.
      Include: average debtor days, creditor days, inventory turns, gross margin, net margin,
      revenue per employee, and cash conversion cycle.

      Respond with specific numbers based on current UK industry standards.
    `;

    try {
      const aiResponse = await this.aiSystem.processRequest({
        type: 'ai_manufacturing_request',
        query: prompt,
        context: { industry, revenue: annualRevenue }
      });

      // Parse AI response and extract benchmarks
      return this.parseAIBenchmarks(aiResponse.response, industry);
    } catch (error) {
      // Fallback to default benchmarks
      return this.getDefaultBenchmarks(industry);
    }
  }

  parseAIBenchmarks(aiResponse, industry) {
    // Extract numerical values from AI response
    const extractNumber = (text, _keyword) => {
      const regex = new RegExp(`${keyword}[^\\d]*(\\d+\.?\\d*)`, 'i');
      const match = text.match(regex);
      return match ? parseFloat(match[1]) : null;
    };

    return {
      avgDebtorDays: extractNumber(aiResponse, 'debtor days') || 45,
      avgCreditorDays: extractNumber(aiResponse, 'creditor days') || 35,
      avgInventoryTurns: extractNumber(aiResponse, 'inventory turns') || 8,
      avgGrossMargin: extractNumber(aiResponse, 'gross margin') || 40,
      avgNetMargin: extractNumber(aiResponse, 'net margin') || 20,
      revenuePerEmployee: extractNumber(aiResponse, 'revenue per employee') || 150000,
      cashConversionCycle: extractNumber(aiResponse, 'cash conversion cycle') || 50
    };
  }

  getDefaultBenchmarks(industry) {
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
      }
    };

    return benchmarks[industry] || benchmarks.manufacturing;
  }

  analyzeBenchmarks(params, benchmarks) {
    const {
      averageDebtorDays,
      averageCreditorDays,
      netMargin,
      annualRevenue,
      numberOfEmployees
    } = params;

    return {
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
  }

  async generateAIRecommendations(data) {
    const prompt = `
      Based on the following working capital analysis, provide 3-5 specific, actionable recommendations:

      Current Working Capital: £${data.currentOperations.currentWorkingCapital}
      Cash Injection Needed: £${data.currentOperations.cashInjectionNeeded}
      Growth Funding Required: £${data.growthFunding.totalGrowthFunding}
      Cash Unlock Potential (90 days): £${data.optimization.unlock90Days}
      Performance Score: ${data.benchmarkAnalysis.performanceScore}/100

      Focus on practical actions that can be implemented within 30-90 days.
    `;

    try {
      const aiResponse = await this.aiSystem.processRequest({
        type: 'ai_manufacturing_request',
        query: prompt,
        context: data
      });

      return this.parseAIRecommendations(aiResponse.response);
    } catch (error) {
      return this.getDefaultRecommendations(data);
    }
  }

  parseAIRecommendations(aiResponse) {
    // Parse AI response into structured recommendations
    const recommendations = [];
    const lines = aiResponse.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.match(/^\d+.|^-|^*/)) {
        const cleanLine = line.replace(/^[\d+.\-*\s]+/, '').trim();
        if (cleanLine.length > 10) {
          recommendations.push({
            action: cleanLine,
            priority: recommendations.length < 2 ? 'high' : 'medium',
            timeline: '30-90 days'
          });
        }
      }
    });

    return recommendations.slice(0, 5);
  }

  getDefaultRecommendations(data) {
    const recommendations = [];

    if (data.optimization.unlock90Days > 50000) {
      recommendations.push({
        action: 'Implement automated invoice collection system to reduce debtor days',
        priority: 'high',
        timeline: '30 days'
      });
    }

    if (data.benchmarkAnalysis.debtorDaysVsBenchmark > 5) {
      recommendations.push({
        action: 'Negotiate early payment discounts with major customers',
        priority: 'high',
        timeline: '60 days'
      });
    }

    if (data.currentOperations.cashInjectionNeeded > 100000) {
      recommendations.push({
        action: 'Consider invoice factoring for immediate cash flow improvement',
        priority: 'medium',
        timeline: '30 days'
      });
    }

    return recommendations;
  }

  generateTalkingPoints(data) {
    const talkingPoints = [];
    const { optimization, growthFunding, benchmarkAnalysis, dailyRevenue } = data;

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

    if (benchmarkAnalysis.debtorDaysVsBenchmark > 5) {
      talkingPoints.push({
        type: 'improvement',
        title: 'Collection Process Enhancement',
        message: `Debtor days ${Math.round(benchmarkAnalysis.debtorDaysVsBenchmark)} days above industry average`,
        impact: dailyRevenue * benchmarkAnalysis.debtorDaysVsBenchmark
      });
    }

    if (growthFunding.totalGrowthFunding > 0) {
      talkingPoints.push({
        type: 'planning',
        title: 'Growth Funding Requirement',
        message: `£${(growthFunding.totalGrowthFunding / 1000).toFixed(0)}K funding needed for growth targets`,
        impact: growthFunding.totalGrowthFunding
      });
    }

    return talkingPoints;
  }

  calculateKeyMetrics(params) {
    const {
      currentDebtors,
      currentInventory,
      currentCashOnHand,
      currentCreditors,
      annualRevenue
    } = params;

    const currentAssets = currentDebtors + currentInventory + currentCashOnHand;
    const currentWorkingCapital = currentAssets - currentCreditors;

    return {
      currentRatio: (currentAssets / currentCreditors).toFixed(2),
      quickRatio: ((currentDebtors + currentCashOnHand) / currentCreditors).toFixed(2),
      workingCapitalTurnover: (annualRevenue / currentWorkingCapital).toFixed(2),
      daysWorkingCapital: (currentWorkingCapital / (annualRevenue / 365)).toFixed(0)
    };
  }
}

export default WorkingCapitalExpertTool;
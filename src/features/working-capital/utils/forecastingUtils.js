/**
 * Forecasting Utilities for Working Capital Management
 * Integrates various forecasting models with the working capital system
 */

import { TimeSeriesForecaster, CashFlowForecaster, WorkingCapitalOptimizer } from '../models/FinancialForecastModels.js'

// Cash flow forecasting utilities
export const generateCashFlowForecast = (_historicalData, options = _{}) => {
  const forecaster = new CashFlowForecaster(historicalData, options)
  const scenarios = ['base', 'optimistic', 'pessimistic']

  const forecasts = {}

  scenarios.forEach(scenario => {
    forecasts[scenario] = []
    for (let period = 0; period < (options.periods || 12); period++) {
      forecasts[scenario].push(forecaster.generateScenarioForecast(scenario, period))
    }
  })

  // Add Monte Carlo simulation for base case
  if (options.includeMonteCarlo) {
    forecasts.monteCarlo = forecaster.monteCarloForecast(options.iterations || 1000)
  }

  return forecasts
}

// Working Capital metrics forecasting
export const forecastWorkingCapitalMetrics = (historicalMetrics, options = _{}) => {
  const dsoForecaster = new TimeSeriesForecaster(
    historicalMetrics.map(m => ({ date: m.date, value: m.dso, period: m.period })),
    { smoothingFactor: 0.3 }
  )

  const dioForecaster = new TimeSeriesForecaster(
    historicalMetrics.map(m => ({ date: m.date, value: m.dio, period: m.period })),
    { smoothingFactor: 0.3 }
  )

  const dpoForecaster = new TimeSeriesForecaster(
    historicalMetrics.map(m => ({ date: m.date, value: m.dpo, period: m.period })),
    { smoothingFactor: 0.3 }
  )

  const forecastPeriods = options.periods || 6

  const dsoForecast = dsoForecaster.seasonalForecast(forecastPeriods)
  const dioForecast = dioForecaster.seasonalForecast(forecastPeriods)
  const dpoForecast = dpoForecaster.seasonalForecast(forecastPeriods)

  // Combine forecasts to calculate CCC
  const combinedForecast = []
  for (let i = 0; i < Math.max(dsoForecast.length, dioForecast.length, dpoForecast.length); i++) {
    const dso = dsoForecast[i]?.value || 0
    const dio = dioForecast[i]?.value || 0
    const dpo = dpoForecast[i]?.value || 0
    const ccc = dso + dio - dpo

    combinedForecast.push({
      period: i < historicalMetrics.length ? historicalMetrics[i].period : `Forecast ${i - historicalMetrics.length + 1}`,
      date: dsoForecast[i]?.date || dioForecast[i]?.date || dpoForecast[i]?.date,
      dso: Math.round(dso),
      dio: Math.round(dio),
      dpo: Math.round(dpo),
      ccc: Math.round(ccc),
      isForecast: i >= historicalMetrics.length,
      confidence: i >= historicalMetrics.length ? Math.max(0.5, 0.95 - ((i - historicalMetrics.length) * 0.1)) : 1.0
    })
  }

  return combinedForecast
}

// Generate optimization recommendations
export const generateOptimizationRecommendations = (_currentMetrics, industryBenchmarks = _{}) => {
  const optimizer = new WorkingCapitalOptimizer(currentMetrics, industryBenchmarks)
  const opportunities = optimizer.calculateOptimizationOpportunities()
  const impact = optimizer.calculateOptimizationImpact(opportunities)

  return {
    opportunities,
    impact,
    summary: {
      totalPotentialSavings: impact.totalCashRelease,
      currentCCC: impact.currentCCC,
      optimizedCCC: impact.optimizedCCC,
      improvement: impact.cccImprovement,
      estimatedROI: impact.roi
    }
  }
}

// Risk assessment utilities
export const assessCashFlowRisk = (forecastData, thresholds = _{}) => {
  const defaultThresholds = {
    criticalCash: 25000,
    lowCash: 75000,
    highVolatility: 0.3,
    negativeFlowPeriods: 3
  }

  const riskThresholds = { ...defaultThresholds, ...thresholds }
  const risks = []

  // Analyze cash position risks
  const lowCashPeriods = forecastData.filter(f =>
    f.cumulativeCash && f.cumulativeCash < riskThresholds.lowCash
  )

  const criticalCashPeriods = forecastData.filter(f =>
    f.cumulativeCash && f.cumulativeCash < riskThresholds.criticalCash
  )

  if (criticalCashPeriods.length > 0) {
    risks.push({
      type: 'Critical Cash Shortage',
      severity: 'critical',
      description: `Cash balance forecast to fall below $${riskThresholds.criticalCash.toLocaleString()} in ${criticalCashPeriods.length} period(s)`,
      impact: 'High',
      recommendations: [
        'Arrange immediate short-term financing',
        'Accelerate collection of receivables',
        'Delay non-critical payments'
      ]
    })
  }

  if (lowCashPeriods.length > 0 && criticalCashPeriods.length === 0) {
    risks.push({
      type: 'Low Cash Warning',
      severity: 'warning',
      description: `Cash balance forecast to fall below $${riskThresholds.lowCash.toLocaleString()} in ${lowCashPeriods.length} period(s)`,
      impact: 'Medium',
      recommendations: [
        'Monitor cash flow closely',
        'Review payment schedules',
        'Consider contingency financing arrangements'
      ]
    })
  }

  // Analyze volatility risks
  const cashFlows = forecastData
    .filter(f => f.netCashFlow !== undefined)
    .map(f => f.netCashFlow)

  if (cashFlows.length > 1) {
    const mean = cashFlows.reduce((a, _b) => a + b, 0) / cashFlows.length
    const variance = cashFlows.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / cashFlows.length
    const volatility = Math.sqrt(variance) / Math.abs(mean)

    if (volatility > riskThresholds.highVolatility) {
      risks.push({
        type: 'High Cash Flow Volatility',
        severity: 'info',
        description: `Cash flow volatility of ${(volatility * 100).toFixed(1)}% indicates unpredictable patterns`,
        impact: 'Medium',
        recommendations: [
          'Diversify customer base to reduce concentration risk',
          'Implement more frequent cash flow monitoring',
          'Consider seasonal financing arrangements'
        ]
      })
    }
  }

  // Analyze negative flow periods
  const negativeFlowPeriods = forecastData.filter(f =>
    f.netCashFlow && f.netCashFlow < 0
  )

  if (negativeFlowPeriods.length >= riskThresholds.negativeFlowPeriods) {
    risks.push({
      type: 'Persistent Negative Cash Flow',
      severity: 'warning',
      description: `${negativeFlowPeriods.length} periods forecast with negative cash flow`,
      impact: 'High',
      recommendations: [
        'Review business model and profitability',
        'Implement cost reduction measures',
        'Improve collection efficiency'
      ]
    })
  }

  return {
    risks,
    riskLevel: risks.some(r => r.severity === 'critical') ? 'critical' :
               risks.some(r => r.severity === 'warning') ? 'warning' : 'low',
    summary: {
      totalRisks: risks.length,
      criticalRisks: risks.filter(r => r.severity === 'critical').length,
      warningRisks: risks.filter(r => r.severity === 'warning').length,
      volatility: cashFlows.length > 1 ? Math.sqrt(
        cashFlows.reduce((sum, value) => sum + Math.pow(value - (cashFlows.reduce((a, _b) => a + b, 0) / cashFlows.length), 2), 0) / cashFlows.length
      ) / Math.abs(cashFlows.reduce((a, _b) => a + b, 0) / cashFlows.length) : 0
    }
  }
}

// Scenario modeling utilities
export const createScenarioModels = (baseData, scenarioDefinitions = _{}) => {
  const defaultScenarios = {
    optimistic: {
      name: 'Optimistic',
      description: 'Best case scenario with improved collections and favorable market conditions',
      adjustments: {
        dso: -0.15, // 15% improvement in DSO
        dio: -0.10, // 10% improvement in inventory turnover
        dpo: 0.20,  // 20% increase in payment terms
        salesGrowth: 0.15, // 15% sales growth
        marginImprovement: 0.05 // 5% margin improvement
      }
    },
    pessimistic: {
      name: 'Pessimistic',
      description: 'Conservative scenario with slower collections and market challenges',
      adjustments: {
        dso: 0.20,   // 20% deterioration in DSO
        dio: 0.15,   // 15% increase in inventory days
        dpo: -0.10,  // 10% decrease in payment terms
        salesGrowth: -0.10, // 10% sales decline
        marginImprovement: -0.03 // 3% margin pressure
      }
    },
    stressed: {
      name: 'Stress Test',
      description: 'Extreme scenario for stress testing with severe market disruption',
      adjustments: {
        dso: 0.40,   // 40% deterioration in DSO
        dio: 0.30,   // 30% increase in inventory days
        dpo: -0.20,  // 20% decrease in payment terms
        salesGrowth: -0.25, // 25% sales decline
        marginImprovement: -0.08 // 8% margin pressure
      }
    }
  }

  const scenarios = { ...defaultScenarios, ...scenarioDefinitions }
  const results = {}

  Object.entries(scenarios).forEach(_([key, scenario]) => {
    results[key] = applyScenarioAdjustments(baseData, scenario.adjustments)
    results[key].scenarioInfo = {
      name: scenario.name,
      description: scenario.description,
      adjustments: scenario.adjustments
    }
  })

  return results
}

const applyScenarioAdjustments = (baseData, adjustments) => {
  return baseData.map(dataPoint => {
    const adjusted = { ...dataPoint }

    // Apply DSO adjustments
    if (adjustments.dso && dataPoint.dso) {
      adjusted.dso = Math.max(1, dataPoint.dso * (1 + adjustments.dso))
    }

    // Apply DIO adjustments
    if (adjustments.dio && dataPoint.dio) {
      adjusted.dio = Math.max(1, dataPoint.dio * (1 + adjustments.dio))
    }

    // Apply DPO adjustments
    if (adjustments.dpo && dataPoint.dpo) {
      adjusted.dpo = Math.max(1, dataPoint.dpo * (1 + adjustments.dpo))
    }

    // Recalculate CCC if components are available
    if (adjusted.dso && adjusted.dio && adjusted.dpo) {
      adjusted.ccc = adjusted.dso + adjusted.dio - adjusted.dpo
    }

    // Apply cash flow adjustments
    if (adjustments.salesGrowth && dataPoint.cashInflow) {
      adjusted.cashInflow = dataPoint.cashInflow * (1 + adjustments.salesGrowth)
    }

    if (adjustments.marginImprovement && dataPoint.cashInflow && dataPoint.cashOutflow) {
      const margin = (dataPoint.cashInflow - dataPoint.cashOutflow) / dataPoint.cashInflow
      const newMargin = margin + adjustments.marginImprovement
      adjusted.cashOutflow = adjusted.cashInflow * (1 - newMargin)
      adjusted.netCashFlow = adjusted.cashInflow - adjusted.cashOutflow
    }

    adjusted.scenarioAdjusted = true

    return adjusted
  })
}

// Export utility functions for easy integration
export const forecastingUtils = {
  generateCashFlowForecast,
  forecastWorkingCapitalMetrics,
  generateOptimizationRecommendations,
  assessCashFlowRisk,
  createScenarioModels
}

export default forecastingUtils
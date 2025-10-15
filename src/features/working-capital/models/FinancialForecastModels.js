/**
 * Financial Forecasting Models for Working Capital Analysis
 * Provides comprehensive forecasting algorithms and scenario modeling
 */

// Time series forecasting using moving averages and exponential smoothing
export class TimeSeriesForecaster {
  constructor(data, options = {}) {
    this.data = data
    this.smoothingFactor = options.smoothingFactor || 0.3
    this.seasonalityPeriod = options.seasonalityPeriod || 12
    this.trendPeriods = options.trendPeriods || 6
  }

  // Simple Moving Average
  simpleMovingAverage(periods = 3) {
    if (this.data.length < periods) return this.data

    const forecast = []
    for (let i = 0; i < this.data.length; i++) {
      if (i < periods - 1) {
        forecast.push(this.data[i])
      } else {
        const sum = this.data.slice(i - periods + 1, i + 1).reduce((a, b) => a + b.value, 0)
        forecast.push({
          ...this.data[i],
          value: sum / periods,
          method: 'SMA'
        })
      }
    }
    return forecast
  }

  // Exponential Smoothing
  exponentialSmoothing() {
    if (this.data.length === 0) return []

    const forecast = [{ ...this.data[0], method: 'ES' }]

    for (let i = 1; i < this.data.length; i++) {
      const smoothed = (this.smoothingFactor * this.data[i].value) +
                      ((1 - this.smoothingFactor) * forecast[i - 1].value)

      forecast.push({
        ...this.data[i],
        value: smoothed,
        method: 'ES'
      })
    }
    return forecast
  }

  // Linear Trend Forecasting
  linearTrend(periodsToForecast = 6) {
    if (this.data.length < 2) return this.data

    // Calculate linear regression
    const n = this.data.length
    const sumX = n * (n - 1) / 2 // 0 + 1 + 2 + ... + (n-1)
    const sumY = this.data.reduce((sum, point) => sum + point.value, 0)
    const sumXY = this.data.reduce((sum, point, index) => sum + (index * point.value), 0)
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6 // 0² + 1² + 2² + ... + (n-1)²

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Generate forecast
    const forecast = [...this.data]
    const lastDate = new Date(this.data[this.data.length - 1].date)

    for (let i = 0; i < periodsToForecast; i++) {
      const futureIndex = n + i
      const forecastDate = new Date(lastDate)
      forecastDate.setMonth(forecastDate.getMonth() + i + 1)

      forecast.push({
        date: forecastDate.toISOString(),
        value: intercept + slope * futureIndex,
        period: `Forecast ${i + 1}`,
        isForecast: true,
        method: 'Linear Trend',
        confidence: Math.max(0.5, 0.9 - (i * 0.1)) // Decreasing confidence
      })
    }

    return forecast
  }

  // Seasonal decomposition and forecasting
  seasonalForecast(periodsToForecast = 6) {
    if (this.data.length < this.seasonalityPeriod * 2) {
      return this.linearTrend(periodsToForecast)
    }

    // Calculate seasonal indices
    const seasonalIndices = this.calculateSeasonalIndices()

    // Deseasonalize data and apply trend
    const deseasonalized = this.data.map((point, index) => ({
      ...point,
      value: point.value / seasonalIndices[index % this.seasonalityPeriod]
    }))

    // Apply linear trend to deseasonalized data
    const trendForecaster = new TimeSeriesForecaster(deseasonalized)
    const trendForecast = trendForecaster.linearTrend(periodsToForecast)

    // Reapply seasonality to forecast
    return trendForecast.map((point, index) => {
      const seasonalIndex = seasonalIndices[index % this.seasonalityPeriod]
      return {
        ...point,
        value: point.value * seasonalIndex,
        method: 'Seasonal'
      }
    })
  }

  calculateSeasonalIndices() {
    const seasonalSums = new Array(this.seasonalityPeriod).fill(0)
    const seasonalCounts = new Array(this.seasonalityPeriod).fill(0)

    // Calculate averages for each seasonal period
    this.data.forEach((point, index) => {
      const seasonIndex = index % this.seasonalityPeriod
      seasonalSums[seasonIndex] += point.value
      seasonalCounts[seasonIndex]++
    })

    const seasonalAverages = seasonalSums.map((sum, index) =>
      seasonalCounts[index] > 0 ? sum / seasonalCounts[index] : 1
    )

    // Calculate overall average
    const overallAverage = seasonalAverages.reduce((a, b) => a + b, 0) / this.seasonalityPeriod

    // Return seasonal indices (normalized)
    return seasonalAverages.map(avg => avg / overallAverage)
  }
}

// Cash Flow Forecasting Models
export class CashFlowForecaster {
  constructor(historicalData, options = {}) {
    this.historical = historicalData
    this.options = {
      forecastPeriods: options.forecastPeriods || 12,
      confidenceLevel: options.confidenceLevel || 0.95,
      scenarios: options.scenarios || ['base', 'optimistic', 'pessimistic']
    }
  }

  // Monte Carlo simulation for cash flow forecasting
  monteCarloForecast(iterations = 1000) {
    const results = {
      base: [],
      optimistic: [],
      pessimistic: [],
      statistics: {
        mean: [],
        median: [],
        confidence95: [],
        confidence75: []
      }
    }

    for (let period = 0; period < this.options.forecastPeriods; period++) {
      const simulations = []

      for (let i = 0; i < iterations; i++) {
        const simulation = this.generateScenarioForecast('monte_carlo', period)
        simulations.push(simulation.netCashFlow)
      }

      simulations.sort((a, b) => a - b)

      results.statistics.mean.push({
        period: period + 1,
        value: simulations.reduce((a, b) => a + b, 0) / iterations
      })

      results.statistics.median.push({
        period: period + 1,
        value: simulations[Math.floor(iterations / 2)]
      })

      results.statistics.confidence95.push({
        period: period + 1,
        lower: simulations[Math.floor(iterations * 0.025)],
        upper: simulations[Math.floor(iterations * 0.975)]
      })

      results.statistics.confidence75.push({
        period: period + 1,
        lower: simulations[Math.floor(iterations * 0.125)],
        upper: simulations[Math.floor(iterations * 0.875)]
      })
    }

    return results
  }

  // Generate scenario-based forecasts
  generateScenarioForecast(scenario, period) {
    const baseMetrics = this.calculateBaseMetrics()
    let multipliers = { inflow: 1, outflow: 1, volatility: 1 }

    switch (scenario) {
      case 'optimistic':
        multipliers = { inflow: 1.15, outflow: 0.9, volatility: 0.8 }
        break
      case 'pessimistic':
        multipliers = { inflow: 0.85, outflow: 1.1, volatility: 1.3 }
        break
      case 'stressed':
        multipliers = { inflow: 0.7, outflow: 1.25, volatility: 1.8 }
        break
      case 'monte_carlo':
        // Random multipliers for Monte Carlo
        multipliers = {
          inflow: 0.8 + (Math.random() * 0.4), // 0.8 to 1.2
          outflow: 0.9 + (Math.random() * 0.2), // 0.9 to 1.1
          volatility: 0.7 + (Math.random() * 0.6) // 0.7 to 1.3
        }
        break
    }

    // Apply seasonality if detected
    const seasonalFactor = this.getSeasonalFactor(period)

    // Calculate forecast values
    const baseInflow = baseMetrics.avgInflow * multipliers.inflow * seasonalFactor
    const baseOutflow = baseMetrics.avgOutflow * multipliers.outflow

    // Add volatility
    const inflowVariance = baseInflow * baseMetrics.inflowVolatility * multipliers.volatility * (Math.random() - 0.5)
    const outflowVariance = baseOutflow * baseMetrics.outflowVolatility * multipliers.volatility * (Math.random() - 0.5)

    const cashInflow = Math.max(0, baseInflow + inflowVariance)
    const cashOutflow = Math.max(0, baseOutflow + outflowVariance)

    return {
      period: period + 1,
      cashInflow: Math.round(cashInflow),
      cashOutflow: Math.round(cashOutflow),
      netCashFlow: Math.round(cashInflow - cashOutflow),
      scenario,
      confidence: Math.max(0.5, 0.95 - (period * 0.05))
    }
  }

  calculateBaseMetrics() {
    const inflows = this.historical.map(h => h.cashInflow || 0)
    const outflows = this.historical.map(h => h.cashOutflow || 0)

    return {
      avgInflow: inflows.reduce((a, b) => a + b, 0) / inflows.length,
      avgOutflow: outflows.reduce((a, b) => a + b, 0) / outflows.length,
      inflowVolatility: this.calculateVolatility(inflows),
      outflowVolatility: this.calculateVolatility(outflows)
    }
  }

  calculateVolatility(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length
    return Math.sqrt(variance) / mean // Coefficient of variation
  }

  getSeasonalFactor(period) {
    // Simple seasonal pattern - can be enhanced with actual seasonal analysis
    const seasonalPattern = [0.9, 0.85, 0.95, 1.0, 1.05, 1.1, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9]
    return seasonalPattern[period % 12]
  }
}

// Working Capital Optimization Models
export class WorkingCapitalOptimizer {
  constructor(currentMetrics, industryBenchmarks = {}) {
    this.current = currentMetrics
    this.benchmarks = {
      dso: industryBenchmarks.dso || 35,
      dio: industryBenchmarks.dio || 30,
      dpo: industryBenchmarks.dpo || 40,
      currentRatio: industryBenchmarks.currentRatio || 2.0,
      quickRatio: industryBenchmarks.quickRatio || 1.5,
      ...industryBenchmarks
    }
  }

  // Calculate optimization opportunities
  calculateOptimizationOpportunities() {
    const opportunities = []

    // DSO optimization
    if (this.current.dso > this.benchmarks.dso) {
      const dsoImprovement = this.current.dso - this.benchmarks.dso
      const potentialCashRelease = (dsoImprovement / 365) * (this.current.annualRevenue || 0)

      opportunities.push({
        metric: 'DSO',
        current: this.current.dso,
        target: this.benchmarks.dso,
        improvement: dsoImprovement,
        potentialImpact: potentialCashRelease,
        priority: potentialCashRelease > 100000 ? 'High' : 'Medium',
        recommendations: this.getDSORecommendations(dsoImprovement)
      })
    }

    // DIO optimization
    if (this.current.dio > this.benchmarks.dio) {
      const dioImprovement = this.current.dio - this.benchmarks.dio
      const potentialCashRelease = (dioImprovement / 365) * (this.current.cogs || 0)

      opportunities.push({
        metric: 'DIO',
        current: this.current.dio,
        target: this.benchmarks.dio,
        improvement: dioImprovement,
        potentialImpact: potentialCashRelease,
        priority: potentialCashRelease > 150000 ? 'High' : 'Medium',
        recommendations: this.getDIORecommendations(dioImprovement)
      })
    }

    // DPO optimization
    if (this.current.dpo < this.benchmarks.dpo) {
      const dpoImprovement = this.benchmarks.dpo - this.current.dpo
      const potentialCashRelease = (dpoImprovement / 365) * (this.current.cogs || 0)

      opportunities.push({
        metric: 'DPO',
        current: this.current.dpo,
        target: this.benchmarks.dpo,
        improvement: dpoImprovement,
        potentialImpact: potentialCashRelease,
        priority: potentialCashRelease > 100000 ? 'High' : 'Medium',
        recommendations: this.getDPORecommendations(dpoImprovement)
      })
    }

    return opportunities.sort((a, b) => b.potentialImpact - a.potentialImpact)
  }

  getDSORecommendations(improvement) {
    const recommendations = []

    if (improvement > 10) {
      recommendations.push('Implement automated payment reminders')
      recommendations.push('Offer early payment discounts (2/10 net 30)')
      recommendations.push('Review and tighten credit policies')
    }

    if (improvement > 15) {
      recommendations.push('Consider factoring for large receivables')
      recommendations.push('Implement credit insurance for high-risk customers')
    }

    return recommendations
  }

  getDIORecommendations(improvement) {
    const recommendations = []

    if (improvement > 15) {
      recommendations.push('Implement ABC analysis for inventory classification')
      recommendations.push('Negotiate consignment agreements with suppliers')
      recommendations.push('Improve demand forecasting accuracy')
    }

    if (improvement > 25) {
      recommendations.push('Consider just-in-time (JIT) inventory management')
      recommendations.push('Liquidate slow-moving inventory')
      recommendations.push('Implement vendor-managed inventory (VMI)')
    }

    return recommendations
  }

  getDPORecommendations(improvement) {
    const recommendations = []

    if (improvement > 5) {
      recommendations.push('Negotiate extended payment terms with key suppliers')
      recommendations.push('Optimize payment scheduling to maximize cash flow')
    }

    if (improvement > 10) {
      recommendations.push('Implement supply chain financing programs')
      recommendations.push('Consider early payment discounts vs. cash flow impact')
      recommendations.push('Consolidate suppliers for better negotiation power')
    }

    return recommendations
  }

  // Calculate the impact of implementing optimization opportunities
  calculateOptimizationImpact(opportunities) {
    let totalCashRelease = 0
    let newCCC = this.current.dso + this.current.dio - this.current.dpo

    opportunities.forEach(opp => {
      totalCashRelease += opp.potentialImpact

      switch (opp.metric) {
        case 'DSO':
          newCCC = newCCC - opp.improvement
          break
        case 'DIO':
          newCCC = newCCC - opp.improvement
          break
        case 'DPO':
          newCCC = newCCC - opp.improvement
          break
      }
    })

    return {
      totalCashRelease,
      currentCCC: this.current.dso + this.current.dio - this.current.dpo,
      optimizedCCC: newCCC,
      cccImprovement: (this.current.dso + this.current.dio - this.current.dpo) - newCCC,
      roi: totalCashRelease > 0 ? (totalCashRelease * 0.05) : 0 // Assuming 5% cost of capital
    }
  }
}
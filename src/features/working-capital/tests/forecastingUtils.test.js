import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  TimeSeriesForecaster,
  CashFlowForecaster,
  WorkingCapitalOptimizer
} from '../models/FinancialForecastModels.js'

import {
  generateCashFlowForecast,
  forecastWorkingCapitalMetrics,
  generateOptimizationRecommendations,
  assessCashFlowRisk,
  createScenarioModels
} from '../utils/forecastingUtils.js'

describe('Time Series _Forecaster', () => {
  let mockData
  let forecaster

  beforeEach(() => {
    mockData = [
      { date: '2024-01-01', value: 100, period: 'Jan' },
      { date: '2024-02-01', value: 110, period: 'Feb' },
      { date: '2024-03-01', value: 105, period: 'Mar' },
      { date: '2024-04-01', value: 120, period: 'Apr' },
      { date: '2024-05-01', value: 115, period: 'May' },
      { date: '2024-06-01', value: 125, period: 'Jun' }
    ]
    forecaster = new TimeSeriesForecaster(mockData)
  })

  describe('Simple Moving _Average', () => {
    it('calculates moving average _correctly', () => {
      const result = forecaster.simpleMovingAverage(3)

      expect(result).toHaveLength(mockData.length)
      expect(result[0].value).toBe(100) // First value unchanged
      expect(result[1].value).toBe(110) // Second value unchanged

      // Third value should be average of first three
      const expectedThird = (100 + 110 + 105) / 3
      expect(result[2].value).toBeCloseTo(expectedThird, 2)

      // Check method is marked
      expect(result[2].method).toBe('SMA')
    })

    it('handles insufficient data _gracefully', () => {
      const smallData = [{ value: 100 }, { value: 110 }]
      const smallForecaster = new TimeSeriesForecaster(smallData)

      const result = smallForecaster.simpleMovingAverage(5)
      expect(result).toEqual(smallData)
    })
  })

  describe('Exponential _Smoothing', () => {
    it('applies exponential smoothing _correctly', () => {
      const result = forecaster.exponentialSmoothing()

      expect(result).toHaveLength(mockData.length)
      expect(result[0].value).toBe(100) // First value unchanged
      expect(result[0].method).toBe('ES')

      // Second value should be smoothed
      const expectedSecond = (0.3 * 110) + (0.7 * 100)
      expect(result[1].value).toBeCloseTo(expectedSecond, 2)
      expect(result[1].method).toBe('ES')
    })

    it('handles empty _data', () => {
      const emptyForecaster = new TimeSeriesForecaster([])
      const result = emptyForecaster.exponentialSmoothing()
      expect(result).toEqual([])
    })
  })

  describe('Linear Trend _Forecasting', () => {
    it('generates linear trend _forecast', () => {
      const result = forecaster.linearTrend(3)

      expect(result.length).toBe(mockData.length + 3)

      // Check that forecast values are marked
      const forecastValues = result.filter(item => item.isForecast)
      expect(forecastValues).toHaveLength(3)

      // Check method is marked
      forecastValues.forEach(item => {
        expect(item.method).toBe('Linear Trend')
        expect(item.confidence).toBeLessThanOrEqual(1)
        expect(item.confidence).toBeGreaterThan(0)
      })
    })

    it('handles insufficient data for trend _analysis', () => {
      const singlePoint = [{ date: '2024-01-01', value: 100, period: 'Jan' }]
      const singleForecaster = new TimeSeriesForecaster(singlePoint)

      const result = singleForecaster.linearTrend(2)
      expect(result).toEqual(singlePoint)
    })

    it('calculates confidence levels _correctly', () => {
      const result = forecaster.linearTrend(5)
      const forecastValues = result.filter(item => item.isForecast)

      // Confidence should decrease over time
      for (let i = 1; i < forecastValues.length; i++) {
        expect(forecastValues[i].confidence).toBeLessThanOrEqual(forecastValues[i - 1].confidence)
      }
    })
  })

  describe('Seasonal _Forecasting', () => {
    it('applies seasonal forecasting when sufficient _data', () => {
      // Create data with 24 periods for seasonal analysis
      const seasonalData = Array.from({ length: 24 }, (_, i) => ({
        date: new Date(2024, i, 1).toISOString(),
        value: 100 + (i % 12) * 5 + Math.random() * 10,
        period: `Period ${i + 1}`
      }))

      const seasonalForecaster = new TimeSeriesForecaster(seasonalData, {
        seasonalityPeriod: 12
      })

      const result = seasonalForecaster.seasonalForecast(6)

      expect(result.length).toBeGreaterThan(seasonalData.length)

      const forecastValues = result.filter(item => item.isForecast)
      expect(forecastValues.length).toBe(6)

      forecastValues.forEach(item => {
        expect(item.method).toBe('Seasonal')
      })
    })

    it('falls back to linear trend with insufficient seasonal _data', () => {
      const result = forecaster.seasonalForecast(3)

      // Should fallback to linear trend
      const forecastValues = result.filter(item => item.isForecast)
      forecastValues.forEach(item => {
        expect(item.method).toBe('Linear Trend')
      })
    })

    it('calculates seasonal indices _correctly', () => {
      const seasonalData = Array.from({ length: 24 }, (_, i) => ({
        date: new Date(2024, i, 1).toISOString(),
        value: 100 + (i % 12) * 10, // Clear seasonal pattern
        period: `Period ${i + 1}`
      }))

      const seasonalForecaster = new TimeSeriesForecaster(seasonalData, {
        seasonalityPeriod: 12
      })

      const indices = seasonalForecaster.calculateSeasonalIndices()

      expect(indices).toHaveLength(12)
      indices.forEach(index => {
        expect(index).toBeGreaterThan(0)
      })

      // Indices should sum to approximately the number of periods
      const sum = indices.reduce((a, _b) => a + b, 0)
      expect(sum).toBeCloseTo(12, 1)
    })
  })
})

describe('Cash Flow _Forecaster', () => {
  let mockHistoricalData
  let forecaster

  beforeEach(() => {
    mockHistoricalData = [
      { cashInflow: 150000, cashOutflow: 120000, netCashFlow: 30000, date: '2024-01-01' },
      { cashInflow: 160000, cashOutflow: 125000, netCashFlow: 35000, date: '2024-02-01' },
      { cashInflow: 155000, cashOutflow: 130000, netCashFlow: 25000, date: '2024-03-01' },
      { cashInflow: 170000, cashOutflow: 135000, netCashFlow: 35000, date: '2024-04-01' }
    ]
    forecaster = new CashFlowForecaster(mockHistoricalData)
  })

  describe('Monte Carlo _Simulation', () => {
    it('generates monte carlo forecast with _statistics', () => {
      const result = forecaster.monteCarloForecast(100) // Reduced iterations for testing

      expect(result.statistics.mean).toBeDefined()
      expect(result.statistics.median).toBeDefined()
      expect(result.statistics.confidence95).toBeDefined()
      expect(result.statistics.confidence75).toBeDefined()

      expect(result.statistics.mean).toHaveLength(12) // Default forecast periods
      expect(result.statistics.median).toHaveLength(12)
      expect(result.statistics.confidence95).toHaveLength(12)
      expect(result.statistics.confidence75).toHaveLength(12)

      // Check confidence intervals
      result.statistics.confidence95.forEach(item => {
        expect(item.lower).toBeLessThanOrEqual(item.upper)
      })
    })

    it('handles custom iterations and periods', () => {
      const customForecaster = new CashFlowForecaster(mockHistoricalData, {
        forecastPeriods: 6
      })

      const result = customForecaster.monteCarloForecast(50)

      expect(result.statistics.mean).toHaveLength(6)
    })
  })

  describe('Scenario _Forecasting', () => {
    it('generates base scenario _forecast', () => {
      const result = forecaster.generateScenarioForecast('base', 0)

      expect(result.period).toBe(1)
      expect(result.scenario).toBe('base')
      expect(result.cashInflow).toBeGreaterThan(0)
      expect(result.cashOutflow).toBeGreaterThan(0)
      expect(result.netCashFlow).toBe(result.cashInflow - result.cashOutflow)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('applies optimistic scenario _adjustments', () => {
      const baseResult = forecaster.generateScenarioForecast('base', 0)
      const optimisticResult = forecaster.generateScenarioForecast('optimistic', 0)

      // Optimistic should have higher inflow and lower outflow
      expect(optimisticResult.cashInflow).toBeGreaterThan(baseResult.cashInflow)
      expect(optimisticResult.cashOutflow).toBeLessThan(baseResult.cashOutflow)
      expect(optimisticResult.scenario).toBe('optimistic')
    })

    it('applies pessimistic scenario _adjustments', () => {
      const baseResult = forecaster.generateScenarioForecast('base', 0)
      const pessimisticResult = forecaster.generateScenarioForecast('pessimistic', 0)

      // Pessimistic should have lower inflow and higher outflow
      expect(pessimisticResult.cashInflow).toBeLessThan(baseResult.cashInflow)
      expect(pessimisticResult.cashOutflow).toBeGreaterThan(baseResult.cashOutflow)
      expect(pessimisticResult.scenario).toBe('pessimistic')
    })

    it('applies stressed scenario _adjustments', () => {
      const baseResult = forecaster.generateScenarioForecast('base', 0)
      const stressedResult = forecaster.generateScenarioForecast('stressed', 0)

      // Stressed should have significantly lower inflow and higher outflow
      expect(stressedResult.cashInflow).toBeLessThan(baseResult.cashInflow * 0.8)
      expect(stressedResult.cashOutflow).toBeGreaterThan(baseResult.cashOutflow * 1.1)
      expect(stressedResult.scenario).toBe('stressed')
    })
  })

  describe('Base Metrics _Calculation', () => {
    it('calculates base metrics _correctly', () => {
      const metrics = forecaster.calculateBaseMetrics()

      expect(metrics.avgInflow).toBeCloseTo(158750, 0) // Average of mock data
      expect(metrics.avgOutflow).toBeCloseTo(127500, 0) // Average of mock data
      expect(metrics.inflowVolatility).toBeGreaterThan(0)
      expect(metrics.outflowVolatility).toBeGreaterThan(0)
    })

    it('calculates volatility _correctly', () => {
      const values = [100, 110, 90, 120, 80]
      const volatility = forecaster.calculateVolatility(values)

      expect(volatility).toBeGreaterThan(0)
      expect(volatility).toBeLessThan(1) // Coefficient of variation should be reasonable
    })
  })

  describe('Seasonal _Factors', () => {
    it('applies seasonal patterns _correctly', () => {
      const januaryFactor = forecaster.getSeasonalFactor(0)
      const julyFactor = forecaster.getSeasonalFactor(6)

      expect(januaryFactor).toBeCloseTo(0.9, 1)
      expect(julyFactor).toBeCloseTo(1.15, 1)

      // All factors should be positive
      for (let i = 0; i < 12; i++) {
        expect(forecaster.getSeasonalFactor(i)).toBeGreaterThan(0)
      }
    })
  })
})

describe('Working Capital _Optimizer', () => {
  let optimizer
  let currentMetrics
  let industryBenchmarks

  beforeEach(() => {
    currentMetrics = {
      dso: 45,
      dio: 35,
      dpo: 25,
      currentRatio: 1.8,
      quickRatio: 1.2,
      annualRevenue: 10000000,
      cogs: 6000000
    }

    industryBenchmarks = {
      dso: 35,
      dio: 30,
      dpo: 40,
      currentRatio: 2.0,
      quickRatio: 1.5
    }

    optimizer = new WorkingCapitalOptimizer(currentMetrics, industryBenchmarks)
  })

  describe('Optimization Opportunities _Calculation', () => {
    it('identifies DSO optimization _opportunities', () => {
      const opportunities = optimizer.calculateOptimizationOpportunities()

      const dsoOpportunity = opportunities.find(opp => opp.metric === 'DSO')
      expect(dsoOpportunity).toBeDefined()
      expect(dsoOpportunity.current).toBe(45)
      expect(dsoOpportunity.target).toBe(35)
      expect(dsoOpportunity.improvement).toBe(10)
      expect(dsoOpportunity.potentialImpact).toBeGreaterThan(0)
      expect(dsoOpportunity.priority).toBeDefined()
    })

    it('identifies DIO optimization _opportunities', () => {
      const opportunities = optimizer.calculateOptimizationOpportunities()

      const dioOpportunity = opportunities.find(opp => opp.metric === 'DIO')
      expect(dioOpportunity).toBeDefined()
      expect(dioOpportunity.current).toBe(35)
      expect(dioOpportunity.target).toBe(30)
      expect(dioOpportunity.improvement).toBe(5)
    })

    it('identifies DPO optimization _opportunities', () => {
      const opportunities = optimizer.calculateOptimizationOpportunities()

      const dpoOpportunity = opportunities.find(opp => opp.metric === 'DPO')
      expect(dpoOpportunity).toBeDefined()
      expect(dpoOpportunity.current).toBe(25)
      expect(dpoOpportunity.target).toBe(40)
      expect(dpoOpportunity.improvement).toBe(15)
    })

    it('sorts opportunities by potential impact', () => {
      const opportunities = optimizer.calculateOptimizationOpportunities()

      for (let i = 1; i < opportunities.length; i++) {
        expect(opportunities[i].potentialImpact).toBeLessThanOrEqual(opportunities[i - 1].potentialImpact)
      }
    })

    it('assigns correct priorities based on impact', () => {
      const opportunities = optimizer.calculateOptimizationOpportunities()

      opportunities.forEach(opp => {
        if (opp.potentialImpact > 100000) {
          expect(opp.priority).toBe('High')
        } else {
          expect(['High', 'Medium']).toContain(opp.priority)
        }
      })
    })
  })

  describe('Recommendation _Generation', () => {
    it('generates DSO recommendations based on improvement _needed', () => {
      const recommendations = optimizer.getDSORecommendations(15)

      expect(recommendations).toContain('Implement automated payment reminders')
      expect(recommendations).toContain('Consider factoring for large receivables')
      expect(recommendations.length).toBeGreaterThan(1)
    })

    it('generates appropriate DIO _recommendations', () => {
      const recommendations = optimizer.getDIORecommendations(20)

      expect(recommendations).toContain('Implement ABC analysis for inventory classification')
      expect(recommendations.length).toBeGreaterThan(0)
    })

    it('generates appropriate DPO _recommendations', () => {
      const recommendations = optimizer.getDPORecommendations(12)

      expect(recommendations).toContain('Negotiate extended payment terms with key suppliers')
      expect(recommendations).toContain('Implement supply chain financing programs')
      expect(recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Impact _Calculation', () => {
    it('calculates total optimization impact _correctly', () => {
      const opportunities = optimizer.calculateOptimizationOpportunities()
      const impact = optimizer.calculateOptimizationImpact(opportunities)

      expect(impact.totalCashRelease).toBeGreaterThan(0)
      expect(impact.currentCCC).toBe(55) // 45 + 35 - 25
      expect(impact.optimizedCCC).toBeLessThan(impact.currentCCC)
      expect(impact.cccImprovement).toBeGreaterThan(0)
      expect(impact.roi).toBeGreaterThan(0)
    })

    it('calculates CCC improvements _correctly', () => {
      const opportunities = [
        { metric: 'DSO', improvement: 10 },
        { metric: 'DIO', improvement: 5 },
        { metric: 'DPO', improvement: 15 }
      ]

      const impact = optimizer.calculateOptimizationImpact(opportunities)

      // CCC improvement should be DSO improvement + DIO improvement + DPO improvement
      expect(impact.cccImprovement).toBe(30) // 10 + 5 + 15
    })
  })
})

describe('Forecasting _Utilities', () => {
  describe('generateCashFlowForecast', () => {
    it('generates comprehensive cash flow _forecast', () => {
      const historicalData = [
        { cashInflow: 150000, cashOutflow: 120000, netCashFlow: 30000 },
        { cashInflow: 160000, cashOutflow: 125000, netCashFlow: 35000 }
      ]

      const result = generateCashFlowForecast(historicalData, { periods: 6 })

      expect(result.base).toBeDefined()
      expect(result.optimistic).toBeDefined()
      expect(result.pessimistic).toBeDefined()
      expect(Array.isArray(result.base)).toBe(true)
      expect(result.base).toHaveLength(6)
    })

    it('includes Monte Carlo simulation when _requested', () => {
      const result = generateCashFlowForecast([], {
        includeMonteCarlo: true,
        iterations: 100
      })

      expect(result.monteCarlo).toBeDefined()
      expect(result.monteCarlo.statistics).toBeDefined()
    })
  })

  describe('assessCashFlowRisk', () => {
    it('identifies cash shortage _risks', () => {
      const forecastData = [
        { cumulativeCash: 20000, netCashFlow: -10000 },
        { cumulativeCash: 10000, netCashFlow: -5000 },
        { cumulativeCash: 5000, netCashFlow: 15000 }
      ]

      const result = assessCashFlowRisk(forecastData)

      expect(result.risks.length).toBeGreaterThan(0)
      expect(result.riskLevel).toBeDefined()
      expect(['critical', 'warning', 'low']).toContain(result.riskLevel)
      expect(result.summary.totalRisks).toBe(result.risks.length)
    })

    it('calculates volatility _correctly', () => {
      const forecastData = [
        { netCashFlow: 30000 },
        { netCashFlow: -20000 },
        { netCashFlow: 40000 },
        { netCashFlow: -10000 }
      ]

      const result = assessCashFlowRisk(forecastData)

      expect(result.summary.volatility).toBeGreaterThan(0)
    })

    it('uses custom thresholds', () => {
      const forecastData = [{ cumulativeCash: 30000 }]
      const customThresholds = { criticalCash: 50000 }

      const result = assessCashFlowRisk(forecastData, customThresholds)

      const criticalRisk = result.risks.find(risk => risk.severity === 'critical')
      expect(criticalRisk).toBeDefined()
    })
  })

  describe('createScenarioModels', () => {
    it('creates multiple scenario _models', () => {
      const baseData = [
        { dso: 35, dio: 30, dpo: 35, ccc: 30 }
      ]

      const result = createScenarioModels(baseData)

      expect(result.optimistic).toBeDefined()
      expect(result.pessimistic).toBeDefined()
      expect(result.stressed).toBeDefined()

      expect(result.optimistic[0].scenarioAdjusted).toBe(true)
      expect(result.pessimistic[0].scenarioAdjusted).toBe(true)
      expect(result.stressed[0].scenarioAdjusted).toBe(true)
    })

    it('applies scenario adjustments _correctly', () => {
      const baseData = [{ dso: 40, dio: 30, dpo: 35, ccc: 35 }]

      const result = createScenarioModels(baseData)

      // Optimistic scenario should improve DSO and DIO, extend DPO
      expect(result.optimistic[0].dso).toBeLessThan(baseData[0].dso)
      expect(result.optimistic[0].dio).toBeLessThan(baseData[0].dio)
      expect(result.optimistic[0].dpo).toBeGreaterThan(baseData[0].dpo)

      // Pessimistic scenario should worsen DSO and DIO, reduce DPO
      expect(result.pessimistic[0].dso).toBeGreaterThan(baseData[0].dso)
      expect(result.pessimistic[0].dio).toBeGreaterThan(baseData[0].dio)
      expect(result.pessimistic[0].dpo).toBeLessThan(baseData[0].dpo)
    })

    it('recalculates CCC after _adjustments', () => {
      const baseData = [{ dso: 40, dio: 30, dpo: 35, ccc: 35 }]

      const result = createScenarioModels(baseData)

      Object.values(result).forEach(scenario => {
        const item = scenario[0]
        const calculatedCCC = item.dso + item.dio - item.dpo
        expect(item.ccc).toBeCloseTo(calculatedCCC, 1)
      })
    })

    it('includes scenario metadata', () => {
      const baseData = [{ dso: 40 }]

      const result = createScenarioModels(baseData)

      Object.values(result).forEach(scenario => {
        expect(scenario.scenarioInfo).toBeDefined()
        expect(scenario.scenarioInfo.name).toBeDefined()
        expect(scenario.scenarioInfo.description).toBeDefined()
        expect(scenario.scenarioInfo.adjustments).toBeDefined()
      })
    })
  })
})
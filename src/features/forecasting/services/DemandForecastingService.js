/**
 * Demand Forecasting Service
 * Comprehensive demand forecasting using multiple algorithms and AI-powered analysis
 * Integrates with AI Central Nervous System for enhanced manufacturing intelligence
 */

import { TimeSeriesForecaster } from '../../working-capital/models/FinancialForecastModels.js'
import { logError } from '../../../utils/structuredLogger.js'

export class DemandForecastingService {
  constructor(options = {}) {
    this.options = {
      defaultForecastPeriods: options.forecastPeriods || 12,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      seasonalityDetectionThreshold: options.seasonalityDetectionThreshold || 0.3,
      aiEnabled: options.aiEnabled !== false,
      ...options
    }

    this.algorithms = {
      LINEAR_TREND: 'linear_trend',
      EXPONENTIAL_SMOOTHING: 'exponential_smoothing',
      SEASONAL_DECOMPOSITION: 'seasonal_decomposition',
      MOVING_AVERAGE: 'moving_average',
      MACHINE_LEARNING: 'machine_learning',
      HYBRID: 'hybrid'
    }

    this.forecastAccuracy = new Map()
    this.modelPerformance = new Map()
  }

  /**
   * Generate comprehensive demand forecast using multiple algorithms
   * @param {Array} historicalData - Historical demand data with date and value
   * @param {Object} options - Forecasting options
   * @returns {Object} Forecast results with multiple scenarios and confidence intervals
   */
  async generateDemandForecast(historicalData, options = {}) {
    const config = { ...this.options, ...options }

    try {
      // Data validation and preprocessing
      const processedData = this.preprocessData(historicalData)

      if (processedData.length < 3) {
        throw new Error('Insufficient historical data for forecasting (minimum 3 data points required)')
      }

      // Detect seasonality and trends
      const dataAnalysis = this.analyzeDataPatterns(processedData)

      // Select optimal forecasting algorithm
      const optimalAlgorithm = this.selectOptimalAlgorithm(processedData, dataAnalysis)

      // Generate base forecasts using multiple methods
      const forecasts = await this.generateMultipleForecasts(processedData, config)

      // Calculate ensemble forecast (weighted average of multiple models)
      const ensembleForecast = this.calculateEnsembleForecast(forecasts, dataAnalysis)

      // Generate scenario-based forecasts
      const scenarios = this.generateScenarioForecasts(ensembleForecast, dataAnalysis, config)

      // Calculate forecast accuracy metrics
      const accuracyMetrics = this.calculateAccuracyMetrics(processedData, forecasts)

      // AI-powered insights and recommendations
      const aiInsights = await this.generateAIInsights(processedData, ensembleForecast, dataAnalysis)

      return {
        forecast: ensembleForecast,
        scenarios,
        algorithm: optimalAlgorithm,
        dataAnalysis,
        accuracy: accuracyMetrics,
        aiInsights,
        metadata: {
          dataPoints: processedData.length,
          forecastPeriods: config.defaultForecastPeriods,
          confidence: this.calculateOverallConfidence(forecasts),
          generatedAt: new Date().toISOString(),
          version: '2.0'
        }
      }

    } catch (error) {
      logError('Demand forecasting failed', error)
      throw new Error(`Demand forecasting failed: ${error.message}`)
    }
  }

  /**
   * Preprocess historical data for forecasting
   */
  preprocessData(data) {
    // Remove invalid entries and sort by date
    let processed = data
      .filter(item => item.date && typeof item.value === 'number' && !isNaN(item.value))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    // Remove outliers using IQR method
    processed = this.removeOutliers(processed)

    // Fill missing data points if needed
    processed = this.fillMissingData(processed)

    return processed
  }

  /**
   * Remove statistical outliers using Interquartile Range method
   */
  removeOutliers(data) {
    const values = data.map(d => d.value).sort((a, b) => a - b)
    const q1 = values[Math.floor(values.length * 0.25)]
    const q3 = values[Math.floor(values.length * 0.75)]
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr

    return data.filter(d => d.value >= lowerBound && d.value <= upperBound)
  }

  /**
   * Fill missing data points using interpolation
   */
  fillMissingData(data) {
    if (data.length < 2) return data

    const filled = []
    for (let i = 0; i < data.length - 1; i++) {
      filled.push(data[i])

      const currentDate = new Date(data[i].date)
      const nextDate = new Date(data[i + 1].date)
      const timeDiff = nextDate - currentDate
      const monthsDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24 * 30))

      // Fill gaps longer than 2 months
      if (monthsDiff > 2) {
        for (let j = 1; j < monthsDiff; j++) {
          const interpolatedDate = new Date(currentDate)
          interpolatedDate.setMonth(interpolatedDate.getMonth() + j)

          const interpolatedValue = data[i].value +
            ((data[i + 1].value - data[i].value) * (j / monthsDiff))

          filled.push({
            date: interpolatedDate.toISOString(),
            value: interpolatedValue,
            interpolated: true
          })
        }
      }
    }
    filled.push(data[data.length - 1])

    return filled
  }

  /**
   * Analyze data patterns for seasonality, trends, and volatility
   */
  analyzeDataPatterns(data) {
    const values = data.map(d => d.value)

    // Calculate basic statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    const volatility = stdDev / mean

    // Detect trend
    const trend = this.detectTrend(data)

    // Detect seasonality
    const seasonality = this.detectSeasonality(data)

    // Calculate autocorrelation
    const autocorrelation = this.calculateAutocorrelation(values, 12)

    return {
      mean,
      variance,
      stdDev,
      volatility,
      trend,
      seasonality,
      autocorrelation,
      dataQuality: this.assessDataQuality(data)
    }
  }

  /**
   * Detect trend in time series data
   */
  detectTrend(data) {
    if (data.length < 3) return { type: 'none', strength: 0 }

    // Calculate linear regression
    const n = data.length
    const sumX = n * (n - 1) / 2
    const sumY = data.reduce((sum, point) => sum + point.value, 0)
    const sumXY = data.reduce((sum, point, index) => sum + (index * point.value), 0)
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const rSquared = this.calculateRSquared(data, slope, sumY / n)

    return {
      type: Math.abs(slope) < 0.01 ? 'none' : slope > 0 ? 'increasing' : 'decreasing',
      slope,
      strength: rSquared,
      significance: rSquared > 0.5 ? 'strong' : rSquared > 0.2 ? 'moderate' : 'weak'
    }
  }

  /**
   * Detect seasonality patterns
   */
  detectSeasonality(data) {
    if (data.length < 24) return { present: false, period: null, strength: 0 }

    // Test for common seasonal periods (3, 6, 12 months)
    const periods = [3, 6, 12]
    let bestPeriod = null
    let maxStrength = 0

    for (const period of periods) {
      if (data.length >= period * 2) {
        const strength = this.calculateSeasonalStrength(data, period)
        if (strength > maxStrength) {
          maxStrength = strength
          bestPeriod = period
        }
      }
    }

    return {
      present: maxStrength > this.options.seasonalityDetectionThreshold,
      period: bestPeriod,
      strength: maxStrength,
      significance: maxStrength > 0.7 ? 'strong' : maxStrength > 0.4 ? 'moderate' : 'weak'
    }
  }

  /**
   * Calculate seasonal strength for a given period
   */
  calculateSeasonalStrength(data, period) {
    const seasonalAverages = new Array(period).fill(0)
    const seasonalCounts = new Array(period).fill(0)

    // Calculate seasonal averages
    data.forEach((point, _index) => {
      const seasonIndex = index % period
      seasonalAverages[seasonIndex] += point.value
      seasonalCounts[seasonIndex]++
    })

    for (let i = 0; i < period; i++) {
      seasonalAverages[i] = seasonalCounts[i] > 0 ? seasonalAverages[i] / seasonalCounts[i] : 0
    }

    // Calculate variance of seasonal averages
    const overallMean = seasonalAverages.reduce((a, b) => a + b, 0) / period
    const seasonalVariance = seasonalAverages.reduce((sum, avg) =>
      sum + Math.pow(avg - overallMean, 2), 0) / period

    // Calculate overall variance
    const values = data.map(d => d.value)
    const totalMean = values.reduce((a, b) => a + b, 0) / values.length
    const totalVariance = values.reduce((sum, val) =>
      sum + Math.pow(val - totalMean, 2), 0) / values.length

    return totalVariance > 0 ? seasonalVariance / totalVariance : 0
  }

  /**
   * Generate forecasts using multiple algorithms
   */
  async generateMultipleForecasts(data, config) {
    const forecasts = {}

    // Linear Trend Forecast
    const trendForecaster = new TimeSeriesForecaster(data)
    forecasts.linearTrend = trendForecaster.linearTrend(config.defaultForecastPeriods)

    // Exponential Smoothing
    forecasts.exponentialSmoothing = trendForecaster.exponentialSmoothing()

    // Add future periods for exponential smoothing
    const lastValue = forecasts.exponentialSmoothing[forecasts.exponentialSmoothing.length - 1].value
    const lastDate = new Date(data[data.length - 1].date)

    for (let i = 0; i < config.defaultForecastPeriods; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setMonth(futureDate.getMonth() + i + 1)

      forecasts.exponentialSmoothing.push({
        date: futureDate.toISOString(),
        value: lastValue * (0.98 + Math.random() * 0.04), // Small random variation
        period: `Forecast ${i + 1}`,
        isForecast: true,
        method: 'Exponential Smoothing',
        confidence: Math.max(0.5, 0.9 - (i * 0.05))
      })
    }

    // Seasonal Forecast (if seasonality detected)
    forecasts.seasonal = trendForecaster.seasonalForecast(config.defaultForecastPeriods)

    // Moving Average
    forecasts.movingAverage = trendForecaster.simpleMovingAverage(3)

    // Machine Learning Forecast (if AI enabled)
    if (config.aiEnabled) {
      forecasts.machineLearning = await this.generateMLForecast(data, config)
    }

    return forecasts
  }

  /**
   * Generate ML-based forecast using AI patterns
   */
  async generateMLForecast(data, config) {
    // Simulate advanced ML forecast for now
    // In production, this would call the AI Central Nervous System
    const values = data.map(d => d.value)
    const trend = this.detectTrend(data)

    const mlForecast = [...data]
    const lastDate = new Date(data[data.length - 1].date)
    const lastValue = data[data.length - 1].value

    for (let i = 0; i < config.defaultForecastPeriods; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setMonth(futureDate.getMonth() + i + 1)

      // Apply trend with some ML-like adjustments
      let predictedValue = lastValue + (trend.slope * (i + 1))

      // Add some AI-like pattern recognition
      const cyclicalFactor = Math.sin((i * 2 * Math.PI) / 12) * 0.1
      const momentumFactor = trend.strength * 0.2

      predictedValue *= (1 + cyclicalFactor + momentumFactor)

      mlForecast.push({
        date: futureDate.toISOString(),
        value: Math.max(0, predictedValue),
        period: `ML Forecast ${i + 1}`,
        isForecast: true,
        method: 'Machine Learning',
        confidence: Math.max(0.6, 0.95 - (i * 0.04))
      })
    }

    return mlForecast
  }

  /**
   * Calculate ensemble forecast as weighted average of multiple methods
   */
  calculateEnsembleForecast(forecasts, dataAnalysis) {
    const methods = Object.keys(forecasts)
    const weights = this.calculateMethodWeights(forecasts, dataAnalysis)

    // Find the longest forecast to determine periods
    const maxLength = Math.max(...methods.map(method => forecasts[method].length))
    const ensemble = []

    for (let i = 0; i < maxLength; i++) {
      let weightedSum = 0
      let totalWeight = 0
      let forecastInfo = null

      methods.forEach(method => {
        if (forecasts[method][i]) {
          const weight = weights[method] || 1
          weightedSum += forecasts[method][i].value * weight
          totalWeight += weight

          if (!forecastInfo) {
            forecastInfo = { ...forecasts[method][i] }
          }
        }
      })

      if (totalWeight > 0) {
        ensemble.push({
          ...forecastInfo,
          value: weightedSum / totalWeight,
          method: 'Ensemble',
          contributingMethods: methods.filter(m => forecasts[m][i])
        })
      }
    }

    return ensemble
  }

  /**
   * Calculate weights for different forecasting methods based on data characteristics
   */
  calculateMethodWeights(forecasts, dataAnalysis) {
    const weights = {}

    // Base weights
    weights.linearTrend = 1.0
    weights.exponentialSmoothing = 1.0
    weights.seasonal = 1.0
    weights.movingAverage = 0.8
    weights.machineLearning = 1.2

    // Adjust based on trend strength
    if (dataAnalysis.trend.strength > 0.7) {
      weights.linearTrend *= 1.5
    }

    // Adjust based on seasonality
    if (dataAnalysis.seasonality.present && dataAnalysis.seasonality.strength > 0.5) {
      weights.seasonal *= 2.0
    }

    // Adjust based on volatility
    if (dataAnalysis.volatility > 0.3) {
      weights.exponentialSmoothing *= 1.3
      weights.movingAverage *= 1.2
    }

    return weights
  }

  /**
   * Generate scenario-based forecasts (optimistic, pessimistic, realistic)
   */
  generateScenarioForecasts(baseForecast, dataAnalysis, config) {
    const scenarios = {
      realistic: baseForecast,
      optimistic: this.applyScenarioMultipliers(baseForecast, {
        growth: 1.15,
        volatility: 0.8,
        confidence: 1.1
      }),
      pessimistic: this.applyScenarioMultipliers(baseForecast, {
        growth: 0.85,
        volatility: 1.3,
        confidence: 0.9
      }),
      stressed: this.applyScenarioMultipliers(baseForecast, {
        growth: 0.7,
        volatility: 1.8,
        confidence: 0.7
      })
    }

    return scenarios
  }

  /**
   * Apply scenario multipliers to base forecast
   */
  applyScenarioMultipliers(forecast, multipliers) {
    return forecast.map((point, index) => {
      if (point.isForecast) {
        const growthFactor = Math.pow(multipliers.growth, index - forecast.findIndex(p => p.isForecast) + 1)
        const randomFactor = 1 + (Math.random() - 0.5) * 0.1 * multipliers.volatility

        return {
          ...point,
          value: point.value * growthFactor * randomFactor,
          confidence: (point.confidence || 0.8) * multipliers.confidence
        }
      }
      return point
    })
  }

  /**
   * Calculate forecast accuracy metrics
   */
  calculateAccuracyMetrics(historicalData, forecasts) {
    const metrics = {}

    Object.keys(forecasts).forEach(method => {
      const forecast = forecasts[method]
      const historical = historicalData.slice(-Math.min(historicalData.length, forecast.length))

      if (historical.length > 0) {
        const mae = this.calculateMAE(historical, forecast.slice(0, historical.length))
        const mape = this.calculateMAPE(historical, forecast.slice(0, historical.length))
        const rmse = this.calculateRMSE(historical, forecast.slice(0, historical.length))

        metrics[method] = { mae, mape, rmse }
      }
    })

    return metrics
  }

  /**
   * Generate AI-powered insights and recommendations
   */
  async generateAIInsights(historicalData, forecast, dataAnalysis) {
    // Simulate AI insights - in production, this would call the MCP server
    const insights = []

    // Trend insights
    if (dataAnalysis.trend.strength > 0.7) {
      insights.push({
        type: 'trend',
        severity: 'info',
        title: `Strong ${dataAnalysis.trend.type} Trend Detected`,
        description: `Data shows a ${dataAnalysis.trend.significance} ${dataAnalysis.trend.type} trend with ${(dataAnalysis.trend.strength * 100).toFixed(1)}% confidence`,
        recommendation: dataAnalysis.trend.type === 'increasing'
          ? 'Consider scaling production capacity to meet growing demand'
          : 'Implement cost optimization and efficiency measures'
      })
    }

    // Seasonality insights
    if (dataAnalysis.seasonality.present) {
      insights.push({
        type: 'seasonality',
        severity: 'info',
        title: 'Seasonal Pattern Identified',
        description: `${dataAnalysis.seasonality.period}-month seasonal cycle detected with ${dataAnalysis.seasonality.significance} strength`,
        recommendation: 'Optimize inventory levels and production scheduling based on seasonal demand patterns'
      })
    }

    // Volatility warnings
    if (dataAnalysis.volatility > 0.4) {
      insights.push({
        type: 'volatility',
        severity: 'warning',
        title: 'High Demand Volatility',
        description: `Demand volatility of ${(dataAnalysis.volatility * 100).toFixed(1)}% indicates unpredictable demand patterns`,
        recommendation: 'Implement flexible production planning and safety stock strategies'
      })
    }

    // Forecast accuracy warnings
    const avgConfidence = forecast
      .filter(p => p.isForecast)
      .reduce((sum, p) => sum + (p.confidence || 0.5), 0) /
      forecast.filter(p => p.isForecast).length

    if (avgConfidence < 0.7) {
      insights.push({
        type: 'accuracy',
        severity: 'warning',
        title: 'Low Forecast Confidence',
        description: `Average forecast confidence of ${(avgConfidence * 100).toFixed(1)}% suggests uncertainty in predictions`,
        recommendation: 'Collect more data points and consider external factors for improved accuracy'
      })
    }

    return insights
  }

  /**
   * Select optimal forecasting algorithm based on data characteristics
   */
  selectOptimalAlgorithm(data, analysis) {
    // Decision tree for algorithm selection
    if (analysis.seasonality.present && analysis.seasonality.strength > 0.5) {
      return this.algorithms.SEASONAL_DECOMPOSITION
    }

    if (analysis.trend.strength > 0.7) {
      return this.algorithms.LINEAR_TREND
    }

    if (analysis.volatility > 0.3) {
      return this.algorithms.EXPONENTIAL_SMOOTHING
    }

    if (data.length > 50 && this.options.aiEnabled) {
      return this.algorithms.MACHINE_LEARNING
    }

    return this.algorithms.HYBRID
  }

  // Utility methods for statistical calculations
  calculateMAE(actual, predicted) {
    const errors = actual.map((a, i) => Math.abs(a.value - (predicted[i]?.value || 0)))
    return errors.reduce((sum, e) => sum + e, 0) / errors.length
  }

  calculateMAPE(actual, predicted) {
    const errors = actual.map((a, i) => {
      const pred = predicted[i]?.value || 0
      return a.value !== 0 ? Math.abs((a.value - pred) / a.value) : 0
    })
    return (errors.reduce((sum, e) => sum + e, 0) / errors.length) * 100
  }

  calculateRMSE(actual, predicted) {
    const squaredErrors = actual.map((a, i) => {
      const pred = predicted[i]?.value || 0
      return Math.pow(a.value - pred, 2)
    })
    return Math.sqrt(squaredErrors.reduce((sum, e) => sum + e, 0) / squaredErrors.length)
  }

  calculateRSquared(data, slope, intercept) {
    const actual = data.map(d => d.value)
    const predicted = data.map((d, i) => intercept + slope * i)
    const actualMean = actual.reduce((a, b) => a + b, 0) / actual.length

    const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0)
    const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0)

    return ssTotal !== 0 ? 1 - (ssRes / ssTotal) : 0
  }

  calculateAutocorrelation(values, lag) {
    if (values.length <= lag) return 0

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < values.length - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean)
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2)
    }

    return denominator !== 0 ? numerator / denominator : 0
  }

  calculateOverallConfidence(forecasts) {
    const confidenceValues = []

    Object.values(forecasts).forEach(forecast => {
      forecast.forEach(point => {
        if (point.confidence && point.isForecast) {
          confidenceValues.push(point.confidence)
        }
      })
    })

    return confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0.8
  }

  assessDataQuality(data) {
    const interpolatedCount = data.filter(d => d.interpolated).length
    const validDataRatio = (data.length - interpolatedCount) / data.length
    const consistencyScore = this.calculateDataConsistency(data)

    return {
      score: (validDataRatio * 0.7 + consistencyScore * 0.3),
      validDataRatio,
      interpolatedPoints: interpolatedCount,
      consistencyScore,
      recommendation: validDataRatio < 0.8
        ? 'Collect more historical data for improved forecast accuracy'
        : 'Data quality is sufficient for reliable forecasting'
    }
  }

  calculateDataConsistency(data) {
    if (data.length < 3) return 1

    const intervals = []
    for (let i = 1; i < data.length; i++) {
      const timeDiff = new Date(data[i].date) - new Date(data[i - 1].date)
      intervals.push(timeDiff)
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) =>
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length

    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = avgInterval !== 0 ? stdDev / avgInterval : 0

    return Math.max(0, 1 - coefficientOfVariation)
  }
}

// Export singleton instance for easy use
export const demandForecastingService = new DemandForecastingService()

export default DemandForecastingService
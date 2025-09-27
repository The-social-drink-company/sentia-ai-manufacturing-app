import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui'
import { logError } from '../../../utils/structuredLogger.js'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CogIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/solid'
import { demandForecastingService } from '../services/DemandForecastingService'

const TimeSeriesAnalysis = ({
  data = [],
  title = "Time Series Analysis",
  onForecastUpdate,
  className = "",
  autoRefresh = false,
  refreshInterval = 30000
}) => {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState(12)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('hybrid')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Memoized data processing
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []

    return data
      .filter(item => item && item.date && typeof item.value === 'number')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        date: item.date,
        value: parseFloat(item.value),
        period: item.period || new Date(item.date).toISOString().slice(0, 7)
      }))
  }, [data])

  // Generate analysis
  useEffect(() => {
    if (processedData.length > 0) {
      generateAnalysis()
    }
  }, [processedData, selectedPeriod, selectedAlgorithm])

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && processedData.length > 0) {
      const interval = setInterval(() => {
        generateAnalysis()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, processedData])

  const generateAnalysis = async () => {
    if (processedData.length < 3) {
      setError('Insufficient data points for analysis (minimum 3 required)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const forecastOptions = {
        forecastPeriods: selectedPeriod,
        algorithm: selectedAlgorithm,
        aiEnabled: true
      }

      const forecast = await demandForecastingService.generateDemandForecast(
        processedData,
        forecastOptions
      )

      setAnalysis(forecast)

      // Notify parent component of forecast update
      if (onForecastUpdate) {
        onForecastUpdate(forecast)
      }

    } catch (err) {
      logError('Time series analysis failed', err)
      setError(err.message || 'Analysis generation failed')
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value, format = 'number') => {
    if (typeof value !== 'number' || isNaN(value)) return '--'

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value)
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`
      case 'decimal':
        return value.toFixed(2)
      default:
        return value.toLocaleString()
    }
  }

  const getTrendIcon = (trendType) => {
    switch (trendType) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
      case 'decreasing':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
      default:
        return <ChartBarIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CogIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Analyzing time series data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardContent className="py-6">
          <div className="flex items-center text-red-600 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <h3 className="font-semibold">Analysis Error</h3>
          </div>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={generateAnalysis}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry Analysis
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No analysis data available</p>
          <button
            onClick={generateAnalysis}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Generate Analysis
          </button>
        </CardContent>
      </Card>
    )
  }

  const { dataAnalysis, forecast, scenarios, accuracy, aiInsights, metadata } = analysis

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
              {title}
            </CardTitle>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={18}>18 Months</option>
                <option value={24}>24 Months</option>
              </select>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="hybrid">Hybrid</option>
                <option value="linear_trend">Linear Trend</option>
                <option value="seasonal_decomposition">Seasonal</option>
                <option value="exponential_smoothing">Exponential</option>
                <option value="machine_learning">ML Enhanced</option>
              </select>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Advanced
              </button>
              <button
                onClick={generateAnalysis}
                className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(dataAnalysis.trend.type)}
                  <span className="ml-2 font-semibold capitalize">
                    {dataAnalysis.trend.type}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Strength</p>
                <p className="font-semibold">
                  {formatValue(dataAnalysis.trend.strength, 'percentage')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Seasonality</p>
                <p className="font-semibold capitalize">
                  {dataAnalysis.seasonality.present
                    ? `${dataAnalysis.seasonality.period}M Cycle`
                    : 'None Detected'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Strength</p>
                <p className="font-semibold">
                  {formatValue(dataAnalysis.seasonality.strength, 'percentage')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volatility</p>
                <p className="font-semibold">
                  {formatValue(dataAnalysis.volatility, 'percentage')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Quality Score</p>
                <p className="font-semibold">
                  {formatValue(dataAnalysis.dataQuality.score, 'percentage')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Forecast Confidence</p>
                <p className="font-semibold">
                  {formatValue(metadata.confidence, 'percentage')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Algorithm</p>
                <p className="font-semibold text-xs">
                  {metadata.algorithm || selectedAlgorithm}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {aiInsights && aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              AI Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.map((insight, __index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <p className="text-sm font-medium">
                          Recommendation: {insight.recommendation}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                      insight.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      insight.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {insight.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Settings */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CogIcon className="h-5 w-5 mr-2 text-gray-600" />
              Advanced Analysis Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Data Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Data Points:</span>
                    <span>{metadata.dataPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean Value:</span>
                    <span>{formatValue(dataAnalysis.mean)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Deviation:</span>
                    <span>{formatValue(dataAnalysis.stdDev, 'decimal')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Autocorrelation:</span>
                    <span>{formatValue(dataAnalysis.autocorrelation, 'decimal')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Forecast Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Forecast Periods:</span>
                    <span>{metadata.forecastPeriods}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generated:</span>
                    <span>{new Date(metadata.generatedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>{metadata.version}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Model Performance</h4>
                {accuracy && Object.keys(accuracy).length > 0 && (
                  <div className="space-y-2 text-sm">
                    {Object.entries(accuracy).map(([method, metrics]) => (
                      <div key={method}>
                        <div className="font-medium capitalize mb-1">{method.replace('_', ' ')}</div>
                        <div className="ml-2 space-y-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>MAPE:</span>
                            <span>{formatValue(metrics.mape, 'decimal')}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>RMSE:</span>
                            <span>{formatValue(metrics.rmse, 'decimal')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario Comparison */}
      {scenarios && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
              Scenario Forecasts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(scenarios).map(([scenarioName, scenarioData]) => {
                const futurePoints = scenarioData.filter(p => p.isForecast)
                const avgFutureValue = futurePoints.length > 0
                  ? futurePoints.reduce((sum, p) => sum + p.value, 0) / futurePoints.length
                  : 0

                const avgConfidence = futurePoints.length > 0
                  ? futurePoints.reduce((sum, p) => sum + (p.confidence || 0.8), 0) / futurePoints.length
                  : 0

                return (
                  <div key={scenarioName} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold capitalize mb-2">{scenarioName}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Avg. Forecast:</span>
                        <span className="font-medium">{formatValue(avgFutureValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span className="font-medium">{formatValue(avgConfidence, 'percentage')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Points:</span>
                        <span className="font-medium">{futurePoints.length}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            Last updated: {new Date(metadata.generatedAt).toLocaleString()}
          </span>
          {autoRefresh && (
            <span className="text-green-600">Auto-refresh enabled</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Powered by AI Central Nervous System</span>
        </div>
      </div>
    </div>
  )
}

export default TimeSeriesAnalysis

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartBarIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  GlobeAltIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'
import DemandForecastingEngine from '@/services/DemandForecastingEngine'

const DemandForecasting = () => {
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeHorizon, setTimeHorizon] = useState('12months')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [engine] = useState(() => new DemandForecastingEngine())

  const fetchForecastData = async () => {
    try {
      setLoading(true)
      setError(null)

      const forecast = await engine.getDemandForecast(timeHorizon)
      setForecastData(forecast)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForecastData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeHorizon])

  const formatNumber = value => {
    if (typeof value !== 'number') return 'N/A'
    return value.toLocaleString()
  }

  const getConfidenceColor = confidence => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getPriorityColor = priority => {
    const colors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50',
    }
    return colors[priority] || 'border-gray-300 bg-gray-50'
  }

  const getImpactColor = impact => {
    const colors = {
      high: 'text-red-600',
      positive: 'text-green-600',
      negative: 'text-red-600',
      medium: 'text-yellow-600',
    }
    return colors[impact] || 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Demand Forecasting
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                AI-powered demand prediction for Sentia Manufacturing
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Demand Forecasting
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              AI-powered demand prediction for Sentia Manufacturing
            </p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Unable to load forecast data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchForecastData}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Demand Forecasting
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              AI-powered demand prediction using statistical models and pattern analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeHorizon}
            onChange={e => setTimeHorizon(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="6months">6 Months</option>
            <option value="12months">12 Months</option>
            <option value="18months">18 Months</option>
          </select>

          <button
            onClick={fetchForecastData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Forecast Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Annual Demand Forecast"
          value={formatNumber(forecastData?.forecast?.totalAnnualDemand || 0)}
          icon={TrendingUpIcon}
          color="green"
          description="Total units predicted for next 12 months"
        />

        <MetricCard
          title="Peak Month"
          value={forecastData?.forecast?.peakMonth?.monthName || 'N/A'}
          icon={CalendarDaysIcon}
          color="blue"
          description={`${formatNumber(forecastData?.forecast?.peakMonth?.demandForecast || 0)} units expected`}
        />

        <MetricCard
          title="Forecast Confidence"
          value={`${Math.round((forecastData?.confidence?.overall || 0) * 100)}%`}
          icon={ChartBarIcon}
          color="purple"
          description="Overall model confidence level"
        />

        <MetricCard
          title="Models Used"
          value="4"
          icon={LightBulbIcon}
          color="yellow"
          description="Statistical, Seasonal, Channel, Regional"
        />
      </div>

      {/* Monthly Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 12-Month Demand Forecast
            <span className="text-sm font-normal text-muted-foreground">
              Ensemble model combining statistical, seasonal, and behavioral patterns
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple chart representation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 text-sm">
              {forecastData?.forecast?.data?.map((month, index) => (
                <div key={index} className="text-center">
                  <div className="bg-green-100 rounded-lg p-3 mb-2">
                    <div
                      className="bg-green-600 rounded-sm mx-auto"
                      style={{
                        height: `${Math.max(20, (month.demandForecast / Math.max(...forecastData.forecast.data.map(m => m.demandForecast))) * 80)}px`,
                        width: '100%',
                      }}
                    ></div>
                  </div>
                  <p className="font-medium text-gray-900">{month.monthName.slice(0, 3)}</p>
                  <p className="text-xs text-gray-600">{formatNumber(month.demandForecast)}</p>
                  <p className="text-xs text-green-600">
                    ±{formatNumber(month.confidenceInterval.upper - month.demandForecast)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {forecastData?.insights && forecastData.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI-Generated Insights
              <span className="text-sm font-normal text-muted-foreground">
                ({forecastData.insights.length} insights detected)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {forecastData.insights.map((insight, index) => (
              <div
                key={index}
                className={`border-l-4 pl-4 py-3 ${
                  insight.impact === 'high'
                    ? 'border-red-500 bg-red-50'
                    : insight.impact === 'positive'
                      ? 'border-green-500 bg-green-50'
                      : insight.impact === 'negative'
                        ? 'border-red-500 bg-red-50'
                        : 'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-sm font-medium text-blue-600 mt-2">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(insight.impact)} ${
                        insight.impact === 'high'
                          ? 'bg-red-100'
                          : insight.impact === 'positive'
                            ? 'bg-green-100'
                            : insight.impact === 'negative'
                              ? 'bg-red-100'
                              : 'bg-yellow-100'
                      }`}
                    >
                      {insight.impact} impact
                    </span>
                    {insight.actionRequired && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        Action Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {forecastData?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Strategic Recommendations
              <span className="text-sm font-normal text-muted-foreground">
                Based on demand forecast analysis
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {forecastData.recommendations.map((rec, index) => (
              <div key={index} className={`border-l-4 pl-4 py-3 ${getPriorityColor(rec.priority)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : rec.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      <strong>Rationale:</strong> {rec.rationale}
                    </p>
                    <div className="flex gap-4 text-xs">
                      <span>
                        <strong>Timeline:</strong> {rec.timeline}
                      </span>
                      {rec.estimatedCost && (
                        <span>
                          <strong>Cost:</strong> {rec.estimatedCost}
                        </span>
                      )}
                      {rec.estimatedSavings && (
                        <span className="text-green-600">
                          <strong>Savings:</strong> {rec.estimatedSavings}
                        </span>
                      )}
                      {rec.estimatedImpact && (
                        <span className="text-blue-600">
                          <strong>Impact:</strong> {rec.estimatedImpact}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Model Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🔬 Model Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecastData?.confidence?.byModel &&
                Object.entries(forecastData.confidence.byModel).map(([model, confidence]) => (
                  <div key={model} className="flex justify-between items-center">
                    <span className="font-medium capitalize">
                      {model.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${confidence * 100}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getConfidenceColor(confidence)}`}
                      >
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📊 Forecast Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Statistical Models</span>
                <span className="font-semibold">30%</span>
              </div>
              <div className="flex justify-between">
                <span>Seasonal Patterns</span>
                <span className="font-semibold">40%</span>
              </div>
              <div className="flex justify-between">
                <span>Channel Behavior</span>
                <span className="font-semibold">20%</span>
              </div>
              <div className="flex justify-between">
                <span>Regional Analysis</span>
                <span className="font-semibold">10%</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Ensemble Method:</strong> Combines multiple forecasting approaches for
                improved accuracy and robustness.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source */}
      <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <GlobeAltIcon className="w-4 h-4" />
              <span>AI-powered forecasting based on historical sales data and market patterns</span>
            </div>
            {lastUpdated && (
              <span className="text-green-600 dark:text-green-400">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-green-700 dark:text-green-300">
            Incorporates seasonal trends, channel behaviors, and regional market dynamics for
            Sentia's 9-SKU operation
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const MetricCard = ({ title, value, icon, color, description }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-900 border-green-200',
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  }

  const Icon = icon

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <Icon className="w-8 h-8" />
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs opacity-70 mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DemandForecasting

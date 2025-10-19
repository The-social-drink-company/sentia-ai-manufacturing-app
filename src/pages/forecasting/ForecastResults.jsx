import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, ArrowLeft, TrendingUp, Target, Brain, FileText, Share2 } from 'lucide-react'

/**
 * ForecastResults Component
 *
 * Detailed forecast results display with:
 * - Forecast chart (actual vs. predicted)
 * - Confidence intervals (shaded area)
 * - Accuracy metrics display
 * - Feature importance (for tree-based models)
 * - Explainable AI insights
 * - Export forecast data functionality
 */
function ForecastResults() {
  const { forecastId } = useParams()
  const navigate = useNavigate()

  const [chartView, setChartView] = useState('forecast') // forecast, residuals, features
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true)

  // Fetch forecast results
  const { data: forecast, isLoading } = useQuery({
    queryKey: ['forecasts', 'results', forecastId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/forecasts/${forecastId}`)
      if (!response.ok) throw new Error('Failed to fetch forecast results')
      const result = await response.json()
      return result.data
    },
  })

  const handleExport = format => {
    // TODO: Implement export functionality
    console.log('Export forecast as:', format)
    const dataStr = JSON.stringify(forecast, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `forecast-${forecastId}.${format}`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading forecast results...</p>
        </div>
      </div>
    )
  }

  const accuracy = forecast.metrics.mape ? 100 - forecast.metrics.mape : null
  const isGoodAccuracy = accuracy && accuracy >= 85

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/forecasting')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forecasting
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forecast Results</h1>
            <p className="text-gray-600 mt-1">
              {forecast.productName} • {forecast.model} • {forecast.horizon} days
            </p>
          </div>

          {/* Export Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/forecasting/comparison?productId=${forecast.productId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compare Models
            </button>
            <div className="relative group">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 last:rounded-b-lg"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accuracy Summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div
          className={`rounded-lg p-6 ${isGoodAccuracy ? 'bg-green-50 border-2 border-green-500' : 'bg-yellow-50 border-2 border-yellow-500'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target
              className={`w-5 h-5 ${isGoodAccuracy ? 'text-green-600' : 'text-yellow-600'}`}
            />
            <span className="text-sm font-medium text-gray-700">Accuracy</span>
          </div>
          <p
            className={`text-3xl font-bold ${isGoodAccuracy ? 'text-green-900' : 'text-yellow-900'}`}
          >
            {accuracy ? `${accuracy.toFixed(1)}%` : 'N/A'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {isGoodAccuracy ? 'Excellent' : 'Fair'} • Target: &gt;85%
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">MAPE</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{forecast.metrics.mape.toFixed(2)}%</p>
          <p className="text-sm text-gray-600 mt-1">Mean Absolute % Error</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">RMSE</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{forecast.metrics.rmse.toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-1">Root Mean Squared Error</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">R²</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{forecast.metrics.r2.toFixed(3)}</p>
          <p className="text-sm text-gray-600 mt-1">Coefficient of Determination</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setChartView('forecast')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            chartView === 'forecast'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Forecast Chart
        </button>
        <button
          onClick={() => setChartView('residuals')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            chartView === 'residuals'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Residual Analysis
        </button>
        {forecast.featureImportance && (
          <button
            onClick={() => setChartView('features')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              chartView === 'features'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Feature Importance
          </button>
        )}
      </div>

      {/* Forecast Chart View */}
      {chartView === 'forecast' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Actual vs. Predicted Demand</h2>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showConfidenceInterval}
                onChange={e => setShowConfidenceInterval(e.target.checked)}
                className="w-4 h-4"
              />
              Show Confidence Interval
            </label>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={forecast.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={date =>
                  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                }
                style={{ fontSize: '12px' }}
              />
              <YAxis
                label={{ value: 'Demand (units)', angle: -90, position: 'insideLeft' }}
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<ForecastTooltip />} />
              <Legend />

              {/* Confidence interval */}
              {showConfidenceInterval && (
                <>
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="url(#confidenceArea)"
                    name="95% Confidence Interval"
                  />
                  <Area type="monotone" dataKey="lowerBound" stroke="none" fill="white" />
                </>
              )}

              {/* Actual values */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Actual Demand"
              />

              {/* Predicted values */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#3b82f6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="Predicted Demand"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Residual Analysis View */}
      {chartView === 'residuals' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Residual Analysis</h2>
          <p className="text-sm text-gray-600 mb-4">
            Residuals show the difference between actual and predicted values. Random scatter
            indicates a good model fit.
          </p>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={forecast.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={date =>
                  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                }
                style={{ fontSize: '12px' }}
              />
              <YAxis
                label={{ value: 'Residual (units)', angle: -90, position: 'insideLeft' }}
                style={{ fontSize: '12px' }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="residual" fill="#8b5cf6" name="Residual" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Feature Importance View */}
      {chartView === 'features' && forecast.featureImportance && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Feature Importance</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Shows which features contributed most to the forecast predictions.
          </p>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={forecast.featureImportance}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 120, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" style={{ fontSize: '12px' }} />
              <YAxis type="category" dataKey="feature" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar
                dataKey="importance"
                fill="#8b5cf6"
                name="Importance Score"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Explainable AI Insights */}
      {forecast.insights && forecast.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Explainable AI Insights</h2>
          </div>

          <div className="space-y-3">
            {forecast.insights.map((insight, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-1">{insight.title}</h3>
                <p className="text-sm text-blue-800">{insight.description}</p>
                {insight.impact && (
                  <p className="text-xs text-blue-600 mt-2">Impact: {insight.impact}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ForecastTooltip Component
 */
function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg p-3">
      <p className="font-medium text-gray-900 mb-2">
        {new Date(label).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold">
            {entry.value !== null && entry.value !== undefined ? entry.value.toFixed(0) : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default ForecastResults

import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ChartLineIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  ClockIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '../../hooks/useAuth'
import TimeSeriesAnalysis from './components/TimeSeriesAnalysis'
import ForecastChart from './components/ForecastChart'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui'
import { demandForecastingService } from './services/DemandForecastingService'
import { logError } from '../../utils/structuredLogger'

export default function ForecastingDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedDataSource, setSelectedDataSource] = useState('demand')
  const [selectedPeriod, setSelectedPeriod] = useState(12)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Mock data sources
  const dataSources = {
    demand: {
      name: 'Product Demand',
      description: 'Historical product demand data',
      data: generateMockDemandData()
    },
    inventory: {
      name: 'Inventory Levels',
      description: 'Inventory level trends',
      data: generateMockInventoryData()
    },
    production: {
      name: 'Production Volume',
      description: 'Manufacturing production volumes',
      data: generateMockProductionData()
    },
    revenue: {
      name: 'Revenue',
      description: 'Revenue trends and patterns',
      data: generateMockRevenueData()
    }
  }

  // Role-based access control
  if (user?.role === 'viewer') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    const sourceData = dataSources[selectedDataSource]?.data || []
    setData(sourceData)
  }, [selectedDataSource])

  const handleForecastUpdate = (forecastResult) => {
    setAnalysis(forecastResult)
  }

  const handleExport = async (format) => {
    try {
      if (!analysis) {
        throw new Error('No analysis data to export')
      }

      const exportData = {
        timestamp: new Date().toISOString(),
        dataSource: selectedDataSource,
        period: selectedPeriod,
        analysis,
        metadata: {
          user: user?.firstName || 'Unknown',
          version: '1.0'
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: format === 'json' ? 'application/json' : 'text/plain'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `forecast-analysis-${selectedDataSource}-${new Date().toISOString().split('T')[0]}.${format}`
      link.click()

      URL.revokeObjectURL(url)
    } catch (err) {
      logError('Export failed', err)
      setError(err.message)
    }
  }

  const refreshAnalysis = () => {
    // Force re-analysis by updating a dummy state
    setAnalysis(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <CpuChipIcon className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating forecasting analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <ChartLineIcon className="h-8 w-8 mr-3 text-blue-600" />
                Demand Forecasting
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                AI-powered demand forecasting and time series analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Data Source Selector */}
              <select
                value={selectedDataSource}
                onChange={(e) => setSelectedDataSource(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                {Object.entries(dataSources).map(([key, source]) => (
                  <option key={key} value={key}>{source.name}</option>
                ))}
              </select>

              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={18}>18 Months</option>
                <option value={24}>24 Months</option>
              </select>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition ${
                  autoRefresh
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                }`}
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                <BoltIcon className="h-5 w-5" />
              </button>

              {/* Settings */}
              <button
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                title="Analysis settings"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>

              {/* Export Menu */}
              <div className="relative group">
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center">
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export Report
                  </button>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshAnalysis}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="py-4">
              <div className="flex items-center text-red-600">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">Analysis Error:</span>
                <span className="ml-2">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Source Info */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Current Data Source: {dataSources[selectedDataSource]?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dataSources[selectedDataSource]?.description}
                </p>
              </div>
              <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {data.length} data points available
                </div>
                {autoRefresh && (
                  <div className="flex items-center text-green-600 mt-1">
                    <BoltIcon className="h-3 w-3 mr-1" />
                    Auto-refresh active
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Series Analysis */}
        <div className="mb-8">
          <TimeSeriesAnalysis
            data={data}
            title={`Time Series Analysis - ${dataSources[selectedDataSource]?.name}`}
            onForecastUpdate={handleForecastUpdate}
            autoRefresh={autoRefresh}
            refreshInterval={30000}
          />
        </div>

        {/* Forecast Chart */}
        {analysis && (
          <div className="mb-8">
            <ForecastChart
              data={analysis.forecast}
              scenarios={analysis.scenarios}
              title="Forecast Visualization"
              height={500}
              showConfidenceBands={true}
              showScenarios={true}
              interactive={true}
            />
          </div>
        )}

        {/* Additional Analytics Cards */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analysis.accuracy || {}).map(([method, metrics]) => (
                    <div key={method} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                      <h4 className="font-semibold capitalize text-gray-900 dark:text-white mb-2">
                        {method.replace('_', ' ')}
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">MAPE:</span>
                          <div className="font-semibold">{metrics.mape?.toFixed(2)}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">RMSE:</span>
                          <div className="font-semibold">{metrics.rmse?.toFixed(0)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">MAE:</span>
                          <div className="font-semibold">{metrics.mae?.toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Quality Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.dataAnalysis?.dataQuality && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Overall Score:</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className={`h-2 rounded-full ${
                              analysis.dataAnalysis.dataQuality.score > 0.8 ? 'bg-green-500' :
                              analysis.dataAnalysis.dataQuality.score > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${analysis.dataAnalysis.dataQuality.score * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold">
                          {Math.round(analysis.dataAnalysis.dataQuality.score * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Valid Data Ratio:</span>
                        <span className="font-semibold">
                          {Math.round(analysis.dataAnalysis.dataQuality.validDataRatio * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Interpolated Points:</span>
                        <span className="font-semibold">
                          {analysis.dataAnalysis.dataQuality.interpolatedPoints}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Consistency Score:</span>
                        <span className="font-semibold">
                          {Math.round(analysis.dataAnalysis.dataQuality.consistencyScore * 100)}%
                        </span>
                      </div>
                    </div>

                    {analysis.dataAnalysis.dataQuality.recommendation && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Recommendation:</strong> {analysis.dataAnalysis.dataQuality.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p>Powered by AI Central Nervous System • Advanced Time Series Analysis • Real-time Forecasting</p>
        </div>
      </div>
    </div>
  )
}

// Mock data generators
function generateMockDemandData() {
  const data = []
  const startDate = new Date(2023, 0, 1)

  for (let i = 0; i < 24; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)

    // Create realistic demand pattern with seasonality and trend
    const baseValue = 1000
    const trendFactor = 1 + (i * 0.02) // 2% monthly growth
    const seasonalFactor = 1 + Math.sin((i * 2 * Math.PI) / 12) * 0.3 // Annual seasonality
    const randomFactor = 0.9 + Math.random() * 0.2 // ±10% noise

    const value = baseValue * trendFactor * seasonalFactor * randomFactor

    data.push({
      date: date.toISOString(),
      value: Math.round(value),
      period: date.toISOString().slice(0, 7)
    })
  }

  return data
}

function generateMockInventoryData() {
  const data = []
  const startDate = new Date(2023, 0, 1)

  for (let i = 0; i < 24; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)

    const baseValue = 500000
    const cyclicalFactor = 1 + Math.sin((i * 2 * Math.PI) / 6) * 0.15 // Inventory cycles
    const randomFactor = 0.95 + Math.random() * 0.1

    const value = baseValue * cyclicalFactor * randomFactor

    data.push({
      date: date.toISOString(),
      value: Math.round(value),
      period: date.toISOString().slice(0, 7)
    })
  }

  return data
}

function generateMockProductionData() {
  const data = []
  const startDate = new Date(2023, 0, 1)

  for (let i = 0; i < 24; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)

    const baseValue = 800
    const efficiencyTrend = 1 + (i * 0.01) // 1% monthly improvement
    const weekendEffect = Math.random() > 0.3 ? 1 : 0.7 // Weekend production
    const randomFactor = 0.9 + Math.random() * 0.2

    const value = baseValue * efficiencyTrend * weekendEffect * randomFactor

    data.push({
      date: date.toISOString(),
      value: Math.round(value),
      period: date.toISOString().slice(0, 7)
    })
  }

  return data
}

function generateMockRevenueData() {
  const data = []
  const startDate = new Date(2023, 0, 1)

  for (let i = 0; i < 24; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)

    const baseValue = 250000
    const growthTrend = 1 + (i * 0.015) // 1.5% monthly growth
    const seasonalFactor = 1 + Math.sin((i * 2 * Math.PI) / 12 + Math.PI / 4) * 0.25 // Q4 peak
    const marketVolatility = 0.85 + Math.random() * 0.3

    const value = baseValue * growthTrend * seasonalFactor * marketVolatility

    data.push({
      date: date.toISOString(),
      value: Math.round(value),
      period: date.toISOString().slice(0, 7)
    })
  }

  return data
}
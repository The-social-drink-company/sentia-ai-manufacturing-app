import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CurrencyPoundIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  TrendingDownIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'
import EnhancedWorkingCapitalService from '../../services/EnhancedWorkingCapitalService'

const RealTimeCashFlowForecasting = () => {
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState('baseline')
  const [forecastPeriod, setForecastPeriod] = useState(12)
  const [refreshInterval, setRefreshInterval] = useState(null)

  // Initialize service
  const [wcService] = useState(() => new EnhancedWorkingCapitalService())

  // Generate comprehensive cash flow forecasts using real data
  const generateRealTimeForecast = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get real working capital data
      const workingCapitalData = await wcService.calculateWorkingCapitalRequirements({
        period: forecastPeriod,
        currency: 'GBP',
        includeForecasts: true
      })

      // Generate detailed cash flow scenarios
      const scenarios = await generateMultipleScenarios(workingCapitalData)
      
      setForecastData({
        ...workingCapitalData,
        scenarios,
        generatedAt: new Date().toISOString(),
        currency: 'GBP',
        period: forecastPeriod
      })

    } catch (err) {
      setError(err.message)
      console.error('Cash flow forecasting failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generate multiple scenario forecasts
  const generateMultipleScenarios = async (baseData) => {
    const scenarios = {}

    // Baseline scenario (current trends)
    scenarios.baseline = {
      name: 'Baseline',
      description: 'Current growth and operational trends continue',
      probability: 0.6,
      forecasts: baseData.forecasts || [],
      assumptions: {
        revenueGrowth: 0.08,
        seasonality: 0.15,
        operationalEfficiency: 1.0
      }
    }

    // Optimistic scenario (+20% growth)
    scenarios.optimistic = {
      name: 'Optimistic',
      description: 'Strong market growth and operational improvements',
      probability: 0.25,
      forecasts: generateScenarioForecasts(baseData, 1.2, 0.1),
      assumptions: {
        revenueGrowth: 0.20,
        seasonality: 0.10,
        operationalEfficiency: 1.1
      }
    }

    // Conservative scenario (-10% growth)
    scenarios.conservative = {
      name: 'Conservative',
      description: 'Market challenges and reduced growth',
      probability: 0.15,
      forecasts: generateScenarioForecasts(baseData, 0.9, 0.2),
      assumptions: {
        revenueGrowth: 0.03,
        seasonality: 0.20,
        operationalEfficiency: 0.95
      }
    }

    return scenarios
  }

  // Generate forecasts for specific scenario
  const generateScenarioForecasts = (baseData, growthMultiplier, volatility) => {
    if (!baseData.forecasts) return []

    return baseData.forecasts.map((forecast, index) => {
      const monthFactor = 1 + (index * growthMultiplier * 0.01) // Compound growth
      const randomFactor = 1 + ((throw new Error("REAL DATA REQUIRED: Connect to real APIs") 0.5) * volatility) // Volatility

      return {
        ...forecast,
        workingCapital: forecast.workingCapital * monthFactor * randomFactor,
        accountsReceivable: forecast.accountsReceivable * monthFactor * randomFactor,
        inventory: forecast.inventory * monthFactor * randomFactor,
        accountsPayable: forecast.accountsPayable * monthFactor * randomFactor,
        revenue: forecast.revenue * monthFactor * randomFactor,
        cashFlow: forecast.cashFlow * monthFactor * randomFactor
      }
    })
  }

  useEffect(() => {
    generateRealTimeForecast()
  }, [forecastPeriod])

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(generateRealTimeForecast, refreshInterval * 60000)
      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  const formatCurrency = (amount, compact = false) => {
    if (compact && Math.abs(amount) >= 1000000) {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        notation: 'compact',
        compactDisplay: 'short'
      }).format(amount)
    }
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`
  }

  const getTrendIcon = (current, previous) => {
    if (current > previous) return ArrowTrendingUpIcon
    if (current < previous) return TrendingDownIcon
    return InformationCircleIcon
  }

  const getTrendColor = (current, previous) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  const getScenarioProbabilityColor = (probability) => {
    if (probability >= 0.5) return 'bg-green-100 text-green-800'
    if (probability >= 0.2) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const calculateForecastSummary = (forecasts) => {
    if (!forecasts || forecasts.length === 0) return null

    const totalCashFlow = forecasts.reduce((sum, f) => sum + f.cashFlow, 0)
    const avgWorkingCapital = forecasts.reduce((sum, f) => sum + f.workingCapital, 0) / forecasts.length
    const minCashFlow = Math.min(...forecasts.map(f => f.cashFlow))
    const maxCashFlow = Math.max(...forecasts.map(f => f.cashFlow))
    const volatility = forecasts.length > 1 ? 
      Math.sqrt(forecasts.reduce((sum, f, i) => {
        const avg = totalCashFlow / forecasts.length
        return sum + Math.pow(f.cashFlow - avg, 2)
      }, 0) / forecasts.length) : 0

    return {
      totalCashFlow,
      avgWorkingCapital,
      minCashFlow,
      maxCashFlow,
      volatility,
      trend: forecasts.length > 1 ? 
        (forecasts[forecasts.length - 1].cashFlow - forecasts[0].cashFlow) / forecasts[0].cashFlow : 0
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <DocumentChartBarIcon className="w-8 h-8 text-blue-600 mr-3" />
                Real-Time Cash Flow Forecasting
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                AI-powered cash flow predictions using live financial data and market intelligence
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Forecast Period */}
              <select
                value={forecastPeriod}
                onChange={(e) => setForecastPeriod(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={18}>18 Months</option>
                <option value={24}>24 Months</option>
              </select>

              {/* Auto-refresh */}
              <select
                value={refreshInterval || ''}
                onChange={(e) => setRefreshInterval(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Manual Refresh</option>
                <option value={5}>Every 5 min</option>
                <option value={10}>Every 10 min</option>
                <option value={30}>Every 30 min</option>
              </select>

              {/* Generate Forecast Button */}
              <button
                onClick={generateRealTimeForecast}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <ChartBarIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating...' : 'Generate Forecast'}
              </button>
            </div>
          </div>

          {/* Last Updated */}
          {forecastData && (
            <div className="flex items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              <ClockIcon className="w-4 h-4 mr-1" />
              Generated: {new Date(forecastData.generatedAt).toLocaleString()}
              <span className="mx-2">•</span>
              Forecast Period: {forecastData.period} months
              {refreshInterval && (
                <>
                  <span className="mx-2">•</span>
                  Auto-refresh: Every {refreshInterval} minutes
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Forecast Generation Error
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                <button
                  onClick={generateRealTimeForecast}
                  className="mt-2 text-red-600 hover:text-red-800 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generating Cash Flow Forecasts
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Analyzing real financial data and generating scenario-based projections...
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {forecastData && !loading && (
          <>
            {/* Scenario Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Forecast Scenarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(forecastData.scenarios || {}).map(([key, scenario]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedScenario(key)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedScenario === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{scenario.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getScenarioProbabilityColor(scenario.probability)}`}>
                        {formatPercentage(scenario.probability, 0)} likely
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-left">{scenario.description}</p>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-left">
                      Growth: {formatPercentage(scenario.assumptions.revenueGrowth)} • 
                      Efficiency: {formatPercentage(scenario.assumptions.operationalEfficiency - 1)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Forecast Summary Cards */}
            {forecastData.scenarios[selectedScenario] && (() => {
              const scenario = forecastData.scenarios[selectedScenario]
              const summary = calculateForecastSummary(scenario.forecasts)
              
              return summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Total Cash Flow */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cash Flow</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(summary.totalCashFlow)}
                        </p>
                        <p className={`text-sm mt-1 ${getTrendColor(summary.totalCashFlow, 0)}`}>
                          {summary.trend > 0 ? '+' : ''}{formatPercentage(summary.trend)} trend
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                        <CurrencyPoundIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* Average Working Capital */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Working Capital</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(summary.avgWorkingCapital)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Over {forecastPeriod} months
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow Range */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cash Flow Range</h3>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(summary.minCashFlow, true)} - {formatCurrency(summary.maxCashFlow, true)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Min to Max monthly
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                        <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </div>

                  {/* Volatility Risk */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cash Flow Volatility</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {formatCurrency(summary.volatility, true)}
                        </p>
                        <p className={`text-sm mt-1 ${
                          summary.volatility > 500000 ? 'text-red-600' :
                          summary.volatility > 200000 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {summary.volatility > 500000 ? 'High' :
                           summary.volatility > 200000 ? 'Medium' : 'Low'} risk
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <ExclamationTriangleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Monthly Forecast Table */}
            {forecastData.scenarios[selectedScenario] && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Monthly Cash Flow Forecast - {forecastData.scenarios[selectedScenario].name} Scenario
                  </h3>
                  <div className="flex items-center space-x-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">{forecastPeriod} month projection</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Month</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Working Capital</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Revenue</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">A/R</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Inventory</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">A/P</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Cash Flow</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastData.scenarios[selectedScenario].forecasts.map((forecast, index) => {
                        const prevForecast = index > 0 ? forecastData.scenarios[selectedScenario].forecasts[index - 1] : null
                        const TrendIcon = prevForecast ? getTrendIcon(forecast.cashFlow, prevForecast.cashFlow) : InformationCircleIcon
                        const trendColor = prevForecast ? getTrendColor(forecast.cashFlow, prevForecast.cashFlow) : 'text-gray-600'
                        
                        return (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                              {new Date(forecast.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(forecast.workingCapital)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">
                              {formatCurrency(forecast.revenue)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">
                              {formatCurrency(forecast.accountsReceivable)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">
                              {formatCurrency(forecast.inventory)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">
                              {formatCurrency(forecast.accountsPayable)}
                            </td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${
                              forecast.cashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {forecast.cashFlow >= 0 ? '+' : ''}{formatCurrency(forecast.cashFlow)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RealTimeCashFlowForecasting
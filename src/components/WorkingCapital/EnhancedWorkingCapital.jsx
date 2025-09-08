import React, { useState, useEffect } from 'react'
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  CurrencyPoundIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import EnhancedWorkingCapitalService from '../../services/EnhancedWorkingCapitalService'

const EnhancedWorkingCapital = () => {
  const [workingCapitalData, setWorkingCapitalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState(12)
  const [showForecasts, setShowForecasts] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Initialize service
  const [wcService] = useState(() => new EnhancedWorkingCapitalService())

  // Fetch working capital data
  const fetchWorkingCapitalData = async () => {
    try {
      setRefreshing(true)
      setError(null)
      
      const data = await wcService.calculateWorkingCapitalRequirements({
        period: selectedPeriod,
        currency: 'GBP',
        includeForecasts: showForecasts
      })
      
      setWorkingCapitalData(data)
    } catch (err) {
      setError(err.message)
      console.error('Working capital calculation failed:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchWorkingCapitalData()
  }, [selectedPeriod, showForecasts])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchWorkingCapitalData()
      }
    }, 300000) // 5 minutes

    return () => clearInterval(interval)
  }, [loading, refreshing])

  const formatCurrency = (amount, decimals = 0) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount)
  }

  const formatNumber = (num, decimals = 1) => {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMetricStatus = (current, target, isReverse = false) => {
    const ratio = current / target
    if (isReverse) {
      if (ratio <= 0.8) return { color: 'green', icon: CheckCircleIcon, status: 'excellent' }
      if (ratio <= 1.0) return { color: 'yellow', icon: InformationCircleIcon, status: 'good' }
      return { color: 'red', icon: ExclamationTriangleIcon, status: 'poor' }
    } else {
      if (ratio >= 1.2) return { color: 'green', icon: CheckCircleIcon, status: 'excellent' }
      if (ratio >= 0.9) return { color: 'yellow', icon: InformationCircleIcon, status: 'good' }
      return { color: 'red', icon: ExclamationTriangleIcon, status: 'poor' }
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
                <BanknotesIcon className="w-8 h-8 text-blue-600 mr-3" />
                True Working Capital Requirements
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Real-time analysis using live financial data - No mock data, only actual API calculations
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchWorkingCapitalData}
                disabled={loading || refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowTrendingUpIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating...' : 'Refresh Data'}
              </button>
            </div>
          </div>

          {/* Last Updated */}
          {workingCapitalData && (
            <div className="flex items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              <ClockIcon className="w-4 h-4 mr-1" />
              Last updated: {new Date(workingCapitalData.calculationDate).toLocaleString()}
              <span className="mx-2">•</span>
              Currency: {workingCapitalData.currency}
              <span className="mx-2">•</span>
              Period: {workingCapitalData.period} months
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center">
              <XCircleIcon className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Working Capital Calculation Error
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                <button
                  onClick={fetchWorkingCapitalData}
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
                Calculating Working Capital Requirements
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fetching real financial data from APIs and performing calculations...
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {workingCapitalData && !loading && (
          <>
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Working Capital */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Working Capital</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(workingCapitalData.workingCapital.total)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {formatNumber(workingCapitalData.workingCapital.percentage, 1)}% of revenue
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BanknotesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Per Employee: {formatCurrency(workingCapitalData.workingCapital.perEmployee)}
                  </div>
                </div>
              </div>

              {/* Current Ratio */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Ratio</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatNumber(workingCapitalData.ratios.current, 2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Target: ≥{workingCapitalData.benchmarks.currentRatio.target}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    {(() => {
                      const status = getMetricStatus(workingCapitalData.ratios.current, workingCapitalData.benchmarks.currentRatio.target)
                      const IconComponent = status.icon
                      return <IconComponent className={`w-6 h-6 text-${status.color}-600 dark:text-${status.color}-400`} />
                    })()}
                  </div>
                </div>
              </div>

              {/* Cash Conversion Cycle */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cash Conversion Cycle</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {formatNumber(workingCapitalData.cashConversionCycle.total, 1)} days
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Target: ≤{workingCapitalData.benchmarks.cashConversionCycle.target} days
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Performance Score */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Performance Score</h3>
                    <p className={`text-2xl font-bold mt-2 ${getPerformanceColor(workingCapitalData.performanceScore)}`}>
                      {workingCapitalData.performanceScore}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Overall efficiency
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Working Capital Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Current Assets */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Assets</h3>
                <div className="space-y-4">
                  {Object.entries(workingCapitalData.currentAssets).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-gray-900 dark:text-white">Total Current Assets</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatCurrency(Object.values(workingCapitalData.currentAssets).reduce((sum, val) => sum + val, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Liabilities */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Liabilities</h3>
                <div className="space-y-4">
                  {Object.entries(workingCapitalData.currentLiabilities).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-gray-900 dark:text-white">Total Current Liabilities</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatCurrency(Object.values(workingCapitalData.currentLiabilities).reduce((sum, val) => sum + val, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Capital Requirements by Category */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Working Capital Requirements by Category
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(workingCapitalData.requirements)
                  .filter(([key]) => !['employeeCount', 'facilityCount'].includes(key))
                  .map(([category, req]) => (
                  <div key={category} className={`p-4 rounded-lg border-2 ${
                    req.priority === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                    req.priority === 'high' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
                    'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{category}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        req.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        req.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{req.description}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(req.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Days of Sales:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatNumber(req.daysOfSales, 1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            {workingCapitalData.riskAssessment && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Assessment</h3>
                  <div className={`px-4 py-2 rounded-lg border ${getRiskColor(workingCapitalData.riskAssessment.overall)}`}>
                    <div className="flex items-center">
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                      <span className="font-semibold capitalize">{workingCapitalData.riskAssessment.overall} Risk</span>
                    </div>
                  </div>
                </div>

                {workingCapitalData.riskAssessment.risks.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workingCapitalData.riskAssessment.risks.map((risk, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getRiskColor(risk.level)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{risk.category}</h4>
                          <span className="text-xs px-2 py-1 rounded-full font-medium capitalize">
                            {risk.level}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{risk.description}</p>
                        <p className="text-xs font-medium">Impact: {risk.impact}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Optimization Recommendations */}
            {workingCapitalData.recommendations && workingCapitalData.recommendations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Optimization Recommendations
                </h3>
                <div className="space-y-4">
                  {workingCapitalData.recommendations.map((rec, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{rec.category}</h4>
                          <span className={`ml-2 text-xs px-2 py-1 rounded-full font-medium ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.priority} priority
                          </span>
                        </div>
                        {rec.potentialImpact && (
                          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                            Impact: {rec.potentialImpact}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <strong>Issue:</strong> {rec.issue}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        <strong>Recommendation:</strong> {rec.recommendation}
                      </p>
                      {rec.targetValue && rec.currentValue && (
                        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Current: {formatNumber(rec.currentValue, 1)}</span>
                          <span className="mx-2">→</span>
                          <span>Target: {formatNumber(rec.targetValue, 1)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Working Capital Forecasts */}
            {workingCapitalData.forecasts && showForecasts && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    12-Month Working Capital Forecast
                  </h3>
                  <div className="flex items-center space-x-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Based on real growth trends</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Month</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Working Capital</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">A/R</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Inventory</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">A/P</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Cash Flow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workingCapitalData.forecasts.slice(0, 12).map((forecast, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {new Date(forecast.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(forecast.workingCapital)}
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
                          <td className="py-3 px-4 text-sm text-right text-green-600 dark:text-green-400">
                            +{formatCurrency(forecast.cashFlow)}
                          </td>
                        </tr>
                      ))}
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

export default EnhancedWorkingCapital
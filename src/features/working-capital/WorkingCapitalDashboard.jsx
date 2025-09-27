import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '../../hooks/useAuth'
import { useWorkingCapitalMetrics } from './hooks/useWorkingCapitalMetrics'
import { useDashboardAudit } from './hooks/useAuditTrail'
import MetricCard from './components/MetricCard'
import AgingChart from './components/AgingChart'
import CashConversionCycle from './components/CashConversionCycle'
import CashFlowForecast from './components/CashFlowForecast'
import OptimizationRecommendations from './components/OptimizationRecommendations'
import XeroConnection from './components/XeroConnection'
import { logError, devLog } from '../../utils/structuredLogger'

export default function WorkingCapitalDashboard() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const {
    data: metrics,
    loading,
    error,
    refetch,
    exportData,
    isXeroConnected,
    isUsingRealData
  } = useWorkingCapitalMetrics(selectedPeriod)

  // Audit trail logging
  const audit = useDashboardAudit()

  // Track dashboard load performance
  useEffect(() => {
    const loadStartTime = performance.now()

    if (metrics && !loading) {
      const loadTime = performance.now() - loadStartTime
      const dataPoints = Object.keys(metrics).length
      audit.logDashboardLoad(loadTime, dataPoints)
    }
  }, [metrics, loading, audit])

  // Role-based access control
  if (user?.role === 'viewer') {
    return <Navigate to="/dashboard" replace />
  }

  // Auto-refresh every 15 minutes for critical metrics
  useEffect(() => {
    const interval = setInterval(() => {
      audit.logMetricRefresh('auto_refresh', 'periodic')
      refetch()
    }, 15 * 60 * 1000) // 15 minutes
    return () => clearInterval(interval)
  }, [refetch, audit])

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading working capital metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Data</h3>
                <p className="text-red-600 dark:text-red-400 mt-1">{error.message}</p>
                <button
                  _onClick={() => {
                    audit.logError(error, { action: 'retry_data_load', userInitiated: true })
                    refetch()
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleExport = async (_format) => {
    const startTime = performance.now()

    try {
      // Log export attempt
      audit.logExport(format, {
        includeForecasts: true,
        includeRecommendations: true,
        dateRange: selectedPeriod
      })

      await exportData(format)

      // Log successful export
      const duration = performance.now() - startTime
      audit.trackAction('export_success', {
        format,
        duration: Math.round(duration),
        period: selectedPeriod
      })
    } catch (err) {
      // Log export failure
      audit.logError(err, {
        action: 'data_export',
        format,
        period: selectedPeriod,
        duration: performance.now() - startTime
      })
      logError('Export failed', err)
    }
  }

  // Handle period changes with audit logging
  const handlePeriodChange = (_newPeriod) => {
    audit.logPeriodChange(selectedPeriod, newPeriod)
    setSelectedPeriod(newPeriod)
  }

  // Handle currency changes with audit logging
  const handleCurrencyChange = (_newCurrency) => {
    audit.logCurrencyChange(selectedCurrency, newCurrency)
    setSelectedCurrency(newCurrency)
  }

  // Handle manual refresh with audit logging
  const handleRefresh = () => {
    audit.logMetricRefresh('manual_refresh', 'user_initiated')
    refetch()
  }

  const { summary, receivables, payables, inventory, cashFlow, recommendations, alerts } = metrics || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <BanknotesIcon className="h-8 w-8 mr-3 text-blue-600" />
                Working Capital Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Optimize cash flow and improve financial efficiency
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Currency Selector */}
              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>

              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="current">Current</option>
                <option value="mtd">Month to Date</option>
                <option value="qtd">Quarter to Date</option>
                <option value="ytd">Year to Date</option>
              </select>

              {/* Export Menu */}
              <div className="relative group">
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center">
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Xero Integration Section */}
        <div className="mb-8">
          <XeroConnection
            onConnectionChange={(connected, _status) => {
              audit.trackAction('xero_connection_changed', {
                connected,
                tenantName: status?.tenantName,
                isUsingRealData: connected && !!metrics
              })
            }}
          />
        </div>

        {/* Data Source Indicator */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isUsingRealData
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isUsingRealData ? 'bg-green-600' : 'bg-yellow-600'
            }`} />
            {isUsingRealData ? 'Live Data from Xero' : 'Sample Data'}
          </div>
        </div>

        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border flex items-start ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <ExclamationTriangleIcon
                    className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                      alert.severity === 'critical'
                        ? 'text-red-600 dark:text-red-400'
                        : alert.severity === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.description}</p>
                    {alert.action && (
                      <button className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                        {alert.action}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Working Capital"
            value={summary?.workingCapital || 0}
            change={summary?.workingCapitalChange}
            format="currency"
            icon={BanknotesIcon}
            color="blue"
          />
          <MetricCard
            title="Cash Conversion Cycle"
            value={summary?.cashConversionCycle || 0}
            change={summary?.cccChange}
            format="days"
            icon={ChartBarIcon}
            color="green"
            target={30}
          />
          <MetricCard
            title="Current Ratio"
            value={summary?.currentRatio || 0}
            change={summary?.currentRatioChange}
            format="ratio"
            icon={ArrowTrendingUpIcon}
            color="purple"
            target={2.0}
          />
          <MetricCard
            title="Quick Ratio"
            value={summary?.quickRatio || 0}
            change={summary?.quickRatioChange}
            format="ratio"
            icon={ArrowTrendingDownIcon}
            color="orange"
            target={1.5}
          />
        </div>

        {/* Working Capital Components */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Accounts Receivable
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Outstanding</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${(receivables?.total || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">DSO</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {receivables?.dso || 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  ${(receivables?.overdue || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Accounts Payable
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Outstanding</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${(payables?.total || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">DPO</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {payables?.dpo || 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Discounts Available</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ${(payables?.discountsAvailable || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Inventory
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${(inventory?.total || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">DIO</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {inventory?.dio || 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Turnover Ratio</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {inventory?.turnoverRatio || 0}x
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AgingChart
            receivables={receivables?.aging}
            payables={payables?.aging}
            title="AR/AP Aging Analysis"
          />
          <CashConversionCycle
            dso={receivables?.dso || 0}
            dio={inventory?.dio || 0}
            dpo={payables?.dpo || 0}
            historical={metrics?.cccHistory}
          />
        </div>

        {/* Cash Flow Forecast */}
        <div className="mb-8">
          <CashFlowForecast
            data={cashFlow}
            period={selectedPeriod}
          />
        </div>

        {/* Optimization Recommendations */}
        <OptimizationRecommendations
          recommendations={recommendations}
          onActionClick={(action) => devLog.log('Action clicked:', action)}
        />
      </div>
    </div>
  )
}
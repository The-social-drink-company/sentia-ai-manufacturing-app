import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
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
import ScenarioPlanner from './components/ScenarioPlanner'
import ApprovalInsights from './components/ApprovalInsights'
import MitigationPlan from './components/MitigationPlan'
import useWorkingCapitalOptimization from './hooks/useWorkingCapitalOptimization'
import { logError, devLog } from '../../utils/structuredLogger'

const SUPPORTED_EXPORTS = ['csv', 'json']

export default function WorkingCapitalDashboard() {
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const {
    data: metrics,
    loading,
    error,
    refetch,
    exportData,
    isUsingRealData
  } = useWorkingCapitalMetrics(selectedPeriod)

  const audit = useDashboardAudit()

  const {
    baseline: optimizationBaseline,
    scenarios: optimizationScenarios,
    plan: optimizationPlan,
    summaryQuery: optimizationSummaryQuery,
    scenarioMutation,
    approvalMutation,
    mitigationMutation,
    refetchSummary,
  } = useWorkingCapitalOptimization()

  const [customScenario, setCustomScenario] = useState(null)
  const [approvalEvaluation, setApprovalEvaluation] = useState(null)

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        maximumFractionDigits: 0,
      }),
    [selectedCurrency]
  )

  const formatCurrency = value =>
    typeof value === 'number' && Number.isFinite(value) ? currencyFormatter.format(value) : '--'

  const formatNumber = value =>
    typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '--'

  const getMonetaryTotal = source => {
    if (!source || typeof source !== 'object') return null
    const keys = ['total', 'totalOutstanding', 'value', 'totalValue', 'balance', 'amount']
    for (const key of keys) {
      const candidate = source[key]
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate
      }
    }
    return null
  }

  const runScenarioAsync = scenarioMutation.mutateAsync
  const evaluateApprovalAsync = approvalMutation.mutateAsync
  const mitigationAsync = mitigationMutation.mutateAsync

  const handleScenarioSimulation = async payload => {
    try {
      const response = await runScenarioAsync(payload)
      let plan = null

      if (response?.scenario?.metrics) {
        try {
          const mitigation = await mitigationAsync({
            metrics: response.scenario.metrics,
            scenarios: [response.scenario],
          })
          plan = mitigation?.plan || null
        } catch (error) {
          logError('Mitigation plan generation failed', error)
        }
      }

      setCustomScenario({ ...response, plan })
      setApprovalEvaluation(null)
      refetchSummary()
    } catch (error) {
      logError('Scenario modelling failed', error)
    }
  }

  const handleApprovalEvaluation = async payload => {
    try {
      const response = await evaluateApprovalAsync({
        ...payload,
        scenarioKey: payload?.scenarioKey || customScenario?.scenario?.key,
      })
      setApprovalEvaluation(response?.evaluation || null)
    } catch (error) {
      logError('Approval evaluation failed', error)
    }
  }

  useEffect(() => {
    if (isViewer) {
      return
    }
    const start = performance.now()
    if (metrics && !loading) {
      audit.logDashboardLoad(performance.now() - start, Object.keys(metrics).length)
    }
  }, [metrics, loading, audit, isViewer])

  useEffect(() => {
    if (isViewer) {
      return undefined
    }
    const interval = setInterval(() => {
      audit.logMetricRefresh('auto_refresh', 'periodic')
      refetch()
    }, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refetch, audit, isViewer])

  if (isViewer) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Unable to load data</h3>
                <p className="text-red-600 dark:text-red-400 mt-1">{error.message}</p>
                <button
                  type="button"
                  onClick={() => {
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

  if (!metrics) {
    return null
  }

  const { summary, receivables, payables, inventory, cashFlow, recommendations, alerts, cccHistory } = metrics

  const plannerBaseline = customScenario?.baseline || optimizationBaseline
  const baseScenarioList = Array.isArray(optimizationScenarios) ? optimizationScenarios : []
  const plannerScenarios = customScenario?.scenario
    ? [...baseScenarioList.filter(item => item.key !== 'custom'), { ...customScenario.scenario, key: customScenario.scenario.key || 'custom' }]
    : baseScenarioList

  const mitigationPlan = customScenario?.plan || optimizationPlan
  const isScenarioRunning = scenarioMutation.isPending || mitigationMutation.isPending

  const receivablesTotal = getMonetaryTotal(receivables)
  const payablesTotal = getMonetaryTotal(payables)
  const inventoryTotal = getMonetaryTotal(inventory)

  const handleExport = async format => {
    const start = performance.now()
    try {
      audit.logExport(format, { period: selectedPeriod })
      await exportData(format)
      audit.trackAction('export_success', {
        format,
        duration: Math.round(performance.now() - start),
        period: selectedPeriod
      })
    } catch (err) {
      audit.logError(err, {
        action: 'data_export',
        format,
        period: selectedPeriod,
        duration: performance.now() - start
      })
      logError('Export failed', err)
    }
  }

  const handlePeriodChange = newPeriod => {
    audit.logPeriodChange(selectedPeriod, newPeriod)
    setSelectedPeriod(newPeriod)
  }

  const handleCurrencyChange = newCurrency => {
    audit.logCurrencyChange(selectedCurrency, newCurrency)
    setSelectedCurrency(newCurrency)
  }

  const handleRefresh = () => {
    audit.logMetricRefresh('manual_refresh', 'user_initiated')
    refetch()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <BanknotesIcon className="h-8 w-8 mr-3 text-blue-600" />
                Working Capital Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Live working capital, cash flow, and liquidity intelligence
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCurrency}
                onChange={event => handleCurrencyChange(event.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>

              <select
                value={selectedPeriod}
                onChange={event => handlePeriodChange(event.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="current">Current</option>
                <option value="mtd">Month to Date</option>
                <option value="qtd">Quarter to Date</option>
                <option value="ytd">Year to Date</option>
              </select>

              <div className="relative group">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  {SUPPORTED_EXPORTS.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleExport(option)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Export as {option.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
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
        {/* Xero connection banners removed - custom connections don't require user interaction */}

        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
            <span
              className={`w-2 h-2 rounded-full mr-2 ${isUsingRealData ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
            />
            {isUsingRealData ? 'Data source: PostgreSQL (live)' : 'Data source: awaiting live feed'}
          </div>
        </div>

        {alerts?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Alerts</h2>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg border flex items-start"
                >
                  <ExclamationTriangleIcon
                    className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.description}</p>
                    {alert.action && (
                      <button type="button" className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                        {alert.action}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Working Capital"
            value={summary?.workingCapital ?? null}
            change={summary?.workingCapitalChange}
            format="currency"
            icon={BanknotesIcon}
            color="blue"
          />
          <MetricCard
            title="Cash Conversion Cycle"
            value={summary?.cashConversionCycle ?? null}
            change={summary?.cccChange}
            format="days"
            icon={ChartBarIcon}
            color="green"
            target={30}
          />
          <MetricCard
            title="Current Ratio"
            value={summary?.currentRatio ?? null}
            change={summary?.currentRatioChange}
            format="ratio"
            icon={ArrowTrendingUpIcon}
            color="purple"
            target={2.0}
          />
          <MetricCard
            title="Quick Ratio"
            value={summary?.quickRatio ?? null}
            change={summary?.quickRatioChange}
            format="ratio"
            icon={ArrowTrendingDownIcon}
            color="orange"
            target={1.5}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accounts Receivable</h3>
            {receivables ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Outstanding</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(receivablesTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">DSO</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(receivables.dso)} days
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">Receivables metrics are not available for this period.</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accounts Payable</h3>
            {payables ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Outstanding</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payablesTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">DPO</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(payables.dpo)} days
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">Payables metrics are not available for this period.</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory</h3>
            {inventory ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(inventoryTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">DIO</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(inventory.dio)} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Turnover Ratio</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(inventory.turnoverRatio)}x
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">Inventory metrics are not available for this period.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AgingChart
            receivables={receivables?.aging}
            payables={payables?.aging}
            title="AR/AP Aging"
          />
          <CashConversionCycle
            dso={receivables?.dso ?? null}
            dio={inventory?.dio ?? null}
            dpo={payables?.dpo ?? null}
            historical={cccHistory}
          />
        </div>

        <div className="mb-8">
          <CashFlowForecast data={cashFlow} period={selectedPeriod} />
        </div>

        <OptimizationRecommendations
          recommendations={recommendations}
          onActionClick={action => devLog.log('Recommendation action clicked', action)}
        />

        {optimizationSummaryQuery.isLoading ? (
          <div className="mt-8 rounded-lg border border-dashed border-border dark:border-gray-700 p-6 text-sm text-gray-600 dark:text-gray-400">
            Running optimisation analysis…
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {plannerBaseline && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ScenarioPlanner
                  baseline={plannerBaseline}
                  scenarios={plannerScenarios}
                  onRunScenario={handleScenarioSimulation}
                  isRunning={isScenarioRunning}
                />
                <ApprovalInsights
                  onEvaluate={payload => handleApprovalEvaluation({
                    ...payload,
                    scenarioKey: customScenario?.scenario?.key,
                  })}
                  evaluation={approvalEvaluation}
                  isLoading={approvalMutation.isPending}
                />
              </div>
            )}

            {mitigationPlan && <MitigationPlan plan={mitigationPlan} />}
          </div>
        )}
      </div>
    </div>
  )
}

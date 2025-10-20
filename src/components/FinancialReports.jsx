import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarIcon,
  ChartBarIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  MinusIcon,
} from '@heroicons/react/24/outline'
import apiService from '@/services/api'

const asNumber = value => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatCurrency = value => {
  const number = asNumber(value)
  if (number === null) {
    return 'N/A'
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: number >= 1_000_000 ? 0 : 1,
  }).format(number)
}

const formatRatio = value => {
  const number = asNumber(value)
  if (number === null) {
    return 'N/A'
  }

  return `${number.toFixed(2)}x`
}

const formatDays = value => {
  const number = asNumber(value)
  if (number === null) {
    return 'N/A'
  }

  return `${Math.round(number)} days`
}

const derivePercentChange = (current, previous) => {
  const currentNumber = asNumber(current)
  const previousNumber = asNumber(previous)

  if (currentNumber === null || previousNumber === null || previousNumber === 0) {
    return null
  }

  return ((currentNumber - previousNumber) / Math.abs(previousNumber)) * 100
}

const resolveTrendDirection = change => {
  const value = asNumber(change)

  if (value === null) {
    return 'neutral'
  }

  if (value > 0) {
    return 'up'
  }

  if (value < 0) {
    return 'down'
  }

  return 'neutral'
}

const TrendIndicator = ({ change, direction }) => {
  const value = asNumber(change)
  if (value === null) {
    return null
  }

  const iconMap = {
    up: ArrowTrendingUpIcon,
    down: ArrowTrendingDownIcon,
    neutral: MinusIcon,
  }

  const IconComponent = iconMap[direction] || iconMap.neutral
  const color =
    direction === 'up' ? 'text-green-600' : direction === 'down' ? 'text-red-600' : 'text-slate-500'

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${color}`}>
      <IconComponent className="w-4 h-4" />
      <span>{`${value > 0 ? '+' : ''}${value.toFixed(1)}%`}</span>
    </div>
  )
}

const MetricCard = ({ title, value, icon: IconComponent, changePercent, description, trend }) => {
  const direction = trend ?? resolveTrendDirection(changePercent)

  return (
    <Card className="border">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {IconComponent && (
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <IconComponent className="w-6 h-6" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value ?? 'N/A'}</p>
              {description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
              )}
            </div>
          </div>
          <TrendIndicator change={changePercent} direction={direction} />
        </div>
      </CardContent>
    </Card>
  )
}

const FinancialReports = () => {
  const [summary, setSummary] = useState(null)
  const [workingCapital, setWorkingCapital] = useState(null)
  const [cashFlow, setCashFlow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchFinancialData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [summaryResult, workingCapitalResult, cashFlowResult] = await Promise.allSettled([
        apiService.getDashboardSummary(),
        apiService.getWorkingCapital(),
        apiService.getCashFlow(),
      ])

      const resolvedSummary = summaryResult.status === 'fulfilled' ? summaryResult.value : null
      const resolvedWorkingCapital =
        workingCapitalResult.status === 'fulfilled' ? workingCapitalResult.value : null
      const resolvedCashFlow = cashFlowResult.status === 'fulfilled' ? cashFlowResult.value : null

      setSummary(resolvedSummary)
      setWorkingCapital(resolvedWorkingCapital)
      setCashFlow(resolvedCashFlow)
      setLastUpdated(new Date())
    } catch (fetchError) {
      console.error('Failed to load financial data', fetchError)
      setError(fetchError.message || 'Unable to load financial data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFinancialData()
  }, [fetchFinancialData])

  const workingCapitalSeries = useMemo(() => {
    if (!workingCapital) {
      return []
    }

    if (Array.isArray(workingCapital?.data)) {
      return workingCapital.data
    }

    if (Array.isArray(workingCapital?.entries)) {
      return workingCapital.entries
    }

    if (Array.isArray(workingCapital?.history)) {
      return workingCapital.history
    }

    return []
  }, [workingCapital])

  const latestWorkingCapital = useMemo(() => {
    if (workingCapital?.latest) {
      return workingCapital.latest
    }

    if (workingCapitalSeries.length > 0) {
      return workingCapitalSeries[0]
    }

    if (workingCapital && workingCapital.data && !Array.isArray(workingCapital.data)) {
      return workingCapital.data
    }

    return null
  }, [workingCapital, workingCapitalSeries])

  const previousWorkingCapital = useMemo(() => {
    if (workingCapital?.previous) {
      return workingCapital.previous
    }

    if (workingCapitalSeries.length > 1) {
      return workingCapitalSeries[1]
    }

    return null
  }, [workingCapital, workingCapitalSeries])

  const cashFlowSeries = useMemo(() => {
    if (!cashFlow) {
      return []
    }

    if (Array.isArray(cashFlow?.data)) {
      return cashFlow.data
    }

    if (Array.isArray(cashFlow?.rows)) {
      return cashFlow.rows
    }

    return []
  }, [cashFlow])

  const latestCashFlow = useMemo(() => {
    if (cashFlow?.latest) {
      return cashFlow.latest
    }

    if (cashFlowSeries.length > 0) {
      return cashFlowSeries[0]
    }

    return null
  }, [cashFlow, cashFlowSeries])

  const previousCashFlow = useMemo(() => {
    if (cashFlowSeries.length > 1) {
      return cashFlowSeries[1]
    }

    return null
  }, [cashFlowSeries])

  const workingCapitalCurrent = useMemo(() => {
    const explicit = asNumber(latestWorkingCapital?.workingCapital)
    if (explicit !== null) {
      return explicit
    }

    const currentAssets = asNumber(latestWorkingCapital?.currentAssets)
    const currentLiabilities = asNumber(latestWorkingCapital?.currentLiabilities)

    if (currentAssets !== null && currentLiabilities !== null) {
      return currentAssets - currentLiabilities
    }

    return null
  }, [latestWorkingCapital])

  const workingCapitalPrevious = useMemo(() => {
    const explicit = asNumber(previousWorkingCapital?.workingCapital)
    if (explicit !== null) {
      return explicit
    }

    const previousAssets = asNumber(previousWorkingCapital?.currentAssets)
    const previousLiabilities = asNumber(previousWorkingCapital?.currentLiabilities)

    if (previousAssets !== null && previousLiabilities !== null) {
      return previousAssets - previousLiabilities
    }

    return null
  }, [previousWorkingCapital])

  const summaryMetrics = useMemo(() => {
    const revenueGrowth = asNumber(summary?.revenue?.growth)
    const currentRatioChange = derivePercentChange(
      latestWorkingCapital?.workingCapitalRatio,
      previousWorkingCapital?.workingCapitalRatio
    )
    const cccChange = derivePercentChange(
      latestWorkingCapital?.cashConversionCycle,
      previousWorkingCapital?.cashConversionCycle
    )
    const workingCapitalChange = derivePercentChange(workingCapitalCurrent, workingCapitalPrevious)
    const cashFlowChange = derivePercentChange(
      latestCashFlow?.netCashFlow,
      previousCashFlow?.netCashFlow
    )

    return [
      {
        title: 'Monthly Revenue',
        value: formatCurrency(summary?.revenue?.monthly),
        changePercent: revenueGrowth,
        icon: ChartBarIcon,
        description: 'Revenue generated in the current month',
        trend: resolveTrendDirection(revenueGrowth),
      },
      {
        title: 'Working Capital',
        value: formatCurrency(workingCapitalCurrent),
        changePercent: workingCapitalChange,
        icon: CurrencyDollarIcon,
        description: 'Current assets minus liabilities',
        trend: resolveTrendDirection(workingCapitalChange),
      },
      {
        title: 'Current Ratio',
        value: formatRatio(latestWorkingCapital?.workingCapitalRatio),
        changePercent: currentRatioChange,
        icon: ChartPieIcon,
        description: 'Liquidity coverage of short-term obligations',
        trend: resolveTrendDirection(currentRatioChange),
      },
      {
        title: 'Cash Conversion Cycle',
        value: formatDays(latestWorkingCapital?.cashConversionCycle),
        changePercent: cccChange,
        icon: ArrowPathIcon,
        description: 'Time to convert investments to cash',
        trend: resolveTrendDirection(cccChange),
      },
      {
        title: 'Net Cash Flow',
        value: formatCurrency(latestCashFlow?.netCashFlow),
        changePercent: cashFlowChange,
        icon: BanknotesIcon,
        description: 'Operating + investing + financing cash flow',
        trend: resolveTrendDirection(cashFlowChange),
      },
    ]
  }, [
    summary,
    workingCapitalCurrent,
    workingCapitalPrevious,
    latestWorkingCapital,
    previousWorkingCapital,
    latestCashFlow,
    previousCashFlow,
  ])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <DocumentChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Financial Reports
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Comprehensive financial analysis for CapLiquify Platform
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
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
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <DocumentChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Comprehensive financial analysis for CapLiquify Platform
            </p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <div className="space-y-2">
                <h3 className="font-medium text-red-900 dark:text-red-200">
                  Unable to load financial data
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={fetchFinancialData}
                  className="text-sm font-medium text-red-600 hover:text-red-500 underline"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <DocumentChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time financial analysis for CapLiquify Platform
            </p>
          </div>
        </div>

        <button
          onClick={fetchFinancialData}
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryMetrics.map(metric => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            changePercent={metric.changePercent}
            description={metric.description}
            trend={metric.trend}
          />
        ))}
      </div>

      {latestWorkingCapital && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
              Working Capital Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900 dark:text-white">
                  Cash Conversion Cycle
                </h4>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {formatDays(latestWorkingCapital.cashConversionCycle)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Time required to convert investments to cash
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900 dark:text-white">Accounts Receivable</h4>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(latestWorkingCapital.accountsReceivable)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Outstanding customer payments
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900 dark:text-white">Accounts Payable</h4>
                <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(latestWorkingCapital.accountsPayable)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Outstanding supplier payments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {latestCashFlow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BanknotesIcon className="w-5 h-5 text-blue-600" />
              Cash Flow Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Operating</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(latestCashFlow.operatingCashFlow)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Investing</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(latestCashFlow.investingCashFlow)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Financing</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(latestCashFlow.financingCashFlow)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Net Cash Flow
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(latestCashFlow.netCashFlow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2">
            <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
              <CalendarIcon className="w-4 h-4" />
              <span>Data sourced from manufacturing finance services</span>
            </div>
            {lastUpdated && (
              <span className="text-blue-600 dark:text-blue-400">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
            Financial metrics combine working capital, cash flow, and dashboard summary endpoints
            with live authentication.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FinancialReports

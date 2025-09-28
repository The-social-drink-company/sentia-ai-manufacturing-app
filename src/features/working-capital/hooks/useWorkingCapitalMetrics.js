import { useCallback, useEffect, useMemo, useState } from 'react'
import { workingCapitalApi } from '../../../services/api/workingCapitalApi'
import { logError, logWarn } from '../../../utils/structuredLogger.js'

const percentChange = (current, previous) => {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return null
  }

  if (previous === 0) {
    return null
  }

  return ((current - previous) / Math.abs(previous)) * 100
}

const buildSummary = (latest, previous) => {
  if (!latest) {
    return null
  }

  const workingCapitalCurrent = latest.currentAssets - latest.currentLiabilities
  const workingCapitalPrevious = previous
    ? previous.currentAssets - previous.currentLiabilities
    : null

  return {
    workingCapital: workingCapitalCurrent,
    workingCapitalChange: percentChange(workingCapitalCurrent, workingCapitalPrevious),
    cashConversionCycle: latest.cashConversionCycle,
    cccChange: percentChange(latest.cashConversionCycle, previous?.cashConversionCycle),
    currentRatio: latest.workingCapitalRatio,
    currentRatioChange: percentChange(latest.workingCapitalRatio, previous?.workingCapitalRatio),
    quickRatio: latest.quickRatio,
    quickRatioChange: percentChange(latest.quickRatio, previous?.quickRatio)
  }
}

const buildReceivables = latest => {
  if (!latest) {
    return null
  }

  return {
    total: latest.accountsReceivable ?? null,
    dso: latest.dso ?? null,
    overdue: null,
    aging: null
  }
}

const buildPayables = latest => {
  if (!latest) {
    return null
  }

  return {
    total: latest.accountsPayable ?? null,
    dpo: latest.dpo ?? null,
    discountsAvailable: null,
    aging: null
  }
}

const buildInventory = (latest, inventorySummary) => {
  if (!latest && !inventorySummary) {
    return null
  }

  return {
    total: inventorySummary?.totalValue ?? latest?.inventory ?? null,
    dio: latest?.dio ?? null,
    turnoverRatio: inventorySummary?.turnover ?? null
  }
}

const buildCccHistory = entries => {
  if (!entries?.length) {
    return []
  }

  return entries
    .slice(0, 6)
    .reverse()
    .map(entry => ({
      month: new Date(entry.date).toLocaleDateString('en', { month: 'short' }),
      ccc: entry.cashConversionCycle,
      dso: entry.dso,
      dio: entry.dio,
      dpo: entry.dpo
    }))
}

const buildCashFlowSeries = (rows, openingBalance) => {
  if (!rows?.length) {
    return []
  }

  const ordered = [...rows].reverse()
  let runningBalance = openingBalance ?? 0

  return ordered.map(row => {
    const inflow = ['operatingCashFlow', 'financingCashFlow', 'investingCashFlow']
      .map(key => Math.max(row[key] ?? 0, 0))
      .reduce((acc, value) => acc + value, 0)

    const outflow = ['operatingCashFlow', 'financingCashFlow', 'investingCashFlow']
      .map(key => Math.min(row[key] ?? 0, 0))
      .reduce((acc, value) => acc + value, 0)

    runningBalance += row.netCashFlow ?? 0

    return {
      date: row.date,
      inflow,
      outflow: Math.abs(outflow),
      netFlow: row.netCashFlow ?? inflow + outflow,
      runningBalance
    }
  })
}

const buildAlerts = (summary, receivables, payables, inventory) => {
  const alerts = []

  if (summary?.cashConversionCycle && summary.cashConversionCycle > 60) {
    alerts.push({
      id: 'ccc-alert',
      severity: 'warning',
      title: 'Cash conversion cycle deteriorating',
      description: CCC is  days. Target is < 45 days.,
      action: 'Review receivable collections and inventory turns'
    })
  }

  if (receivables?.dso && receivables.dso > 45) {
    alerts.push({
      id: 'dso-alert',
      severity: 'warning',
      title: 'Days sales outstanding elevated',
      description: Current DSO is  days. Typical SaaS benchmark is 35-40 days.,
      action: 'Prioritise collections for invoices older than 30 days'
    })
  }

  if (payables?.dpo && payables.dpo < 20) {
    alerts.push({
      id: 'dpo-alert',
      severity: 'info',
      title: 'Supplier payments being settled early',
      description: DPO is  days. Consider negotiating extended terms.,
      action: 'Engage top suppliers regarding 45-day terms'
    })
  }

  if (inventory?.dio && inventory.dio > 45) {
    alerts.push({
      id: 'inventory-alert',
      severity: 'warning',
      title: 'Inventory days on hand above target',
      description: Inventory is sitting  days on average.,
      action: 'Reduce purchase orders for slow-moving SKUs'
    })
  }

  return alerts
}

const buildRecommendations = (summary, receivables, payables, inventory) => {
  const recommendations = []

  if (receivables?.total && receivables.dso && receivables.dso > 45) {
    recommendations.push({
      id: 'accelerate-collections',
      type: 'receivables',
      priority: 'high',
      title: 'Accelerate collections',
      description: 'Implement targeted outreach on invoices older than 30 days.',
      impact: Potential cash unlock: ,
      effort: 'medium',
      timeframe: '2-3 weeks'
    })
  }

  if (payables?.total && payables.dpo && payables.dpo < 25) {
    recommendations.push({
      id: 'extend-terms',
      type: 'payables',
      priority: 'medium',
      title: 'Optimise supplier payment terms',
      description: 'Explore extending standard payment terms to 45 days with strategic partners.',
      impact: Potential cash preservation: ,
      effort: 'low',
      timeframe: '1-2 weeks'
    })
  }

  if (inventory?.total && inventory.dio && inventory.dio > 45) {
    recommendations.push({
      id: 'reduce-inventory',
      type: 'inventory',
      priority: 'high',
      title: 'Reduce excess inventory',
      description: 'Slow-moving items are tying up cash. Prioritise liquidation or production rescheduling.',
      impact: Potential free cash: ,
      effort: 'high',
      timeframe: '4-6 weeks'
    })
  }

  return recommendations
}

const createExporter = data => async format => {
  if (!data) {
    throw new Error('No working capital data to export')
  }

  const timestamp = new Date().toISOString().split('T')[0]

  if (format === 'csv') {
    const headers = ['Metric', 'Value']
    const rows = []

    if (data.summary) {
      rows.push(['Working Capital', data.summary.workingCapital ?? ''])
      rows.push(['Cash Conversion Cycle', data.summary.cashConversionCycle ?? ''])
      rows.push(['Current Ratio', data.summary.currentRatio ?? ''])
      rows.push(['Quick Ratio', data.summary.quickRatio ?? ''])
    }

    if (data.receivables) {
      rows.push(['Accounts Receivable', data.receivables.total ?? ''])
      rows.push(['DSO', data.receivables.dso ?? ''])
    }

    if (data.payables) {
      rows.push(['Accounts Payable', data.payables.total ?? ''])
      rows.push(['DPO', data.payables.dpo ?? ''])
    }

    if (data.inventory) {
      rows.push(['Inventory Value', data.inventory.total ?? ''])
      rows.push(['DIO', data.inventory.dio ?? ''])
    }

    const csvBody = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvBody], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = working-capital-.csv
    link.click()
    return
  }

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = working-capital-.json
    link.click()
    return
  }

  throw new Error(Export format \"\" is not supported yet.)
}

export function useWorkingCapitalMetrics(period = 'current') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [workingCapital, cashFlow, financialMetrics, inventory] = await Promise.all([
        workingCapitalApi.getWorkingCapital(period),
        workingCapitalApi.getCashFlow(),
        workingCapitalApi.getFinancialMetrics(),
        workingCapitalApi.getDashboardSummary().then(summary => summary?.inventory ?? null).catch(error => {
          logWarn('Failed to load dashboard summary', error)
          return null
        })
      ])

      const entries = workingCapital?.data ?? []
      if (!entries.length) {
        throw new Error('No working capital records available yet.')
      }

      const latest = workingCapital.latest ?? entries[0]
      const previous = entries[1] ?? null

      const summary = buildSummary(latest, previous)
      const receivables = buildReceivables(latest)
      const payables = buildPayables(latest)
      const inventoryMetrics = buildInventory(latest, inventory)
      const cashFlowSeries = buildCashFlowSeries(cashFlow?.data ?? [], latest?.cash)
      const cccHistory = buildCccHistory(entries)
      const alerts = buildAlerts(summary, receivables, payables, inventoryMetrics)
      const recommendations = buildRecommendations(summary, receivables, payables, inventoryMetrics)

      setData({
        summary,
        receivables,
        payables,
        inventory: inventoryMetrics,
        cashFlow: {
          series: cashFlowSeries,
          latest: cashFlow?.latest ?? null
        },
        recommendations,
        alerts,
        cccHistory,
        source: {
          workingCapital: workingCapital?.dataSource ?? null,
          cashFlow: cashFlow?.dataSource ?? null,
          metrics: financialMetrics?.dataSource ?? null
        }
      })
    } catch (err) {
      logError('Failed to load working capital metrics', err)
      setError(err instanceof Error ? err : new Error('Failed to load working capital metrics'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportData = useMemo(() => createExporter(data), [data])
  const isUsingRealData = Boolean(data?.source?.workingCapital === 'database')

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    exportData,
    isXeroConnected: false,
    xeroStatus: null,
    isUsingRealData
  }
}

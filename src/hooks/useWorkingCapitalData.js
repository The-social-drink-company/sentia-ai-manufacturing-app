import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : '/api'

function buildUrl(path, params) {
  if (!params || Object.keys(params).length === 0) {
    return path
  }

  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  ).toString()

  return query ? path + '?' + query : path
}

async function getClerkToken() {
  if (typeof window === 'undefined') {
    return null
  }

  const clerkSession = window.Clerk && window.Clerk.session
  if (!clerkSession || typeof clerkSession.getToken !== 'function') {
    return null
  }

  try {
    return await clerkSession.getToken({ template: 'sentia-backend' })
  } catch (error) {
    console.warn('[useWorkingCapitalData] Clerk token fetch failed, retrying with default session token', error)
    return clerkSession.getToken()
  }
}

async function fetchJson(path, params) {
  const headers = new Headers()
  headers.set('Accept', 'application/json')

  const url = buildUrl(API_BASE_URL + path, params)
  const token = await getClerkToken()
  if (token) {
    headers.set('Authorization', 'Bearer ' + token)
  }

  const response = await fetch(url, { method: 'GET', headers })

  if (!response.ok) {
    let details = {}
    try {
      details = await response.json()
    } catch {
      // ignore parsing issues here
    }

    const message = details?.error || details?.message || 'HTTP ' + response.status + ' ' + response.statusText
    const error = new Error(message)
    error.status = response.status
    error.details = details
    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function percentChange(currentValue, previousValue) {
  if (currentValue === null || currentValue === undefined || previousValue === null || previousValue === undefined) {
    return null
  }

  if (previousValue === 0) {
    return null
  }

  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100
}

function deriveSummary(latest, previous) {
  if (!latest) {
    return null
  }

  const workingCapitalCurrent = (latest.currentAssets ?? 0) - (latest.currentLiabilities ?? 0)
  const workingCapitalPrior = previous ? (previous.currentAssets ?? 0) - (previous.currentLiabilities ?? 0) : null

  return {
    workingCapital: workingCapitalCurrent,
    workingCapitalChange: percentChange(workingCapitalCurrent, workingCapitalPrior),
    cashConversionCycle: latest.cashConversionCycle ?? null,
    cccChange: percentChange(latest.cashConversionCycle ?? null, previous?.cashConversionCycle ?? null),
    currentRatio: latest.workingCapitalRatio ?? null,
    currentRatioChange: percentChange(latest.workingCapitalRatio ?? null, previous?.workingCapitalRatio ?? null),
    quickRatio: latest.quickRatio ?? null,
    quickRatioChange: percentChange(latest.quickRatio ?? null, previous?.quickRatio ?? null),
  }
}

function buildAlerts(summary, latest) {
  const alerts = []

  if (summary?.cashConversionCycle && summary.cashConversionCycle > 60) {
    alerts.push({
      id: 'ccc',
      severity: summary.cashConversionCycle > 75 ? 'critical' : 'warning',
      title: 'Cash conversion cycle elevated',
      description: `Current CCC is ${Math.round(summary.cashConversionCycle)} days. Target should be under 45 days.`,
      action: 'Review receivables and production throughput to shorten the cycle.',
    })
  }

  if (latest?.dso && latest.dso > 45) {
    alerts.push({
      id: 'dso',
      severity: 'warning',
      title: 'High Days Sales Outstanding',
      description: `DSO is ${Math.round(latest.dso)} days. Collections efficiency is below target.`,
      action: 'Prioritise overdue receivables and incentivise early payment.',
    })
  }

  if (latest?.dpo && latest.dpo < 20) {
    alerts.push({
      id: 'dpo',
      severity: 'info',
      title: 'Supplier payments ahead of terms',
      description: `DPO is ${Math.round(latest.dpo)} days. Extending payment terms could unlock cash.`,
      action: 'Engage strategic suppliers regarding 45-day settlement terms.',
    })
  }

  return alerts
}

function calculateCashFlowInsights(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      series: [],
      totals: null,
      runningBalances: [],
      shortfallDays: [],
    }
  }

  const sorted = rows
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let runningBalance = 0
  const runningBalances = []

  const series = sorted.map((row) => {
    const operating = row.operatingCashFlow ?? 0
    const investing = row.investingCashFlow ?? 0
    const financing = row.financingCashFlow ?? 0
    const net = row.netCashFlow ?? (operating + investing + financing)
    runningBalance += net
    runningBalances.push({ date: row.date, balance: runningBalance })
    return {
      date: row.date,
      operating,
      investing,
      financing,
      net,
    }
  })

  const totals = series.reduce(
    (acc, entry) => {
      acc.operating += entry.operating
      acc.investing += entry.investing
      acc.financing += entry.financing
      acc.net += entry.net
      return acc
    },
    { operating: 0, investing: 0, financing: 0, net: 0 }
  )

  const shortfallDays = runningBalances.filter((entry) => entry.balance < 0)

  return {
    series,
    totals,
    runningBalances,
    shortfallDays,
  }
}

export function useWorkingCapitalData(period = 'current') {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [payload, setPayload] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const workingCapitalParams = period && period !== 'current' ? { period } : undefined

    try {
      const [workingCapitalRes, cashFlowRes, summaryRes, financialMetricsRes] = await Promise.all([
        fetchJson('/financial/working-capital', workingCapitalParams),
        fetchJson('/financial/cash-flow'),
        fetchJson('/dashboard/summary'),
        fetchJson('/financial/metrics').catch(() => null),
      ])

      const workingCapitalData = workingCapitalRes?.data || []
      const latestEntry = workingCapitalRes?.latest || workingCapitalData[0] || null
      const previousEntry = workingCapitalData.length > 1 ? workingCapitalData[1] : null

      if (!latestEntry) {
        throw new Error('Working capital records are not yet available. Ingest financial data to enable this dashboard.')
      }

      const summary = deriveSummary(latestEntry, previousEntry)
      const alerts = buildAlerts(summary, latestEntry)
      const cashFlowInsights = calculateCashFlowInsights(cashFlowRes?.data || [])

      setPayload({
        summary,
        latestEntry,
        previousEntry,
        history: workingCapitalData,
        cashFlow: cashFlowInsights,
        dashboardSummary: summaryRes || null,
        financialMetrics: financialMetricsRes?.metrics || null,
        dataSource: {
          workingCapital: workingCapitalRes?.dataSource || 'unknown',
          cashFlow: cashFlowRes?.dataSource || 'unknown',
        },
        alerts,
        generatedAt: new Date().toISOString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load working capital data'))
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  const computed = useMemo(() => {
    if (!payload) {
      return null
    }

    const receivables = {
      total: payload.latestEntry.accountsReceivable ?? null,
      dso: payload.latestEntry.dso ?? null,
    }

    const payables = {
      total: payload.latestEntry.accountsPayable ?? null,
      dpo: payload.latestEntry.dpo ?? null,
    }

    const inventory = {
      total: payload.latestEntry.inventory ?? (payload.dashboardSummary?.inventory?.value ?? null),
      dio: payload.latestEntry.dio ?? null,
    }

    return {
      ...payload,
      receivables,
      payables,
      inventory,
    }
  }, [payload])

  return {
    loading,
    error,
    data: computed,
    refetch: load,
  }
}

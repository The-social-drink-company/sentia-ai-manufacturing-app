import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

const REFRESH_INTERVAL_MS = 30_000

const parseApiJson = async (endpoint) => {
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include'
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`${endpoint} responded with ${response.status}: ${errorText}`)
  }

  const payload = await response.json().catch(() => null)

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data) || typeof payload.data === 'object') {
      return payload.data
    }

    if (payload.result) {
      return payload.result
    }

    if (payload.success && payload.payload) {
      return payload.payload
    }
  }

  return payload
}

export const parseNumericValue = (raw) => {
  if (raw === null || raw === undefined) {
    return null
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }

  if (typeof raw !== 'string') {
    return null
  }

  const cleaned = raw.trim().toUpperCase()
  if (!cleaned) {
    return null
  }

  let multiplier = 1
  if (cleaned.includes('B')) {
    multiplier = 1_000_000_000
  } else if (cleaned.includes('M')) {
    multiplier = 1_000_000
  } else if (cleaned.includes('K')) {
    multiplier = 1_000
  }

  const numericPart = cleaned.replace(/[^0-9.+\-]/g, '')
  const value = Number(numericPart)

  if (!Number.isFinite(value)) {
    return null
  }

  return value * multiplier
}

export const parsePercentageValue = (raw) => {
  const numeric = parseNumericValue(raw)
  if (numeric === null) {
    return null
  }

  if (typeof raw === 'string' && raw.includes('%')) {
    return numeric
  }

  if (Math.abs(numeric) <= 1) {
    return numeric * 100
  }

  return numeric
}

const findKpiByKeywords = (kpis, keywords = []) => {
  if (!Array.isArray(kpis)) {
    return null
  }

  const lowered = keywords.map((keyword) => keyword.toLowerCase())

  return (
    kpis.find((item) => {
      if (!item) {
        return false
      }

      const haystack = `${item.id || ''} ${item.title || ''} ${item.label || ''}`.toLowerCase()
      return lowered.some((needle) => haystack.includes(needle))
    }) || null
  )
}

const normalizeWorkingCapital = (executiveData, workingCapitalData) => {
  const source = workingCapitalData || executiveData?.workingCapital || {}

  const currentAmount = source.current?.amount ?? source.current_value ?? source.current
  const projectionAmount = source.projection?.amount ?? source.projection ?? source.projection30 ?? source.projection_value
  const changeValue = source.change ?? source.delta ?? source.changePercent ?? source.trend_change

  const series = Array.isArray(source.trend?.points)
    ? source.trend.points
    : Array.isArray(source.trend)
      ? source.trend
      : Array.isArray(source.series)
        ? source.series
        : []

  return {
    current: parseNumericValue(currentAmount),
    rawCurrent: currentAmount,
    projection: parseNumericValue(projectionAmount),
    rawProjection: projectionAmount,
    change: parsePercentageValue(changeValue),
    rawChange: changeValue,
    currency: source.currency || source.unit || 'GBP',
    trend: series
  }
}

const normalizeMetrics = (executiveData, realtimeData) => {
  const metricsSource = realtimeData?.metrics || realtimeData || executiveData?.keyMetrics || {}

  return {
    revenueGrowth: parsePercentageValue(metricsSource.revenueGrowth ?? metricsSource.revenue_growth ?? metricsSource.growth),
    revenueGrowthRaw: metricsSource.revenueGrowth ?? metricsSource.revenue_growth ?? metricsSource.growth,
    orderFulfillment: parsePercentageValue(metricsSource.orderFulfillment ?? metricsSource.order_fulfillment ?? metricsSource.fulfillmentRate),
    orderFulfillmentRaw: metricsSource.orderFulfillment ?? metricsSource.order_fulfillment ?? metricsSource.fulfillmentRate,
    customerSatisfaction: parseNumericValue(metricsSource.customerSatisfaction ?? metricsSource.customer_satisfaction ?? metricsSource.csat),
    customerSatisfactionRaw: metricsSource.customerSatisfaction ?? metricsSource.customer_satisfaction ?? metricsSource.csat,
    inventoryTurnover: parseNumericValue(metricsSource.inventoryTurnover ?? metricsSource.inventory_turnover ?? metricsSource.turnover),
    inventoryTurnoverRaw: metricsSource.inventoryTurnover ?? metricsSource.inventory_turnover ?? metricsSource.turnover
  }
}

const normalizeQuickActions = (executiveData) => {
  if (!executiveData?.quickActions) {
    return []
  }

  return executiveData.quickActions
    .filter(Boolean)
    .map((action) => ({
      id: action.id || (action.title ? action.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'action'),
      title: action.title || action.label,
      description: action.description,
      action: action.action || action.href || '#'
    }))
}

const normalizeRealtimeSeries = (realtimeData) => {
  if (!realtimeData) {
    return []
  }

  if (Array.isArray(realtimeData.series)) {
    return realtimeData.series
  }

  if (Array.isArray(realtimeData.timeline)) {
    return realtimeData.timeline
  }

  if (Array.isArray(realtimeData.points)) {
    return realtimeData.points
  }

  if (Array.isArray(realtimeData.trend)) {
    return realtimeData.trend
  }

  if (Array.isArray(realtimeData.metrics)) {
    return realtimeData.metrics
  }

  return []
}

const normalizeExecutiveDashboard = (executiveData, realtimeData, workingCapitalData) => {
  const kpis = executiveData?.kpis || executiveData?.metrics || []

  const revenueKpi = findKpiByKeywords(kpis, ['revenue'])
  const ordersKpi = findKpiByKeywords(kpis, ['order', 'orders'])
  const inventoryKpi = findKpiByKeywords(kpis, ['inventory'])
  const customersKpi = findKpiByKeywords(kpis, ['customer'])

  const normalizedKpis = [
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      description: 'Monthly recurring revenue',
      value: parseNumericValue(revenueKpi?.value ?? revenueKpi?.amount ?? revenueKpi?.current),
      rawValue: revenueKpi?.value ?? revenueKpi?.amount ?? revenueKpi?.current,
      trend: parsePercentageValue(revenueKpi?.change ?? revenueKpi?.delta ?? revenueKpi?.trend),
      rawTrend: revenueKpi?.change ?? revenueKpi?.delta ?? revenueKpi?.trend
    },
    {
      id: 'active-orders',
      title: 'Active Orders',
      description: 'Orders in production',
      value: parseNumericValue(ordersKpi?.value ?? ordersKpi?.count ?? ordersKpi?.current),
      rawValue: ordersKpi?.value ?? ordersKpi?.count ?? ordersKpi?.current,
      trend: parsePercentageValue(ordersKpi?.change ?? ordersKpi?.delta ?? ordersKpi?.trend),
      rawTrend: ordersKpi?.change ?? ordersKpi?.delta ?? ordersKpi?.trend
    },
    {
      id: 'inventory-value',
      title: 'Inventory Value',
      description: 'Current stock valuation',
      value: parseNumericValue(inventoryKpi?.value ?? inventoryKpi?.amount ?? inventoryKpi?.current),
      rawValue: inventoryKpi?.value ?? inventoryKpi?.amount ?? inventoryKpi?.current,
      trend: parsePercentageValue(inventoryKpi?.change ?? inventoryKpi?.delta ?? inventoryKpi?.trend),
      rawTrend: inventoryKpi?.change ?? inventoryKpi?.delta ?? inventoryKpi?.trend
    },
    {
      id: 'active-customers',
      title: 'Active Customers',
      description: 'Customers with active orders',
      value: parseNumericValue(customersKpi?.value ?? customersKpi?.count ?? customersKpi?.current),
      rawValue: customersKpi?.value ?? customersKpi?.count ?? customersKpi?.current,
      trend: parsePercentageValue(customersKpi?.change ?? customersKpi?.delta ?? customersKpi?.trend),
      rawTrend: customersKpi?.change ?? customersKpi?.delta ?? customersKpi?.trend
    }
  ]

  const workingCapital = normalizeWorkingCapital(executiveData, workingCapitalData)
  const keyMetrics = normalizeMetrics(executiveData, realtimeData)
  const quickActions = normalizeQuickActions(executiveData)
  const realtimeSeries = normalizeRealtimeSeries(realtimeData)

  return {
    kpis: normalizedKpis,
    workingCapital,
    keyMetrics,
    quickActions,
    realtimeSeries,
    raw: {
      executive: executiveData,
      realtime: realtimeData,
      workingCapital: workingCapitalData
    }
  }
}

export const useExecutiveDashboard = (options = {}) => {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['executive-dashboard', options?.queryKey],
        queryFn: () => parseApiJson('/api/dashboard/executive'),
        refetchInterval: REFRESH_INTERVAL_MS,
        refetchIntervalInBackground: true,
        retry: 1,
        enabled: options?.enabled ?? true
      },
      {
        queryKey: ['executive-realtime-metrics', options?.queryKey],
        queryFn: () => parseApiJson('/api/metrics/realtime'),
        refetchInterval: REFRESH_INTERVAL_MS,
        refetchIntervalInBackground: true,
        retry: 1,
        enabled: options?.enabled ?? true
      },
      {
        queryKey: ['executive-working-capital', options?.queryKey],
        queryFn: () => parseApiJson('/api/working-capital/current'),
        refetchInterval: REFRESH_INTERVAL_MS,
        refetchIntervalInBackground: true,
        retry: 1,
        enabled: options?.enabled ?? true
      }
    ]
  })

  const [executiveQuery, realtimeQuery, workingCapitalQuery] = queries

  const normalized = useMemo(
    () => normalizeExecutiveDashboard(executiveQuery.data, realtimeQuery.data, workingCapitalQuery.data),
    [executiveQuery.data, realtimeQuery.data, workingCapitalQuery.data]
  )

  const isLoading = queries.some((query) => query.isLoading)
  const isFetching = queries.some((query) => query.isFetching)
  const isError = queries.some((query) => query.isError)
  const error = queries.find((query) => query.isError)?.error ?? null

  const refetch = async () => {
    return Promise.all(queries.map((query) => query.refetch()))
  }

  return {
    data: normalized,
    queries,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  }
}

export default useExecutiveDashboard

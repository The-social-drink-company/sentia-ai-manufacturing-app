import { useQuery, useQueries } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const fetchFinancialData = async (endpoint, params = {}) => {
  const url = new URL(`${API_BASE}/financial/${endpoint}`, window.location.origin)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString())
    }
  })

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Query keys for consistent caching
export const financialQueryKeys = {
  kpiMetrics: (timeRange, filters) => ['financial', 'kpi', { timeRange, filters }],
  revenueData: range => ['financial', 'revenue', range],
  profitMarginData: range => ['financial', 'profit-margin', range],
  productPerformance: () => ['financial', 'products'],
  insights: () => ['financial', 'insights'],
}

// Custom hooks
export const useFinancialKPIData = (timeRange = 'year', filters = {}) => {
  return useQuery({
    queryKey: financialQueryKeys.kpiMetrics(timeRange, filters),
    queryFn: () => fetchFinancialData('dashboard', { period: timeRange, ...filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })
}

export const useFinancialChartsData = (revenueRange = '1y', profitRange = '1y') => {
  const results = useQueries({
    queries: [
      {
        queryKey: financialQueryKeys.revenueData(revenueRange),
        queryFn: () => fetchFinancialData('revenue-trends', { range: revenueRange }),
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      },
      {
        queryKey: financialQueryKeys.profitMarginData(profitRange),
        queryFn: () => fetchFinancialData('profit-margins', { range: profitRange }),
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      },
    ],
  })

  return {
    revenueData: results[0].data,
    profitMarginData: results[1].data,
    isLoading: results.some(result => result.isLoading),
    error: results.find(result => result.error)?.error,
  }
}

export const useProductPerformanceData = () => {
  return useQuery({
    queryKey: financialQueryKeys.productPerformance(),
    queryFn: () => fetchFinancialData('products/performance'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export const useFinancialInsightsData = () => {
  return useQuery({
    queryKey: financialQueryKeys.insights(),
    queryFn: () => fetchFinancialData('insights'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// Combined hook for all financial reports data
export const useFinancialReportsData = (options = {}) => {
  const { timeRange = 'year', revenueRange = '1y', profitRange = '1y', filters = {} } = options

  const [chartRanges, setChartRanges] = useState({
    revenue: revenueRange,
    profit: profitRange,
  })

  const kpiData = useFinancialKPIData(timeRange, filters)
  const chartsData = useFinancialChartsData(chartRanges.revenue, chartRanges.profit)
  const productData = useProductPerformanceData()
  const insightsData = useFinancialInsightsData()

  const isLoading =
    kpiData.isLoading || chartsData.isLoading || productData.isLoading || insightsData.isLoading
  const error = kpiData.error || chartsData.error || productData.error || insightsData.error

  return {
    kpiData: kpiData.data,
    revenueData: chartsData.revenueData,
    profitMarginData: chartsData.profitMarginData,
    productData: productData.data,
    insightsData: insightsData.data,
    isLoading,
    error,
    chartRanges,
    setChartRanges,
    refetch: () => {
      kpiData.refetch()
      productData.refetch()
      insightsData.refetch()
    },
  }
}

export default useFinancialReportsData

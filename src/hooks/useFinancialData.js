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
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Generate sample data for development
const generateSampleKPIData = () => ({
  annualRevenue: {
    current: 8500000,
    growth: 12.4,
    previous: 7564102
  },
  grossProfit: {
    current: 3825000,
    growth: 8.7,
    margin: 45.0,
    previous: 3519784
  },
  ebitda: {
    current: 1700000,
    growth: 15.2,
    margin: 20.0,
    previous: 1475694
  },
  profitMargin: {
    current: 15.8,
    change: 1.2,
    industryAverage: 12.5,
    previous: 14.6
  },
  workingCapital: {
    ratio: 1.8,
    current: 2100000,
    change: 5.3
  }
})

const generateSampleRevenueData = (range = '1y') => {
  const periods = {
    '3m': 3,
    '6m': 6, 
    '1y': 12,
    '2y': 24,
    'all': 36
  }

  const months = periods[range] || 12
  const data = []
  
  for (let i = months; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    
    const baseRevenue = 600000 + Math.random() * 200000
    const seasonalFactor = 1 + 0.3 * Math.sin((date.getMonth() / 12) * 2 * Math.PI)
    const trendFactor = 1 + (months - i) * 0.01
    
    data.push({
      period: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      revenue: Math.round(baseRevenue * seasonalFactor * trendFactor),
      grossProfit: Math.round(baseRevenue * seasonalFactor * trendFactor * 0.45),
      ebitda: Math.round(baseRevenue * seasonalFactor * trendFactor * 0.20)
    })
  }
  
  return data
}

const generateSampleProfitMarginData = (range = '1y') => {
  const periods = {
    '3m': 3,
    '6m': 6,
    '1y': 12, 
    '2y': 24,
    'all': 36
  }

  const months = periods[range] || 12
  const data = []
  
  for (let i = months; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    
    const baseMargin = 14 + Math.random() * 4 + Math.sin((months - i) / 6) * 2
    
    data.push({
      period: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      profitMargin: Math.max(8, Math.min(22, baseMargin))
    })
  }
  
  return data
}

const generateSampleProductData = () => [
  {
    name: 'GABA Red',
    revenue: 2450000,
    revenueGrowth: 12.5,
    unitsSold: 145000,
    unitsSoldGrowth: 8.2,
    marketShare: 34.5,
    marketShareChange: 2.1,
    avgOrderValue: 16.90,
    profitMargin: 28.5,
    totalProfit: 698250
  },
  {
    name: 'GABA Black',
    revenue: 1890000,
    revenueGrowth: 6.8,
    unitsSold: 98000,
    unitsSoldGrowth: 4.1,
    marketShare: 26.8,
    marketShareChange: -0.5,
    avgOrderValue: 19.28,
    profitMargin: 31.2,
    totalProfit: 589680
  },
  {
    name: 'GABA Gold',
    revenue: 1750000,
    revenueGrowth: 15.3,
    unitsSold: 87000,
    unitsSoldGrowth: 12.7,
    marketShare: 22.1,
    marketShareChange: 3.2,
    avgOrderValue: 20.11,
    profitMargin: 35.8,
    totalProfit: 626500
  }
]

const generateSampleInsightsData = () => ({
  revenue: { growth: 12.4 },
  profitMargin: { current: 15.8 },
  workingCapital: { ratio: 1.8 },
  products: generateSampleProductData(),
  seasonality: {
    detected: true,
    strength: 'moderate'
  },
  recommendations: [
    {
      title: 'Optimize GABA Gold Production',
      description: 'GABA Gold shows highest profit margins and growth. Consider increasing production capacity.',
      impact: '+18% Revenue Potential',
      action: 'Review production capacity'
    },
    {
      title: 'Market Share Expansion',
      description: 'Red variant losing market share to competitors. Review pricing and marketing strategy.',
      impact: '2.1% Share Recovery',
      action: 'Analyze competitor pricing'
    }
  ],
  lastUpdated: new Date().toISOString()
})

// Query keys for consistent caching
export const financialQueryKeys = {
  kpiMetrics: (timeRange, filters) => ['financial', 'kpi', { timeRange, filters }],
  revenueData: (range) => ['financial', 'revenue', range],
  profitMarginData: (range) => ['financial', 'profit-margin', range],
  productPerformance: () => ['financial', 'products'],
  insights: () => ['financial', 'insights']
}

// Custom hooks
export const useFinancialKPIData = (timeRange = 'year', filters = {}) => {
  const isDevelopment = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'
  
  return useQuery({
    queryKey: financialQueryKeys.kpiMetrics(timeRange, filters),
    queryFn: async () => {
      if (isDevelopment) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        return generateSampleKPIData()
      }
      return fetchFinancialData('dashboard', { period: timeRange, ...filters })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })
}

export const useFinancialChartsData = (revenueRange = '1y', profitRange = '1y') => {
  const isDevelopment = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'
  
  const results = useQueries({
    queries: [
      {
        queryKey: financialQueryKeys.revenueData(revenueRange),
        queryFn: async () => {
          if (isDevelopment) {
            await new Promise(resolve => setTimeout(resolve, 300))
            return generateSampleRevenueData(revenueRange)
          }
          return fetchFinancialData('revenue-trends', { range: revenueRange })
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000
      },
      {
        queryKey: financialQueryKeys.profitMarginData(profitRange),
        queryFn: async () => {
          if (isDevelopment) {
            await new Promise(resolve => setTimeout(resolve, 300))
            return generateSampleProfitMarginData(profitRange)
          }
          return fetchFinancialData('profit-margins', { range: profitRange })
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000
      }
    ]
  })

  return {
    revenueData: results[0].data,
    profitMarginData: results[1].data,
    isLoading: results.some(result => result.isLoading),
    error: results.find(result => result.error)?.error
  }
}

export const useProductPerformanceData = () => {
  const isDevelopment = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'
  
  return useQuery({
    queryKey: financialQueryKeys.productPerformance(),
    queryFn: async () => {
      if (isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 400))
        return generateSampleProductData()
      }
      return fetchFinancialData('products/performance')
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export const useFinancialInsightsData = () => {
  const isDevelopment = import.meta.env.VITE_DEVELOPMENT_MODE === 'true'
  
  return useQuery({
    queryKey: financialQueryKeys.insights(),
    queryFn: async () => {
      if (isDevelopment) {
        await new Promise(resolve => setTimeout(resolve, 600))
        return generateSampleInsightsData()
      }
      return fetchFinancialData('insights')
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

// Combined hook for all financial reports data
export const useFinancialReportsData = (options = {}) => {
  const {
    timeRange = 'year',
    revenueRange = '1y',
    profitRange = '1y',
    filters = {}
  } = options

  const [chartRanges, setChartRanges] = useState({
    revenue: revenueRange,
    profit: profitRange
  })

  const kpiData = useFinancialKPIData(timeRange, filters)
  const chartsData = useFinancialChartsData(chartRanges.revenue, chartRanges.profit)
  const productData = useProductPerformanceData()
  const insightsData = useFinancialInsightsData()

  const isLoading = kpiData.isLoading || chartsData.isLoading || productData.isLoading || insightsData.isLoading
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
    }
  }
}

export default useFinancialReportsData
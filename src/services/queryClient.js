import { QueryClient } from '@tanstack/react-query'

// API-specific stale times based on data update frequency
const STALE_TIMES = {
  // Real-time or frequently changing data
  KPI_METRICS: 1000 * 60 * 2, // 2 minutes
  CAPACITY_STATUS: 1000 * 60 * 5, // 5 minutes
  SYSTEM_HEALTH: 1000 * 60 * 1, // 1 minute
  
  // Operational data  
  STOCK_LEVELS: 1000 * 60 * 10, // 10 minutes
  DEMAND_FORECAST: 1000 * 60 * 15, // 15 minutes
  RECENT_JOBS: 1000 * 60 * 5, // 5 minutes
  SALES_DATA: 1000 * 60 * 5, // 5 minutes
  
  // Configuration and slow-changing data
  USER_PREFERENCES: 1000 * 60 * 60, // 1 hour
  SYSTEM_CONFIG: 1000 * 60 * 30, // 30 minutes
  WORKING_CAPITAL: 1000 * 60 * 60, // 1 hour (updated less frequently)
  
  // Static or rarely changing data
  PRODUCT_CATALOG: 1000 * 60 * 60 * 24, // 24 hours
  USER_ROLES: 1000 * 60 * 60 * 12 // 12 hours
}

// Cache times for different data types
const CACHE_TIMES = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 30, // 30 minutes  
  LONG: 1000 * 60 * 60 * 2, // 2 hours
  PERSISTENT: 1000 * 60 * 60 * 24 // 24 hours
}

// Query key factories for consistent query key generation
export const queryKeys = {
  // KPI and metrics
  kpi: {
    metrics: (timeRange, filters) => ['kpi-metrics', { timeRange, filters }],
    alerts: () => ['kpi-alerts']
  },
  kpiMetrics: (timeRange, filters) => ['kpi-metrics', { timeRange, filters }], // Legacy support
  systemHealth: () => ['system-health'],
  
  // Forecasting
  forecasts: () => ['forecasts'],
  forecast: (id) => ['forecast', id],
  forecastJob: (jobId) => ['forecast-job', jobId],
  forecastSeries: (seriesId, params) => ['forecast-series', seriesId, params],
  forecastAccuracy: (seriesId, timeRange) => ['forecast-accuracy', seriesId, timeRange],
  
  // Stock optimization
  stockOptimization: () => ['stock-optimization'],
  stockOptimizationJob: (jobId) => ['stock-optimization-job', jobId],
  stockPlans: (id) => ['stock-plans', id],
  stockLevels: (filters) => ['stock-levels', filters],
  reorderSuggestions: (filters) => ['reorder-suggestions', filters],
  
  // Working capital
  workingCapital: {
    diagnostics: () => ['working-capital', 'diagnostics'],
    projections: (timeRange, scenario) => ['working-capital', 'projections', { timeRange, scenario }],
    kpis: () => ['working-capital', 'kpis'],
    policies: (type) => ['working-capital', 'policies', type],
    job: (jobId) => ['working-capital', 'job', jobId]
  },
  // Legacy support
  workingCapitalJob: (jobId) => ['working-capital-job', jobId],
  workingCapitalProjections: (params) => ['wc-projections', params],
  workingCapitalKpis: (timeRange) => ['wc-kpis', timeRange],
  workingCapitalPolicies: (type) => ['wc-policies', type],
  
  // Sales and external integrations
  sales: {
    multiChannel: (timeRange) => ['sales', 'multi-channel', { timeRange }],
    amazon: (timeRange, filters) => ['sales', 'amazon', { timeRange, filters }],
    shopify: (region, timeRange, filters) => ['sales', 'shopify', region, { timeRange, filters }]
  },
  
  // Capacity and operations
  capacityUtilization: (facilities, timeRange) => ['capacity-utilization', facilities, timeRange],
  productionJobs: (status, limit) => ['production-jobs', status, limit],
  
  // User and configuration
  userProfile: (userId) => ['user-profile', userId],
  userPermissions: (userId) => ['user-permissions', userId],
  dashboardLayouts: (userId) => ['dashboard-layouts', userId],
  systemConfig: () => ['system-config'],
  
  // Data import
  importJobs: (status, limit) => ['import-jobs', status, limit],
  importJob: (jobId) => ['import-job', jobId],
  validationRules: (dataType) => ['validation-rules', dataType]
}

// Default query options by data type
const defaultQueryOptions = {
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors except 408, 429
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return error?.response?.status === 408 || error?.response?.status === 429
    }
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: true
}

// Create the query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...defaultQueryOptions,
      staleTime: STALE_TIMES.STOCK_LEVELS, // Default stale time
      cacheTime: CACHE_TIMES.MEDIUM,
      // Enable background refetch for better UX
      refetchInterval: false, // Disabled by default, enabled per query as needed
      refetchIntervalInBackground: false
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      // Global mutation error handling
      onError: (error, variables, context) => {
        console.error('Mutation failed:', error, variables)
        // Could integrate with toast notification system here
      }
    }
  }
})

// Query configuration presets for different types of data
export const queryConfigs = {
  // Real-time data that updates frequently
  realtime: {
    staleTime: STALE_TIMES.KPI_METRICS,
    cacheTime: CACHE_TIMES.SHORT,
    refetchInterval: 1000 * 30, // 30 seconds
    refetchIntervalInBackground: true
  },
  
  // Query functions for CFO KPI Strip and other widgets
  forecast: {
    accuracy: (timeRange, region) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            mape: Math.random() * 15 + 5, // 5-20%
            smape: Math.random() * 20 + 8, // 8-28%
            rmse: Math.random() * 50 + 75, // 75-125
            coverage: Math.random() * 10 + 90, // 90-100%
            change: (Math.random() - 0.5) * 10, // ±5%
            dataQuality: Math.random() > 0.5 ? 'excellent' : 'good'
          })
        }, 500)
      })
    }
  },
  
  workingCapital: {
    kpis: (timeRange, region) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            cashConversionCycle: Math.round(Math.random() * 30 + 40), // 40-70 days
            cccChange: (Math.random() - 0.5) * 20, // ±10%
            cccTrend: Math.random() * 100, // 0-100%
            wcUnlockedQTD: Math.random() * 300000 + 100000, // £100k-400k
            wcUnlockedChange: (Math.random() - 0.5) * 30 // ±15%
          })
        }, 500)
      })
    },
    
    cashPosition: (region) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            minCash90d: Math.random() * 1500000 + 200000, // £200k-1.7M
            minCashChange: (Math.random() - 0.5) * 40, // ±20%
            fxExposureNet: (Math.random() - 0.5) * 2000000, // ±£1M
            fxExposureChange: (Math.random() - 0.5) * 50 // ±25%
          })
        }, 500)
      })
    }
  },
  
  optimization: {
    facilityUtilization: (region) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            overallUtilization: Math.random() * 40 + 60, // 60-100%
            utilizationChange: (Math.random() - 0.5) * 20 // ±10%
          })
        }, 500)
      })
    }
  },
  
  // Operational data for daily use
  operational: {
    staleTime: STALE_TIMES.STOCK_LEVELS,
    cacheTime: CACHE_TIMES.MEDIUM,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    refetchIntervalInBackground: false
  },
  
  // Configuration data that rarely changes
  configuration: {
    staleTime: STALE_TIMES.SYSTEM_CONFIG,
    cacheTime: CACHE_TIMES.LONG,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Static data that changes very rarely
  static: {
    staleTime: STALE_TIMES.PRODUCT_CATALOG,
    cacheTime: CACHE_TIMES.PERSISTENT,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // Job polling configuration
  jobPolling: {
    staleTime: 0, // Always fresh for job status
    cacheTime: CACHE_TIMES.SHORT,
    refetchInterval: 1000 * 2, // 2 seconds
    refetchIntervalInBackground: true,
    // Stop polling when job is complete
    refetchIntervalConditional: (data) => {
      return data?.status && !['completed', 'failed', 'cancelled'].includes(data.status)
    }
  }
}

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries matching a pattern
  invalidateQueries: (pattern) => {
    return queryClient.invalidateQueries({ queryKey: [pattern] })
  },
  
  // Clear all cache
  clearCache: () => {
    return queryClient.clear()
  },
  
  // Remove specific query from cache
  removeQuery: (queryKey) => {
    return queryClient.removeQueries({ queryKey })
  },
  
  // Prefetch data for better UX
  prefetchQuery: (queryKey, queryFn, options = {}) => {
    return queryClient.prefetchQuery({ 
      queryKey, 
      queryFn,
      ...options 
    })
  },
  
  // Set query data directly (useful for optimistic updates)
  setQueryData: (queryKey, data) => {
    return queryClient.setQueryData(queryKey, data)
  },
  
  // Get cached data without triggering a fetch
  getQueryData: (queryKey) => {
    return queryClient.getQueryData(queryKey)
  },
  
  // Update query data with a function
  updateQueryData: (queryKey, updateFn) => {
    return queryClient.setQueryData(queryKey, (oldData) => {
      return updateFn(oldData)
    })
  }
}

// Error handling utilities
export const errorHandlers = {
  // Standard API error handler
  handleApiError: (error) => {
    if (error?.response?.data?.message) {
      return error.response.data.message
    }
    if (error?.message) {
      return error.message
    }
    return 'An unexpected error occurred'
  },
  
  // Check if error is network related
  isNetworkError: (error) => {
    return !error?.response && error?.request
  },
  
  // Check if error is server related
  isServerError: (error) => {
    return error?.response?.status >= 500
  },
  
  // Check if error is client related
  isClientError: (error) => {
    return error?.response?.status >= 400 && error?.response?.status < 500
  },
  
  // Generate error ID for support
  generateErrorId: () => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Development helpers
if (process.env.NODE_ENV === 'development') {
  window.queryClient = queryClient
  window.queryKeys = queryKeys
  window.cacheUtils = cacheUtils
}
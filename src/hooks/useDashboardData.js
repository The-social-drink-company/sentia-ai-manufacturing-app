/**
 * Dashboard Data Hooks
 * React Query hooks for dashboard data fetching - MCP Server Live Data Only
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { enhancedDashboardApi, mcpApi } from '@/services/api/mcpApi'

// Query keys for data management
export const QUERY_KEYS = {
  DASHBOARD_SUMMARY: ['dashboard', 'summary'],
  WORKING_CAPITAL: ['dashboard', 'working-capital'],
  CASH_FLOW: ['dashboard', 'cash-flow'],
  FORECASTING: ['dashboard', 'forecasting'],
  WORKING_CAPITAL_OVERVIEW: ['dashboard', 'working-capital-overview'],
  PRODUCTION_JOBS: ['dashboard', 'production-jobs'],
  QUALITY_METRICS: ['dashboard', 'quality-metrics'],
  INVENTORY_LEVELS: ['dashboard', 'inventory-levels'],
  DEMAND_FORECAST: ['dashboard', 'demand-forecast'],
  ANALYTICS_KPIS: ['dashboard', 'analytics-kpis'],
}

// MCP-optimized query options for real-time data
const MCP_OPTIONS = {
  staleTime: 2 * 60 * 1000, // 2 minutes for fresh MCP data
  cacheTime: 5 * 60 * 1000, // 5 minutes cache
  retry: 1, // Only 1 retry for MCP - fail fast if server down
  refetchOnWindowFocus: true, // Always fetch fresh data when user returns
  refetchInterval: 15 * 1000, // 15 seconds for live MCP data
  refetchIntervalInBackground: false,
  throwOnError: true, // Throw errors instead of silent fallback
}

/**
 * Dashboard summary data - MCP Live Data Only
 */
export const useDashboardSummary = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_SUMMARY,
    queryFn: enhancedDashboardApi.getSummary,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Working capital data - MCP Live Data Only
 */
export const useWorkingCapital = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.WORKING_CAPITAL,
    queryFn: enhancedDashboardApi.getWorkingCapital,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Cash flow data - MCP Live Data Only
 */
export const useCashFlow = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.CASH_FLOW,
    queryFn: enhancedDashboardApi.getWorkingCapital, // MCP provides unified financial data
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Forecasting data - MCP AI Live Data Only
 */
export const useForecasting = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.FORECASTING,
    queryFn: enhancedDashboardApi.getForecasting,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Working capital overview (detailed) - MCP Live Data Only
 */
export const useWorkingCapitalOverview = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.WORKING_CAPITAL_OVERVIEW,
    queryFn: enhancedDashboardApi.getWorkingCapital,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Production jobs data - MCP Live Data Only
 */
export const useProductionJobs = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTION_JOBS,
    queryFn: enhancedDashboardApi.getProductionJobs,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Quality metrics - MCP Live Data Only
 */
export const useQualityMetrics = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.QUALITY_METRICS,
    queryFn: enhancedDashboardApi.getQualityMetrics,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Inventory levels - MCP Live Data Only
 */
export const useInventoryLevels = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.INVENTORY_LEVELS,
    queryFn: enhancedDashboardApi.getInventoryLevels,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Demand forecast - MCP AI Live Data Only
 */
export const useDemandForecast = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.DEMAND_FORECAST,
    queryFn: enhancedDashboardApi.getForecasting,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * Analytics KPIs - MCP Unified Live Data Only
 */
export const useAnalyticsKPIs = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.ANALYTICS_KPIS,
    queryFn: enhancedDashboardApi.getAnalyticsKPIs,
    ...MCP_OPTIONS,
    ...options,
  })
}

/**
 * MCP Server Status - Real-time health check
 */
export const useMCPServerStatus = (options = {}) => {
  return useQuery({
    queryKey: ['mcp', 'status'],
    queryFn: mcpApi.getStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute
    ...options,
  })
}

/**
 * MCP AI Insights
 */
export const useMCPAIInsights = (query, options = {}) => {
  return useQuery({
    queryKey: ['mcp', 'ai-insights', query],
    queryFn: () => mcpApi.getAIInsights(query),
    enabled: !!query,
    staleTime: 5 * 60 * 1000, // 5 minutes for AI insights
    ...options,
  })
}

/**
 * Generic widget data hook
 */
export const useWidgetData = (widgetId, options = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'widget', widgetId],
    queryFn: () => dashboardApi.getWidgetData(widgetId),
    ...DEFAULT_OPTIONS,
    ...options,
  })
}

/**
 * Hook to invalidate all dashboard queries
 */
export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    invalidateSummary: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_SUMMARY })
    },
    invalidateWorkingCapital: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKING_CAPITAL })
    },
    refetchAll: () => {
      queryClient.refetchQueries({ queryKey: ['dashboard'] })
    },
  }
}

/**
 * Hook for real-time dashboard updates
 */
export const useRealtimeDashboard = () => {
  const invalidate = useInvalidateDashboard()
  
  // Use SSE for real-time updates
  const connectSSE = () => {
    const eventSource = new EventSource('/api/events')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Invalidate relevant queries based on event type
        switch (data.type) {
          case 'dashboard_update':
            invalidate.invalidateSummary()
            break
          case 'working_capital_update':
            invalidate.invalidateWorkingCapital()
            break
          case 'production_update':
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTION_JOBS })
            break
          case 'quality_update':
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUALITY_METRICS })
            break
          case 'inventory_update':
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY_LEVELS })
            break
          default:
            // Invalidate all for unknown events
            invalidate.invalidateAll()
        }
      } catch (error) {
        console.error('[RealtimeDashboard] Failed to parse SSE event:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('[RealtimeDashboard] SSE connection error:', error)
      // Reconnect after 5 seconds
      setTimeout(connectSSE, 5000)
    }
    
    return eventSource
  }
  
  return { connectSSE }
}
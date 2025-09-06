import { devLog } from '../lib/devLog.js';\nimport { useState, useEffect, useCallback } from 'react'

// Custom hook for real-time data fetching with automatic refresh
export function useRealTimeData(endpoint, refreshInterval = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${endpoint}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result.data || result)
      setError(null)
      setLastUpdated(new Date())
      
      if (loading) {
        setLoading(false)
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      devLog.error(`Failed to fetch ${endpoint}:`, err)
    }
  }, [endpoint, loading])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Set up polling for real-time updates
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  const refresh = useCallback(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  }
}

// Hook specifically for KPI data with optimized caching
export function useKPIData() {
  return useRealTimeData('/api/kpis/realtime', 15000) // Refresh every 15 seconds
}

// Hook for production metrics with slower refresh rate
export function useProductionMetrics() {
  return useRealTimeData('/api/metrics/current', 60000) // Refresh every minute
}

// Hook for system health monitoring
export function useSystemHealth() {
  return useRealTimeData('/api/status', 30000) // Refresh every 30 seconds
}
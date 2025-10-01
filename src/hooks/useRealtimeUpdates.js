/**
 * Real-time Updates Hook
 * Integrates SSE client with React Query for real-time dashboard updates
 */

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { sseClient } from '@/services/realtime/sseClient'
import { QUERY_KEYS } from './useDashboardData'

export const useRealtimeUpdates = () => {
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [lastUpdate, setLastUpdate] = useState(null)
  const unsubscribeRef = useRef([])

  useEffect(() => {
    // Connect to SSE
    sseClient.connect()

    // Subscribe to connection status
    const unsubscribeConnection = sseClient.subscribe('connection', (data) => {
      setConnectionStatus(data.status)
      console.log('[RealtimeUpdates] Connection status:', data.status)
    })

    // Subscribe to dashboard updates
    const unsubscribeDashboard = sseClient.subscribe('dashboard_update', (data) => {
      console.log('[RealtimeUpdates] Dashboard update received:', data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_SUMMARY })
      setLastUpdate({ type: 'dashboard_update', timestamp: new Date(), data })
    })

    // Subscribe to working capital updates
    const unsubscribeWorkingCapital = sseClient.subscribe('working_capital_update', (data) => {
      console.log('[RealtimeUpdates] Working capital update received:', data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKING_CAPITAL })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKING_CAPITAL_OVERVIEW })
      setLastUpdate({ type: 'working_capital_update', timestamp: new Date(), data })
    })

    // Subscribe to production updates
    const unsubscribeProduction = sseClient.subscribe('production_update', (data) => {
      console.log('[RealtimeUpdates] Production update received:', data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTION_JOBS })
      setLastUpdate({ type: 'production_update', timestamp: new Date(), data })
    })

    // Subscribe to quality updates
    const unsubscribeQuality = sseClient.subscribe('quality_update', (data) => {
      console.log('[RealtimeUpdates] Quality update received:', data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUALITY_METRICS })
      setLastUpdate({ type: 'quality_update', timestamp: new Date(), data })
    })

    // Subscribe to inventory updates
    const unsubscribeInventory = sseClient.subscribe('inventory_update', (data) => {
      console.log('[RealtimeUpdates] Inventory update received:', data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY_LEVELS })
      setLastUpdate({ type: 'inventory_update', timestamp: new Date(), data })
    })

    // Subscribe to forecasting updates
    const unsubscribeForecasting = sseClient.subscribe('forecast_update', (data) => {
      console.log('[RealtimeUpdates] Forecast update received:', data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FORECASTING })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEMAND_FORECAST })
      setLastUpdate({ type: 'forecast_update', timestamp: new Date(), data })
    })

    // Subscribe to analytics updates
    const unsubscribeAnalytics = sseClient.subscribe('analytics_update', (data) => {
      console.log('[RealtimeUpdates] Analytics update received:', data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ANALYTICS_KPIS })
      setLastUpdate({ type: 'analytics_update', timestamp: new Date(), data })
    })

    // Subscribe to generic heartbeat for connection monitoring
    const unsubscribeHeartbeat = sseClient.subscribe('heartbeat', (data) => {
      console.log('[RealtimeUpdates] Heartbeat received:', data.timestamp)
      setLastUpdate({ type: 'heartbeat', timestamp: new Date(), data })
    })

    // Store unsubscribe functions
    unsubscribeRef.current = [
      unsubscribeConnection,
      unsubscribeDashboard,
      unsubscribeWorkingCapital,
      unsubscribeProduction,
      unsubscribeQuality,
      unsubscribeInventory,
      unsubscribeForecasting,
      unsubscribeAnalytics,
      unsubscribeHeartbeat,
    ]

    // Cleanup on unmount
    return () => {
      unsubscribeRef.current.forEach(unsubscribe => unsubscribe())
      sseClient.disconnect()
    }
  }, [queryClient])

  // Manual refresh function
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    console.log('[RealtimeUpdates] Manual refresh triggered')
  }

  // Get detailed connection status
  const getConnectionDetails = () => {
    return {
      status: connectionStatus,
      lastUpdate,
      isConnected: connectionStatus === 'connected',
      ...sseClient.getConnectionStatus(),
    }
  }

  return {
    connectionStatus,
    lastUpdate,
    isConnected: connectionStatus === 'connected',
    refreshAll,
    getConnectionDetails,
  }
}

/**
 * Hook for specific event types
 */
export const useRealtimeEvent = (eventType, callback) => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const unsubscribe = sseClient.subscribe(eventType, (data) => {
      callbackRef.current(data)
    })

    return unsubscribe
  }, [eventType])
}

/**
 * Hook for connection status monitoring
 */
export const useConnectionStatus = () => {
  const [status, setStatus] = useState('disconnected')
  const [lastConnected, setLastConnected] = useState(null)

  useEffect(() => {
    const unsubscribe = sseClient.subscribe('connection', (data) => {
      setStatus(data.status)
      if (data.status === 'connected') {
        setLastConnected(new Date())
      }
    })

    // Set initial status
    const currentStatus = sseClient.getConnectionStatus()
    setStatus(currentStatus.isConnected ? 'connected' : 'disconnected')

    return unsubscribe
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    lastConnected,
    connectionDetails: sseClient.getConnectionStatus(),
  }
}
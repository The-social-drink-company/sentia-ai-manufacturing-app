import { devLog } from '../lib/devLog.js';\nimport { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys, cacheUtils } from '../services/queryClient'

// SSE event types and their corresponding query invalidations
const SSE_EVENT_HANDLERS = {
  // Job status updates
  'job.forecast.started': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.forecastJob(data.jobId), {
      ...data,
      status: 'running',
      startedAt: new Date().toISOString()
    })
  },
  
  'job.forecast.progress': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.forecastJob(data.jobId), (old) => ({
      ...old,
      ...data,
      updatedAt: new Date().toISOString()
    }))
  },
  
  'job.forecast.completed': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.forecastJob(data.jobId), {
      ...data,
      status: 'completed',
      completedAt: new Date().toISOString()
    })
    // Invalidate related forecasting queries
    queryClient.invalidateQueries({ queryKey: ['forecasts'] })
    queryClient.invalidateQueries({ queryKey: ['forecast-series'] })
  },
  
  'job.forecast.failed': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.forecastJob(data.jobId), {
      ...data,
      status: 'failed',
      failedAt: new Date().toISOString()
    })
  },
  
  // Stock optimization updates  
  'job.stock.started': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.stockOptimizationJob(data.jobId), {
      ...data,
      status: 'running',
      startedAt: new Date().toISOString()
    })
  },
  
  'job.stock.completed': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.stockOptimizationJob(data.jobId), {
      ...data,
      status: 'completed',
      completedAt: new Date().toISOString()
    })
    // Invalidate stock-related queries
    queryClient.invalidateQueries({ queryKey: ['stock-optimization'] })
    queryClient.invalidateQueries({ queryKey: ['stock-levels'] })
    queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] })
  },
  
  'job.stock.failed': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.stockOptimizationJob(data.jobId), {
      ...data,
      status: 'failed',
      failedAt: new Date().toISOString()
    })
  },
  
  // Working capital updates
  'job.workingcapital.completed': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.workingCapitalJob(data.jobId), {
      ...data,
      status: 'completed',
      completedAt: new Date().toISOString()
    })
    // Invalidate working capital queries
    queryClient.invalidateQueries({ queryKey: ['working-capital'] })
    queryClient.invalidateQueries({ queryKey: ['wc-projections'] })
    queryClient.invalidateQueries({ queryKey: ['wc-kpis'] })
  },
  
  // Real-time metric updates
  'metrics.kpi.updated': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.kpiMetrics(data.timeRange, data.filters), (old) => ({
      ...old,
      ...data.metrics,
      updatedAt: new Date().toISOString()
    }))
  },
  
  'metrics.capacity.updated': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.capacityUtilization(data.facilities, data.timeRange), (old) => ({
      ...old,
      ...data.utilization,
      updatedAt: new Date().toISOString()
    }))
  },
  
  'metrics.system.health': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.systemHealth(), {
      ...data,
      timestamp: new Date().toISOString()
    })
  },
  
  // Stock level alerts
  'alert.stock.low': (data, queryClient) => {
    // Invalidate stock queries to show updated alerts
    queryClient.invalidateQueries({ queryKey: ['stock-levels'] })
    queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] })
  },
  
  'alert.stock.critical': (data, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['stock-levels'] })
    queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] })
  },
  
  // Working capital breach alerts
  'alert.workingcapital.breach': (data, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['wc-projections'] })
    queryClient.invalidateQueries({ queryKey: ['wc-kpis'] })
  },
  
  // Data import updates
  'job.import.started': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.importJob(data.jobId), {
      ...data,
      status: 'running',
      startedAt: new Date().toISOString()
    })
  },
  
  'job.import.completed': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.importJob(data.jobId), {
      ...data,
      status: 'completed',
      completedAt: new Date().toISOString()
    })
    queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
  },
  
  'job.import.failed': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.importJob(data.jobId), {
      ...data,
      status: 'failed',
      failedAt: new Date().toISOString()
    })
  },
  
  // System status updates
  'system.maintenance.start': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.systemHealth(), (old) => ({
      ...old,
      maintenance: true,
      maintenanceMessage: data.message
    }))
  },
  
  'system.maintenance.end': (data, queryClient) => {
    queryClient.setQueryData(queryKeys.systemHealth(), (old) => ({
      ...old,
      maintenance: false,
      maintenanceMessage: null
    }))
  }
}

export const useSSE = ({
  endpoint = '/api/events',
  enabled = true,
  reconnectDelay = 3000,
  maxReconnectAttempts = 10,
  onConnect = null,
  onDisconnect = null,
  onError = null,
  onMessage = null
} = {}) => {
  const [connectionState, setConnectionState] = useState({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0
  })
  
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const queryClient = useQueryClient()
  
  // Track received events for debugging
  const [eventLog, setEventLog] = useState([])
  
  const addToEventLog = useCallback((event) => {
    if (process.env.NODE_ENV === 'development') {
      setEventLog(prev => [
        {
          type: event.type,
          data: event.data,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 99) // Keep last 100 events
      ])
    }
  }, [])
  
  const handleSSEMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data)
      addToEventLog({ type: event.type, data })
      
      // Call custom message handler if provided
      if (onMessage) {
        onMessage(event.type, data)
      }
      
      // Handle predefined event types
      const handler = SSE_EVENT_HANDLERS[event.type]
      if (handler) {
        handler(data, queryClient)
      }
      
      // Emit custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('sse-message', {
        detail: { type: event.type, data }
      }))
      
    } catch (error) {
      devLog.error('Error parsing SSE message:', error, event)
    }
  }, [onMessage, queryClient, addToEventLog])
  
  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return
    
    setConnectionState(prev => ({ 
      ...prev, 
      connecting: true, 
      error: null 
    }))
    
    try {
      const eventSource = new EventSource(endpoint)
      eventSourceRef.current = eventSource
      
      eventSource.onopen = () => {
        setConnectionState({
          connected: true,
          connecting: false,
          error: null,
          reconnectAttempts: 0
        })
        
        if (onConnect) onConnect()
        
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }
      
      eventSource.onerror = (error) => {
        devLog.error('SSE connection error:', error)
        
        setConnectionState(prev => ({
          connected: false,
          connecting: false,
          error: error,
          reconnectAttempts: prev.reconnectAttempts + 1
        }))
        
        if (onError) onError(error)
        
        // Close the current connection
        eventSource.close()
        eventSourceRef.current = null
        
        // Attempt to reconnect if within limits
        if (connectionState.reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay)
        }
      }
      
      eventSource.onmessage = (event) => {
        handleSSEMessage({ type: 'message', data: event.data })
      }
      
      // Register handlers for all known event types
      Object.keys(SSE_EVENT_HANDLERS).forEach(eventType => {
        eventSource.addEventListener(eventType, handleSSEMessage)
      })
      
    } catch (error) {
      devLog.error('Failed to create SSE connection:', error)
      setConnectionState(prev => ({
        ...prev,
        connecting: false,
        error: error
      }))
    }
  }, [enabled, endpoint, maxReconnectAttempts, reconnectDelay, onConnect, onError, handleSSEMessage, connectionState.reconnectAttempts])
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setConnectionState({
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0
    })
    
    if (onDisconnect) onDisconnect()
  }, [onDisconnect])
  
  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(connect, 100)
  }, [disconnect, connect])
  
  // Setup and cleanup
  useEffect(() => {
    if (enabled) {
      connect()
    }
    
    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])
  
  return {
    connectionState,
    eventLog,
    connect,
    disconnect,
    reconnect,
    
    // Utility methods
    isConnected: connectionState.connected,
    isConnecting: connectionState.connecting,
    hasError: !!connectionState.error,
    canReconnect: connectionState.reconnectAttempts < maxReconnectAttempts
  }
}

// Hook for listening to specific SSE events
export const useSSEEvent = (eventType, handler, dependencies = []) => {
  useEffect(() => {
    const handleEvent = (event) => {
      if (event.detail.type === eventType) {
        handler(event.detail.data)
      }
    }
    
    window.addEventListener('sse-message', handleEvent)
    
    return () => {
      window.removeEventListener('sse-message', handleEvent)
    }
  }, [eventType, handler, ...dependencies])
}

// Hook for job status polling with SSE fallback
export const useJobStatus = (jobId, jobType, options = {}) => {
  const queryClient = useQueryClient()
  const { enabled = true, onComplete, onFailed } = options
  
  const queryKey = jobType === 'forecast' 
    ? queryKeys.forecastJob(jobId)
    : jobType === 'stock'
    ? queryKeys.stockOptimizationJob(jobId) 
    : jobType === 'workingcapital'
    ? queryKeys.workingCapitalJob(jobId)
    : queryKeys.importJob(jobId)
  
  // Listen for SSE job updates
  useSSEEvent(`job.${jobType}.completed`, (data) => {
    if (data.jobId === jobId && onComplete) {
      onComplete(data)
    }
  }, [jobId, jobType, onComplete])
  
  useSSEEvent(`job.${jobType}.failed`, (data) => {
    if (data.jobId === jobId && onFailed) {
      onFailed(data)
    }
  }, [jobId, jobType, onFailed])
  
  return {
    queryKey,
    // Additional job-specific utilities could be added here
  }
}
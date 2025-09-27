import { useEffect, useState, useCallback } from 'react'

import { sseClient } from '../services/realtime/sseClient'

/**
 * Custom hook for Server-Sent Events
 * Provides real-time updates to React components
 */
export function useSSE(eventTypes = [], options = {}) {
  const [data, setData] = useState({})
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(_() => {
    // Connect to SSE if not already connected
    if (!sseClient.isConnected) {
      sseClient.connect()
    }

    // Subscribe to connection status
    const unsubConnection = sseClient.subscribe('connection', (status) => {
      setIsConnected(status.status === 'connected')
    })

    // Subscribe to specified event types
    const unsubscribers = eventTypes.map(eventType => {
      return _sseClient.subscribe(eventType, _(eventData) => {
        setData(prevData => ({
          ...prevData,
          [eventType]: eventData
        }))
        setLastUpdate(new Date())

        // Call custom handler if provided
        if (options.onEvent) {
          options.onEvent(eventType, eventData)
        }
      })
    })

    // Set initial connection status
    setIsConnected(sseClient.isConnected)

    // Cleanup
    return () => {
      unsubConnection()
      unsubscribers.forEach(unsub => unsub())

      // Disconnect if no other components are using SSE
      if (options.disconnectOnUnmount) {
        sseClient.disconnect()
      }
    }
  }, [eventTypes.join(','), options.disconnectOnUnmount])

  const reconnect = useCallback(_() => {
    sseClient.connect()
  }, [])

  const disconnect = useCallback(_() => {
    sseClient.disconnect()
  }, [])

  return {
    data,
    isConnected,
    lastUpdate,
    reconnect,
    disconnect
  }
}

/**
 * Hook for subscribing to a single SSE event type
 */
export function useSSEEvent(eventType, handler) {
  const [lastData, setLastData] = useState(null)

  useEffect(_() => {
    if (!eventType || !handler) return

    // Connect to SSE if not already connected
    if (!sseClient.isConnected) {
      sseClient.connect()
    }

    // Subscribe to the event
    const unsubscribe = sseClient.subscribe(eventType, _(data) => {
      setLastData(data)
      handler(data)
    })

    return unsubscribe
  }, [eventType, handler])

  return lastData
}
import { useEffect, useState, useCallback, useMemo } from 'react'

import { sseClient } from '../services/realtime/sseClient'

/**
 * Custom hook for Server-Sent Events
 * Provides real-time updates to React components
 */
export function useSSE(eventTypes = [], options = {}) {
  const normalizedEventTypes = useMemo(() => {
    if (!eventTypes) {
      return [];
    }

    return Array.isArray(eventTypes) ? eventTypes : [eventTypes];
  }, [eventTypes]);

  const { onEvent, disconnectOnUnmount = false } = options;
  const [data, setData] = useState({})
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    // Connect to SSE if not already connected
    if (!sseClient.isConnected) {
      sseClient.connect()
    }

    // Subscribe to connection status
    const unsubConnection = sseClient.subscribe('connection', (status) => {
      setIsConnected(status.status === 'connected')
    })

    // Subscribe to specified event types
    const unsubscribers = normalizedEventTypes.map(eventType => {
      return sseClient.subscribe(eventType, (eventData) => {
        setData(prevData => ({
          ...prevData,
          [eventType]: eventData
        }))
        setLastUpdate(new Date())

        // Call custom handler if provided
        if (onEvent) {
          onEvent(eventType, eventData);
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
      if (disconnectOnUnmount) {
        sseClient.disconnect();
      }
    }
  }, [normalizedEventTypes, disconnectOnUnmount, onEvent])

  const reconnect = useCallback(() => {
    sseClient.connect()
  }, [])

  const disconnect = useCallback(() => {
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

  useEffect(() => {
    if (!eventType || !handler) return

    // Connect to SSE if not already connected
    if (!sseClient.isConnected) {
      sseClient.connect()
    }

    // Subscribe to the event
    const unsubscribe = sseClient.subscribe(eventType, (data) => {
      setLastData(data)
      handler(data)
    })

    return unsubscribe
  }, [eventType, handler])

  return lastData
}





import { useState, useEffect, useCallback, useRef } from 'react'
import { logInfo, logError, logWarn } from '../services/observability/structuredLogger.js'

const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_RECONNECT_DELAY = 1000
const STATUS_META = {
  connected: {
    status: 'connected',
    color: 'emerald',
    message: 'Real-time Connected',
    icon: 'check'
  },
  connecting: {
    status: 'connecting',
    color: 'amber',
    message: 'Connecting?',
    icon: 'loader'
  },
  disconnected: {
    status: 'disconnected',
    color: 'rose',
    message: 'Real-time Disconnected',
    icon: 'alert'
  }
}

const serializeMessage = (type, payload) =>
  JSON.stringify({
    type,
    data: payload,
    timestamp: new Date().toISOString()
  })

export const useRealTimeData = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [data, setData] = useState({})
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const websocketRef = useRef(null)
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws'
  const sseUrl = import.meta.env.VITE_SSE_URL || 'http://localhost:5000/api/events'

  const clearReconnectTimer = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  const disconnectAll = useCallback(() => {
    clearReconnectTimer()

    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttemptsRef.current = 0
    logInfo('Disconnected all realtime transports')
  }, [])

  const handleRealtimePayload = useCallback((message) => {
    if (!message?.type) {
      return
    }

    setData((previous) => ({
      ...previous,
      [message.type]: {
        ...message.data,
        timestamp: new Date().toISOString()
      }
    }))
    setLastUpdate(new Date().toISOString())
  }, [])

  const connectWebSocket = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      logInfo('Connecting real-time WebSocket', { url: wsUrl })
      setConnectionStatus('connecting')

      const socket = new WebSocket(wsUrl)
      websocketRef.current = socket

      socket.onopen = () => {
        logInfo('WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleRealtimePayload(message)
        } catch (parseError) {
          logError('Failed to parse WebSocket payload', parseError)
        }
      }

      socket.onclose = (event) => {
        logWarn('WebSocket closed', { code: event.code, reason: event.reason })
        setIsConnected(false)
        setConnectionStatus('disconnected')

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const attempt = reconnectAttemptsRef.current + 1
          const delay = Math.min(INITIAL_RECONNECT_DELAY * 2 ** reconnectAttemptsRef.current, 10000)
          reconnectAttemptsRef.current = attempt

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, delay)

          logInfo('Scheduled WebSocket reconnection', { attempt, delay })
        } else {
          setError('WebSocket reconnection failed')
          logError('Maximum WebSocket reconnection attempts reached')
        }
      }

      socket.onerror = (event) => {
        logError('WebSocket error encountered', event)
        setError('WebSocket error')
      }
    } catch (connectionError) {
      logError('Unable to establish WebSocket connection', connectionError)
      setError('Failed to connect WebSocket')
    }
  }, [handleRealtimePayload, wsUrl])

  const connectEventSource = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    try {
      logInfo('Connecting Server-Sent Events', { url: sseUrl })

      const source = new EventSource(sseUrl)
      eventSourceRef.current = source

      source.onopen = () => {
        logInfo('Server-Sent Events connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        setError(null)
      }

      source.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleRealtimePayload(message)
        } catch (parseError) {
          logError('Failed to parse SSE payload', parseError)
        }
      }

      source.onerror = (event) => {
        logWarn('Server-Sent Events error', event)
        setConnectionStatus('disconnected')
        setError('SSE connection error')
      }
    } catch (connectionError) {
      logError('Unable to initialize Server-Sent Events connection', connectionError)
      setError('Failed to connect SSE')
    }
  }, [handleRealtimePayload, sseUrl])

  const sendMessage = useCallback((type, payload) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(serializeMessage(type, payload))
      logInfo('WebSocket message dispatched', { type })
      return true
    }

    logWarn('Unable to send WebSocket message: socket not open', { type })
    return false
  }, [])

  const subscribe = useCallback((dataType, callback) => {
    setData((previous) => ({
      ...previous,
      [dataType]: {
        ...(previous[dataType] || {}),
        callback
      }
    }))

    return () => {
      setData((previous) => {
        if (!previous[dataType]) {
          return previous
        }

        const { [dataType]: removed, ...rest } = previous
        const callbackless = { ...removed }
        delete callbackless.callback

        return {
          ...rest,
          ...(Object.keys(callbackless).length ? { [dataType]: callbackless } : {})
        }
      })
    }
  }, [])

  const getData = useCallback((dataType) => data[dataType] ?? null, [data])

  const getConnectionStatusInfo = useCallback(() => {
    if (connectionStatus === 'disconnected' && error) {
      return { ...STATUS_META.disconnected, message: error }
    }

    return STATUS_META[connectionStatus] || STATUS_META.disconnected
  }, [connectionStatus, error])

  useEffect(() => {
    connectWebSocket()
    const sseTimer = setTimeout(() => {
      connectEventSource()
    }, 1000)

    return () => {
      clearTimeout(sseTimer)
      disconnectAll()
    }
  }, [connectEventSource, connectWebSocket, disconnectAll])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (!isConnected) {
          connectWebSocket()
          connectEventSource()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectEventSource, connectWebSocket, isConnected])

  useEffect(() => {
    const handleOnline = () => {
      logInfo('Network online, ensuring realtime connections')
      if (!isConnected) {
        connectWebSocket()
        connectEventSource()
      }
    }

    const handleOffline = () => {
      logWarn('Network offline, suspending realtime connections')
      disconnectAll()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connectEventSource, connectWebSocket, disconnectAll, isConnected])

  return {
    isConnected,
    connectionStatus,
    error,
    lastUpdate,
    data,
    getData,
    connect: connectWebSocket,
    disconnect: disconnectAll,
    sendMessage,
    subscribe,
    getConnectionStatusInfo
  }
}

export default useRealTimeData

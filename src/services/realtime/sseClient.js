/**
 * Server-Sent Events Client
 * Handles real-time updates from the server
 */

import { logInfo, logError, logWarn, logDebug, devLog } from '../../utils/structuredLogger.js';

const SSE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '/events') || 'http://localhost:5000/events'

class SSEClient {
  constructor() {
    this.eventSource = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.isConnected = false
  }

  connect() {
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      return
    }

    try {
      this.eventSource = new EventSource(SSE_URL, {
        withCredentials: true
      })

      this.eventSource.onopen = () => {
        logInfo('SSE connection established')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifyListeners('connection', { status: 'connected' })
      }

      this.eventSource.onerror = (error) => {
        logError('SSE connection error', error)
        this.isConnected = false
        this.notifyListeners('connection', { status: 'error', error })

        if (this.eventSource.readyState === EventSource.CLOSED) {
          this.reconnect()
        }
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.notifyListeners('message', data)
        } catch (error) {
          logError('Error parsing SSE message', error)
        }
      }

      // Register specific event types
      this.registerEventTypes()
    } catch (error) {
      logError('Failed to create SSE connection', error)
      this.reconnect()
    }
  }

  registerEventTypes() {
    const eventTypes = [
      'metrics-update',
      'alert',
      'production-status',
      'inventory-change',
      'order-update',
      'system-status',
      'forecast-update',
      'cash-flow-update'
    ]

    eventTypes.forEach(type => {
      this.eventSource.addEventListener(type, (event) => {
        try {
          const data = JSON.parse(event.data)
          this.notifyListeners(type, data)
        } catch (error) {
          logError('Error parsing event', { type, error })
        }
      })
    })
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logError('Max reconnection attempts reached')
      this.notifyListeners('connection', { status: 'failed' })
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    logInfo('Reconnecting SSE', { delay: `${delay}ms`, attempt: this.reconnectAttempts })

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType).add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  notifyListeners(eventType, data) {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          logError('Error in SSE listener callback', error)
        }
      })
    }

    // Also notify wildcard listeners
    const wildcardCallbacks = this.listeners.get('*')
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback({ type: eventType, data })
        } catch (error) {
          logError('Error in wildcard SSE listener', error)
        }
      })
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
      this.notifyListeners('connection', { status: 'disconnected' })
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.eventSource?.readyState,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

export const sseClient = new SSEClient()
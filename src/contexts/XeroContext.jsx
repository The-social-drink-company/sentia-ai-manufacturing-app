/**
 * Global Xero Context for App-Wide Connection Management
 * 
 * Provides centralized Xero connection state and OAuth flow management
 * across all components that need financial data.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { logInfo, logWarn, logError } from '../utils/structuredLogger'

const XeroContext = createContext()

export const useXero = () => {
  const context = useContext(XeroContext)
  if (!context) {
    throw new Error('useXero must be used within a XeroProvider')
  }
  return context
}

export const XeroProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [organizationInfo, setOrganizationInfo] = useState(null)
  const [lastError, setLastError] = useState(null)

  // Check connection status on mount and periodically
  const checkConnectionStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setLastError(null)
      
      logInfo('[XeroContext] Checking Xero connection status...')
      
      const response = await fetch('/api/xero/status')
      const data = await response.json()
      
      logInfo('[XeroContext] Xero status API response:', data)
      
      if (data.success && data.status) {
        const wasConnected = isConnected
        setIsConnected(data.status.connected)
        setConnectionStatus(data.status)
        
        // Log state changes
        if (wasConnected !== data.status.connected) {
          logInfo('[XeroContext] Connection state changed:', { 
            from: wasConnected, 
            to: data.status.connected 
          })
        }
        
        if (data.status.connected && data.status.organizationId) {
          setOrganizationInfo({
            id: data.status.organizationId,
            name: data.status.organizationName || 'Connected Organization',
            lastSync: data.status.lastSync,
            tokenExpiry: data.status.tokenExpiry
          })
          logInfo('[XeroContext] Organization info updated:', {
            id: data.status.organizationId,
            name: data.status.organizationName
          })
        } else {
          setOrganizationInfo(null)
        }
        
        logInfo('[XeroContext] Final state:', { 
          connected: data.status.connected,
          hasTokens: data.status.hasTokens,
          organizationId: data.status.organizationId 
        })
      } else {
        logWarn('[XeroContext] Invalid API response, setting disconnected state')
        setIsConnected(false)
        setConnectionStatus(null)
        setOrganizationInfo(null)
      }
    } catch (error) {
      logError('[XeroContext] Failed to check Xero connection status', error)
      setLastError(error.message)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  // Initialize connection check on mount
  useEffect(() => {
    logInfo('[XeroContext] Initializing XeroContext, checking connection status...')
    checkConnectionStatus()
    
    // Check connection status every 5 minutes
    const interval = setInterval(() => {
      logInfo('[XeroContext] Periodic connection check (5min interval)')
      checkConnectionStatus()
    }, 5 * 60 * 1000)
    
    return () => {
      logInfo('[XeroContext] Cleaning up XeroContext interval')
      clearInterval(interval)
    }
  }, [checkConnectionStatus])

  // Handle OAuth callback completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const xerConnected = urlParams.get('xero_connected')
    const xeroError = urlParams.get('xero_error')
    
    logInfo('[XeroContext] OAuth callback check:', { xerConnected, xeroError })
    
    if (xerConnected === 'true') {
      logInfo('[XeroContext] Xero OAuth callback completed successfully')
      checkConnectionStatus() // Refresh status after successful connection
      
      // Clean up URL parameters
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      logInfo('[XeroContext] URL parameters cleaned up after successful OAuth')
    } else if (xeroError === 'true') {
      logError('[XeroContext] Xero OAuth callback completed with error')
      setLastError('Xero connection failed. Please try again.')
      
      // Clean up URL parameters
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      logInfo('[XeroContext] URL parameters cleaned up after OAuth error')
    }
  }, [checkConnectionStatus])

  // Start OAuth flow
  const startAuthFlow = useCallback(() => {
    try {
      setIsAuthenticating(true)
      setLastError(null)
      logInfo('[XeroContext] Starting Xero OAuth flow')
      
      // Redirect to OAuth endpoint
      window.location.href = '/api/xero/auth'
    } catch (error) {
      logError('[XeroContext] Failed to start Xero OAuth flow', error)
      setLastError(error.message)
      setIsAuthenticating(false)
    }
  }, [])

  // Disconnect from Xero
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true)
      setLastError(null)
      
      const response = await fetch('/api/xero/disconnect', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setIsConnected(false)
        setConnectionStatus(null)
        setOrganizationInfo(null)
        logInfo('Xero disconnected successfully')
      } else {
        throw new Error(data.message || 'Failed to disconnect from Xero')
      }
    } catch (error) {
      logError('Failed to disconnect from Xero', error)
      setLastError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Retry connection (refresh status)
  const retry = useCallback(() => {
    setLastError(null)
    checkConnectionStatus()
  }, [checkConnectionStatus])

  const value = {
    // Connection state
    isConnected,
    isLoading,
    isAuthenticating,
    connectionStatus,
    organizationInfo,
    lastError,
    
    // Actions
    startAuthFlow,
    disconnect,
    retry,
    checkConnectionStatus
  }

  return (
    <XeroContext.Provider value={value}>
      {children}
    </XeroContext.Provider>
  )
}
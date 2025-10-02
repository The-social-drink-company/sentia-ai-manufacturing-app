import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for live working capital data from MCP server
 * Provides real-time data with transparent error reporting - NO FALLBACK DATA
 */
export const useWorkingCapitalLiveData = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const fetchWorkingCapitalData = useCallback(async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      console.log('🔄 Fetching live working capital data from MCP server...')
      const response = await fetch('/api/working-capital')
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        const errorDetails = {
          type: result.error || 'API Error',
          message: result.message || 'Failed to fetch working capital data',
          userAction: result.userAction || 'Please try again',
          retryIn: result.retryIn,
          timestamp: result.timestamp,
          httpStatus: response.status
        }
        
        console.error('❌ Working capital API error:', errorDetails)
        setError(errorDetails)
        setData(null)
        setMetadata(null)
        
        if (isRetry) {
          setRetryCount(prev => prev + 1)
          console.log(`🔄 Retry attempt ${retryCount + 1} failed`)
        }
      } else {
        console.log('✅ Live working capital data fetched successfully from MCP server')
        setData(result.data)
        setMetadata(result.metadata)
        setError(null)
        setRetryCount(0)
      }
    } catch (fetchError) {
      const networkError = {
        type: 'Network Error',
        message: 'Unable to connect to the server. Check your internet connection.',
        userAction: 'Please check your connection and try again',
        retryIn: '30 seconds',
        timestamp: new Date().toISOString(),
        originalError: fetchError.message
      }
      
      console.error('❌ Network error fetching working capital data:', networkError)
      setError(networkError)
      setData(null)
      setMetadata(null)
      
      if (isRetry) {
        setRetryCount(prev => prev + 1)
      }
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }, [retryCount])

  // Manual retry function for user-triggered retries
  const retryConnection = useCallback(() => {
    console.log('🔄 Manual retry triggered by user')
    fetchWorkingCapitalData(true)
  }, [fetchWorkingCapitalData])

  // Automatic retry with exponential backoff (only for network errors, not API errors)
  const scheduleRetry = useCallback(() => {
    if (error && error.type === 'Network Error' && retryCount < 3) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000) // Max 30 seconds
      console.log(`⏱️ Scheduling automatic retry in ${retryDelay}ms (attempt ${retryCount + 1}/3)`)
      
      setTimeout(() => {
        fetchWorkingCapitalData(true)
      }, retryDelay)
    } else if (retryCount >= 3) {
      console.warn('⚠️ Max retry attempts reached, stopping automatic retries')
    }
  }, [error, retryCount, fetchWorkingCapitalData])

  // Initial data fetch
  useEffect(() => {
    fetchWorkingCapitalData()
  }, [fetchWorkingCapitalData])

  // Auto-refresh every 5 minutes for live data (only if successfully connected)
  useEffect(() => {
    if (!error && data && metadata && metadata.dataSource === 'live') {
      console.log('🔄 Setting up auto-refresh interval for live data (5 minutes)')
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing live working capital data')
        fetchWorkingCapitalData()
      }, 5 * 60 * 1000)
      
      return () => {
        console.log('🛑 Clearing auto-refresh interval')
        clearInterval(interval)
      }
    }
  }, [error, data, metadata, fetchWorkingCapitalData])

  // Schedule automatic retry on network errors only
  useEffect(() => {
    if (error && error.type === 'Network Error' && retryCount < 3) {
      scheduleRetry()
    }
  }, [error, retryCount, scheduleRetry])

  return {
    data,
    loading,
    error,
    metadata,
    isRetrying,
    retryCount,
    retryConnection,
    refresh: fetchWorkingCapitalData
  }
}

export default useWorkingCapitalLiveData
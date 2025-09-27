import { useState, useEffect, useCallback } from 'react'
import { fetchProductionMetrics, exportProductionData } from '../services/productionService'
import { useIoTProductionMetrics } from './useIoTIntegration'
import { logError } from '../../../utils/structuredLogger.js'

export function useProductionMetrics({ line = 'all', shift = 'current', timeRange = '24h' } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Try to get real-time IoT data first
  const iotMetrics = useIoTProductionMetrics()

  const fetchData = useCallback(async _() => {
    setLoading(true)
    setError(null)

    try {
      // If IoT data is available and healthy, use real-time data
      if (!iotMetrics.isLoading && !iotMetrics.isError && iotMetrics.summary) {
        const enhancedMetrics = {
          ...iotMetrics,
          // Add additional production context
          filters: { line, shift, timeRange },
          isRealTimeData: true,
          source: 'iot_sensors',
          lastUpdated: new Date().toISOString()
        }

        setData(enhancedMetrics)
        setLoading(false)
        return
      }

      // Fallback to mock/service data
      const metrics = await fetchProductionMetrics(timeRange, line, shift)
      setData({
        ...metrics,
        isRealTimeData: false,
        source: 'mock_data'
      })
    } catch (err) {
      setError(err)
      // Log error in development only
      if (import.meta.env.DEV) {
        logError('Failed to fetch production metrics', err)
      }
    } finally {
      setLoading(false)
    }
  }, [line, shift, timeRange, iotMetrics])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  const exportData = useCallback(async _(format) => {
    try {
      await exportProductionData(format, timeRange, line, shift)
    } catch (err) {
      throw new Error(`Export failed: ${err.message}`)
    }
  }, [timeRange, line, shift])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    exportData,
    // IoT integration status
    isRealTimeData: data?.isRealTimeData || false,
    iotConnectionStatus: iotMetrics.isLoading ? 'connecting' :
                        iotMetrics.isError ? 'error' :
                        iotMetrics.summary ? 'connected' : 'disconnected',
    dataSource: data?.source || 'unknown'
  }
}
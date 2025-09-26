import { useState, useEffect, useCallback } from 'react'

import { fetchInventoryMetrics, exportInventoryData } from '../services/inventoryService'

const REFRESH_INTERVAL = 300000 // 5 minutes

export function useInventoryMetrics(period = 'current', category = 'all', location = 'all') {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const rawMetrics = await fetchInventoryMetrics(period, category, location)

      // Transform data to match dashboard expectations
      const metrics = {
        summary: {
          totalValue: rawMetrics.summary.totalValue,
          valueChange: rawMetrics.summary.valueChange || 2.3,
          turnoverRatio: rawMetrics.summary.turnoverRatio,
          turnoverChange: rawMetrics.summary.turnoverChange || 0.8,
          daysOnHand: rawMetrics.summary.daysOnHand,
          daysOnHandChange: rawMetrics.summary.daysOnHandChange || -2.1,
          stockoutRisk: rawMetrics.summary.stockoutRisk || 12,
          stockoutRiskChange: rawMetrics.summary.stockoutRiskChange || -1.5
        },
        stockLevels: {
          heatmapData: rawMetrics.stockLevels.heatmapData,
          chartData: rawMetrics.stockLevels.chartData
        },
        reorderPoints: rawMetrics.reorderPoints,
        turnover: {
          chartData: rawMetrics.turnover.chartData
        },
        slowMoving: rawMetrics.slowMoving,
        forecast: rawMetrics.forecast,
        alerts: rawMetrics.alerts?.map(alert => ({
          severity: alert.severity,
          title: alert.title || 'Inventory Alert',
          description: alert.message,
          action: alert.action
        })) || []
      }

      setState({
        data: metrics,
        loading: false,
        error: null,
        lastUpdated: new Date()
      })
    } catch (error) {
      console.error('Failed to fetch inventory metrics:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error
      }))
    }
  }, [period, category, location])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const exportData = useCallback(async (format) => {
    try {
      await exportInventoryData(format, period, category, location)
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }, [period, category, location])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refetch: refresh,
    exportData
  }
}
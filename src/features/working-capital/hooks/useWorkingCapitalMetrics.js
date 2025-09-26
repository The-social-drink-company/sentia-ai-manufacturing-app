import { useState, useEffect, useCallback } from 'react'

import { fetchWorkingCapitalMetrics, exportWorkingCapitalData } from '../services/workingCapitalService'

const REFRESH_INTERVAL = 60000 // 1 minute

export function useWorkingCapitalMetrics(period = 'month') {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const rawMetrics = await fetchWorkingCapitalMetrics(period)

      // Transform data to match dashboard expectations
      const metrics = {
        summary: {
          workingCapital: rawMetrics.cashPosition,
          workingCapitalChange: rawMetrics.cashTrend,
          cashConversionCycle: rawMetrics.cashConversionCycle,
          cccChange: rawMetrics.cccTrend,
          currentRatio: 2.1, // Mock - would come from actual data
          currentRatioChange: 0.1,
          quickRatio: 1.8, // Mock - would come from actual data
          quickRatioChange: 0.05
        },
        receivables: {
          total: rawMetrics.arAging.total,
          dso: rawMetrics.dso,
          overdue: rawMetrics.arAging['90+'],
          aging: {
            current: rawMetrics.arAging.current,
            days30: rawMetrics.arAging['1-30'],
            days60: rawMetrics.arAging['31-60'],
            days90: rawMetrics.arAging['61-90'],
            days90plus: rawMetrics.arAging['90+'],
            total: rawMetrics.arAging.total
          }
        },
        payables: {
          total: rawMetrics.apAging.total,
          dpo: rawMetrics.dpo,
          discountsAvailable: 25000, // Mock - would calculate from actual data
          aging: {
            current: rawMetrics.apAging.current,
            days30: rawMetrics.apAging['1-30'],
            days60: rawMetrics.apAging['31-60'],
            days90: rawMetrics.apAging['61-90'],
            days90plus: rawMetrics.apAging['90+'],
            total: rawMetrics.apAging.total
          }
        },
        inventory: {
          total: rawMetrics.inventory.totalValue,
          dio: rawMetrics.inventory.daysOnHand,
          turnoverRatio: rawMetrics.inventory.turnoverRatio
        },
        cashFlow: rawMetrics.cashFlow,
        cccHistory: rawMetrics.forecast?.weeks || [],
        recommendations: [
          {
            id: 1,
            title: 'Accelerate Collections',
            description: 'Implement early payment discounts to reduce DSO by 5-7 days',
            impact: 'High',
            effort: 'Low',
            potentialSaving: 125000,
            action: 'Setup Discount Program'
          }
        ],
        alerts: rawMetrics.alerts?.map(alert => ({
          severity: alert.severity,
          title: alert.severity === 'warning' ? 'Action Required' : 'Information',
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
      console.error('Failed to fetch working capital metrics:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error
      }))
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const exportData = useCallback(async (format) => {
    try {
      await exportWorkingCapitalData(format, period)
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }, [period])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refetch: refresh,
    exportData
  }
}
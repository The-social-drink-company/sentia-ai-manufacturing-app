import { useState, useEffect, useCallback } from 'react'

import { fetchWorkingCapitalMetrics } from '../services/workingCapitalService'

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
      const metrics = await fetchWorkingCapitalMetrics(period)
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

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refresh
  }
}
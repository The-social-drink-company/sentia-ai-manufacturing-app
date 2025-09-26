import { useEffect, useMemo, useState } from 'react'
import { fetchDashboardSummary } from '../services/dashboardService.js'

const initialState = {
  status: 'idle',
  data: null,
  source: 'mock',
}

export function useDashboardSummary() {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    let isMounted = true

    setState(prev => ({ ...prev, status: 'loading' }))

    fetchDashboardSummary()
      .then(result => {
        if (!isMounted) {
          return
        }

        setState({
          status: 'success',
          data: result.payload,
          source: result.source,
        })
      })
      .catch(error => {
        if (!isMounted) {
          return
        }

        console.error('[useDashboardSummary] failed to load summary', error)
        setState({
          status: 'error',
          data: null,
          source: 'mock',
        })
      })

    return () => {
      isMounted = false
    }
  }, [])

  return useMemo(() => state, [state])
}

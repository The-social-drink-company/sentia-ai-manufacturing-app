import { useEffect, useMemo, useState } from 'react'
import apiClient from '@/services/api/apiClient'

const FALLBACK_INSIGHTS = Object.freeze({
  generatedAt: new Date().toISOString(),
  summary: {
    total: 4,
    highPriority: 1,
    mediumPriority: 2,
    lowPriority: 1,
    averageConfidence: 86,
  },
  insights: [
    {
      id: 'fallback-1',
      title: 'Revenue Growth Opportunity',
      description:
        'Optimise pricing strategy for premium SKUs across EU channels to capture an additional GBP 420K in Q4 revenue.',
      category: 'financial',
      type: 'prediction',
      severity: 'high',
      confidence: 91,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      recommendation: 'Review current price elasticity data and trial a 3% increase in the UK market next sprint.',
    },
    {
      id: 'fallback-2',
      title: 'Inventory Rebalance Suggested',
      description:
        'Widget A stock levels are projected to exceed demand by 14% over the next 6 weeks in the Northern warehouse.',
      category: 'inventory',
      type: 'optimization',
      severity: 'medium',
      confidence: 83,
      timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      recommendation: 'Move 300 units to Midlands warehouse and pause re-order until mid-November.',
    },
    {
      id: 'fallback-3',
      title: 'Quality Drift Detected',
      description:
        'Line B first-pass yield dipped to 96.1% for the last production cycle, outside acceptable variance.',
      category: 'quality',
      type: 'anomaly',
      severity: 'medium',
      confidence: 78,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      recommendation: 'Schedule preventive maintenance slot and run root cause analysis on filling valves.',
    },
    {
      id: 'fallback-4',
      title: 'Working Capital Watch',
      description:
        'Days sales outstanding increased by 3.4 days this month, affecting cash conversion cycle.',
      category: 'working-capital',
      type: 'prediction',
      severity: 'low',
      confidence: 92,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      recommendation: 'Flag overdue invoices to collections queue and confirm revised payment terms with top debtors.',
    },
  ],
})

export const useAIMetrics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const allowFallback = useMemo(() => {
    const flag = import.meta.env?.VITE_DEVELOPMENT_MODE
    if (import.meta.env?.PROD) {
      return flag === 'true'
    }
    return flag !== 'false'
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const fetchInsights = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.request('/api/ai/insights', {
          method: 'POST',
          body: JSON.stringify({}),
          signal: controller.signal,
        })

        const insightsPayload = normalizeResponse(response)
        if (isMounted) {
          setData(insightsPayload)
        }
      } catch (fetchError) {
        console.warn('[useAIMetrics] Failed to fetch AI insights, using fallback:', fetchError)
        if (isMounted) {
          if (allowFallback) {
            setData(FALLBACK_INSIGHTS)
            setError(null)
          } else {
            setError(fetchError instanceof Error ? fetchError : new Error('Failed to fetch AI insights'))
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchInsights()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [allowFallback])

  return { data, loading, error }
}

const normalizeResponse = raw => {
  if (!raw) {
    return FALLBACK_INSIGHTS
  }

  if (Array.isArray(raw?.insights)) {
    return {
      generatedAt: raw.timestamp || new Date().toISOString(),
      summary: raw.summary || buildSummary(raw.insights),
      insights: raw.insights.map(hydrateInsight),
    }
  }

  if (Array.isArray(raw?.data?.insights)) {
    return {
      generatedAt: raw.data.timestamp || new Date().toISOString(),
      summary: raw.data.summary || buildSummary(raw.data.insights),
      insights: raw.data.insights.map(hydrateInsight),
    }
  }

  return FALLBACK_INSIGHTS
}

const hydrateInsight = (insight, index) => ({
  id: insight.id || `insight-${index}`,
  title: insight.title || 'Insight',
  description: insight.description || 'No description provided.',
  category: insight.category || 'general',
  type: insight.type || 'observation',
  severity: insight.severity || 'medium',
  confidence: typeof insight.confidence === 'number' ? Math.round(insight.confidence) : 50,
  timestamp: insight.timestamp || new Date().toISOString(),
  recommendation:
    insight.recommendation ||
    insight.action ||
    'Review this insight with the operations team to determine the next best step.',
})

const buildSummary = insights => {
  if (!Array.isArray(insights) || insights.length === 0) {
    return FALLBACK_INSIGHTS.summary
  }

  const totals = insights.reduce(
    (acc, item) => {
      const severityKey = (item.severity || 'unknown').toLowerCase()
      if (['high', 'medium', 'low'].includes(severityKey)) {
        acc[`${severityKey}Priority`] += 1
      }
      acc.confidenceSum += Number(item.confidence) || 0
      acc.total += 1
      return acc
    },
    { total: 0, highPriority: 0, mediumPriority: 0, lowPriority: 0, confidenceSum: 0 }
  )

  return {
    total: totals.total,
    highPriority: totals.highPriority,
    mediumPriority: totals.mediumPriority,
    lowPriority: totals.lowPriority,
    averageConfidence: totals.total > 0 ? Math.round(totals.confidenceSum / totals.total) : 0,
  }
}

export default useAIMetrics

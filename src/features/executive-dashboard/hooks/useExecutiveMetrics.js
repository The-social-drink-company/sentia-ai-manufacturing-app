import { useState, useEffect } from 'react'
import { logWarn, logError } from '../../../utils/structuredLogger.js'

// Mock data for executive metrics
const mockExecutiveData = {
  kpis: [
    {
      id: 'revenue',
      name: 'Monthly Revenue',
      value: '2.4M',
      unit: 'USD',
      trend: 8.2,
      target: 2.5,
      status: 'warning'
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow',
      value: '450K',
      unit: 'USD',
      trend: -3.5,
      target: 500,
      status: 'critical'
    },
    {
      id: 'oee',
      name: 'Overall Equipment Effectiveness',
      value: '87',
      unit: '%',
      trend: 2.1,
      target: 90,
      status: 'good'
    },
    {
      id: 'customer-satisfaction',
      name: 'Customer Satisfaction',
      value: '94',
      unit: '%',
      trend: 1.5,
      target: 95,
      status: 'good'
    }
  ],
  opportunities: [
    {
      title: 'Expand European Market',
      description: 'Potential 30% growth in Q2 based on current demand trends'
    },
    {
      title: 'Automation Investment',
      description: 'ROI projection shows 18-month payback on proposed line upgrade'
    },
    {
      title: 'Strategic Partnership',
      description: 'Distribution partnership could reduce logistics costs by 15%'
    }
  ],
  risks: [
    {
      title: 'Supply Chain Disruption',
      impact: 'High',
      probability: 'Medium',
      description: 'Supplier lead times extending by 20%'
    },
    {
      title: 'Currency Fluctuation',
      impact: 'Medium',
      probability: 'High',
      description: 'USD/EUR volatility affecting margins'
    },
    {
      title: 'Regulatory Changes',
      impact: 'Medium',
      probability: 'Low',
      description: 'New compliance requirements in Q3'
    }
  ],
  financialMetrics: {
    grossMargin: { value: 42.3, trend: 0.8, target: 45 },
    operatingMargin: { value: 18.7, trend: -0.5, target: 20 },
    workingCapital: { value: 1.2, trend: 0.1, target: 1.5, unit: 'M USD' },
    debtToEquity: { value: 0.35, trend: -0.02, target: 0.40 },
    returnOnAssets: { value: 12.5, trend: 0.3, target: 15, unit: '%' },
    inventoryTurnover: { value: 8.2, trend: 0.5, target: 10 }
  },
  operationalMetrics: {
    productionVolume: { value: 125000, trend: 5000, target: 130000, unit: 'units' },
    onTimeDelivery: { value: 96.2, trend: 1.1, target: 98, unit: '%' },
    defectRate: { value: 0.8, trend: -0.1, target: 0.5, unit: '%' },
    capacityUtilization: { value: 78, trend: 3, target: 85, unit: '%' },
    leadTime: { value: 3.2, trend: -0.2, target: 3, unit: 'days' },
    supplierPerformance: { value: 91, trend: 2, target: 95, unit: '%' }
  }
}

const fetchExecutiveMetrics = async (period) => {
  // Simulate API call to MCP server
  const mcpUrl = import.meta.env?.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'

  try {
    const response = await fetch(`${mcpUrl}/v1/executive/metrics?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch executive metrics')
    }

    const data = await response.json()
    return data
  } catch (error) {
    logWarn('Falling back to mock executive data', { error: error.message })
    // Return mock data with slight variations based on period
    return {
      ...mockExecutiveData,
      period,
      lastUpdated: new Date().toISOString()
    }
  }
}

export const useExecutiveMetrics = (period = 'month') => {
  const [metrics, setMetrics] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadMetrics = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchExecutiveMetrics(period)

        if (!isMounted) return

        setMetrics(data)

        // Generate alerts based on metrics
        const newAlerts = []

        // Check for critical KPIs
        data.kpis?.forEach(kpi => {
          if (kpi.status === 'critical') {
            newAlerts.push({
              id: `kpi-${kpi.id}`,
              severity: 'critical',
              message: `${kpi.name} is below critical threshold (${kpi.value}${kpi.unit} vs target ${kpi.target}${kpi.unit})`
            })
          } else if (kpi.status === 'warning') {
            newAlerts.push({
              id: `kpi-${kpi.id}`,
              severity: 'warning',
              message: `${kpi.name} needs attention (${kpi.value}${kpi.unit} vs target ${kpi.target}${kpi.unit})`
            })
          }
        })

        // Check for high-impact risks
        data.risks?.forEach((risk, index) => {
          if (risk.impact === 'High' && risk.probability !== 'Low') {
            newAlerts.push({
              id: `risk-${index}`,
              severity: 'critical',
              message: risk.title
            })
          }
        })

        setAlerts(newAlerts)
      } catch (err) {
        if (!isMounted) return

        setError(err)
        logError('Error loading executive metrics', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMetrics()

    // Set up polling for real-time updates
    const interval = setInterval(loadMetrics, 30000) // Update every 30 seconds

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [period])

  return {
    metrics,
    alerts,
    loading,
    error,
    refresh: () => {
      setLoading(true)
      fetchExecutiveMetrics(period).then(data => {
        setMetrics(data)
        setLoading(false)
      }).catch(err => {
        setError(err)
        setLoading(false)
      })
    }
  }
}
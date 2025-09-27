import { useState, useEffect, useCallback } from 'react'
import { logInfo, logError } from '../../../utils/logger'

// Mock data generator for development
const generateMockMetrics = (period) => {
  const baseMultiplier = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365

  return {
    kpis: {
      // Primary Financial KPIs
      currentRatio: 1.8 + Math.random() * 0.4,
      currentRatioTrend: Math.random() > 0.5 ? 'up' : 'down',
      quickRatio: 1.3 + Math.random() * 0.3,
      quickRatioTrend: Math.random() > 0.5 ? 'up' : 'down',
      cashUnlockPotential: 250000 * baseMultiplier + Math.random() * 50000,
      cashUnlockTrend: Math.random() > 0.6 ? 'up' : 'down',
      cashConversionCycle: 35 + Math.floor(Math.random() * 15),
      cccTrend: Math.random() > 0.5 ? 'up' : 'down',

      // Working Capital Metrics
      dso: 42 + Math.floor(Math.random() * 10), // Days Sales Outstanding
      dpo: 38 + Math.floor(Math.random() * 8),  // Days Payable Outstanding
      dio: 31 + Math.floor(Math.random() * 7),  // Days Inventory Outstanding

      // Cash Flow Metrics
      operatingCashFlow: 180000 * baseMultiplier + Math.random() * 30000,
      freeCashFlow: 120000 * baseMultiplier + Math.random() * 20000,
      cashBalance: 850000 + Math.random() * 150000,

      // Operational Metrics
      revenue: 500000 * baseMultiplier + Math.random() * 100000,
      grossMargin: 0.42 + Math.random() * 0.08,
      ebitda: 85000 * baseMultiplier + Math.random() * 15000,
      netProfit: 65000 * baseMultiplier + Math.random() * 10000,

      // Efficiency Metrics
      oee: 0.78 + Math.random() * 0.12, // Overall Equipment Effectiveness
      inventoryTurnover: 8.5 + Math.random() * 2,
      assetTurnover: 1.8 + Math.random() * 0.4,

      // Customer Metrics
      customerSatisfaction: 0.88 + Math.random() * 0.08,
      orderFulfillmentRate: 0.94 + Math.random() * 0.04,
      onTimeDelivery: 0.92 + Math.random() * 0.05,
    },

    cashFlow: {
      labels: Array.from({ length: 12 }, _(_, _i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (11 - i))
        return date.toLocaleDateString('en-US', { month: 'short' })
      }),
      operating: Array.from({ length: 12 }, () => 150000 + Math.random() * 50000),
      investing: Array.from({ length: 12 }, () => -30000 - Math.random() * 20000),
      financing: Array.from({ length: 12 }, () => -20000 - Math.random() * 10000),
      net: Array.from({ length: 12 }, () => 100000 + Math.random() * 30000),
    },

    workingCapital: {
      labels: ['Receivables', 'Inventory', 'Payables', 'Net Working Capital'],
      current: [450000, 320000, -280000, 490000],
      previous: [480000, 300000, -270000, 510000],
      optimal: [380000, 280000, -320000, 340000],
    },

    alerts: [
      {
        severity: 'critical',
        title: 'Cash Flow Alert',
        message: 'Operating cash flow decreased by 15% compared to last period',
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        severity: 'warning',
        title: 'DSO Increase',
        message: 'Days Sales Outstanding increased to 52 days (target: 45)',
        timestamp: new Date().toLocaleTimeString(),
      },
    ],

    insights: {
      opportunities: [
        {
          title: 'Accelerate Collections',
          description: 'Reducing DSO by 5 days could unlock $125,000 in cash',
          impact: '$125,000',
        },
        {
          title: 'Optimize Inventory',
          description: 'Improving turnover ratio to industry benchmark releases $85,000',
          impact: '$85,000',
        },
        {
          title: 'Extend Payables',
          description: 'Negotiating 5 additional days DPO improves cash by $65,000',
          impact: '$65,000',
        },
      ],
      risks: [
        {
          title: 'Customer Concentration',
          description: 'Top 3 customers represent 45% of receivables',
          level: 'Medium',
        },
        {
          title: 'Inventory Aging',
          description: '12% of inventory is over 180 days old',
          level: 'High',
        },
      ],
    },
  }
}

export function useExecutiveMetrics(period = 'month') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMetrics = useCallback(async _() => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch from MCP server
      const mcpUrl = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3001'

      try {
        const response = await fetch(`${mcpUrl}/api/executive/metrics?period=${period}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
          },
        })

        if (response.ok) {
          const metrics = await response.json()
          logInfo('Executive metrics fetched from MCP', { period })
          setData(metrics)
          return
        }
      } catch (mcpError) {
        logInfo('MCP server not available, using mock data', mcpError)
      }

      // Fallback to mock data
      const mockData = generateMockMetrics(period)
      setData(mockData)

    } catch (err) {
      logError('Failed to fetch executive metrics', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics,
  }
}
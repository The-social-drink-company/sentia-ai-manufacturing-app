import { useState, useEffect, useCallback } from 'react'

export function useInventoryMetrics(filters = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { location = 'all', category = 'all', timeRange = '30d' } = filters

  const generateMockData = useCallback(() => {
    const baseData = {
      summary: {
        totalItems: 120 + Math.floor(Math.random() * 50),
        itemsChange: (Math.random() - 0.5) * 10,
        totalValue: 2800000 + Math.random() * 500000,
        valueChange: (Math.random() - 0.5) * 15,
        turnoverRatio: 8.5 + Math.random() * 3,
        turnoverChange: (Math.random() - 0.5) * 8,
        stockoutRisk: 3 + Math.random() * 8,
        riskChange: (Math.random() - 0.5) * 5
      },

      stockLevels: generateStockLevels(),
      forecast: generateDemandForecast(),
      suppliers: generateSupplierData(),
      reorders: generateReorderRecommendations(),
      analysis: generateABCAnalysis(),
      alerts: generateInventoryAlerts()
    }

    return baseData
  }, [location, category, timeRange])

  function generateStockLevels() {
    const periods = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const data = []

    for (let i = 0; i < periods; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (periods - i))

      data.push({
        period: date.toISOString().split('T')[0],
        currentStock: Math.round(150 + Math.random() * 300),
        minLevel: Math.round(50 + Math.random() * 50),
        maxLevel: Math.round(400 + Math.random() * 200),
        value: Math.round((150 + Math.random() * 300) * (45 + Math.random() * 20))
      })
    }

    return data
  }

  function generateDemandForecast() {
    const periods = 60
    const data = []
    const today = new Date()

    for (let i = -30; i < periods; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      const isPast = i <= 0
      const baseDemand = 80 + Math.random() * 60
      const seasonalFactor = 1 + 0.3 * Math.sin((i / 30) * Math.PI)

      const actualDemand = isPast ? Math.round(baseDemand * seasonalFactor) : null
      const forecastDemand = Math.round(baseDemand * seasonalFactor * (0.9 + Math.random() * 0.2))

      data.push({
        period: date.toISOString().split('T')[0],
        actualDemand,
        forecastDemand,
        upperBound: Math.round(forecastDemand * 1.2),
        lowerBound: Math.round(forecastDemand * 0.8),
        confidence: Math.round(75 + Math.random() * 20),
        items: [
          { name: 'Steel Sheets', actualDemand: isPast ? Math.round((actualDemand || 0) / 3) : null, forecastDemand: Math.round(forecastDemand / 3) },
          { name: 'Circuit Boards', actualDemand: isPast ? Math.round((actualDemand || 0) / 4) : null, forecastDemand: Math.round(forecastDemand / 4) }
        ]
      })
    }

    return data
  }

  function generateSupplierData() {
    return [
      {
        id: 1,
        name: 'Steel Dynamics Corp',
        category: 'Raw Materials',
        onTimeDelivery: 92.5 + Math.random() * 5,
        qualityScore: 96.2 + Math.random() * 3,
        avgLeadTime: 12 + Math.random() * 8,
        costEfficiency: 88 + Math.random() * 10,
        responsiveness: 90 + Math.random() * 8,
        riskFactors: Math.random() > 0.7 ? ['Single source', 'Geographic risk'] : []
      },
      {
        id: 2,
        name: 'TechComponents Ltd',
        category: 'Electronic Components',
        onTimeDelivery: 88.3 + Math.random() * 8,
        qualityScore: 94.1 + Math.random() * 4,
        avgLeadTime: 18 + Math.random() * 10,
        costEfficiency: 82 + Math.random() * 12,
        responsiveness: 85 + Math.random() * 10,
        riskFactors: Math.random() > 0.5 ? ['Quality variations'] : []
      },
      {
        id: 3,
        name: 'Precision Manufacturing',
        category: 'Machined Parts',
        onTimeDelivery: 95.7 + Math.random() * 3,
        qualityScore: 98.5 + Math.random() * 1.5,
        avgLeadTime: 8 + Math.random() * 4,
        costEfficiency: 75 + Math.random() * 15,
        responsiveness: 93 + Math.random() * 6,
        riskFactors: []
      }
    ]
  }

  function generateReorderRecommendations() {
    const items = [
      { id: 1, name: 'Steel Sheets', category: 'raw-materials' },
      { id: 2, name: 'Circuit Boards', category: 'wip' },
      { id: 3, name: 'Motors', category: 'finished-goods' },
      { id: 4, name: 'Aluminum Rods', category: 'raw-materials' }
    ]

    return items.map(item => {
      const stockLevel = Math.floor(Math.random() * 50)
      const reorderPoint = Math.round(50 + Math.random() * 30)
      const unitCost = 15 + Math.random() * 85

      return {
        ...item,
        stockLevel,
        reorderPoint,
        maxLevel: Math.round(300 + Math.random() * 200),
        recommendedQuantity: Math.round(100 + Math.random() * 200),
        unitCost,
        leadTime: Math.round(7 + Math.random() * 14),
        preferredSupplier: 'Steel Dynamics Corp',
        reasoning: stockLevel <= reorderPoint * 0.5 ? 'Critical stockout - immediate replenishment required' : 'Standard reorder point reached',
        annualDemand: Math.round(2000 + Math.random() * 5000),
        orderCost: Math.round(150 + Math.random() * 100),
        holdingCost: Math.round(unitCost * 0.25)
      }
    })
  }

  function generateABCAnalysis() {
    const items = [
      { id: 1, name: 'Steel Sheets', category: 'raw-materials' },
      { id: 2, name: 'Aluminum Rods', category: 'raw-materials' },
      { id: 3, name: 'Circuit Boards', category: 'wip' },
      { id: 4, name: 'Motors', category: 'finished-goods' },
      { id: 5, name: 'Screws & Bolts', category: 'consumables' },
      { id: 6, name: 'Wire Harnesses', category: 'wip' },
      { id: 7, name: 'Plastic Housings', category: 'raw-materials' },
      { id: 8, name: 'Finished Units', category: 'finished-goods' }
    ]

    return items.map(item => ({
      ...item,
      quantity: Math.floor(50 + Math.random() * 500),
      unitCost: 25 + Math.random() * 175,
      annualUsage: Math.floor(1000 + Math.random() * 8000),
      leadTime: Math.round(5 + Math.random() * 20)
    }))
  }

  function generateInventoryAlerts() {
    const alerts = []

    if (Math.random() > 0.5) {
      alerts.push({
        id: 'stockout-1',
        severity: 'critical',
        title: 'Stockout Risk: Steel Sheets',
        description: 'Current stock is critically low. Production may be impacted within 48 hours.',
        action: 'Initiate emergency procurement'
      })
    }

    if (Math.random() > 0.7) {
      alerts.push({
        id: 'quality-1',
        severity: 'warning',
        title: 'Quality Issues Detected',
        description: 'Recent batch showing higher defect rates than normal',
        action: 'Contact supplier for quality review'
      })
    }

    if (Math.random() > 0.6) {
      alerts.push({
        id: 'demand-1',
        severity: 'info',
        title: 'Demand Spike Predicted',
        description: 'AI forecasting indicates 25% increase in demand next month',
        action: 'Consider increasing safety stock'
      })
    }

    return alerts
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (Math.random() < 0.03) {
        throw new Error('Failed to fetch inventory data')
      }

      const mockData = generateMockData()
      setData(mockData)
      setLoading(false)
    } catch (err) {
      setError(err)
      setLoading(false)
    }
  }, [generateMockData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  const exportData = useCallback(async (format) => {
    if (!data) return

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: format === 'pdf' ? 'application/pdf' : format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `inventory-report.${format === 'excel' ? 'xlsx' : format}`
      link.click()
    } catch (err) {
      throw new Error(`Export failed: ${err.message}`)
    }
  }, [data])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    exportData
  }
}
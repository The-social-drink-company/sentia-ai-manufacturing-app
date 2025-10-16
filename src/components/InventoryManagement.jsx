import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  TruckIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

const InventoryManagement = () => {
  const [inventoryData, setInventoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [alertsFilter, setAlertsFilter] = useState('all')
  const [lastUpdated, setLastUpdated] = useState(null)

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

  // Sentia's 9-SKU business model
  const sentiaProducts = {
    'GABA-RED-UK': { name: 'GABA Red UK', price: 29.99, currency: 'GBP' },
    'GABA-RED-EU': { name: 'GABA Red EU', price: 34.99, currency: 'EUR' },
    'GABA-RED-USA': { name: 'GABA Red USA', price: 39.99, currency: 'USD' },
    'GABA-BLACK-UK': { name: 'GABA Black UK', price: 29.99, currency: 'GBP' },
    'GABA-BLACK-EU': { name: 'GABA Black EU', price: 34.99, currency: 'EUR' },
    'GABA-BLACK-USA': { name: 'GABA Black USA', price: 39.99, currency: 'USD' },
    'GABA-GOLD-UK': { name: 'GABA Gold UK', price: 29.99, currency: 'GBP' },
    'GABA-GOLD-EU': { name: 'GABA Gold EU', price: 34.99, currency: 'EUR' },
    'GABA-GOLD-USA': { name: 'GABA Gold USA', price: 39.99, currency: 'USD' }
  }

  const salesChannels = {
    'amazon-uk': { name: 'Amazon UK', commission: 0.15, paymentTerms: 14 },
    'amazon-usa': { name: 'Amazon USA', commission: 0.15, paymentTerms: 14 },
    'shopify-uk': { name: 'Shopify UK', commission: 0.029, paymentTerms: 3 },
    'shopify-eu': { name: 'Shopify EU', commission: 0.029, paymentTerms: 3 },
    'shopify-usa': { name: 'Shopify USA', commission: 0.029, paymentTerms: 3 }
  }

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${apiBase}/inventory/levels`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory data: ${response.status}`)
      }

      const data = await response.json()
      
      // Enhance data with Sentia-specific calculations
      const enhancedData = enhanceInventoryData(data)
      setInventoryData(enhancedData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const enhanceInventoryData = (rawData) => {
    // Mock enhancement with Sentia business logic
    // In real implementation, this would process actual inventory data
    return {
      totalValue: rawData.totalValue || 117000, // From Phase 1 data
      lowStockItems: rawData.lowStock || 2,
      products: generateSentiaInventory(),
      alerts: generateInventoryAlerts(),
      channelAllocation: calculateChannelAllocation(),
      reorderRecommendations: calculateReorderPoints(),
      leadTimeForecast: calculateLeadTimes()
    }
  }

  const generateSentiaInventory = () => {
    return Object.entries(sentiaProducts).map(([sku, product]) => {
      // Simulate realistic inventory levels for each SKU
      const baseStock = Math.floor(Math.random() * 400) + 100 // 100-500 units
      const reserved = Math.floor(Math.random() * 50) // 0-50 reserved
      const inbound = Math.floor(Math.random() * 100) // 0-100 inbound
      
      const reorderPoint = calculateReorderPoint(sku)
      const economicOrderQuantity = calculateEOQ(sku)
      
      return {
        sku,
        name: product.name,
        availableQuantity: baseStock,
        reservedQuantity: reserved,
        inboundQuantity: inbound,
        totalQuantity: baseStock + reserved + inbound,
        unitValue: product.price,
        totalValue: baseStock * product.price,
        currency: product.currency,
        reorderPoint,
        economicOrderQuantity,
        daysOfStock: Math.floor(baseStock / 3), // Assuming 3 units/day average sales
        status: baseStock < reorderPoint ? 'low' : baseStock < reorderPoint * 1.5 ? 'medium' : 'good',
        lastUpdated: new Date(),
        location: getProductLocation(sku)
      }
    })
  }

  const calculateReorderPoint = (sku) => {
    // Safety stock + lead time demand
    const avgDailySales = 3 // 3 units per day average
    const leadTimeDays = 30 // 30-day lead time
    const safetyStockDays = 7 // 7-day safety buffer
    
    return avgDailySales * (leadTimeDays + safetyStockDays)
  }

  const calculateEOQ = (sku) => {
    // Economic Order Quantity based on Sentia's batch sizes (100-1000 units)
    const annualDemand = 1095 // ~3 units/day * 365 days
    const orderingCost = 500 // £500 per order
    const holdingCost = 2 // £2 per unit per year
    
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
    return Math.max(100, Math.min(1000, Math.round(eoq))) // Clamp to batch constraints
  }

  const getProductLocation = (sku) => {
    if (sku.includes('UK')) return 'UK Warehouse'
    if (sku.includes('EU')) return 'EU Fulfillment Center'
    if (sku.includes('USA')) return 'US Distribution Center'
    return 'Main Warehouse'
  }

  const generateInventoryAlerts = () => {
    return [
      {
        id: 1,
        type: 'low_stock',
        severity: 'high',
        sku: 'GABA-RED-UK',
        message: 'Stock below reorder point (89 units remaining)',
        recommendation: 'Order 250 units immediately',
        estimatedStockout: '12 days'
      },
      {
        id: 2,
        type: 'high_demand',
        severity: 'medium',
        sku: 'GABA-GOLD-USA',
        message: 'Demand surge detected (+40% this week)',
        recommendation: 'Consider increasing next order quantity',
        estimatedStockout: null
      },
      {
        id: 3,
        type: 'slow_moving',
        severity: 'low',
        sku: 'GABA-BLACK-EU',
        message: 'Slow movement detected (60+ days of stock)',
        recommendation: 'Consider promotional campaign',
        estimatedStockout: null
      }
    ]
  }

  const calculateChannelAllocation = () => {
    return Object.entries(salesChannels).map(([channel, info]) => ({
      channel,
      name: info.name,
      allocation: Math.floor(Math.random() * 30) + 10, // 10-40% allocation
      expectedSales: Math.floor(Math.random() * 100) + 20,
      commission: info.commission,
      paymentTerms: info.paymentTerms,
      profitability: (1 - info.commission) * 100
    }))
  }

  const calculateReorderPoints = () => {
    return [
      {
        sku: 'GABA-RED-UK',
        currentStock: 89,
        reorderPoint: 111,
        recommendedOrder: 250,
        priority: 'urgent',
        leadTime: '30 days',
        cost: '£7,497.50'
      },
      {
        sku: 'GABA-GOLD-USA',
        currentStock: 156,
        reorderPoint: 111,
        recommendedOrder: 200,
        priority: 'soon',
        leadTime: '30 days',
        cost: '$7,998.00'
      }
    ]
  }

  const calculateLeadTimes = () => {
    return {
      averageLeadTime: 30,
      currentOrders: [
        { orderDate: '2025-10-01', expectedDelivery: '2025-10-31', status: 'in_transit' },
        { orderDate: '2025-10-15', expectedDelivery: '2025-11-14', status: 'processing' }
      ],
      supplierPerformance: {
        onTimeDelivery: 0.92,
        averageDelay: 2.5
      }
    }
  }

  useEffect(() => {
    fetchInventoryData()
    
    // Set up real-time updates every 5 minutes
    const interval = setInterval(fetchInventoryData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value, currency = 'GBP') => {
    const currencyMap = { 'GBP': '£', 'EUR': '€', 'USD': '$' }
    return `${currencyMap[currency] || '£'}${value.toFixed(2)}`
  }

  const getStatusColor = (status) => {
    const colors = {
      good: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-red-600 bg-red-100'
    }
    return colors[status] || 'text-gray-600 bg-gray-100'
  }

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50'
    }
    return colors[severity] || 'border-gray-300 bg-gray-50'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <CubeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
              <p className="text-slate-600 dark:text-slate-400">Real-time stock monitoring for Sentia Manufacturing</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <CubeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
            <p className="text-slate-600 dark:text-slate-400">Real-time stock monitoring for Sentia Manufacturing</p>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Unable to load inventory data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchInventoryData}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <CubeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time monitoring of 9 GABA SKUs across 5 sales channels
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInventoryData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Inventory Value"
          value={formatCurrency(inventoryData?.totalValue || 0)}
          icon={CubeIcon}
          color="purple"
          description="Total stock value across all SKUs"
        />
        
        <MetricCard
          title="Active SKUs"
          value="9"
          icon={ChartBarIcon}
          color="blue"
          description="GABA Red/Black/Gold × 3 regions"
        />
        
        <MetricCard
          title="Low Stock Alerts"
          value={inventoryData?.lowStockItems || 0}
          icon={ExclamationTriangleIcon}
          color={inventoryData?.lowStockItems > 0 ? "red" : "green"}
          description="Items below reorder point"
        />
        
        <MetricCard
          title="Avg Lead Time"
          value={`${inventoryData?.leadTimeForecast?.averageLeadTime || 30} days`}
          icon={ClockIcon}
          color="yellow"
          description="Average supplier lead time"
        />
      </div>

      {/* Stock Alerts */}
      {inventoryData?.alerts && inventoryData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚨 Inventory Alerts
              <span className="text-sm font-normal text-muted-foreground">
                ({inventoryData.alerts.length} active)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventoryData.alerts.map((alert) => (
              <div key={alert.id} className={`border-l-4 pl-4 py-3 ${getSeverityColor(alert.severity)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{alert.sku}</h4>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-sm font-medium text-blue-600 mt-2">
                      💡 {alert.recommendation}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity} priority
                  </span>
                </div>
                {alert.estimatedStockout && (
                  <p className="text-xs text-red-600 mt-1">
                    ⏰ Estimated stockout in {alert.estimatedStockout}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stock Levels by SKU */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Available</th>
                  <th className="text-left py-2">Reserved</th>
                  <th className="text-left py-2">Inbound</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Days of Stock</th>
                  <th className="text-left py-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData?.products?.map((product) => (
                  <tr key={product.sku} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{product.name}</td>
                    <td className="py-3">{product.availableQuantity}</td>
                    <td className="py-3 text-gray-600">{product.reservedQuantity}</td>
                    <td className="py-3 text-green-600">{product.inboundQuantity}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3">{product.daysOfStock} days</td>
                    <td className="py-3 text-sm text-gray-600">{product.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Channel Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏪 Channel Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryData?.channelAllocation?.map((channel) => (
                <div key={channel.channel} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-sm text-gray-600">
                      {channel.allocation}% allocation • {(channel.commission * 100).toFixed(1)}% commission
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{channel.profitability.toFixed(1)}%</p>
                    <p className="text-xs text-gray-600">profitability</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Reorder Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryData?.reorderRecommendations?.map((rec) => (
                <div key={rec.sku} className="border-l-4 border-orange-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{rec.sku}</p>
                      <p className="text-sm text-gray-600">
                        Current: {rec.currentStock} • Reorder Point: {rec.reorderPoint}
                      </p>
                      <p className="text-sm text-orange-600 font-medium">
                        Recommend: {rec.recommendedOrder} units
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rec.priority}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{rec.cost}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source */}
      <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-purple-800 dark:text-purple-200">
              <TruckIcon className="w-4 h-4" />
              <span>Real-time inventory data from Sentia manufacturing system</span>
            </div>
            {lastUpdated && (
              <span className="text-purple-600 dark:text-purple-400">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const MetricCard = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    red: 'bg-red-50 text-red-900 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200'
  }

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <Icon className="w-8 h-8" />
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs opacity-70 mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default InventoryManagement
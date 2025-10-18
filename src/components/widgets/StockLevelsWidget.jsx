import { Suspense, lazy, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import stockLevelsApi from '@/services/api/stockLevelsApi'

const StockLevelsChart = lazy(() => import('@/components/dashboard/StockLevelsChart'))

const StockLevelsWidget = () => {
  const [stockData, setStockData] = useState([])
  const [stockSummary, setStockSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [stockLevels, summary] = await Promise.all([
          stockLevelsApi.getGABAStockLevels(),
          stockLevelsApi.getStockSummary(),
        ])

        setStockData(stockLevels)
        setStockSummary(summary)
      } catch (err) {
        console.error('Failed to fetch stock data:', err)
        setError('Failed to load stock levels')
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [])

  // TODO: Use getStatusBadgeColor for stock status badges when implementing table view
  // eslint-disable-next-line no-unused-vars
  const getStatusBadgeColor = status => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const renderStockStatusIndicator = () => {
    if (!stockSummary) return null

    const criticalProducts = stockData.filter(item => item.currentStock <= item.reorderLevel)

    return (
      <div className="flex items-center space-x-2">
        {criticalProducts.length > 0 && (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            {criticalProducts.length} Need Reorder
          </Badge>
        )}
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {stockSummary.totalProducts} Products
        </Badge>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
          <CardDescription>Loading GABA product inventory...</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
          <CardDescription>Unable to load stock data</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <div className="flex items-center justify-center h-full text-red-500">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Stock Levels</CardTitle>
            <CardDescription>GABA product inventory with reorder indicators</CardDescription>
          </div>
          {renderStockStatusIndicator()}
        </div>
      </CardHeader>
      <CardContent className="h-64">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <StockLevelsChart data={stockData} />
        </Suspense>

        {/* Stock Status Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex space-x-4">
            {stockData.map(item => (
              <div key={item.sku} className="flex items-center space-x-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: item.currentStock <= item.reorderLevel ? '#f59e0b' : '#10b981',
                  }}
                />
                <span className="text-xs">{item.product}</span>
              </div>
            ))}
          </div>
          <div className="text-xs">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StockLevelsWidget

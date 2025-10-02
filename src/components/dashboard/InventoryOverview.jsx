import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon, PackageIcon } from 'lucide-react'

const InventoryOverview = ({ data }) => {
  const formatCurrency = (value) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value) => {
    if (!value) return '0'
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value) => {
    if (!value) return '0%'
    return `${value.toFixed(1)}%`
  }

  const getStockStatus = (current, minimum) => {
    if (!current || !minimum) return 'unknown'
    const ratio = current / minimum
    if (ratio <= 0.5) return 'critical'
    if (ratio <= 1) return 'low'
    if (ratio <= 2) return 'normal'
    return 'high'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-400'
      case 'low': return 'text-yellow-400'
      case 'normal': return 'text-green-400'
      case 'high': return 'text-blue-400'
      default: return 'text-slate-400'
    }
  }

  const inventory = data?.inventory || {}
  const items = inventory.items || []
  const totalValue = inventory.value || 0
  const lowStockCount = inventory.lowStock || 0
  const turnoverRate = inventory.turnoverRate || 0
  const categories = inventory.categories || []

  const lowStockItems = items.filter(item => 
    getStockStatus(item.currentStock, item.minimumStock) === 'critical' ||
    getStockStatus(item.currentStock, item.minimumStock) === 'low'
  ).slice(0, 5)

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PackageIcon className="w-5 h-5" />
          Inventory Overview
        </CardTitle>
        <CardDescription className="text-slate-400">
          Stock levels, valuation and inventory management metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total Value</p>
              <TrendingUpIcon className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-lg font-semibold text-white">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-slate-500">{formatNumber(items.length)} items</p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Low Stock Items</p>
              {lowStockCount > 5 ? (
                <AlertTriangleIcon className="w-4 h-4 text-red-400" />
              ) : lowStockCount > 0 ? (
                <AlertTriangleIcon className="w-4 h-4 text-yellow-400" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
              )}
            </div>
            <p className="text-lg font-semibold text-white">{lowStockCount}</p>
            <p className="text-xs text-slate-500">Require attention</p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Turnover Rate</p>
              {turnoverRate >= 4 ? (
                <TrendingUpIcon className="w-4 h-4 text-green-400" />
              ) : turnoverRate >= 2 ? (
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              ) : (
                <TrendingDownIcon className="w-4 h-4 text-red-400" />
              )}
            </div>
            <p className="text-lg font-semibold text-white">{turnoverRate.toFixed(1)}x</p>
            <p className="text-xs text-slate-500">Annual inventory turns</p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Categories</p>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                {categories.length}
              </Badge>
            </div>
            <p className="text-lg font-semibold text-white">{categories.length}</p>
            <p className="text-xs text-slate-500">Product categories</p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-yellow-400" />
              Low Stock Alerts
            </h4>
            <div className="space-y-2">
              {lowStockItems.map((item, index) => {
                const status = getStockStatus(item.currentStock, item.minimumStock)
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'critical' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}></div>
                      <div>
                        <p className="text-sm text-white">{item.name || item.sku}</p>
                        <p className="text-xs text-slate-400">
                          Current: {formatNumber(item.currentStock)} | Min: {formatNumber(item.minimumStock)}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={status === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Category Breakdown</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.slice(0, 6).map((category, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div>
                    <p className="text-sm text-white">{category.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatNumber(category.itemCount)} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-400">{formatCurrency(category.value)}</p>
                    <p className="text-xs text-slate-400">
                      {formatPercentage((category.value / totalValue) * 100)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Stock Levels</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">In Stock</span>
                <span className="text-sm text-green-400">
                  {formatNumber(items.filter(item => item.currentStock > item.minimumStock).length)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Low Stock</span>
                <span className="text-sm text-yellow-400">
                  {formatNumber(items.filter(item => {
                    const status = getStockStatus(item.currentStock, item.minimumStock)
                    return status === 'low'
                  }).length)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Out of Stock</span>
                <span className="text-sm text-red-400">
                  {formatNumber(items.filter(item => item.currentStock === 0).length)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Movement</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Receipts (30d)</span>
                <span className="text-sm text-blue-400">
                  {formatNumber(inventory.receipts30d)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Issues (30d)</span>
                <span className="text-sm text-orange-400">
                  {formatNumber(inventory.issues30d)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Adjustments</span>
                <span className="text-sm text-slate-300">
                  {formatNumber(inventory.adjustments)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Accuracy</span>
                <span className="text-sm text-green-400">
                  {formatPercentage(inventory.accuracy)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Fill Rate</span>
                <span className="text-sm text-blue-400">
                  {formatPercentage(inventory.fillRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Obsolete Stock</span>
                <span className="text-sm text-red-400">
                  {formatCurrency(inventory.obsoleteValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default InventoryOverview
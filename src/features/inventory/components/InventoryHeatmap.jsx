import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle , Badge } from '../../../components/ui'
import { cn } from '../../../utils/cn'

export function InventoryHeatmap({ data, onCellClick, loading = false, error = null }) {
  const inventoryData = useMemo(() => {
    return Array.isArray(data) ? data : []
  }, [data])

  const locations = useMemo(() => {
    if (inventoryData.length > 0) {
      return inventoryData[0].locations.map(l => l.location)
    }
    return []
  }, [inventoryData])

  const getHeatmapColor = (status, quantity) => {
    if (status === 'critical') return 'bg-red-500'
    if (status === 'warning') return 'bg-amber-500'
    if (quantity > 3000) return 'bg-green-600'
    if (quantity > 1500) return 'bg-green-500'
    if (quantity > 500) return 'bg-green-400'
    return 'bg-green-300'
  }

  const getTextColor = (status, quantity) => {
    if (status === 'critical' || status === 'warning' || quantity > 1500) {
      return 'text-white'
    }
    return 'text-gray-900'
  }

  const formatQuantity = (qty) => {
    if (qty >= 1000) {
      return `${(qty / 1000).toFixed(1)}k`
    }
    return qty.toString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Inventory Distribution Heatmap</CardTitle>
          <div className="flex gap-2">
            <Badge variant="success">Healthy</Badge>
            <Badge variant="warning">Low Stock</Badge>
            <Badge variant="destructive">Critical</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading inventory data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">Failed to load inventory data</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : inventoryData.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No inventory data available</p>
              <p className="text-xs text-muted-foreground">Check API configuration</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-10 gap-1 mb-2">
              <div className="col-span-2 px-2 py-1 text-sm font-semibold">SKU</div>
              {locations.map(location => (
                <div key={location} className="px-1 py-1 text-xs font-medium text-center truncate">
                  {location}
                </div>
              ))}
              <div className="px-2 py-1 text-sm font-semibold text-center">Total</div>
            </div>

            {/* Data Rows */}
            {inventoryData.map((item, index) => {
              const totalQuantity = item.locations.reduce((sum, loc) => sum + loc.quantity, 0)

              return (
                <div key={item.sku} className={cn(
                  "grid grid-cols-10 gap-1 mb-1",
                  index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''
                )}>
                  <div className="col-span-2 px-2 py-2">
                    <div className="text-sm font-medium">{item.sku}</div>
                    <div className="text-xs text-gray-600 truncate">{item.name}</div>
                  </div>

                  {item.locations.map(loc => (
                    <button
                      key={`${item.sku}-${loc.location}`}
                      onClick={() => onCellClick && onCellClick(item.sku, loc)}
                      className={cn(
                        "px-1 py-2 rounded text-xs font-semibold transition-all hover:opacity-90",
                        getHeatmapColor(loc.status, loc.quantity),
                        getTextColor(loc.status, loc.quantity)
                      )}
                    >
                      <div>{formatQuantity(loc.quantity)}</div>
                      <div className="text-[10px] opacity-90">{loc.daysOfSupply}d</div>
                    </button>
                  ))}

                  <div className="px-2 py-2 text-center">
                    <div className="text-sm font-bold">{formatQuantity(totalQuantity)}</div>
                    <div className="text-xs text-gray-600">units</div>
                  </div>
                </div>
              )
            })}

            {/* Summary Row */}
            <div className="grid grid-cols-10 gap-1 mt-2 pt-2 border-t">
              <div className="col-span-2 px-2 py-1 text-sm font-semibold">Location Total</div>
              {locations.map(location => {
                const locationTotal = _inventoryData.reduce((sum, item) => {
                  const loc = item.locations.find(l => l.location === location)
                  return sum + (loc?.quantity || 0)
                }, 0)

                return (
                  <div key={location} className="px-1 py-1 text-xs font-bold text-center">
                    {formatQuantity(locationTotal)}
                  </div>
                )
              })}
              <div className="px-2 py-1 text-sm font-bold text-center">
                {formatQuantity(inventoryData.reduce((sum, item) =>
                  sum + item.locations.reduce((locSum, loc) => locSum + loc.quantity, 0), 0
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
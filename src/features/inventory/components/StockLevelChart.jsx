import React from 'react'

export default function StockLevelChart({ data, period = 'current' }) {
  // Mock stock level data if not provided
  const mockData = data || [
    { date: '2024-01-01', current: 2500, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-02', current: 2300, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-03', current: 2100, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-04', current: 1900, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-05', current: 1700, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-06', current: 1500, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-07', current: 1300, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-08', current: 1100, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-09', current: 900, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-10', current: 700, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' },
    { date: '2024-01-11', current: 2800, minimum: 500, maximum: 4000, reorderPoint: 800, sku: 'SNTG-001' } // Restock
  ]

  const maxValue = Math.max(...mockData.map(d => Math.max(d.current, d.maximum)))
  const dateRange = `${new Date(mockData[0].date).toLocaleDateString()} - ${new Date(mockData[mockData.length - 1].date).toLocaleDateString()}`

  const getStockStatus = (current, reorderPoint, minimum) => {
    if (current <= minimum) return { status: 'critical', color: 'bg-red-500' }
    if (current <= reorderPoint) return { status: 'warning', color: 'bg-yellow-500' }
    return { status: 'healthy', color: 'bg-green-500' }
  }

  const currentStock = mockData[mockData.length - 1]
  const stockStatus = getStockStatus(currentStock.current, currentStock.reorderPoint, currentStock.minimum)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Stock Level Trend
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {dateRange}
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${stockStatus.color}`}></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Current: {currentStock.current.toLocaleString()} units
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Status: <span className={`font-medium ${
              stockStatus.status === 'critical' ? 'text-red-600' :
              stockStatus.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {stockStatus.status.charAt(0).toUpperCase() + stockStatus.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          <span>{maxValue.toLocaleString()}</span>
          <span>{Math.round(maxValue * 0.75).toLocaleString()}</span>
          <span>{Math.round(maxValue * 0.5).toLocaleString()}</span>
          <span>{Math.round(maxValue * 0.25).toLocaleString()}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full relative">
          {/* Reference lines */}
          <div className="absolute inset-0">
            {/* Maximum line */}
            <div
              className="absolute w-full border-t-2 border-dashed border-blue-300 dark:border-blue-600"
              style={{ top: `${100 - (currentStock.maximum / maxValue) * 100}%` }}
            >
              <span className="absolute -top-4 left-2 text-xs text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-1">
                Max: {currentStock.maximum.toLocaleString()}
              </span>
            </div>

            {/* Reorder point line */}
            <div
              className="absolute w-full border-t-2 border-dashed border-yellow-400"
              style={{ top: `${100 - (currentStock.reorderPoint / maxValue) * 100}%` }}
            >
              <span className="absolute -top-4 right-2 text-xs text-yellow-600 dark:text-yellow-400 bg-white dark:bg-gray-800 px-1">
                Reorder: {currentStock.reorderPoint.toLocaleString()}
              </span>
            </div>

            {/* Minimum line */}
            <div
              className="absolute w-full border-t-2 border-dashed border-red-400"
              style={{ top: `${100 - (currentStock.minimum / maxValue) * 100}%` }}
            >
              <span className="absolute -top-4 left-2 text-xs text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-1">
                Min: {currentStock.minimum.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stock level line */}
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-600 dark:text-blue-400"
                points={mockData.map((point, index) => {
                  const x = (index / (mockData.length - 1)) * 100
                  const y = 100 - (point.current / maxValue) * 100
                  return `${x},${y}`
                }).join(' ')}
              />

              {/* Data points */}
              {mockData.map((point, index) => {
                const x = (index / (mockData.length - 1)) * 100
                const y = 100 - (point.current / maxValue) * 100
                const status = getStockStatus(point.current, point.reorderPoint, point.minimum)

                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="0.8"
                    className={`${
                      status.status === 'critical' ? 'fill-red-500' :
                      status.status === 'warning' ? 'fill-yellow-500' : 'fill-green-500'
                    }`}
                  />
                )
              })}
            </svg>
          </div>
        </div>

        {/* X-axis dates */}
        <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>{new Date(mockData[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
          <span>{new Date(mockData[Math.floor(mockData.length / 2)].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
          <span>{new Date(mockData[mockData.length - 1].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Healthy</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Reorder Needed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
          <span className="text-gray-600 dark:text-gray-400">Critical Low</span>
        </div>
      </div>

      {/* Stock Velocity */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Daily Usage Rate:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {Math.round((mockData[0].current - mockData[mockData.length - 2].current) / (mockData.length - 2))} units/day
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Days Until Reorder:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {Math.max(0, Math.round((currentStock.current - currentStock.reorderPoint) / 180))} days
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
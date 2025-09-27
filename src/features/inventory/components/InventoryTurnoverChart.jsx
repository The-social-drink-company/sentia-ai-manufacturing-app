import React from 'react'

export default function InventoryTurnoverChart({ data, period = 'current' }) {
  // Mock inventory turnover data if not provided
  const mockData = data || [
    { category: 'Raw Materials', current: 15.2, target: 18, trend: 1.2, value: 320000 },
    { category: 'Work in Progress', current: 24.8, target: 26, trend: -0.8, value: 180000 },
    { category: 'Finished Goods', current: 8.7, target: 12, trend: 0.5, value: 450000 },
    { category: 'Packaging', current: 20.1, target: 22, trend: 2.1, value: 95000 },
    { category: 'Components', current: 11.3, target: 15, trend: -1.5, value: 275000 }
  ]

  // Calculate overall metrics
  const totalValue = mockData.reduce((sum, item) => sum + item.value, 0)
  const weightedTurnover = mockData.reduce((sum, item) =>
    sum + (item.current * (item.value / totalValue)), 0
  )
  const weightedTarget = mockData.reduce((sum, item) =>
    sum + (item.target * (item.value / totalValue)), 0
  )

  const getTrendColor = (trend) => {
    return trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  const getTrendIcon = (trend) => {
    return trend >= 0 ? '↗' : '↘'
  }

  const getPerformanceColor = (current, target) => {
    const performance = (current / target) * 100
    if (performance >= 100) return 'bg-green-500'
    if (performance >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getPerformancePercentage = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Inventory Turnover Analysis
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {period === 'current' ? 'Annual Rate' : period.toUpperCase()}
        </div>
      </div>

      {/* Overall Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Turnover</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {weightedTurnover.toFixed(1)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Target</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {weightedTarget.toFixed(1)}x
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Performance</p>
            <p className={`text-2xl font-bold ${
              weightedTurnover >= weightedTarget ? 'text-green-600' : 'text-red-600'
            }`}>
              {((weightedTurnover / weightedTarget) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Turnover by Category
        </h4>

        {mockData.map((item, _index) => (
          <div key={item.category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.current}x / {item.target}x
                    </span>
                    <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}{Math.abs(item.trend).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex items-center">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getPerformanceColor(item.current, item.target)}`}
                        style={{ width: `${getPerformancePercentage(item.current, item.target)}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    ${(item.value / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights Section */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Key Insights</h4>

        <div className="space-y-2 text-sm">
          {mockData
            .sort((a, b) => (a.current / a.target) - (b.current / b.target))
            .slice(0, 2)
            .map((item) => (
              <div key={`insight-${item.category}`} className="flex items-start">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{item.category}</span> turnover is{' '}
                  {item.current < item.target ? 'below target' : 'above target'} by{' '}
                  {Math.abs(((item.current / item.target) - 1) * 100).toFixed(1)}%.
                  {item.current < item.target ? ' Consider reducing stock levels.' : ' Excellent performance.'}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Optimize Stock
        </button>
        <button className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          View Details
        </button>
      </div>
    </div>
  )
}
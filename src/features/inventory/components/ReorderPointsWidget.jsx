import React from 'react'
import { ExclamationTriangleIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/solid'

export default function ReorderPointsWidget({ data }) {
  // Mock reorder points data if not provided
  const mockData = data || {
    criticalItems: [
      { sku: 'SNTG-001', name: 'Sentia Ginger 001', currentStock: 245, reorderPoint: 500, leadTimeDays: 7, status: 'critical' },
      { sku: 'SNTB-002', name: 'Sentia Black 002', currentStock: 380, reorderPoint: 400, leadTimeDays: 5, status: 'warning' },
      { sku: 'SNTR-001', name: 'Sentia Red 001', currentStock: 150, reorderPoint: 300, leadTimeDays: 14, status: 'critical' }
    ],
    upcomingReorders: [
      { sku: 'SNTG-003', name: 'Sentia Ginger 003', currentStock: 520, reorderPoint: 500, daysUntilReorder: 3, status: 'warning' },
      { sku: 'SNTB-001', name: 'Sentia Black 001', currentStock: 640, reorderPoint: 600, daysUntilReorder: 7, status: 'watch' },
      { sku: 'SNTR-002', name: 'Sentia Red 002', currentStock: 850, reorderPoint: 750, daysUntilReorder: 12, status: 'watch' }
    ]
  }

  const getStatusColor = (_status) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'watch':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getStatusIcon = (_status) => {
    switch (status) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
      case 'warning':
        return <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      case 'watch':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const formatStockLevel = (current, reorder) => {
    const percentage = (current / reorder) * 100
    return {
      percentage: Math.min(percentage, 100),
      isLow: percentage < 100,
      isCritical: percentage < 50
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
        Reorder Points Alert
      </h3>

      {/* Critical Items Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          Items Needing Immediate Reorder ({mockData.criticalItems.length})
        </h4>

        <div className="space-y-3">
          {mockData.criticalItems.map((item) => {
            const stockLevel = formatStockLevel(item.currentStock, item.reorderPoint)

            return (
              <div
                key={item.sku}
                className={`p-3 rounded-lg border ${getStatusColor(item.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <div className="ml-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.sku}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Stock: {item.currentStock} / {item.reorderPoint}
                        </span>
                        <span className={`font-medium ${stockLevel.isCritical ? 'text-red-600' : 'text-yellow-600'}`}>
                          {stockLevel.percentage.toFixed(0)}%
                        </span>
                      </div>

                      <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            stockLevel.isCritical ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${stockLevel.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Lead Time</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.leadTimeDays} days
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Reorders Section */}
      <div>
        <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          Upcoming Reorders ({mockData.upcomingReorders.length})
        </h4>

        <div className="space-y-2">
          {mockData.upcomingReorders.map((item) => {
            const stockLevel = formatStockLevel(item.currentStock, item.reorderPoint)

            return (
              <div
                key={item.sku}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.sku}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {item.name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.daysUntilReorder} days
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          until reorder
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${stockLevel.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                        {item.currentStock}/{item.reorderPoint}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            Generate POs
          </button>
          <button className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Review All
          </button>
        </div>
      </div>
    </div>
  )
}
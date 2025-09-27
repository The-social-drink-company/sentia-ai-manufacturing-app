import React from 'react'
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'

export default function SlowMovingStock({ data }) {
  // Mock slow-moving stock data if not provided
  const mockData = data || [
    {
      sku: 'SNTG-005',
      name: 'Sentia Ginger Special Edition',
      quantity: 850,
      value: 12750,
      daysOnHand: 180,
      lastMovement: '2024-06-15',
      location: 'UK-London',
      category: 'Finished Goods',
      urgency: 'high'
    },
    {
      sku: 'SNTB-007',
      name: 'Sentia Black Premium',
      quantity: 420,
      value: 8400,
      daysOnHand: 156,
      lastMovement: '2024-07-02',
      location: 'EU-Amsterdam',
      category: 'Finished Goods',
      urgency: 'high'
    },
    {
      sku: 'PKG-001',
      name: 'Legacy Packaging Material',
      quantity: 2500,
      value: 3750,
      daysOnHand: 240,
      lastMovement: '2024-05-20',
      location: 'UK-Manchester',
      category: 'Packaging',
      urgency: 'critical'
    },
    {
      sku: 'COMP-012',
      name: 'Discontinued Component',
      quantity: 1200,
      value: 6000,
      daysOnHand: 195,
      lastMovement: '2024-06-08',
      location: 'US-NYC',
      category: 'Components',
      urgency: 'high'
    },
    {
      sku: 'SNTR-004',
      name: 'Sentia Red Limited',
      quantity: 320,
      value: 4800,
      daysOnHand: 134,
      lastMovement: '2024-07-18',
      location: 'US-LA',
      category: 'Finished Goods',
      urgency: 'medium'
    }
  ]

  // Calculate totals
  const totalValue = mockData.reduce((sum, item) => sum + item.value, 0)
  const totalQuantity = mockData.reduce((sum, item) => sum + item.quantity, 0)
  const avgDaysOnHand = mockData.reduce((sum, item) => sum + item.daysOnHand, 0) / mockData.length

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
    }
  }

  const getUrgencyIcon = (urgency) => {
    if (urgency === 'critical') {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
    }
    return <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
  }

  const formatCurrency = (_value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getDaysLabel = (days) => {
    if (days >= 365) return `${Math.round(days / 365)}y`
    if (days >= 30) return `${Math.round(days / 30)}mo`
    return `${days}d`
  }

  // Sort by urgency and days on hand
  const sortedData = [...mockData].sort(_(a, b) => {
    const urgencyOrder = { critical: 3, high: 2, medium: 1, low: 0 }
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
    }
    return b.daysOnHand - a.daysOnHand
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-2" />
          Slow-Moving Stock
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {mockData.length} items
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <p className="text-xs text-red-600 dark:text-red-400">Total Value</p>
          <p className="text-lg font-bold text-red-900 dark:text-red-100">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          <p className="text-xs text-orange-600 dark:text-orange-400">Total Units</p>
          <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
            {totalQuantity.toLocaleString()}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">Avg Days</p>
          <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
            {Math.round(avgDaysOnHand)}
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedData.map((item) => (
          <div
            key={item.sku}
            className={`p-3 rounded-lg border ${getUrgencyColor(item.urgency)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  {getUrgencyIcon(item.urgency)}
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.sku}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.name}
                    </p>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      {item.quantity.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Value:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      {item.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right ml-4">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {getDaysLabel(item.daysOnHand)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  on hand
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last: {new Date(item.lastMovement).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Progress bar showing how long it's been stagnant */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Stagnation Level</span>
                <span className={`font-medium ${
                  item.daysOnHand > 200 ? 'text-red-600' :
                  item.daysOnHand > 150 ? 'text-orange-600' : 'text-yellow-600'
                }`}>
                  {item.daysOnHand > 200 ? 'Critical' :
                   item.daysOnHand > 150 ? 'High' : 'Medium'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    item.daysOnHand > 200 ? 'bg-red-500' :
                    item.daysOnHand > 150 ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min((item.daysOnHand / 250) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
            Create Clearance Sale
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Transfer Stock
          </button>
        </div>
      </div>
    </div>
  )
}
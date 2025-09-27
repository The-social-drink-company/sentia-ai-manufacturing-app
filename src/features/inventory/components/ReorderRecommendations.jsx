import React, { useState } from 'react'
import {
  ExclamationTriangleIcon,
  ArrowDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid'

export default function ReorderRecommendations({ data, title, onReorderAction }) {
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [filter, setFilter] = useState('all') // all, critical, normal, surplus
  const [sortBy, setSortBy] = useState('urgency') // urgency, value, quantity

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No reorder recommendations at this time</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All inventory levels are optimal</p>
          </div>
        </div>
      </div>
    )
  }

  const getUrgencyLevel = (item) => {
    if (item.stockLevel <= 0) return 'critical'
    if (item.stockLevel <= item.reorderPoint * 0.5) return 'critical'
    if (item.stockLevel <= item.reorderPoint) return 'urgent'
    if (item.stockLevel >= item.maxLevel * 1.1) return 'surplus'
    return 'normal'
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          badge: 'bg-red-600'
        }
      case 'urgent':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          badge: 'bg-yellow-600'
        }
      case 'surplus':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-200',
          badge: 'bg-orange-600'
        }
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          badge: 'bg-blue-600'
        }
    }
  }

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      case 'urgent':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'surplus':
        return <ArrowDownIcon className="h-5 w-5 text-orange-600" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />
    }
  }

  const calculateEOQ = (annualDemand, orderCost, holdingCost) => {
    if (!annualDemand || !orderCost || !holdingCost) return null
    return Math.sqrt((2 * annualDemand * orderCost) / holdingCost)
  }

  const filteredData = data
    .filter(item => {
      const urgency = getUrgencyLevel(item)
      if (filter === 'all') return true
      if (filter === 'critical') return urgency === 'critical'
      if (filter === 'urgent') return urgency === 'urgent' || urgency === 'critical'
      if (filter === 'surplus') return urgency === 'surplus'
      return urgency === 'normal'
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          const urgencyOrder = { critical: 4, urgent: 3, normal: 2, surplus: 1 }
          return urgencyOrder[getUrgencyLevel(b)] - urgencyOrder[getUrgencyLevel(a)]
        case 'value':
          return (b.recommendedQuantity * b.unitCost) - (a.recommendedQuantity * a.unitCost)
        case 'quantity':
          return b.recommendedQuantity - a.recommendedQuantity
        default:
          return 0
      }
    })

  const handleItemSelection = (itemId) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
  }

  const handleBulkAction = (action) => {
    const selectedData = filteredData.filter(item => selectedItems.has(item.id))
    selectedData.forEach(item => onReorderAction?.(item, action))
    setSelectedItems(new Set())
  }

  const getTotalValue = () => {
    return filteredData
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + (item.recommendedQuantity * item.unitCost), 0)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>

        <div className="flex items-center space-x-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">All Items</option>
            <option value="critical">Critical Only</option>
            <option value="urgent">Urgent</option>
            <option value="surplus">Surplus</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="urgency">Sort by Urgency</option>
            <option value="value">Sort by Value</option>
            <option value="quantity">Sort by Quantity</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedItems.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <span className="text-blue-600 dark:text-blue-400 ml-2">
                (${getTotalValue().toLocaleString()} total value)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('create_po')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Create Purchase Orders
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations list */}
      <div className="space-y-4">
        {filteredData.map((item) => {
          const urgency = getUrgencyLevel(item)
          const colors = getUrgencyColor(urgency)
          const eoq = calculateEOQ(item.annualDemand, item.orderCost, item.holdingCost)

          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 transition-all ${colors.border} ${
                selectedItems.has(item.id) ? colors.bg : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Selection checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => handleItemSelection(item.id)}
                  className="mt-1 rounded"
                />

                {/* Urgency indicator */}
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${colors.badge} animate-pulse`}></div>
                </div>

                {/* Item details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {getUrgencyIcon(urgency)}
                        <span className={`text-sm font-medium px-2 py-1 rounded ${colors.badge} text-white`}>
                          {urgency.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {item.recommendedQuantity?.toLocaleString() || '—'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recommended Qty
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Current Stock</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.stockLevel?.toLocaleString() || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Reorder Point</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.reorderPoint?.toLocaleString() || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Unit Cost</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${item.unitCost?.toLocaleString() || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Lead Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.leadTime || '—'} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Value</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${((item.recommendedQuantity || 0) * (item.unitCost || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* EOQ and supplier info */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <TruckIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Supplier: {item.preferredSupplier || 'TBD'}
                          </span>
                        </div>
                        {eoq && (
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              EOQ: {Math.round(eoq).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onReorderAction?.(item, 'create_po')}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                        >
                          Create PO
                        </button>
                        <button
                          onClick={() => onReorderAction?.(item, 'adjust_levels')}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                          Adjust Levels
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  {item.reasoning && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Recommendation:</strong> {item.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No items match the selected filter criteria
          </p>
        </div>
      )}

      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredData.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Critical Items</p>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">
            {filteredData.filter(item => getUrgencyLevel(item) === 'critical').length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            ${filteredData.reduce((sum, item) => sum + (item.recommendedQuantity * item.unitCost), 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Lead Time</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {Math.round(filteredData.reduce((sum, item) => sum + (item.leadTime || 0), 0) / filteredData.length)} days
          </p>
        </div>
      </div>
    </div>
  )
}
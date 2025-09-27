import React from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

export default function InventoryCard({
  title,
  value,
  change,
  format = 'number',
  icon: Icon,
  color = 'blue',
  target,
  inverted = false // For metrics where lower is better (e.g., stockout risk)
}) {
  const formatValue = (val) => {
    if (val === null || val === undefined) return '--'

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val)

      case 'number':
        return val.toLocaleString()

      case 'decimal':
        return val.toFixed(1)

      case 'percentage':
        return `${val.toFixed(1)}%`

      default:
        return val.toString()
    }
  }

  // Determine if change is positive based on inverted logic
  const isPositiveChange = inverted
    ? (change && change < 0) // For inverted metrics, negative change is good
    : (change && change > 0)  // For normal metrics, positive change is good

  const changeColor = isPositiveChange
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'

  const changeIcon = isPositiveChange ? ArrowUpIcon : ArrowDownIcon

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
  }

  // Calculate target progress
  let targetProgress = null
  let targetStatus = 'normal'

  if (target && value !== null && value !== undefined) {
    if (inverted) {
      // For inverted metrics (like risk), lower is better
      targetProgress = Math.min((target / value) * 100, 100)
      targetStatus = value <= target ? 'good' : value <= target * 1.5 ? 'warning' : 'critical'
    } else {
      // For normal metrics, higher is better
      targetProgress = Math.min((value / target) * 100, 100)
      targetStatus = value >= target ? 'good' : value >= target * 0.75 ? 'warning' : 'critical'
    }
  }

  const getTargetColor = (status) => {
    switch (status) {
      case 'good':
        return 'bg-green-500 dark:bg-green-600'
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-600'
      case 'critical':
        return 'bg-red-500 dark:bg-red-600'
      default:
        return 'bg-gray-300 dark:bg-gray-600'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`rounded-lg p-3 ${colorClasses[color] || colorClasses.blue}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatValue(value)}
            </p>
          </div>
        </div>

        {change !== undefined && change !== null && (
          <div className={`flex items-center ${changeColor}`}>
            {React.createElement(changeIcon, { className: 'h-4 w-4 mr-1' })}
            <span className="text-sm font-medium">
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {target && targetProgress !== null && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>
              Target: {formatValue(target)} {inverted ? '(max)' : '(min)'}
            </span>
            <span className={`font-medium ${
              targetStatus === 'good' ? 'text-green-600' :
              targetStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {targetStatus.toUpperCase()}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getTargetColor(targetStatus)}`}
              style={{ width: `${Math.min(Math.max(targetProgress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
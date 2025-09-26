import React from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

export default function MetricCard({
  title,
  value,
  change,
  format = 'number',
  icon: Icon,
  color = 'blue',
  target,
  currency = 'USD'
}) {
  const formatValue = (val) => {
    if (val === null || val === undefined) return '--'

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val)

      case 'days':
        return `${Math.round(val)} days`

      case 'ratio':
        return val.toFixed(2)

      case 'percentage':
        return `${(val * 100).toFixed(1)}%`

      default:
        return val.toLocaleString()
    }
  }

  const isPositiveChange = change && change > 0
  const changeColor = isPositiveChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  const changeIcon = isPositiveChange ? ArrowUpIcon : ArrowDownIcon

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
  }

  const targetProgress = target ? (value / target) * 100 : null

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

        {change !== undefined && (
          <div className={`flex items-center ${changeColor}`}>
            {React.createElement(changeIcon, { className: 'h-4 w-4 mr-1' })}
            <span className="text-sm font-medium">
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {target && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Target: {formatValue(target)}</span>
            <span>{targetProgress?.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                targetProgress >= 100
                  ? 'bg-green-500 dark:bg-green-600'
                  : targetProgress >= 75
                  ? 'bg-yellow-500 dark:bg-yellow-600'
                  : 'bg-red-500 dark:bg-red-600'
              }`}
              style={{ width: `${Math.min(targetProgress || 0, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
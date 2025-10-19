import React from 'react'
import {
  LightBulbIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

const priorityColour = priority => {
  switch (priority) {
    case 'high':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    case 'low':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
  }
}

const statusIcon = status => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
    case 'in_progress':
      return <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
    case 'pending':
    default:
      return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
  }
}

const typeIcon = type => {
  switch (type) {
    case 'receivables':
      return <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    case 'payables':
      return <ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
    case 'inventory':
    case 'cash':
      return <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
    default:
      return <LightBulbIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
  }
}

export default function OptimizationRecommendations({ recommendations, onActionClick }) {
  const items = Array.isArray(recommendations) ? recommendations : []

  const pendingCount = items.filter(item => item.status === 'pending').length

  if (!items.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <LightBulbIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Optimisation Recommendations
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No automation-driven suggestions are available yet. Once sufficient real data is ingested
          we will surface targeted working-capital actions here.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <LightBulbIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Optimisation Recommendations
          </h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {pendingCount} pending action{pendingCount === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map(item => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 transition hover:shadow-md ${priorityColour(item.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {typeIcon(item.type)}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              </div>
              <div>{statusIcon(item.status)}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700 dark:text-gray-300 mt-4">
              <div>
                <span className="font-medium">Impact:</span> {item.impact || '--'}
              </div>
              <div>
                <span className="font-medium">Effort:</span> {item.effort || '--'}
              </div>
              <div>
                <span className="font-medium">Timeframe:</span> {item.timeframe || '--'}
              </div>
            </div>

            {item.actions?.length > 0 && (
              <ul className="mt-4 list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {item.actions.map(action => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            )}

            {onActionClick && (
              <button
                type="button"
                onClick={() => onActionClick(item)}
                className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark as actioned
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

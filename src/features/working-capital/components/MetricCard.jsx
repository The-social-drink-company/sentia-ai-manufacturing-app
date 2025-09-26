import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

export default function MetricCard({ title, value, change, format = 'number', icon: Icon, color = 'blue', target }) {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return `$${(value || 0).toLocaleString()}`
      case 'days':
        return `${value || 0} days`
      case 'ratio':
        return (value || 0).toFixed(2)
      case 'percentage':
        return `${(value || 0).toFixed(1)}%`
      default:
        return (value || 0).toLocaleString()
    }
  }

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  }

  const isPositive = change && change > 0
  const performanceVsTarget = target ? ((value / target) * 100).toFixed(0) : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {formatValue()}
          </p>

          {change !== undefined && (
            <div className="flex items-center mt-3">
              {isPositive ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
            </div>
          )}

          {target && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Target: {target}</span>
                <span className={`font-medium ${performanceVsTarget >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {performanceVsTarget}%
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${performanceVsTarget >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(performanceVsTarget, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

const formatValue = (value, format) => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`
    case 'ratio':
      return value.toFixed(2)
    case 'days':
      return `${Math.round(value)} days`
    case 'number':
      return new Intl.NumberFormat('en-US').format(value)
    default:
      return value
  }
}

export default function KPICard({
  title,
  value,
  format = 'number',
  target,
  trend,
  description
}) {
  const isPositive = trend === 'up'
  const formattedValue = formatValue(value, format)

  // Determine if we're meeting the target
  const meetsTarget = target ? (
    format === 'days' || title.includes('DPO') ? value <= target : value >= target
  ) : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formattedValue}
            </p>
            {target && (
              <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                / {formatValue(target, format)}
              </p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <ArrowUpIcon className="h-5 w-5" />
            ) : (
              <ArrowDownIcon className="h-5 w-5" />
            )}
          </div>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {meetsTarget !== null && (
        <div className="mt-3">
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  meetsTarget ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{
                  width: `${Math.min(100, (value / target) * 100)}%`
                }}
              />
            </div>
            <span className={`ml-2 text-xs font-medium ${
              meetsTarget ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {meetsTarget ? 'On Track' : 'Needs Attention'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
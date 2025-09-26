import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/20/solid'
import { cn } from '../../utils/cn'

const KPIWidget = ({
  title,
  value,
  prefix = '',
  suffix = '',
  change = null,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  trend = null, // Array of values for sparkline
  loading = false,
  icon: Icon = null,
  color = 'blue' // 'blue', 'green', 'red', 'yellow', 'purple'
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600'
  }

  const changeIcon = {
    positive: ArrowUpIcon,
    negative: ArrowDownIcon,
    neutral: MinusIcon
  }

  const ChangeIcon = changeIcon[changeType] || MinusIcon

  const changeColorClasses = {
    positive: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    negative: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
    neutral: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </h3>
          {Icon && (
            <div className={cn(
              'p-2 rounded-lg bg-gradient-to-r',
              colorClasses[color]
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {prefix}{value}{suffix}
            </span>
            {change !== null && (
              <div className={cn(
                'inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium',
                changeColorClasses[changeType]
              )}>
                <ChangeIcon className="h-3 w-3 mr-1" />
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>

          {trend && trend.length > 0 && (
            <div className="ml-4">
              <Sparkline data={trend} color={color} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Mini sparkline component
const Sparkline = ({ data, color = 'blue', width = 60, height = 30 }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const gradientColors = {
    blue: ['#3B82F6', '#2563EB'],
    green: ['#10B981', '#059669'],
    red: ['#EF4444', '#DC2626'],
    yellow: ['#F59E0B', '#D97706'],
    purple: ['#8B5CF6', '#7C3AED']
  }

  const [startColor, endColor] = gradientColors[color] || gradientColors.blue

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={startColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={endColor} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={`url(#gradient-${color})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export default KPIWidget
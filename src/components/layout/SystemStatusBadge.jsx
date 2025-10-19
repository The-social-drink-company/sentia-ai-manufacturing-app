import { cn } from '@/lib/utils'

/**
 * System Status Configuration
 * Defines visual styles for different system states
 */
const statusConfig = {
  operational: {
    label: 'All Systems Operational',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
  },
  degraded: {
    label: 'Degraded Performance',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    dotColor: 'bg-yellow-500',
  },
  issues: {
    label: 'System Issues',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
  },
}

/**
 * SystemStatusBadge Component
 * Displays current system health status with color-coded indicator
 *
 * Features:
 * - Three states: operational (green), degraded (yellow), issues (red)
 * - Visual dot indicator with matching text
 * - Rounded pill design
 * - Accessible with semantic colors
 *
 * @param {string} status - System status: 'operational' | 'degraded' | 'issues'
 */
const SystemStatusBadge = ({ status = 'operational' }) => {
  const config = statusConfig[status] || statusConfig.operational

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
        config.bgColor,
        config.textColor
      )}
      role="status"
      aria-label={`System status: ${config.label}`}
    >
      {/* Status Dot Indicator */}
      <span
        className={cn('h-2 w-2 rounded-full', config.dotColor)}
        aria-hidden="true"
      />

      {/* Status Label */}
      <span>{config.label}</span>
    </div>
  )
}

export default SystemStatusBadge

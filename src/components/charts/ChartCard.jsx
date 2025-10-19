import { cn } from '@/lib/utils'

/**
 * ChartCard - Consistent wrapper for all chart components
 * Provides unified styling, headers, and layout for Recharts visualizations
 *
 * @param {string} title - Chart title
 * @param {string} subtitle - Optional subtitle/description
 * @param {ReactNode} children - Chart component (ResponsiveContainer with Recharts)
 * @param {string} className - Additional CSS classes
 * @param {ReactNode} actions - Optional action buttons (export, filter, etc.)
 * @param {string} icon - Optional emoji icon for the header
 */
const ChartCard = ({
  title,
  subtitle,
  children,
  className,
  actions,
  icon = '📊',
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="Chart icon">
              {icon}
            </span>
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 ml-4">
            {actions}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}

export default ChartCard

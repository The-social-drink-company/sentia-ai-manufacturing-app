import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercentage, formatTrend } from '@/utils/formatters'

/**
 * KPICard Component
 * Gradient card displaying key performance indicator with trend
 *
 * Features:
 * - Gradient background (customizable)
 * - Large emoji or icon
 * - Prominent value display
 * - Metric label
 * - Trend indicator with arrow and percentage
 * - Hover animation
 * - Responsive typography
 *
 * @param {string|React.Component} icon - Emoji string or React component
 * @param {number} value - Numeric value to display
 * @param {string} label - Metric name/description
 * @param {object} trend - Trend data: { value: number, direction: 'up'|'down'|'neutral' }
 * @param {string} gradient - Tailwind gradient class
 * @param {string} valuePrefix - Optional prefix (£, $, etc.)
 * @param {string} valueSuffix - Optional suffix (%, K, M, etc.)
 * @param {string} valueFormat - Format type: 'currency'|'number'|'percentage'|'raw'
 * @param {string} customFooter - Custom footer text (overrides trend)
 * @param {string} className - Additional CSS classes
 */
const KPICard = ({
  icon,
  value,
  label,
  trend = null,
  gradient = 'bg-gradient-to-br from-blue-600 to-purple-600',
  valuePrefix = '',
  valueSuffix = '',
  valueFormat = 'raw',
  customFooter = null,
  className = '',
}) => {
  /**
   * Format value based on specified format type
   */
  const getFormattedValue = () => {
    if (valueFormat === 'currency') {
      return formatCurrency(value, valuePrefix || '£')
    }
    if (valueFormat === 'number') {
      return formatNumber(value)
    }
    if (valueFormat === 'percentage') {
      return formatPercentage(value)
    }

    // Raw format - just add prefix/suffix
    let formatted = value.toString()

    // Handle M/K suffix for raw format
    if (valueSuffix === 'M' && value >= 1000000) {
      formatted = (value / 1000000).toFixed(2)
    } else if (valueSuffix === 'K' && value >= 1000) {
      formatted = (value / 1000).toFixed(0)
    }

    return `${valuePrefix}${formatted}${valueSuffix}`
  }

  /**
   * Get trend icon based on direction
   */
  const getTrendIcon = () => {
    if (!trend) return null

    if (trend.direction === 'up') {
      return <TrendingUp className="h-4 w-4" aria-hidden="true" />
    }
    if (trend.direction === 'down') {
      return <TrendingDown className="h-4 w-4" aria-hidden="true" />
    }
    return <Minus className="h-4 w-4" aria-hidden="true" />
  }

  /**
   * Get trend color based on direction
   */
  const getTrendColor = () => {
    if (!trend) return ''

    if (trend.direction === 'up') {
      return 'text-green-200'
    }
    if (trend.direction === 'down') {
      return 'text-red-200'
    }
    return 'text-white/60'
  }

  /**
   * Get ARIA label for trend
   */
  const getTrendAriaLabel = () => {
    if (!trend) return ''

    const direction =
      trend.direction === 'up'
        ? 'increased'
        : trend.direction === 'down'
          ? 'decreased'
          : 'unchanged'
    return `Trend: ${direction} by ${Math.abs(trend.value)}%`
  }

  return (
    <div
      className={cn(
        // Base styles
        'rounded-xl p-6 text-white shadow-lg',
        // Gradient background
        gradient,
        // Hover animation
        'transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-2xl',
        // Custom classes
        className
      )}
      role="article"
      aria-label={`${label}: ${getFormattedValue()}`}
    >
      {/* Icon */}
      <div className="mb-4 text-4xl" aria-hidden="true">
        {typeof icon === 'string' ? icon : icon}
      </div>

      {/* Value */}
      <div className="mb-2 text-3xl font-bold sm:text-4xl">{getFormattedValue()}</div>

      {/* Label */}
      <div className="mb-3 text-sm text-white/80">{label}</div>

      {/* Trend or Custom Footer */}
      {customFooter ? (
        <div className="text-sm font-medium text-white/90">{customFooter}</div>
      ) : trend ? (
        <div
          className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}
          aria-label={getTrendAriaLabel()}
        >
          <span>{formatTrend(trend.value)}</span>
          {getTrendIcon()}
        </div>
      ) : null}
    </div>
  )
}

export default KPICard

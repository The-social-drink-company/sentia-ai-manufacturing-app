import { cn } from '@/lib/utils'

/**
 * Working Capital Card Component
 *
 * Displays working capital metrics in a gradient card with 4-metric grid.
 * Responsive design: 2x2 on mobile, 4x1 on tablet/desktop.
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Working capital data
 * @param {number} props.data.currentWC - Current working capital (e.g., 869000)
 * @param {number} props.data.daysCCC - Days cash conversion cycle (e.g., 43.6)
 * @param {number} props.data.optimizationPotential - Potential savings (e.g., 150000)
 * @param {number} props.data.percentOfRevenue - Percentage of revenue (e.g., 8.1)
 *
 * @example
 * <WorkingCapitalCard data={{
 *   currentWC: 869000,
 *   daysCCC: 43.6,
 *   optimizationPotential: 150000,
 *   percentOfRevenue: 8.1
 * }} />
 */
const WorkingCapitalCard = ({ data }) => {
  const metrics = [
    {
      value: data.currentWC,
      label: 'Current WC',
      format: 'currency',
    },
    {
      value: data.daysCCC,
      label: 'Days CCC',
      format: 'number',
    },
    {
      value: data.optimizationPotential,
      label: 'Optimization Potential',
      format: 'currency',
    },
    {
      value: data.percentOfRevenue,
      label: '% of Revenue',
      format: 'percentage',
    },
  ]

  /**
   * Format value based on type
   * @param {number} value - Value to format
   * @param {string} format - Format type (currency/percentage/number)
   * @returns {string} Formatted value
   */
  const formatValue = (value, format) => {
    switch (format) {
      case 'currency':
        return `£${(value / 1000).toFixed(0)}K`
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toFixed(1)
    }
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-purple-600 to-violet-700',
        'rounded-xl p-8 text-white shadow-xl',
        'transition-all duration-200'
      )}
      role="region"
      aria-label="Working Capital Analysis"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label="Money bag">
            💰
          </span>
          Working Capital Analysis
        </h2>
        <p className="text-purple-100 mt-2">
          Cash flow optimization and working capital management insights
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="text-center"
            role="group"
            aria-label={`${metric.label}: ${formatValue(metric.value, metric.format)}`}
          >
            <div className="text-4xl font-bold mb-2">
              {formatValue(metric.value, metric.format)}
            </div>
            <div className="text-sm text-purple-100">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WorkingCapitalCard

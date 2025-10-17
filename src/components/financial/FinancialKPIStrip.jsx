import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

const formatCurrency = value => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercentage = value => {
  if (typeof value !== 'number') return '—'
  return `${value.toFixed(1)}%`
}

const getTrendIcon = trend => {
  if (!trend || trend === 0) return MinusIcon
  return trend > 0 ? ArrowUpIcon : ArrowDownIcon
}

const getTrendColor = trend => {
  if (!trend || trend === 0) return 'text-gray-500'
  return trend > 0 ? 'text-green-600' : 'text-red-600'
}

const KPIMetric = ({ label, value, change, helper, isPercentage = false, size = 'default' }) => {
  const TrendIcon = getTrendIcon(change)
  const trendColor = getTrendColor(change)

  const formattedValue = isPercentage ? formatPercentage(value) : formatCurrency(value)
  const formattedChange = change ? Math.abs(change).toFixed(1) : null

  return (
    <Card>
      <CardContent className={cn('space-y-1', size === 'compact' ? 'p-3' : 'p-4')}>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline space-x-2">
          <p
            className={cn(
              'font-semibold text-foreground',
              size === 'compact' ? 'text-xl' : 'text-2xl'
            )}
          >
            {formattedValue}
          </p>
          {formattedChange && (
            <div className={cn('flex items-center space-x-1', trendColor)}>
              <TrendIcon className="w-3 h-3" />
              <span className="text-xs font-medium">{formattedChange}%</span>
            </div>
          )}
        </div>
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </CardContent>
    </Card>
  )
}

const FinancialKPIStrip = ({ data, loading = false, error = null, className }) => {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4 space-y-1">
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-red-600">Error loading financial metrics: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const kpiMetrics = [
    {
      label: 'Annual Revenue',
      value: data?.annualRevenue?.current || 0,
      change: data?.annualRevenue?.growth || 0,
      helper: `vs last year: ${formatPercentage(data?.annualRevenue?.growth || 0)}`,
    },
    {
      label: 'Gross Profit',
      value: data?.grossProfit?.current || 0,
      change: data?.grossProfit?.growth || 0,
      helper: `Margin: ${formatPercentage(data?.grossProfit?.margin || 0)}`,
    },
    {
      label: 'EBITDA',
      value: data?.ebitda?.current || 0,
      change: data?.ebitda?.growth || 0,
      helper: `Margin: ${formatPercentage(data?.ebitda?.margin || 0)}`,
    },
    {
      label: 'Profit Margin',
      value: data?.profitMargin?.current || 0,
      change: data?.profitMargin?.change || 0,
      helper: `Industry avg: ${formatPercentage(data?.profitMargin?.industryAverage || 0)}`,
      isPercentage: true,
    },
  ]

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {kpiMetrics.map((metric, index) => (
        <KPIMetric
          key={index}
          label={metric.label}
          value={metric.value}
          change={metric.change}
          helper={metric.helper}
          isPercentage={metric.isPercentage}
        />
      ))}
    </div>
  )
}

export default FinancialKPIStrip

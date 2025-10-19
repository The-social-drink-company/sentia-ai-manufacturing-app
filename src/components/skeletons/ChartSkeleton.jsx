import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Chart Loading Skeleton
 *
 * Displays a loading skeleton matching the structure of chart components
 * Used for all chart visualizations (line, bar, pie, area)
 *
 * Features:
 * - Matches chart card dimensions and layout
 * - Includes header and chart area skeletons
 * - Responsive height based on variant
 *
 * Usage:
 * ```jsx
 * const { data, isLoading } = useQuery({ ... })
 * if (isLoading) return <ChartSkeleton variant="line" />
 * return <LineChart data={data} />
 * ```
 *
 * @component
 * @param {Object} props
 * @param {('line'|'bar'|'pie'|'area')} [props.variant='line'] - Chart type for height adjustment
 * @param {boolean} [props.showLegend=true] - Whether to show legend skeleton
 *
 * @example
 * <ChartSkeleton variant="bar" showLegend={true} />
 */
export function ChartSkeleton({ variant = 'line', showLegend = true }) {
  // Height based on chart type
  const heights = {
    line: 'h-64',
    bar: 'h-72',
    pie: 'h-80',
    area: 'h-64',
  }

  const chartHeight = heights[variant] || heights.line

  return (
    <Card>
      <CardHeader className="space-y-2">
        {/* Chart title skeleton */}
        <Skeleton className="h-6 w-48" />

        {/* Chart description skeleton */}
        <Skeleton className="h-4 w-64" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Legend skeleton (if enabled) */}
        {showLegend && (
          <div className="flex gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        )}

        {/* Chart area skeleton */}
        <Skeleton className={`w-full ${chartHeight}`} />
      </CardContent>
    </Card>
  )
}

/**
 * Compact Chart Skeleton (for smaller widgets)
 *
 * @component
 * @example
 * <CompactChartSkeleton />
 */
export function CompactChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-4 w-32" />

        {/* Compact chart area */}
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  )
}

export default ChartSkeleton

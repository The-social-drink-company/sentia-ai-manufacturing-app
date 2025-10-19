import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * KPI Card Loading Skeleton
 *
 * Displays a loading skeleton matching the structure of KPI cards
 * Used throughout the dashboard for key performance indicators
 *
 * Features:
 * - Matches KPI card dimensions and layout
 * - Shimmer animation for visual feedback
 * - Accessibility attributes for screen readers
 *
 * Usage:
 * ```jsx
 * const { data, isLoading } = useQuery({ ... })
 * if (isLoading) return <KPICardSkeleton />
 * return <KPICard data={data} />
 * ```
 *
 * @component
 * @example
 * <KPICardSkeleton />
 */
export function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-4 w-32" />

        {/* Value skeleton */}
        <Skeleton className="h-8 w-24" />

        {/* Helper text skeleton */}
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  )
}

/**
 * KPI Strip Loading Skeleton
 *
 * Displays a grid of multiple KPI card skeletons
 * Used for dashboard KPI strips with 4+ metrics
 *
 * @param {Object} props
 * @param {number} [props.count=4] - Number of skeleton cards to display
 *
 * @component
 * @example
 * <KPIStripSkeleton count={4} />
 */
export function KPIStripSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  )
}

export default KPICardSkeleton

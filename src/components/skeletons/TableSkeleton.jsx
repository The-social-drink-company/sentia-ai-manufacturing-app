import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Table Loading Skeleton
 *
 * Displays a loading skeleton matching the structure of data tables
 * Used for inventory tables, financial reports, order lists, etc.
 *
 * Features:
 * - Matches table card dimensions and layout
 * - Configurable number of rows and columns
 * - Includes header row skeleton
 *
 * Usage:
 * ```jsx
 * const { data, isLoading } = useQuery({ ... })
 * if (isLoading) return <TableSkeleton rows={5} columns={4} />
 * return <DataTable data={data} />
 * ```
 *
 * @component
 * @param {Object} props
 * @param {number} [props.rows=5] - Number of table rows to display
 * @param {number} [props.columns=4] - Number of table columns to display
 * @param {boolean} [props.showHeader=true] - Whether to show table header skeleton
 *
 * @example
 * <TableSkeleton rows={10} columns={5} />
 */
export function TableSkeleton({ rows = 5, columns = 4, showHeader = true }) {
  return (
    <Card>
      {showHeader && (
        <CardHeader className="space-y-2">
          {/* Table title skeleton */}
          <Skeleton className="h-6 w-48" />

          {/* Table description skeleton */}
          <Skeleton className="h-4 w-64" />
        </CardHeader>
      )}

      <CardContent>
        <div className="space-y-3">
          {/* Table header row skeleton */}
          <div className="flex gap-4 pb-2 border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-4 flex-1" />
            ))}
          </div>

          {/* Table body rows skeleton */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="h-5 flex-1"
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact Table Skeleton (for smaller widgets)
 *
 * @component
 * @param {Object} props
 * @param {number} [props.rows=3] - Number of rows to display
 *
 * @example
 * <CompactTableSkeleton rows={3} />
 */
export function CompactTableSkeleton({ rows = 3 }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* Icon/Image skeleton */}
              <Skeleton className="h-10 w-10 rounded-full" />

              {/* Content skeleton */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>

              {/* Action skeleton */}
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default TableSkeleton

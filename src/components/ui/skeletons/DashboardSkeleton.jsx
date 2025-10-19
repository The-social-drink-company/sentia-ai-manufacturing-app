import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Base loading skeleton that applies standard styling.
 */
export const LoadingSkeleton = ({ className, ...props }) => (
  <Skeleton className={cn('animate-pulse bg-muted/60 dark:bg-muted/40', className)} {...props} />
)

/**
 * KPI skeleton row for top-level metrics.
 */
export const KpiSkeleton = ({ count = 4, className }) => (
  <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={`kpi-${index}`}>
        <CardContent className="space-y-2 p-5">
          <LoadingSkeleton className="h-4 w-1/2" />
          <LoadingSkeleton className="h-8 w-3/4" />
          <LoadingSkeleton className="h-3 w-1/3" />
        </CardContent>
      </Card>
    ))}
  </div>
)

/**
 * Chart skeleton used for line/bar/area chart cards.
 */
export const ChartSkeleton = ({ height = 260, withHeader = true, title, subtitle, className }) => (
  <Card className={className}>
    {withHeader && (
      <CardHeader>
        {title ? <CardTitle>{title}</CardTitle> : <LoadingSkeleton className="h-6 w-48" />}
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : (
          <LoadingSkeleton className="mt-2 h-4 w-64" />
        )}
      </CardHeader>
    )}
    <CardContent>
      <LoadingSkeleton className="w-full" style={{ height }} />
    </CardContent>
  </Card>
)

/**
 * Data table skeleton.
 */
export const TableSkeleton = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('space-y-3', className)}>
    <div className="flex gap-4">
      {Array.from({ length: columns }).map((_, column) => (
        <LoadingSkeleton key={`header-${column}`} className="h-4 w-full" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, row) => (
      <div key={`row-${row}`} className="flex gap-4">
        {Array.from({ length: columns }).map((_, column) => (
          <LoadingSkeleton key={`cell-${row}-${column}`} className="h-8 w-full" />
        ))}
      </div>
    ))}
  </div>
)

/**
 * Form skeleton with label and input placeholders.
 */
export const FormSkeleton = ({ fields = 4, className }) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={`field-${index}`} className="space-y-2">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <LoadingSkeleton className="h-10 w-24" />
      <LoadingSkeleton className="h-10 w-24" />
    </div>
  </div>
)

/**
 * Compact widget skeleton for small cards.
 */
export const WidgetSkeleton = ({ title, subtitle, className }) => (
  <Card className={className}>
    <CardHeader>
      {title ? (
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      ) : (
        <LoadingSkeleton className="h-5 w-32" />
      )}
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardHeader>
    <CardContent className="space-y-3">
      <LoadingSkeleton className="h-24 w-full" />
      <div className="flex justify-between">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
)

/**
 * Dashboard-level skeleton combining KPI, chart, and table placeholders.
 */
export const DashboardSkeleton = ({ title = 'Dashboard', subtitle = 'Loading data...' }) => (
  <section className="space-y-6">
    <header>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </header>

    <KpiSkeleton />

    <div className="grid gap-6 lg:grid-cols-2">
      <ChartSkeleton height={260} />
      <ChartSkeleton height={260} />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>
          <LoadingSkeleton className="h-6 w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableSkeleton rows={5} columns={4} />
      </CardContent>
    </Card>
  </section>
)

export default DashboardSkeleton

/**
 * Loading Skeleton Components (BMAD-UI-002)
 *
 * Centralized exports for all loading skeleton components
 * Used throughout the application for consistent loading states
 *
 * Framework: BMAD-METHOD v6a Phase 4
 * Story: BMAD-UI-002 (Add Loading Skeletons to All Widgets)
 * Epic: EPIC-003 (UI/UX Polish & Frontend Integration)
 *
 * Usage:
 * ```jsx
 * import { KPICardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/skeletons'
 *
 * function MyComponent() {
 *   const { data, isLoading } = useQuery({ ... })
 *
 *   if (isLoading) return <KPICardSkeleton />
 *   return <KPICard data={data} />
 * }
 * ```
 */

// Base skeleton component (from shadcn/ui)
export { Skeleton } from '@/components/ui/skeleton'

// KPI Card skeletons
export { KPICardSkeleton, KPIStripSkeleton } from './KPICardSkeleton'

// Chart skeletons
export { ChartSkeleton, CompactChartSkeleton } from './ChartSkeleton'

// Table skeletons
export { TableSkeleton, CompactTableSkeleton } from './TableSkeleton'

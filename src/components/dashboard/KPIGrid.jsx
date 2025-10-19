import KPICard from './KPICard'

/**
 * KPIGrid Component
 * Responsive grid wrapper for KPI cards
 *
 * Features:
 * - Responsive grid layout (1/2/4 columns based on screen size)
 * - Consistent spacing between cards
 * - Automatic card rendering from data array
 *
 * Grid Breakpoints:
 * - Mobile (default): 1 column
 * - Tablet (md: 768px): 2 columns
 * - Desktop (lg: 1024px): 4 columns
 *
 * @param {Array} kpis - Array of KPI data objects
 * @param {string} className - Additional CSS classes
 */
const KPIGrid = ({ kpis = [], className = '' }) => {
  if (!kpis || kpis.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">No KPI data available</p>
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}
      role="list"
      aria-label="Key Performance Indicators"
    >
      {kpis.map((kpi, index) => (
        <div key={index} role="listitem">
          <KPICard {...kpi} />
        </div>
      ))}
    </div>
  )
}

export default KPIGrid

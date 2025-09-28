const summary = [
  { label: 'On-time orders', value: '97%' },
  { label: 'Capacity utilization', value: '82%' },
  { label: 'Inventory health', value: 'Balanced' }
]

const AdvancedAnalyticsDashboard = () => (
  <section className="space-y-6">
    <header>
      <h1 className="text-2xl font-semibold tracking-tight">Analytics Overview</h1>
      <p className="text-sm text-muted-foreground">High-level metrics across manufacturing, finance, and quality.</p>
    </header>

    <div className="grid gap-4 sm:grid-cols-3">
      {summary.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-xl font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  </section>
)

export default AdvancedAnalyticsDashboard

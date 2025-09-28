import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const programs = [
  { name: 'Liquidity optimisation', status: 'Active', owner: 'Finance', impact: '$1.2M unlocked' },
  { name: 'Inventory harmonisation', status: 'In flight', owner: 'Operations', impact: '$690K working capital' },
  { name: 'Supplier resilience', status: 'Upcoming', owner: 'Procurement', impact: '12% lead-time reduction' }
]

const EnhancedDashboard = () => (
  <section className="space-y-6">
    <header>
      <h1 className="text-3xl font-semibold tracking-tight">Enhanced dashboard</h1>
      <p className="text-sm text-muted-foreground">Programme-level view of strategic initiatives.</p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>Strategic programmes</CardTitle>
        <CardDescription>Quick snapshot of cross-functional initiatives and expected impact.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {programs.map((item) => (
          <div key={item.name} className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">Lead: {item.owner}</p>
            <p className="text-xs text-muted-foreground">Status: {item.status}</p>
            <p className="text-xs text-primary mt-2">Projected impact: {item.impact}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  </section>
)

export default EnhancedDashboard

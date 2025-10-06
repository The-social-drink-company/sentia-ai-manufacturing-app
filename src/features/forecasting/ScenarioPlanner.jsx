import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const SCENARIOS = [
  { name: 'Base case', demand: '+6%', cashImpact: '$0', notes: 'Aligned with MCP forecast' },
  { name: 'Upside', demand: '+12%', cashImpact: '$+1.4M', notes: 'Requires line B overtime' },
  { name: 'Downside', demand: '-5%', cashImpact: '$-780K', notes: 'Trigger cost containment' }
]

const ScenarioPlanner = () => (
  <Card>
    <CardHeader>
      <CardTitle>Scenario planner</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      {SCENARIOS.map((scenario) => (
        <div key={scenario.name} className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{scenario.name}</p>
            <Badge variant="outline">Demand {scenario.demand}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Cash impact: {scenario.cashImpact}</p>
          <p className="text-xs text-muted-foreground">Notes: {scenario.notes}</p>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default ScenarioPlanner

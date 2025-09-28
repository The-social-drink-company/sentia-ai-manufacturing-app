import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const SAMPLE_ALERTS = [
  { id: 'AL-1032', severity: 'High', summary: 'Working capital below target in APAC', owner: 'Finance', status: 'Investigating' },
  { id: 'AL-1027', severity: 'Medium', summary: 'Inventory variance 4% above plan', owner: 'Operations', status: 'In progress' },
  { id: 'AL-1018', severity: 'Low', summary: 'Demand forecast confidence dip', owner: 'Planning', status: 'Monitoring' }
]

const AlertWidget = () => (
  <Card>
    <CardHeader>
      <CardTitle>Alerts</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      {SAMPLE_ALERTS.map((alert) => (
        <div key={alert.id} className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{alert.summary}</p>
            <Badge variant={alert.severity === 'High' ? 'destructive' : alert.severity === 'Medium' ? 'secondary' : 'outline'}>
              {alert.severity}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">ID: {alert.id} • Owner: {alert.owner}</p>
          <p className="text-xs text-muted-foreground">Status: {alert.status}</p>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default AlertWidget

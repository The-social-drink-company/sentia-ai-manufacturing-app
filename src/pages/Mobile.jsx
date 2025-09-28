import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const MOBILE_METRICS = [
  { label: 'Orders processed', value: '218', helper: 'Since start of shift' },
  { label: 'Downtime', value: '12 min', helper: 'Across all lines' },
  { label: 'Alerts', value: '3', helper: 'Awaiting acknowledgement' }
]

const RECENT_ALERTS = [
  { time: '12:24', message: 'Line 2 speed drop', status: 'Investigating' },
  { time: '11:52', message: 'Quality sample pending', status: 'Due in 4 min' },
  { time: '11:15', message: 'Forklift request', status: 'Completed' }
]

const Mobile = () => (
  <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
    <header className="space-y-1 text-left">
      <Badge variant="secondary">Shop floor</Badge>
      <h1 className="text-2xl font-semibold tracking-tight">Mobile control panel</h1>
      <p className="text-sm text-muted-foreground">Quick metrics for shift leads and operators.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      {MOBILE_METRICS.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{metric.label}</p>
            <p className="text-lg font-semibold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.helper}</p>
          </CardContent>
        </Card>
      ))}
    </section>

    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-semibold text-foreground">Recent alerts</p>
        {RECENT_ALERTS.map((alert) => (
          <div key={alert.time} className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-left">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{alert.time}</span>
              <span>{alert.status}</span>
            </div>
            <p className="text-foreground">{alert.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  </main>
)

export default Mobile

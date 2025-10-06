import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SAMPLE_EVENTS = [
  { time: '11:58', message: 'Production line B resumed after changeover' },
  { time: '11:32', message: 'APAC receivables sync completed successfully' },
  { time: '10:47', message: 'Quality variance alert acknowledged by shift lead' }
]

const ActivityWidget = () => (
  <Card>
    <CardHeader>
      <CardTitle>Recent activity</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      {SAMPLE_EVENTS.map((event) => (
        <div key={event.time} className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{event.time}</p>
          <p className="text-foreground">{event.message}</p>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default ActivityWidget

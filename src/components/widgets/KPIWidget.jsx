import { Card, CardContent } from '@/components/ui/card'

const KPIWidget = ({ label = 'Metric', value = '—', helper = 'Awaiting data' }) => (
  <Card className="border border-border bg-muted/30">
    <CardContent className="space-y-2 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </CardContent>
  </Card>
)

export default KPIWidget

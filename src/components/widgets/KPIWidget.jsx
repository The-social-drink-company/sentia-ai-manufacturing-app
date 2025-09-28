import { Card, CardContent } from '@/components/ui/card'

const KPIWidget = ({ label = 'Metric', value = '—', helper = 'Awaiting data' }) => (
  <Card>
    <CardContent className="space-y-1 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </CardContent>
  </Card>
)

export default KPIWidget

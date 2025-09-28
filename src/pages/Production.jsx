import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'

const THROUGHPUT_SERIES = {
  '24h': [
    { label: '00:00', units: 320 },
    { label: '04:00', units: 410 },
    { label: '08:00', units: 530 },
    { label: '12:00', units: 560 },
    { label: '16:00', units: 505 },
    { label: '20:00', units: 480 }
  ],
  '7d': [
    { label: 'Mon', units: 7420 },
    { label: 'Tue', units: 7680 },
    { label: 'Wed', units: 7510 },
    { label: 'Thu', units: 7895 },
    { label: 'Fri', units: 8210 },
    { label: 'Sat', units: 7055 },
    { label: 'Sun', units: 6840 }
  ],
  '30d': [
    { label: 'Week 1', units: 22100 },
    { label: 'Week 2', units: 22840 },
    { label: 'Week 3', units: 23310 },
    { label: 'Week 4', units: 24020 }
  ]
}

const QUALITY_SERIES = [
  { label: 'Filling', oee: 87, scrap: 2.4 },
  { label: 'Capping', oee: 83, scrap: 3.1 },
  { label: 'Labelling', oee: 91, scrap: 1.6 },
  { label: 'Packaging', oee: 85, scrap: 2.8 }
]

const DOWNTIME_LOG = [
  { reason: 'Changeover', duration: '38 min', impact: 'Medium', action: 'Standardised setup checklist' },
  { reason: 'Quality hold', duration: '22 min', impact: 'High', action: 'Inline inspection recalibrated' },
  { reason: 'Maintenance', duration: '16 min', impact: 'Low', action: 'Lubrication schedule automated' }
]

const Production = () => {
  const [range, setRange] = useState('24h')
  const throughput = useMemo(() => THROUGHPUT_SERIES[range], [range])

  const totalUnits = throughput.reduce((sum, point) => sum + point.units, 0)
  const avgUnits = Math.round(totalUnits / throughput.length)

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Production performance</h1>
          <p className="text-sm text-muted-foreground">
            Monitor throughput, equipment effectiveness, and downtime hotspots across lines.
          </p>
        </div>
        <Badge variant="outline">Shift 3 active</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Throughput overview</CardTitle>
          <CardDescription>Select a horizon to compare output trends.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Control label="Time horizon">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </Control>
          <Metric label="Units produced" value={totalUnits.toLocaleString()} helper="Included in selected window" />
          <Metric label="Average per interval" value={avgUnits.toLocaleString()} helper="Mean output" />
          <Metric label="Top cell" value="Line B" helper="Peak at 92% OEE" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Output by interval</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={throughput}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip formatter={(value) => `${value.toLocaleString()} units`} />
              <Bar dataKey="units" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cell effectiveness</CardTitle>
          <CardDescription>Overall equipment effectiveness compared to scrap rate per sub-process.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={QUALITY_SERIES}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis yAxisId="oee" tickFormatter={(v) => `${v}%`} domain={[70, 100]} />
              <YAxis yAxisId="scrap" orientation="right" tickFormatter={(v) => `${v}%`} domain={[0, 5]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line yAxisId="oee" type="monotone" dataKey="oee" stroke="#16a34a" strokeWidth={2} dot />
              <Line yAxisId="scrap" type="monotone" dataKey="scrap" stroke="#f97316" strokeWidth={2} strokeDasharray="5 3" dot />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Downtime snapshot</CardTitle>
          <CardDescription>Recent stoppages and mitigating actions logged by the shift lead.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Reason</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Impact</th>
                <th className="px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DOWNTIME_LOG.map((row) => (
                <tr key={row.reason}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.reason}</td>
                  <td className="px-4 py-3">{row.duration}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.impact === 'High' ? 'destructive' : row.impact === 'Medium' ? 'secondary' : 'outline'}>
                      {row.impact}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  )
}

const Control = ({ label, children }) => (
  <div className="space-y-2">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
    {children}
  </div>
)

const Metric = ({ label, value, helper }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-lg font-semibold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{helper}</p>
  </div>
)

export default Production

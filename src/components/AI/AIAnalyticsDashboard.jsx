import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'

const STATUS_OPTIONS = {
  connecting: { label: 'Connecting', tone: 'warning', latency: '—', requests: '—', errors: '—' },
  connected: { label: 'Connected', tone: 'success', latency: '42 ms', requests: '12.4k', errors: '0.2%' },
  degraded: { label: 'Degraded', tone: 'destructive', latency: '186 ms', requests: '9.8k', errors: '3.4%' }
}

const ANOMALIES = [
  { id: 1, title: 'Demand spike detected', detail: 'West region volume +28% vs forecast', severity: 'High', action: 'Trigger production contingency' },
  { id: 2, title: 'Inventory imbalance', detail: 'SKU-521 projected to stock out in 6 days', severity: 'Medium', action: 'Advance replenishment cycle' },
  { id: 3, title: 'Quality drift', detail: 'Fill variance trending +1.2σ above control', severity: 'Watch', action: 'Increase sampling frequency' }
]

const AUTOMATIONS = [
  { time: '08:45', action: 'Optimised production schedule', impact: 'Saved 3.2 hrs changeover', status: 'Completed' },
  { time: '10:20', action: 'Raised purchase order', impact: 'Recovered $185K inventory', status: 'Queued' },
  { time: '11:10', action: 'Adjusted pricing tiers', impact: '+$24K projected uplift', status: 'In progress' }
]

const FORECAST_SERIES = [
  { horizon: 'Day 1', confidence: 0.91, netCash: 820000 },
  { horizon: 'Day 7', confidence: 0.89, netCash: 795000 },
  { horizon: 'Day 14', confidence: 0.9, netCash: 812000 },
  { horizon: 'Day 21', confidence: 0.92, netCash: 828000 },
  { horizon: 'Day 28', confidence: 0.88, netCash: 781000 }
]

const AIAnalyticsDashboard = () => {
  const [statusKey] = useState('connected')
  const status = STATUS_OPTIONS[statusKey]
  const forecastChart = useMemo(
    () => FORECAST_SERIES.map((point) => ({ ...point, confidencePct: Math.round(point.confidence * 100) })),
    []
  )

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI analytics console</h1>
          <p className="text-sm text-muted-foreground">
            MCP-powered insights, anomaly detection, and autonomous actions across Sentia operations.
          </p>
        </div>
        <Badge variant={status.tone}>{status.label}</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Model health</CardTitle>
          <CardDescription>Latency, load, and error profile for the orchestrated AI stack.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Average latency" value={status.latency} helper="p95 within SLA" />
          <Metric label="Requests served" value={status.requests} helper="Last 24h window" />
          <Metric label="Error rate" value={status.errors} helper="Model + integration errors" />
          <Metric label="Active models" value="4" helper="GPT-4 + Claude + Sentia ensembles" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash position forecast</CardTitle>
          <CardDescription>Net cash projection with model confidence band.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="horizon" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value, key) => (key === 'confidencePct' ? `${value}%` : `$${value.toLocaleString()}`)} />
              <Area type="monotone" dataKey="netCash" stroke="#2563eb" fill="#2563eb22" strokeWidth={2} />
              <Line type="monotone" dataKey="confidencePct" stroke="#16a34a" strokeWidth={2} dot />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active anomalies</CardTitle>
            <CardDescription>Top scenarios flagged by the monitoring pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ANOMALIES.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <Badge variant={item.severity === 'High' ? 'destructive' : item.severity === 'Medium' ? 'secondary' : 'outline'}>
                    {item.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                <p className="text-xs text-primary mt-2">Recommended action: {item.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Autonomous actions</CardTitle>
            <CardDescription>Recent MCP interventions and their impact.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {AUTOMATIONS.map((item) => (
              <div key={item.time} className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">{item.action}</p>
                <p className="text-xs text-muted-foreground">Impact: {item.impact}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.time}</span>
                  <Badge variant={item.status === 'Completed' ? 'secondary' : item.status === 'Queued' ? 'outline' : 'default'}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

const Metric = ({ label, value, helper }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-lg font-semibold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{helper}</p>
  </div>
)

export default AIAnalyticsDashboard

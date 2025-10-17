import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'

const KPI_SERIES = {
  '30d': {
    revenue: '$2.4M',
    pipeline: '$1.8M',
    grossMargin: '42%',
    churn: '3.1%',
  },
  '90d': {
    revenue: '$6.9M',
    pipeline: '$5.2M',
    grossMargin: '40%',
    churn: '4.2%',
  },
  '365d': {
    revenue: '$24.7M',
    pipeline: '$18.4M',
    grossMargin: '38%',
    churn: '5.6%',
  },
}

const REVENUE_SERIES = {
  '30d': [
    { month: 'Week 1', recurring: 520000, services: 180000, expansion: 95000 },
    { month: 'Week 2', recurring: 545000, services: 192000, expansion: 102000 },
    { month: 'Week 3', recurring: 571000, services: 185000, expansion: 110000 },
    { month: 'Week 4', recurring: 592000, services: 194000, expansion: 123000 },
  ],
  '90d': [
    { month: 'Mar', recurring: 1480000, services: 520000, expansion: 260000 },
    { month: 'Apr', recurring: 1530000, services: 548000, expansion: 282000 },
    { month: 'May', recurring: 1585000, services: 572000, expansion: 305000 },
  ],
  '365d': [
    { month: 'Q1', recurring: 4300000, services: 1610000, expansion: 785000 },
    { month: 'Q2', recurring: 4560000, services: 1695000, expansion: 840000 },
    { month: 'Q3', recurring: 4720000, services: 1750000, expansion: 905000 },
    { month: 'Q4', recurring: 4880000, services: 1820000, expansion: 980000 },
  ],
}

const PIPELINE_SERIES = [
  { stage: 'Qualification', value: 1420000 },
  { stage: 'Discovery', value: 980000 },
  { stage: 'Proposal', value: 760000 },
  { stage: 'Negotiation', value: 420000 },
  { stage: 'Closed Won', value: 310000 },
]

const RETENTION_ROWS = [
  {
    cohort: '2024-Q3',
    customers: 420,
    revenueRetained: '92%',
    expansion: '$185K',
    health: 'Stable',
  },
  {
    cohort: '2024-Q4',
    customers: 508,
    revenueRetained: '89%',
    expansion: '$241K',
    health: 'Watch',
  },
  {
    cohort: '2025-Q1',
    customers: 562,
    revenueRetained: '94%',
    expansion: '$318K',
    health: 'Strong',
  },
]

const Analytics = () => {
  const [range, setRange] = useState('30d')
  const kpis = KPI_SERIES[range]
  const revenueData = REVENUE_SERIES[range]

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics overview</h1>
          <p className="text-sm text-muted-foreground">
            Combined commercial, financial, and retention metrics to guide the weekly business
            review.
          </p>
        </div>
        <Badge variant="outline">Updated {new Date().toLocaleDateString()}</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Headline KPIs</CardTitle>
          <CardDescription>
            Select a timeframe to compare revenue and retention performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Control label="Time horizon">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="365d">Trailing 12 months</SelectItem>
              </SelectContent>
            </Select>
          </Control>
          <Metric label="Recognised revenue" value={kpis.revenue} helper="GAAP compliant" />
          <Metric label="Pipeline coverage" value={kpis.pipeline} helper="Weighted probability" />
          <Metric label="Gross margin" value={kpis.grossMargin} helper="Contribution after COGS" />
          <Metric label="Logo churn" value={kpis.churn} helper="Monthly blended" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue mix</CardTitle>
          <CardDescription>Recurring vs. services revenue with expansion uplift.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={value => `$${Math.round(value / 1000)}k`} />
              <Tooltip formatter={value => `$${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="recurring" stroke="#2563eb" strokeWidth={3} dot />
              <Line type="monotone" dataKey="services" stroke="#16a34a" strokeWidth={3} dot />
              <Area
                type="monotone"
                dataKey="expansion"
                stroke="#f59e0b"
                fill="#f59e0b22"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline velocity</CardTitle>
            <CardDescription>Current quarter pipeline value by stage.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PIPELINE_SERIES}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={value => `$${Math.round(value / 1000)}k`} />
                <Tooltip formatter={value => `$${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#9333ea" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cohort retention</CardTitle>
            <CardDescription>Revenue retained and expansion per customer cohort.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Cohort</th>
                  <th className="px-4 py-2 font-medium">Customers</th>
                  <th className="px-4 py-2 font-medium">Revenue retained</th>
                  <th className="px-4 py-2 font-medium">Expansion</th>
                  <th className="px-4 py-2 font-medium">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RETENTION_ROWS.map(row => (
                  <tr key={row.cohort}>
                    <td className="px-4 py-3 font-medium text-foreground">{row.cohort}</td>
                    <td className="px-4 py-3">{row.customers.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.revenueRetained}</td>
                    <td className="px-4 py-3">{row.expansion}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.health === 'Strong'
                            ? 'secondary'
                            : row.health === 'Stable'
                              ? 'outline'
                              : 'destructive'
                        }
                      >
                        {row.health}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
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

export default Analytics

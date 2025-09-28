import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'

const regionalPerformance = [
  { region: 'APAC', revenue: 3200000, ebitda: 780000 },
  { region: 'EMEA', revenue: 2760000, ebitda: 640000 },
  { region: 'Americas', revenue: 2140000, ebitda: 520000 }
]

const capitalKpis = [
  { label: 'Global working capital', value: '$9.2M', helper: 'Across all subsidiaries' },
  { label: 'Cash coverage', value: '214 days', helper: 'Including credit facilities' },
  { label: 'Intercompany exposure', value: '$1.1M', helper: 'Pending settlements' },
  { label: 'FX sensitivity', value: '$380K', helper: '±1% USD/EUR/JPY' }
]

const DashboardEnterprise = () => (
  <section className="space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Enterprise dashboard</h1>
        <p className="text-sm text-muted-foreground">Consolidated liquidity and performance outlook across all regions.</p>
      </div>
      <Badge variant="outline">Global view</Badge>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>Capital position</CardTitle>
        <CardDescription>Key metrics reviewed in the weekly treasury meeting.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {capitalKpis.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className="text-lg font-semibold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Regional contribution</CardTitle>
        <CardDescription>Revenue and EBITDA by operating region for the current quarter.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={regionalPerformance}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="region" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="ebitda" fill="#16a34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </section>
)

export default DashboardEnterprise

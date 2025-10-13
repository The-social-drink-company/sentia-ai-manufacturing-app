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

const REGION_BALANCE = [
  { month: 'Jan', apac: 3.2, emea: 2.4, americas: 1.8 },
  { month: 'Feb', apac: 3.4, emea: 2.5, americas: 1.9 },
  { month: 'Mar', apac: 3.6, emea: 2.7, americas: 2.1 },
  { month: 'Apr', apac: 3.5, emea: 2.6, americas: 2.0 },
  { month: 'May', apac: 3.8, emea: 2.9, americas: 2.2 }
]

const ACTIONS = [
  { title: 'Accelerate receivables APAC', impact: '$640K liquidity', owner: 'Regional finance', status: 'In progress' },
  { title: 'Extend supplier terms EMEA', impact: '$420K liquidity', owner: 'Procurement', status: 'Planned' },
  { title: 'Inventory rebalance Americas', impact: '$310K release', owner: 'Operations', status: 'Active' }
]

const KPIS = [
  { label: 'Working capital', value: '$9.2M', helper: 'Consolidated' },
  { label: 'Cash runway', value: '214 days', helper: 'Including credit lines' },
  { label: 'DSO', value: '48 days', helper: 'Weighted global' },
  { label: 'DPO', value: '42 days', helper: 'Weighted global' }
]

const WorkingCapitalEnterprise = () => (
  <section className="space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Enterprise working capital</h1>
        <p className="text-sm text-muted-foreground">Global liquidity, receivables, and payables overview.</p>
      </div>
      <Badge variant="outline">Treasury view</Badge>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>Key metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((item) => (
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
        <CardTitle>Regional cash balance</CardTitle>
        <CardDescription>Rolling 5-month forecast by legal entity region (USD millions).</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={REGION_BALANCE}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${value.toFixed(1)}M`} />
            <Tooltip formatter={(value) => `$${(value * 1_000_000).toLocaleString()}`} />
            <Area type="monotone" dataKey="apac" stroke="#2563eb" fill="#2563eb22" strokeWidth={2} />
            <Area type="monotone" dataKey="emea" stroke="#16a34a" fill="#16a34a22" strokeWidth={2} />
            <Area type="monotone" dataKey="americas" stroke="#f97316" fill="#f9731622" strokeWidth={2} />
            <Line type="monotone" dataKey="apac" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="emea" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="americas" stroke="#f97316" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Liquidity playbook</CardTitle>
        <CardDescription>Items escalated to the treasury committee this week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {ACTIONS.map((action) => (
          <div key={action.title} className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{action.title}</p>
              <Badge variant={action.status === 'Active' ? 'secondary' : action.status === 'In progress' ? 'outline' : 'default'}>
                {action.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Owner: {action.owner}</p>
            <p className="text-xs text-primary mt-1">Impact: {action.impact}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  </section>
)

export default WorkingCapitalEnterprise

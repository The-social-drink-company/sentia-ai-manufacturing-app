import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowTrendingUpIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

const headline = {
  revenue: { label: 'Monthly Revenue', value: '$2.5M', change: '+15.2%' },
  orders: { label: 'Active Orders', value: '1,240', change: '+8.5%' },
  inventory: { label: 'Inventory Value', value: '$820K', change: '-2.1%' },
  customers: { label: 'Active Customers', value: '842', change: '+12.3%' },
}

const quickActions = [
  { label: 'Working Capital', description: 'Review liquidity snapshot' },
  { label: 'Demand Forecast', description: 'Refresh AI projection' },
  { label: 'Scenario Model', description: 'Run what-if analysis' },
]

const ExecutiveDashboard = () => {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">Key financial and operational signals.</p>
        </div>
        <Badge variant="outline">Systems operational</Badge>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard {...headline.revenue} icon={<DollarSignIcon className="h-6 w-6" />} />
        <MetricCard {...headline.orders} icon={<ArrowTrendingUpIcon className="h-6 w-6" />} />
        <MetricCard {...headline.inventory} icon={<ShoppingCartIcon className="h-6 w-6" />} />
        <MetricCard {...headline.customers} icon={<UsersIcon className="h-6 w-6" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {quickActions.map(action => (
            <div key={action.label} className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

const MetricCard = ({ label, value, change, icon }) => (
  <Card>
    <CardContent className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className={`text-xs ${change.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
          {change} vs prior period
        </p>
      </div>
      <div className="rounded-lg bg-muted/40 p-2 text-muted-foreground">{icon}</div>
    </CardContent>
  </Card>
)

export default ExecutiveDashboard

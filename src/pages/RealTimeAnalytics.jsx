import { useMemo, useState } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)

const revenueSamples = {
  '24h': [12000, 13850, 14210, 12940, 15320, 16100],
  '7d': [76000, 81250, 79820, 84560, 90310, 88950, 92440],
  '30d': [210000, 215400, 219850, 224300, 231200, 238400, 242100, 246500, 251900, 259300]
}

const orderSamples = {
  '24h': [120, 138, 142, 129, 153, 161],
  '7d': [820, 840, 835, 860, 880, 905, 912],
  '30d': [2950, 3010, 3085, 3120, 3180, 3225, 3275, 3330, 3395, 3450]
}

const inventoryBreakdown = {
  '24h': { available: 1380, low: 120, out: 15 },
  '7d': { available: 1360, low: 140, out: 22 },
  '30d': { available: 1320, low: 160, out: 28 }
}

const RealTimeAnalytics = () => {
  const [timeRange, setTimeRange] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const latestRevenue = revenueSamples[timeRange].slice(-1)[0]
  const latestOrders = orderSamples[timeRange].slice(-1)[0]
  const breakdown = inventoryBreakdown[timeRange]
  const averageOrderValue = latestOrders ? latestRevenue / latestOrders : 0

  const revenueChartData = useMemo(() => {
    const labels = revenueSamples[timeRange].map((_, index) => `P${index + 1}`)
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueSamples[timeRange],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          tension: 0.35,
          fill: true
        }
      ]
    }
  }, [timeRange])

  const ordersChartData = useMemo(() => {
    const labels = orderSamples[timeRange].map((_, index) => `P${index + 1}`)
    return {
      labels,
      datasets: [
        {
          label: 'Orders',
          data: orderSamples[timeRange],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.35,
          fill: true
        }
      ]
    }
  }, [timeRange])

  const inventoryChartData = useMemo(() => ({
    labels: ['Available', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [breakdown.available, breakdown.low, breakdown.out],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderColor: ['#059669', '#D97706', '#DC2626'],
        borderWidth: 2
      }
    ]
  }), [breakdown])

  const refreshLabel = autoRefresh ? 'Auto refresh enabled' : 'Auto refresh disabled'

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Real-Time Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Consolidated revenue, order, and inventory signals across sales integrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <button
            type="button"
            onClick={() => setAutoRefresh((value) => !value)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              autoRefresh
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <ClockIcon className="h-4 w-4" />
            {refreshLabel}
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
            title="Manually refresh dashboards"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<CurrencyDollarIcon className="h-6 w-6 text-emerald-500" />}
          label="Latest Revenue"
          value={`$${latestRevenue.toLocaleString()}`}
          helper={`Average order value $${averageOrderValue.toFixed(2)}`}
        />
        <MetricCard
          icon={<ShoppingCartIcon className="h-6 w-6 text-sky-500" />}
          label="Latest Orders"
          value={latestOrders.toLocaleString()}
          helper="Combined Shopify + Amazon"
        />
        <MetricCard
          icon={<ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />}
          label="Inventory Alerts"
          value={`${breakdown.low + breakdown.out}`}
          helper={`${breakdown.low} low stock · ${breakdown.out} out of stock`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AnalyticsPanel title="Revenue trend" onExport={() => {}}>
          <div className="h-64">
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => `$${value.toLocaleString()}`
                    }
                  }
                }
              }}
            />
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Order volume" onExport={() => {}}>
          <div className="h-64">
            <Line
              data={ordersChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </AnalyticsPanel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AnalyticsPanel title="Inventory mix" onExport={() => {}}>
          <div className="h-64">
            <Doughnut
              data={inventoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>
        </AnalyticsPanel>

        <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border bg-card p-6">
          <div>
            <h3 className="text-lg font-semibold">System status</h3>
            <p className="text-sm text-muted-foreground">
              All integrations responding within expected thresholds.
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>Amazon SP-API</span>
              <Badge tone="success">Operational</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span>Shopify GraphQL</span>
              <Badge tone="success">Operational</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span>Unleashed ERP</span>
              <Badge tone="warning">Monitoring</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span>Xero Accounting</span>
              <Badge tone="success">Operational</Badge>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

const MetricCard = ({ icon, label, value, helper }) => (
  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/40">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
    </div>
  </div>
)

const AnalyticsPanel = ({ title, children, onExport }) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Export
      </button>
    </div>
    {children}
  </div>
)

const Badge = ({ tone, children }) => {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-100 text-emerald-800'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-muted text-muted-foreground'

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClass}`}>{children}</span>
}

export default RealTimeAnalytics

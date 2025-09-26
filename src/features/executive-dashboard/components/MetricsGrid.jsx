import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  TruckIcon,
  ClockIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

import { KPICard } from './KPICard'

const defaultMetrics = [
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: 2547890,
    change: 12.3,
    changeType: 'positive',
    format: 'currency',
    icon: CurrencyDollarIcon
  },
  {
    id: 'orders',
    title: 'Total Orders',
    value: 1234,
    change: 8.7,
    changeType: 'positive',
    format: 'number',
    icon: ShoppingCartIcon
  },
  {
    id: 'inventory',
    title: 'Inventory Value',
    value: 845230,
    change: -3.2,
    changeType: 'negative',
    format: 'currency',
    icon: CubeIcon
  },
  {
    id: 'production',
    title: 'Production Efficiency',
    value: 87.5,
    change: 5.1,
    changeType: 'positive',
    format: 'percentage',
    icon: ChartBarIcon
  },
  {
    id: 'leadtime',
    title: 'Avg Lead Time',
    value: 4.2,
    change: -15.3,
    changeType: 'positive',
    format: 'number',
    icon: ClockIcon
  },
  {
    id: 'shipments',
    title: 'Active Shipments',
    value: 42,
    change: 0,
    changeType: 'neutral',
    format: 'number',
    icon: TruckIcon
  }
]

export function MetricsGrid({ metrics = defaultMetrics, loading = false }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map((metric) => (
        <KPICard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          changeType={metric.changeType}
          format={metric.format}
          icon={metric.icon}
          loading={loading}
        />
      ))}
    </div>
  )
}
import { useUser } from '@clerk/clerk-react'
import {
  CurrencyDollarIcon,
  TruckIcon,
  CubeIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

import ActivityWidget from '../components/widgets/ActivityWidget'
import AlertWidget from '../components/widgets/AlertWidget'
import ChartWidget from '../components/widgets/ChartWidget'
import DataTableWidget from '../components/widgets/DataTableWidget'
import KPIWidget from '../components/widgets/KPIWidget'


const DashboardEnhanced = () => {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({})

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setDashboardData({
        kpis: [
          {
            id: 'revenue',
            title: 'Total Revenue',
            value: '847,925',
            prefix: '$',
            change: 12.5,
            changeType: 'positive',
            icon: CurrencyDollarIcon,
            color: 'green',
            trend: [30, 35, 32, 38, 42, 45, 48]
          },
          {
            id: 'orders',
            title: 'Active Orders',
            value: '256',
            change: -3.2,
            changeType: 'negative',
            icon: ShoppingCartIcon,
            color: 'blue',
            trend: [15, 18, 16, 14, 13, 12, 11]
          },
          {
            id: 'inventory',
            title: 'Inventory Value',
            value: '1.2M',
            prefix: '$',
            change: 5.7,
            changeType: 'positive',
            icon: CubeIcon,
            color: 'purple',
            trend: [40, 42, 43, 45, 47, 48, 50]
          },
          {
            id: 'production',
            title: 'Production Rate',
            value: '94.2',
            suffix: '%',
            change: 2.1,
            changeType: 'positive',
            icon: TruckIcon,
            color: 'yellow',
            trend: [88, 89, 90, 91, 92, 93, 94]
          }
        ],
        recentOrders: [
          { id: 'ORD-001', customer: 'Acme Corp', product: 'Widget A', quantity: 500, value: '$12,500', status: 'In Production' },
          { id: 'ORD-002', customer: 'Beta Inc', product: 'Widget B', quantity: 250, value: '$7,250', status: 'Completed' },
          { id: 'ORD-003', customer: 'Gamma Ltd', product: 'Widget C', quantity: 1000, value: '$45,000', status: 'Pending' },
          { id: 'ORD-004', customer: 'Delta Co', product: 'Widget A', quantity: 750, value: '$18,750', status: 'In Production' },
          { id: 'ORD-005', customer: 'Epsilon LLC', product: 'Widget D', quantity: 300, value: '$9,300', status: 'Shipped' }
        ],
        productionChart: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Units Produced',
              data: [1200, 1350, 1100, 1450, 1600, 800, 600],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4
            },
            {
              label: 'Target',
              data: [1300, 1300, 1300, 1300, 1300, 1000, 800],
              borderColor: 'rgb(156, 163, 175)',
              backgroundColor: 'rgba(156, 163, 175, 0.1)',
              borderDash: [5, 5],
              tension: 0
            }
          ]
        },
        inventoryChart: {
          labels: ['Raw Materials', 'Work in Progress', 'Finished Goods', 'Spare Parts'],
          datasets: [{
            data: [35, 25, 30, 10],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(251, 146, 60, 0.8)',
              'rgba(163, 163, 163, 0.8)'
            ],
            borderWidth: 0
          }]
        },
        revenueChart: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Revenue',
            data: [650000, 720000, 680000, 780000, 820000, 847925],
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderRadius: 4
          }]
        },
        qualityMetrics: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [
            {
              label: 'Pass Rate (%)',
              data: [98.2, 97.8, 98.5, 99.1, 98.7],
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              yAxisID: 'y'
            },
            {
              label: 'Defects',
              data: [12, 15, 10, 6, 9],
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              yAxisID: 'y1'
            }
          ]
        }
      })
      setLoading(false)
    }, 1000)
  }, [])

  const orderColumns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'value', label: 'Value' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          value === 'Completed' ? 'bg-green-100 text-green-800' :
          value === 'In Production' ? 'bg-blue-100 text-blue-800' :
          value === 'Shipped' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-blue-100">
          Here's what's happening in your manufacturing operations today.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardData.kpis?.map(kpi => (
          <KPIWidget
            key={kpi.id}
            {...kpi}
            loading={loading}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Weekly Production Output"
          type="line"
          data={dashboardData.productionChart}
          loading={loading}
          options={{
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Units'
                }
              }
            }
          }}
        />
        <ChartWidget
          title="Revenue Trend"
          type="bar"
          data={dashboardData.revenueChart}
          loading={loading}
          options={{
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback(value) {
                    return `$${  value / 1000  }k`
                  }
                }
              }
            }
          }}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartWidget
          title="Inventory Distribution"
          type="doughnut"
          data={dashboardData.inventoryChart}
          loading={loading}
          height={250}
        />
        <div className="lg:col-span-2">
          <ChartWidget
            title="Quality Metrics"
            type="line"
            data={dashboardData.qualityMetrics}
            loading={loading}
            options={{
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Pass Rate (%)'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Defects'
                  },
                  grid: {
                    drawOnChartArea: false
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTableWidget
        title="Recent Orders"
        columns={orderColumns}
        data={dashboardData.recentOrders || []}
        loading={loading}
        searchable={true}
        sortable={true}
        pageSize={5}
      />

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityWidget loading={loading} />
        <AlertWidget loading={loading} />
      </div>
    </div>
  )
}

export default DashboardEnhanced
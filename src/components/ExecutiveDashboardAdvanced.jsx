import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, Package, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'

const ExecutiveDashboardAdvanced = () => {
  const kpiCards = [
    {
      title: 'Total Revenue',
      value: '£2.5M',
      change: '+15.2%',
      trend: 'up',
      subtitle: 'Monthly recurring revenue',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Active Orders',
      value: '1,250',
      change: '+8.5%',
      trend: 'up',
      subtitle: 'Orders in production',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Inventory Value',
      value: '£0.8M',
      change: '-2.1%',
      trend: 'down',
      subtitle: 'Current stock valuation',
      icon: BarChart3,
      color: 'text-red-600',
    },
    {
      title: 'Active Customers',
      value: '850',
      change: '+12.3%',
      trend: 'up',
      subtitle: 'Customers with active orders',
      icon: Users,
      color: 'text-green-600',
    },
  ]

  const workingCapitalData = {
    current: '£1.9M',
    projection: '£2.1M',
    change: '+19.5%',
  }

  const keyMetrics = [
    { label: 'Revenue Growth', value: '+15.2%', progress: 76 },
    { label: 'Order Fulfillment', value: '94.8%', progress: 95 },
    { label: 'Customer Satisfaction', value: '4.7/5', progress: 94 },
    { label: 'Inventory Turnover', value: '8.2x', progress: 82 },
  ]

  const quickActions = [
    { title: 'Run Forecast', subtitle: 'Generate demand forecast', icon: TrendingUp },
    { title: 'Working Capital', subtitle: 'Analyze cash flow', icon: DollarSign },
    { title: 'What-If Analysis', subtitle: 'Scenario modeling', icon: BarChart3 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time manufacturing operations overview</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>All Systems Operational</span>
          </div>
          <span>18:24:24</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown

          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendIcon className={`h-3 w-3 ${kpi.color}`} />
                  <span className={`text-xs font-medium ${kpi.color}`}>{kpi.change}</span>
                  <span className="text-xs text-gray-500">{kpi.subtitle}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Working Capital Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Working Capital</CardTitle>
            <p className="text-sm text-gray-600">Current financial position and projections</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Current</p>
                <p className="text-2xl font-bold text-gray-900">{workingCapitalData.current}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">90-Day Projection</p>
                <p className="text-2xl font-bold text-gray-900">{workingCapitalData.projection}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Change</p>
                <p className="text-lg font-semibold text-green-600">{workingCapitalData.change}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Potential 90-day cash unlock</h4>
              <p className="text-3xl font-bold text-green-600">£83,000</p>
              <p className="text-sm text-gray-600 mt-1">Without new debt or external funding</p>

              <div className="mt-3">
                <p className="text-lg font-semibold text-blue-600">£334,000</p>
                <p className="text-sm text-gray-600">12-month improvement</p>
              </div>

              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">90 Days to unlock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Key Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {keyMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{metric.value}</span>
                </div>
                <Progress value={metric.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <p className="text-sm text-gray-600">Frequently used analysis tools</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.subtitle}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExecutiveDashboardAdvanced

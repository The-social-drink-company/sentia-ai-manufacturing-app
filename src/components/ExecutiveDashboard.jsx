import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react'

const ExecutiveDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalRevenue: { value: '£2.5M', change: '+15.2%', trend: 'up' },
    activeOrders: { value: '1,250', change: '+8.5%', trend: 'up' },
    inventoryValue: { value: '£0.8M', change: '-2.1%', trend: 'down' },
    activeCustomers: { value: '850', change: '+12.3%', trend: 'up' }
  })

  const [workingCapital, setWorkingCapital] = useState({
    current: '£1.9M',
    projection: '£2.1M',
    change: '+19.5%'
  })

  const [kpis, setKpis] = useState([
    { label: 'Revenue Growth', value: '+15.2%', target: 85 },
    { label: 'Order Fulfillment', value: '94.8%', target: 95 },
    { label: 'Customer Satisfaction', value: '4.7/5', target: 90 },
    { label: 'Inventory Turnover', value: '8.2x', target: 75 }
  ])

  const quickActions = [
    {
      title: 'Run Forecast',
      description: 'Generate demand forecast',
      icon: BarChart3,
      color: 'bg-blue-500'
    },
    {
      title: 'Working Capital',
      description: 'Analyze cash flow',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'What-If Analysis',
      description: 'Scenario modeling',
      icon: Target,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Executive Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Real-time manufacturing operations overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="h-3 w-3 mr-1" />
            All Systems Operational
          </Badge>
          <span className="text-sm text-slate-500">18:24:24</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(metrics).map(([key, metric], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    metric.trend === 'up' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.change}
                  </span>
                  <span className="text-sm text-slate-500 ml-2">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Working Capital Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Working Capital</span>
              </CardTitle>
              <CardDescription>Current position and 90-day projection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Current</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{workingCapital.current}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">90-Day Projection</p>
                  <p className="text-3xl font-bold text-green-600">{workingCapital.projection}</p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-600">{workingCapital.change}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {kpis.map((kpi, index) => (
                <div key={kpi.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{kpi.label}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{kpi.value}</span>
                  </div>
                  <Progress value={kpi.target} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used analysis tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">{action.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default ExecutiveDashboard

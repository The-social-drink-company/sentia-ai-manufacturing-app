import { useState, useEffect } from 'react'
import { BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuthContext } from '../../providers/AuthProvider'
import { useWorkingCapitalMetrics } from './hooks/useWorkingCapitalMetrics'
import CashFlowChart from './components/CashFlowChart'
import ARAgingChart from './components/ARAgingChart'
import APAgingChart from './components/APAgingChart'
import InventoryTurnover from './components/InventoryTurnover'
import CashConversionCycle from './components/CashConversionCycle'

export default function WorkingCapitalDashboard() {
  const { user } = useAuthContext()
  const { data, loading, error, refresh } = useWorkingCapitalMetrics()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [showForecast, setShowForecast] = useState(false)

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(refresh, 60000)
    return () => clearInterval(interval)
  }, [refresh])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load working capital data: {error.message}</p>
            <Button onClick={refresh} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const metrics = data || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Working Capital Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor cash flow, receivables, payables, and inventory metrics
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button onClick={() => setShowForecast(!showForecast)}>
            {showForecast ? 'Hide' : 'Show'} Forecast
          </Button>
          <Button onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cash Position"
          value={metrics.cashPosition}
          trend={metrics.cashTrend}
          icon={BanknotesIcon}
          format="currency"
        />
        <MetricCard
          title="DSO (Days Sales Outstanding)"
          value={metrics.dso}
          trend={metrics.dsoTrend}
          icon={ChartBarIcon}
          format="days"
          inverse
        />
        <MetricCard
          title="DPO (Days Payable Outstanding)"
          value={metrics.dpo}
          trend={metrics.dpoTrend}
          icon={ChartBarIcon}
          format="days"
        />
        <MetricCard
          title="Cash Conversion Cycle"
          value={metrics.cashConversionCycle}
          trend={metrics.cccTrend}
          icon={ChartBarIcon}
          format="days"
          inverse
        />
      </div>

      {/* Cash Flow Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Analysis</CardTitle>
          <CardDescription>
            Inflows, outflows, and net cash position over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={metrics.cashFlow} period={selectedPeriod} showForecast={showForecast} />
        </CardContent>
      </Card>

      {/* AR/AP Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accounts Receivable Aging</CardTitle>
            <CardDescription>Outstanding customer invoices by age</CardDescription>
          </CardHeader>
          <CardContent>
            <ARAgingChart data={metrics.arAging} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accounts Payable Aging</CardTitle>
            <CardDescription>Outstanding supplier invoices by age</CardDescription>
          </CardHeader>
          <CardContent>
            <APAgingChart data={metrics.apAging} />
          </CardContent>
        </Card>
      </div>

      {/* Inventory & Cash Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Turnover</CardTitle>
            <CardDescription>Stock movement and efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryTurnover data={metrics.inventory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Conversion Cycle</CardTitle>
            <CardDescription>Time to convert investments back to cash</CardDescription>
          </CardHeader>
          <CardContent>
            <CashConversionCycle data={metrics.cccDetails} />
          </CardContent>
        </Card>
      </div>

      {/* Forecast Section */}
      {showForecast && (
        <Card>
          <CardHeader>
            <CardTitle>13-Week Cash Flow Forecast</CardTitle>
            <CardDescription>
              Projected cash position based on current trends and scheduled transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500">Forecast visualization coming soon...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricCard({ title, value, trend, icon: Icon, format = 'number', inverse = false }) {
  const formatValue = (val) => {
    if (!val && val !== 0) return '--'
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: val > 1000000 ? 'compact' : 'standard'
        }).format(val)
      case 'days':
        return `${val} days`
      case 'percentage':
        return `${val}%`
      default:
        return val.toLocaleString()
    }
  }

  const isPositiveTrend = inverse ? trend < 0 : trend > 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold mt-2">{formatValue(value)}</p>
            {trend !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${
                isPositiveTrend ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveTrend ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                )}
                <span>{Math.abs(trend)}% vs last period</span>
              </div>
            )}
          </div>
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  )
}
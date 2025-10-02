import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from 'lucide-react'

const ProductionMetrics = ({ data }) => {
  const formatPercentage = (value) => {
    if (!value) return '0%'
    return `${value.toFixed(1)}%`
  }

  const formatNumber = (value) => {
    if (!value) return '0'
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getTrendIcon = (value, threshold = 85) => {
    if (!value) return <MinusIcon className="w-4 h-4 text-slate-400" />
    if (value >= threshold) return <TrendingUpIcon className="w-4 h-4 text-green-400" />
    if (value >= threshold * 0.8) return <MinusIcon className="w-4 h-4 text-yellow-400" />
    return <TrendingDownIcon className="w-4 h-4 text-red-400" />
  }

  const getBadgeVariant = (value, threshold = 85) => {
    if (!value) return 'secondary'
    if (value >= threshold) return 'default'
    if (value >= threshold * 0.8) return 'secondary'
    return 'destructive'
  }

  const production = data?.production || {}
  const efficiency = production.efficiency || 0
  const oeeScore = production.oeeScore || 0
  const capacity = production.capacity || {}
  const units = production.units || {}

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Production Metrics
          {getTrendIcon(efficiency)}
        </CardTitle>
        <CardDescription className="text-slate-400">
          Real-time production performance and efficiency indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Efficiency</p>
              <Badge variant={getBadgeVariant(efficiency)}>
                {formatPercentage(efficiency)}
              </Badge>
            </div>
            <p className="text-lg font-semibold text-white">{formatPercentage(efficiency)}</p>
            <p className="text-xs text-slate-500">Target: 85%</p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">OEE Score</p>
              <Badge variant={getBadgeVariant(oeeScore)}>
                {formatPercentage(oeeScore)}
              </Badge>
            </div>
            <p className="text-lg font-semibold text-white">{formatPercentage(oeeScore)}</p>
            <p className="text-xs text-slate-500">Overall Equipment Effectiveness</p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Capacity Utilization</p>
              <Badge variant={getBadgeVariant(capacity.utilization)}>
                {formatPercentage(capacity.utilization)}
              </Badge>
            </div>
            <p className="text-lg font-semibold text-white">{formatPercentage(capacity.utilization)}</p>
            <p className="text-xs text-slate-500">
              {formatNumber(capacity.used)} / {formatNumber(capacity.total)} units
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Units Produced</p>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                {formatNumber(units.produced)}
              </Badge>
            </div>
            <p className="text-lg font-semibold text-white">{formatNumber(units.produced)}</p>
            <p className="text-xs text-slate-500">
              Target: {formatNumber(units.target)} units
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Production Quality</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Defect Rate</span>
                <span className="text-sm text-yellow-400">
                  {formatPercentage(production.defectRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">First Pass Yield</span>
                <span className="text-sm text-green-400">
                  {formatPercentage(production.firstPassYield)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Rework Rate</span>
                <span className="text-sm text-red-400">
                  {formatPercentage(production.reworkRate)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Machine Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Availability</span>
                <span className="text-sm text-blue-400">
                  {formatPercentage(production.availability)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Performance Rate</span>
                <span className="text-sm text-blue-400">
                  {formatPercentage(production.performanceRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Quality Rate</span>
                <span className="text-sm text-green-400">
                  {formatPercentage(production.qualityRate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {production.alerts && production.alerts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Production Alerts</h4>
            <div className="space-y-2">
              {production.alerts.slice(0, 3).map((alert, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-400' :
                      alert.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}></div>
                    <span className="text-sm text-white">{alert.message}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductionMetrics
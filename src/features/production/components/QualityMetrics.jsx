import { useState } from 'react'
import {
  BeakerIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../../components/ui'

export default function QualityMetrics({ data }) {
  const [selectedView, setSelectedView] = useState('overview') // overview, pareto, trends, actions

  // Mock data fallback
  const qualityData = data || {
    overallQuality: 96.2,
    defectRate: 1.8,
    firstPassYield: 94.5,
    reworkRate: 2.1,
    scrapRate: 0.7,
    customerComplaints: 3,
    qualityTrends: [],
    defectCategories: [],
    correctionActions: []
  }

  const getQualityStatus = (value, thresholds = { excellent: 95, good: 90, fair: 85 }) => {
    if (value >= thresholds.excellent) return { color: 'green', status: 'Excellent' }
    if (value >= thresholds.good) return { color: 'blue', status: 'Good' }
    if (value >= thresholds.fair) return { color: 'yellow', status: 'Fair' }
    return { color: 'red', status: 'Poor' }
  }

  const qualityStatus = getQualityStatus(qualityData.overallQuality)
  const fyStatus = getQualityStatus(qualityData.firstPassYield)

  const QualityCard = ({ title, value, format = 'percentage', target, change, icon: Icon, color = 'blue' }) => {
    const formatValue = (val) => {
      switch (format) {
        case 'percentage': return `${val.toFixed(1)}%`
        case 'number': return val.toString()
        case 'decimal': return val.toFixed(2)
        default: return val.toString()
      }
    }

    const isGood = format === 'percentage' ? value >= (target || 95) : value <= (target || 5)

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
              <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
              <div className="flex items-center">
                <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatValue(value)}
                </span>
                {change !== undefined && (
                  <span className={`ml-2 flex items-center text-sm ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
                    {Math.abs(change).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isGood
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {isGood ? 'Target Met' : 'Below Target'}
          </div>
        </div>

        {target && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Target: {formatValue(target)}</span>
              <span>{format === 'percentage' ?
                ((value / target) * 100).toFixed(0) + '% of target' :
                Math.abs(((target - value) / target) * 100).toFixed(0) + '% from target'
              }</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isGood ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  width: format === 'percentage'
                    ? `${Math.min((value / target) * 100, 100)}%`
                    : `${Math.max(100 - ((value / target) * 100), 0)}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  const ParetoChart = ({ categories }) => {
    const totalDefects = categories.reduce((sum, cat) => sum + cat.count, 0)
    let cumulativePercentage = 0

    return (
      <Card>
        <CardHeader>
          <CardTitle>Defect Analysis (Pareto Chart)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category, __index) => {
              const percentage = totalDefects > 0 ? (category.count / totalDefects) * 100 : 0
              cumulativePercentage += percentage

              return (
                <div key={category.category} className="relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.count} ({percentage.toFixed(1)}%)
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Cumulative: {cumulativePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-red-500' :
                          index === 1 ? 'bg-orange-500' :
                          index === 2 ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">
              80/20 Analysis
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Top {Math.min(2, categories.length)} categories represent{' '}
              {categories.slice(0, 2).reduce((sum, cat) => sum + cat.percentage, 0)}% of all defects.
              Focus improvement efforts on these areas for maximum impact.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const TrendsChart = ({ trends }) => {
    if (!trends || trends.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Quality Trends (24 Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    const maxQuality = Math.max(...trends.map(t => t.quality))
    const minQuality = Math.min(...trends.map(t => t.quality))

    return (
      <Card>
        <CardHeader>
          <CardTitle>Quality Trends (24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{maxQuality.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Peak Quality</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {(trends.reduce((sum, t) => sum + t.quality, 0) / trends.length).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Average Quality</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{minQuality.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Lowest Quality</p>
              </div>
            </div>

            {/* Simplified trend visualization */}
            <div className="space-y-2">
              {trends.map((trend, __index) => (
                <div key={trend.hour} className="flex items-center space-x-2">
                  <span className="text-xs w-8 text-gray-600 dark:text-gray-400">
                    {String(trend.hour).padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        trend.quality >= 95 ? 'bg-green-500' :
                        trend.quality >= 90 ? 'bg-blue-500' :
                        trend.quality >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(trend.quality / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs w-12 text-right text-gray-900 dark:text-white">
                    {trend.quality.toFixed(1)}%
                  </span>
                  <span className="text-xs w-16 text-right text-gray-600 dark:text-gray-400">
                    {trend.defects} defects
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CorrectiveActions = ({ actions }) => {
    const getActionStatus = (status) => {
      const configs = {
        'completed': { color: 'green', variant: 'success', label: 'Completed' },
        'in-progress': { color: 'blue', variant: 'info', label: 'In Progress' },
        'pending': { color: 'yellow', variant: 'warning', label: 'Pending' },
        'overdue': { color: 'red', variant: 'destructive', label: 'Overdue' }
      }
      return configs[status] || configs['pending']
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Corrective Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actions.map((action) => {
              const statusConfig = getActionStatus(action.status)
              const isOverdue = action.dueDate && new Date(action.dueDate) < new Date() && action.status !== 'completed'

              return (
                <div key={action.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={isOverdue ? 'destructive' : statusConfig.variant}>
                          {isOverdue ? 'Overdue' : statusConfig.label}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.id}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {action.issue}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Action:</strong> {action.action}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span><strong>Assignee:</strong> {action.assignee}</span>
                        {action.dueDate && (
                          <span><strong>Due:</strong> {new Date(action.dueDate).toLocaleDateString()}</span>
                        )}
                        {action.completedDate && (
                          <span><strong>Completed:</strong> {new Date(action.completedDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {action.status === 'completed' ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      ) : isOverdue ? (
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      ) : (
                        <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {actions.length === 0 && (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No active corrective actions</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Quality metrics are within acceptable limits</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const OverviewView = () => (
    <div className="space-y-6">
      {/* Key Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QualityCard
          title="Overall Quality"
          value={qualityData.overallQuality}
          target={95}
          change={0.5}
          icon={BeakerIcon}
          color="blue"
        />
        <QualityCard
          title="First Pass Yield"
          value={qualityData.firstPassYield}
          target={95}
          change={-0.8}
          icon={CheckCircleIcon}
          color="green"
        />
        <QualityCard
          title="Defect Rate"
          value={qualityData.defectRate}
          format="percentage"
          target={2}
          change={0.3}
          icon={XCircleIcon}
          color="red"
        />
        <QualityCard
          title="Rework Rate"
          value={qualityData.reworkRate}
          format="percentage"
          target={3}
          change={-0.2}
          icon={ExclamationTriangleIcon}
          color="yellow"
        />
        <QualityCard
          title="Scrap Rate"
          value={qualityData.scrapRate}
          format="percentage"
          target={1}
          change={-0.1}
          icon={XCircleIcon}
          color="red"
        />
        <QualityCard
          title="Customer Complaints"
          value={qualityData.customerComplaints}
          format="number"
          target={5}
          change={-1}
          icon={ExclamationTriangleIcon}
          color="orange"
        />
      </div>

      {/* Quality Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Quality Rating</span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {qualityData.overallQuality.toFixed(1)}%
                  </span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    qualityStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                    qualityStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    qualityStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {qualityStatus.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Defects per Million</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round(qualityData.defectRate * 10000)} PPM
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Right First Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {qualityData.firstPassYield.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Waste Rate</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(qualityData.reworkRate + qualityData.scrapRate).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Performance Indicators</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quality Target Achievement</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div
                        className={`h-2 rounded-full ${qualityData.overallQuality >= 95 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min((qualityData.overallQuality / 95) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{((qualityData.overallQuality / 95) * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Defect Reduction</span>
                  <span className={`text-sm font-medium ${qualityData.defectRate <= 2 ? 'text-green-600' : 'text-red-600'}`}>
                    {qualityData.defectRate <= 2 ? 'On Target' : 'Above Target'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* View Selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quality Control Dashboard</h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg">
          {['overview', 'pareto', 'trends', 'actions'].map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-3 py-1 text-sm capitalize rounded-lg transition ${
                selectedView === view
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && <OverviewView />}
      {selectedView === 'pareto' && <ParetoChart categories={qualityData.defectCategories} />}
      {selectedView === 'trends' && <TrendsChart trends={qualityData.qualityTrends} />}
      {selectedView === 'actions' && <CorrectiveActions actions={qualityData.correctionActions} />}
    </div>
  )
}
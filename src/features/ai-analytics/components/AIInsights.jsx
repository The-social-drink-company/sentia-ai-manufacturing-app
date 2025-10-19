import { useState, memo } from 'react'
import {
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChartBarIcon,
  BeakerIcon,
  EyeIcon,
  PlayIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/solid'
import { useAIMetrics } from '../hooks/useAIMetrics'

const AIInsights = memo(function AIInsights({ onInsightClick, onActionClick }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const { data: aiMetrics, loading, error } = useAIMetrics()

  const getSeverityIcon = severity => {
    switch (severity) {
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'low':
        return <LightBulbIcon className="h-5 w-5 text-blue-500" />
      default:
        return <EyeIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeIcon = type => {
    switch (type) {
      case 'anomaly':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'prediction':
        return <ChartBarIcon className="h-4 w-4" />
      case 'optimization':
        return <LightBulbIcon className="h-4 w-4" />
      case 'quality':
        return <BeakerIcon className="h-4 w-4" />
      default:
        return <EyeIcon className="h-4 w-4" />
    }
  }

  const getSeverityColor = severity => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'low':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
    }
  }

  const getConfidenceColor = confidence => {
    if (confidence >= 90) return 'text-green-600 dark:text-green-400'
    if (confidence >= 70) return 'text-blue-600 dark:text-blue-400'
    return 'text-yellow-600 dark:text-yellow-400'
  }

  const filteredInsights =
    aiMetrics?.insights?.filter(insight => {
      const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory
      const severityMatch = selectedSeverity === 'all' || insight.severity === selectedSeverity
      return categoryMatch && severityMatch
    }) || []

  const getTimeAgo = sourceTimestamp => {
    const time = new Date(sourceTimestamp)
    if (Number.isNaN(time.getTime())) {
      return 'Unknown'
    }

    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
          <p>Failed to load AI insights</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <FireIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {aiMetrics?.insights?.filter(i => i.severity === 'high').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Medium Priority</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {aiMetrics?.insights?.filter(i => i.severity === 'medium').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <LightBulbIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Optimizations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {aiMetrics?.insights?.filter(i => i.type === 'optimization').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {aiMetrics?.insights?.length > 0
                  ? Math.round(
                      aiMetrics.insights.reduce((sum, i) => sum + i.confidence, 0) /
                        aiMetrics.insights.length
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="production">Production</option>
              <option value="inventory">Inventory</option>
              <option value="quality">Quality</option>
              <option value="energy">Energy</option>
              <option value="financial">Financial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="ml-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredInsights.length} of {aiMetrics?.insights?.length || 0} insights
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No insights found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or check back later for new insights.
            </p>
          </div>
        ) : (
          filteredInsights.map(insight => (
            <div
              key={insight.id}
              className={`border rounded-lg p-6 ${getSeverityColor(insight.severity)} hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => onInsightClick && onInsightClick(insight)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getSeverityIcon(insight.severity)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {insight.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        {getTypeIcon(insight.type)}
                        <span className="capitalize">{insight.type}</span>
                      </div>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-3 w-3" />
                        <span>{getTimeAgo(insight.timestamp)}</span>
                      </div>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-xs font-medium capitalize px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {insight.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getConfidenceColor(insight.confidence)}`}>
                      {insight.confidence}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">confidence</div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onActionClick && onActionClick(insight)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center text-sm"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Take Action
                  </button>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">{insight.description}</p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Recommended Action:
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">{insight.recommendation}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

export { AIInsights }

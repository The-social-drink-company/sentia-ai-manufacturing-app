import { memo } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/solid'

const QualityMetrics = memo(function QualityMetrics({ data }) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getQualityStatus = percentage => {
    if (percentage >= 99) return { color: 'green', icon: CheckCircleIcon }
    if (percentage >= 95) return { color: 'blue', icon: CheckCircleIcon }
    if (percentage >= 90) return { color: 'yellow', icon: ExclamationTriangleIcon }
    return { color: 'red', icon: XCircleIcon }
  }

  const formatPercentage = value => `${(value || 0).toFixed(1)}%`
  const formatNumber = value => (value || 0).toLocaleString()

  const summary = data.summary || {}

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Quality Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Overall Quality</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatPercentage(summary.overallQuality)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">First Pass Yield</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatPercentage(summary.firstPassYield)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Defect Rate</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {formatPercentage(summary.defectRate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Quality Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Inspected</span>
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(summary.totalInspected)}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Defects</span>
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(summary.totalDefects)}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</span>
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(summary.passRate)}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Rework Rate</span>
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(summary.reworkRate)}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Critical Defects</span>
              <XCircleIcon className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(summary.criticalDefects)}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Major Defects</span>
              <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(summary.majorDefects)}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Minor Defects</span>
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatNumber(summary.minorDefects)}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Scrap Rate</span>
              <XCircleIcon className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(summary.scrapRate)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Inspection Points Status
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Inspection Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Inspected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Defects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Inspection
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.inspectionPoints?.map(point => {
                const qualityStatus = getQualityStatus(point.quality)
                const StatusIcon = qualityStatus.icon

                return (
                  <tr key={point.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {point.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{point.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon
                          className={`h-4 w-4 mr-2 ${
                            qualityStatus.color === 'green'
                              ? 'text-green-500'
                              : qualityStatus.color === 'blue'
                                ? 'text-blue-500'
                                : qualityStatus.color === 'yellow'
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPercentage(point.quality)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatNumber(point.inspected)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatNumber(point.defects)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          point.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {point.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(point.lastInspection).toLocaleTimeString()}
                    </td>
                  </tr>
                )
              }) || (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No inspection points data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})

export { QualityMetrics }

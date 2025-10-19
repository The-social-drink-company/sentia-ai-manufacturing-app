import React from 'react'
import { Download, Maximize2, RefreshCw } from 'lucide-react'

/**
 * ChartCard Component
 *
 * Reusable card wrapper for dashboard charts with:
 * - Header with title and actions
 * - Loading and error states
 * - Export functionality
 * - Expand/fullscreen capability
 * - Refresh action
 *
 * @param {Object} props
 * @param {string} props.title - Chart title
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {React.ReactNode} props.children - Chart content
 * @param {boolean} props.loading - Loading state
 * @param {Error} props.error - Error object if failed to load
 * @param {Function} props.onRefresh - Refresh handler
 * @param {Function} props.onExport - Export handler
 * @param {Function} props.onExpand - Expand/fullscreen handler
 * @param {React.ReactNode} props.actions - Custom action buttons
 * @param {string} props.className - Additional CSS classes
 */
function ChartCard({
  title,
  subtitle,
  children,
  loading = false,
  error = null,
  onRefresh,
  onExport,
  onExpand,
  actions,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-4">
            {/* Custom actions */}
            {actions}

            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Refresh data"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Export button */}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Export data"
                disabled={loading}
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Expand button */}
            {onExpand && (
              <button
                onClick={onExpand}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Expand chart"
                disabled={loading}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading state */}
        {loading && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading chart data...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <div className="text-red-500 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Failed to load chart</p>
              <p className="text-sm text-gray-600 mb-4">
                {error.message || 'An unexpected error occurred'}
              </p>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chart content */}
        {!loading && !error && children}
      </div>
    </div>
  )
}

export default ChartCard

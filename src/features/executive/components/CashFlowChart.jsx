export default function CashFlowChart({ data, period }) {
  if (!data) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cash Flow Trends
      </h3>

      {/* Placeholder for Chart.js implementation */}
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Cash Flow Chart
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Chart.js integration pending
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Net Cash Flow</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            +${(data.net?.reduce((a, b) => a + b, 0) / data.net?.length || 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Period</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Last 12 Months
          </p>
        </div>
      </div>
    </div>
  )
}
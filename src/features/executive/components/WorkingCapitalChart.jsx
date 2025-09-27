export default function WorkingCapitalChart({ data, period }) {
  if (!data) return null

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Working Capital Components
      </h3>

      {/* Working Capital Bars */}
      <div className="space-y-4">
        {data.labels?.map((label, __index) => {
          const current = data.current?.[index] || 0
          const optimal = data.optimal?.[index] || 0
          const isNegative = current < 0
          const maxValue = Math.max(...(data.current || []).map(Math.abs))

          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </span>
                <span className={`text-sm font-semibold ${
                  isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {isNegative ? '-' : '+'}{formatCurrency(current)}
                </span>
              </div>
              <div className="relative">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${
                      isNegative
                        ? 'bg-red-500 dark:bg-red-600'
                        : 'bg-blue-500 dark:bg-blue-600'
                    }`}
                    style={{
                      width: `${(Math.abs(current) / maxValue) * 100}%`
                    }}
                  />
                </div>
                {optimal !== 0 && (
                  <div
                    className="absolute top-0 h-6 w-0.5 bg-green-600 dark:bg-green-400"
                    style={{
                      left: `${(Math.abs(optimal) / maxValue) * 100}%`
                    }}
                  >
                    <span className="absolute -top-5 -left-8 text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                      Target
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Working Capital</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(data.current?.[3] || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Optimization Potential</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency((data.current?.[3] || 0) - (data.optimal?.[3] || 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
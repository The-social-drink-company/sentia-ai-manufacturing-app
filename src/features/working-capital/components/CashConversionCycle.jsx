import { Line } from 'recharts'
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function CashConversionCycle({ dso, dio, dpo, historical }) {
  const currentCCC = dso + dio - dpo

  // Generate trend data if not provided
  const trendData = historical || [
    { month: 'Jan', dso: 45, dio: 30, dpo: 35, ccc: 40 },
    { month: 'Feb', dso: 43, dio: 32, dpo: 36, ccc: 39 },
    { month: 'Mar', dso: 44, dio: 31, dpo: 37, ccc: 38 },
    { month: 'Apr', dso: 42, dio: 29, dpo: 35, ccc: 36 },
    { month: 'May', dso: 41, dio: 28, dpo: 36, ccc: 33 },
    { month: 'Current', dso, dio, dpo, ccc: currentCCC }
  ]

  const getMetricStatus = (value, type) => {
    const thresholds = {
      dso: { good: 30, warning: 45 },
      dio: { good: 30, warning: 45 },
      dpo: { good: 40, warning: 30 }, // Higher is better for DPO
      ccc: { good: 30, warning: 45 }
    }

    const threshold = thresholds[type]

    if (type === 'dpo') {
      // For DPO, higher is better
      if (value >= threshold.good) return 'text-green-600 dark:text-green-400'
      if (value >= threshold.warning) return 'text-yellow-600 dark:text-yellow-400'
      return 'text-red-600 dark:text-red-400'
    } else {
      // For DSO, DIO, CCC, lower is better
      if (value <= threshold.good) return 'text-green-600 dark:text-green-400'
      if (value <= threshold.warning) return 'text-yellow-600 dark:text-yellow-400'
      return 'text-red-600 dark:text-red-400'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cash Conversion Cycle Analysis
      </h3>

      {/* Current Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">DSO</p>
          <p className={`text-2xl font-bold ${getMetricStatus(dso, 'dso')}`}>
            {dso}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">days</p>
        </div>
        <div className="text-center flex items-center justify-center">
          <span className="text-2xl text-gray-400">+</span>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">DIO</p>
          <p className={`text-2xl font-bold ${getMetricStatus(dio, 'dio')}`}>
            {dio}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">days</p>
        </div>
        <div className="text-center flex items-center justify-center">
          <span className="text-2xl text-gray-400">-</span>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">DPO</p>
          <p className={`text-2xl font-bold ${getMetricStatus(dpo, 'dpo')}`}>
            {dpo}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">days</p>
        </div>
        <div className="text-center flex items-center justify-center">
          <span className="text-2xl text-gray-400">=</span>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">CCC</p>
          <p className={`text-2xl font-bold ${getMetricStatus(currentCCC, 'ccc')}`}>
            {currentCCC}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">days</p>
        </div>
      </div>

      {/* Trend Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
            formatter={(value) => `${value} days`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="ccc"
            name="CCC"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="dso"
            name="DSO"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#3b82f6', r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="dio"
            name="DIO"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10b981', r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="dpo"
            name="DPO"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#ef4444', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Insights */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-medium">Optimization Opportunity:</span> Reducing DSO by 5 days would improve cash flow by approximately ${Math.round((dso * 0.1 * 50000))}
        </p>
      </div>
    </div>
  )
}
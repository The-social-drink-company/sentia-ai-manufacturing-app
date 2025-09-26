import { Bar } from 'recharts'
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AgingChart({ receivables, payables, title }) {
  // Combine AR and AP aging data
  const agingData = [
    {
      period: 'Current',
      receivables: receivables?.current || 0,
      payables: payables?.current || 0
    },
    {
      period: '1-30 days',
      receivables: receivables?.days30 || 0,
      payables: payables?.days30 || 0
    },
    {
      period: '31-60 days',
      receivables: receivables?.days60 || 0,
      payables: payables?.days60 || 0
    },
    {
      period: '61-90 days',
      receivables: receivables?.days90 || 0,
      payables: payables?.days90 || 0
    },
    {
      period: '90+ days',
      receivables: receivables?.days90plus || 0,
      payables: payables?.days90plus || 0
    }
  ]

  const formatCurrency = (value) => {
    return `$${(value / 1000).toFixed(0)}K`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title || 'Aging Analysis'}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={agingData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar
            dataKey="receivables"
            name="Accounts Receivable"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="payables"
            name="Accounts Payable"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Receivables</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            ${((receivables?.total || 0) / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Payables</p>
          <p className="text-lg font-semibold text-red-600 dark:text-red-400">
            ${((payables?.total || 0) / 1000).toFixed(0)}K
          </p>
        </div>
      </div>
    </div>
  )
}
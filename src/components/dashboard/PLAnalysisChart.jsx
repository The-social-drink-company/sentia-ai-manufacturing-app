import { memo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const PLAnalysisChart = ({ data }) => {
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{`Month: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${
                entry.name === 'Gross Margin %'
                  ? `${entry.value.toFixed(1)}%`
                  : `£${entry.value.toLocaleString()}K`
              }`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Format Y-axis labels
  const formatLeftYAxis = value => `£${value}K`
  const formatRightYAxis = value => `${value}%`

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />

        {/* Left Y-Axis for amounts */}
        <YAxis
          yAxisId="left"
          orientation="left"
          tickFormatter={formatLeftYAxis}
          axisLine={false}
          tickLine={false}
          className="text-xs text-gray-500 dark:text-gray-400"
        />

        {/* Right Y-Axis for percentages */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={formatRightYAxis}
          axisLine={false}
          tickLine={false}
          className="text-xs text-gray-500 dark:text-gray-400"
        />

        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          className="text-xs text-gray-500 dark:text-gray-400"
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend
          wrapperStyle={{
            paddingTop: '20px',
            fontSize: '12px',
          }}
        />

        {/* Revenue Line */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          stroke="#2563eb"
          strokeWidth={3}
          dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
          name="Revenue (£K)"
          connectNulls={false}
        />

        {/* Gross Profit Line */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="grossProfit"
          stroke="#16a34a"
          strokeWidth={3}
          dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
          name="Gross Profit (£K)"
          connectNulls={false}
        />

        {/* EBITDA Line */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="ebitda"
          stroke="#ea580c"
          strokeWidth={3}
          dot={{ fill: '#ea580c', strokeWidth: 2, r: 4 }}
          name="EBITDA (£K)"
          connectNulls={false}
        />

        {/* Gross Margin % Line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="grossMarginPercent"
          stroke="#9333ea"
          strokeWidth={3}
          dot={{ fill: '#9333ea', strokeWidth: 2, r: 4 }}
          name="Gross Margin %"
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default memo(PLAnalysisChart)

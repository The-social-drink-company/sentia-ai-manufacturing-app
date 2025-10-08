import { memo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts'

const ProductSalesChart = ({ data }) => {
  // Product-specific colors
  const getProductColor = (productName) => {
    switch (productName) {
      case 'GABA Red':
        return '#ef4444'
      case 'GABA Black':
        return '#374151'
      case 'GABA Gold':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            Revenue: ${payload[0].value.toLocaleString()}
          </p>
          {data.units && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Units Sold: {data.units.toLocaleString()}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-600" />
        <XAxis 
          dataKey="product" 
          tickLine={false} 
          axisLine={false}
          className="text-xs text-gray-500 dark:text-gray-400"
        />
        <YAxis 
          tickFormatter={(value) => `$${Math.round(value / 1000000)}M`}
          axisLine={false}
          tickLine={false}
          className="text-xs text-gray-500 dark:text-gray-400"
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="revenue" 
          radius={[6, 6, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getProductColor(entry.product)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default memo(ProductSalesChart)
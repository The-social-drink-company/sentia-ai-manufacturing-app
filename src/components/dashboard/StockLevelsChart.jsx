import { memo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts'

const StockLevelsChart = ({ data }) => {
  // Product-specific colors
  const getProductColor = (productName, status) => {
    const baseColors = {
      'GABA Red': '#ef4444',
      'GABA Black': '#374151',
      'GABA Gold': '#f59e0b'
    }
    
    // Adjust opacity based on stock status
    const opacity = status === 'low-stock' ? '0.7' : 
                   status === 'out-of-stock' ? '0.4' : '1'
    
    return baseColors[productName] || '#6b7280'
  }

  // Get status color for bars
  const getStatusColor = (currentStock, reorderLevel, productName) => {
    if (currentStock === 0) return '#dc2626' // Red for out of stock
    if (currentStock <= reorderLevel) return '#f59e0b' // Yellow for low stock
    return getProductColor(productName, 'in-stock') // Product color for normal stock
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const stockPercentage = ((data.currentStock / data.maxStock) * 100).toFixed(1)
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-blue-600 dark:text-blue-400">Current Stock:</span>{' '}
              <span className="font-medium">{data.currentStock.toLocaleString()} {data.unit}</span>
            </p>
            <p className="text-sm">
              <span className="text-orange-600 dark:text-orange-400">Reorder Level:</span>{' '}
              <span className="font-medium">{data.reorderLevel.toLocaleString()} {data.unit}</span>
            </p>
            <p className="text-sm">
              <span className="text-purple-600 dark:text-purple-400">Max Stock:</span>{' '}
              <span className="font-medium">{data.maxStock.toLocaleString()} {data.unit}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Stock Level:</span>{' '}
              <span className={`font-medium ${
                data.currentStock <= data.reorderLevel ? 'text-red-600' :
                data.currentStock <= data.reorderLevel * 1.5 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {stockPercentage}%
              </span>
            </p>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className={`text-xs font-medium ${
                data.currentStock === 0 ? 'text-red-600' :
                data.currentStock <= data.reorderLevel ? 'text-yellow-600' : 'text-green-600'
              }`}>
                Status: {
                  data.currentStock === 0 ? 'OUT OF STOCK' :
                  data.currentStock <= data.reorderLevel ? 'LOW STOCK - REORDER NEEDED' : 'IN STOCK'
                }
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Format Y-axis labels
  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p>No stock data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="product" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tickFormatter={formatYAxis}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Current Stock Bars */}
        <Bar dataKey="currentStock" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getStatusColor(entry.currentStock, entry.reorderLevel, entry.product)}
            />
          ))}
        </Bar>

        {/* Reference lines for reorder levels */}
        {data.map((item, index) => (
          <ReferenceLine
            key={`reorder-${index}`}
            y={item.reorderLevel}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{
              value: `Reorder: ${item.reorderLevel}`,
              position: 'topRight',
              fontSize: 10,
              fill: '#f59e0b'
            }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export default memo(StockLevelsChart)
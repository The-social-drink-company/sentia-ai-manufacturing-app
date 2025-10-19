import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartCard from '@/components/charts/ChartCard'
import { chartColors, chartTheme } from '@/utils/chartColors'

// Real Sentia inventory data
const data = [
  {
    product: 'GABA Red',
    currentStock: 45,
    reorderLevel: 25,
  },
  {
    product: 'GABA Black',
    currentStock: 30,
    reorderLevel: 15,
  },
  {
    product: 'GABA Gold',
    currentStock: 12,
    reorderLevel: 8,
  },
]

/**
 * StockLevelsChart - Grouped bar chart comparing current stock vs reorder levels
 * Helps identify products approaching reorder thresholds
 */
const StockLevelsChartEnhanced = () => {
  return (
    <ChartCard
      title="Stock Levels by Product"
      subtitle="Current inventory vs. reorder thresholds"
      icon="📦"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray={chartTheme.gridStrokeDasharray}
            stroke={chartTheme.gridStroke}
          />
          <XAxis
            dataKey="product"
            tick={chartTheme.axisTick}
            axisLine={{ stroke: chartTheme.axisStroke }}
          />
          <YAxis
            label={{
              value: 'Units (K)',
              angle: -90,
              position: 'insideLeft',
              fill: chartColors.axis,
              style: { textAnchor: 'middle' },
            }}
            tick={chartTheme.axisTick}
            axisLine={{ stroke: chartTheme.axisStroke }}
          />
          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            formatter={(value, name) => [`${value}K units`, name]}
          />
          <Legend
            wrapperStyle={chartTheme.legend.wrapperStyle}
            iconType={chartTheme.legend.iconType}
          />
          <Bar
            dataKey="currentStock"
            fill={chartColors.currentStock}
            name="Current Stock"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="reorderLevel"
            fill={chartColors.reorderLevel}
            name="Reorder Level"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default StockLevelsChartEnhanced

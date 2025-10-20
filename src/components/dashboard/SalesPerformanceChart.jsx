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

// Real tenant Spirits product data
const data = [
  {
    product: 'GABA Red',
    unitsSold: 200,
    revenue: 5.5,
  },
  {
    product: 'GABA Black',
    unitsSold: 110,
    revenue: 3.2,
  },
  {
    product: 'GABA Gold',
    unitsSold: 45,
    revenue: 1.8,
  },
]

/**
 * SalesPerformanceChart - Dual-axis bar chart comparing units sold vs revenue
 * Shows sales performance across tenant product lines
 */
const SalesPerformanceChart = () => {
  return (
    <ChartCard
      title="Sales Performance by Product"
      subtitle="Units sold and revenue comparison across product lines"
      icon="📊"
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
            yAxisId="left"
            label={{
              value: 'Units Sold (K)',
              angle: -90,
              position: 'insideLeft',
              fill: chartColors.axis,
              style: { textAnchor: 'middle' },
            }}
            tick={chartTheme.axisTick}
            axisLine={{ stroke: chartTheme.axisStroke }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: 'Revenue (£M)',
              angle: 90,
              position: 'insideRight',
              fill: chartColors.axis,
              style: { textAnchor: 'middle' },
            }}
            tick={chartTheme.axisTick}
            axisLine={{ stroke: chartTheme.axisStroke }}
          />
          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            formatter={(value, name) => {
              if (name === 'Units Sold (K)') return [`${value}K units`, name]
              if (name === 'Revenue (£M)') return [`£${value}M`, name]
              return [value, name]
            }}
          />
          <Legend
            wrapperStyle={chartTheme.legend.wrapperStyle}
            iconType={chartTheme.legend.iconType}
          />
          <Bar
            yAxisId="left"
            dataKey="unitsSold"
            fill={chartColors.unitsSold}
            name="Units Sold (K)"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="revenue"
            fill={chartColors.revenueBar}
            name="Revenue (£M)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default SalesPerformanceChart

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import ChartCard from '@/components/charts/ChartCard'
import { chartColors, chartTheme } from '@/utils/chartColors'

// Real Sentia financial data over 6 months
const data = [
  {
    month: 'Jan',
    revenue: 800,
    grossProfit: 550,
    ebitda: 250,
    grossMargin: 67.5,
  },
  {
    month: 'Mar',
    revenue: 900,
    grossProfit: 620,
    ebitda: 280,
    grossMargin: 67.52,
  },
  {
    month: 'May',
    revenue: 1100,
    grossProfit: 750,
    ebitda: 320,
    grossMargin: 67.54,
  },
  {
    month: 'Jul',
    revenue: 1000,
    grossProfit: 680,
    ebitda: 290,
    grossMargin: 67.53,
  },
  {
    month: 'Sep',
    revenue: 1300,
    grossProfit: 880,
    ebitda: 350,
    grossMargin: 67.55,
  },
  {
    month: 'Nov',
    revenue: 1400,
    grossProfit: 950,
    ebitda: 380,
    grossMargin: 67.59,
  },
]

/**
 * PLAnalysisChart - Multi-line chart with dual Y-axis
 * Shows financial performance trends: revenue, gross profit, EBITDA, and margin
 */
const PLAnalysisChartEnhanced = () => {
  return (
    <ChartCard title="P&L Analysis" subtitle="Financial performance trends over time" icon="💰">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 60, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray={chartTheme.gridStrokeDasharray}
            stroke={chartTheme.gridStroke}
          />
          <XAxis
            dataKey="month"
            tick={chartTheme.axisTick}
            axisLine={{ stroke: chartTheme.axisStroke }}
          />
          <YAxis
            yAxisId="left"
            label={{
              value: 'Amount (£K)',
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
              value: 'Margin %',
              angle: 90,
              position: 'insideRight',
              fill: chartColors.axis,
              style: { textAnchor: 'middle' },
            }}
            tick={chartTheme.axisTick}
            axisLine={{ stroke: chartTheme.axisStroke }}
            domain={[67.4, 67.7]}
          />
          <Tooltip
            contentStyle={chartTheme.tooltip.contentStyle}
            labelStyle={chartTheme.tooltip.labelStyle}
            formatter={(value, name) => {
              if (name.includes('%')) return [`${value.toFixed(2)}%`, name]
              return [`£${value}K`, name]
            }}
          />
          <Legend wrapperStyle={chartTheme.legend.wrapperStyle} iconType="line" />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke={chartColors.revenue}
            strokeWidth={2}
            name="Revenue"
            dot={{ r: 4, fill: chartColors.revenue }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="grossProfit"
            stroke={chartColors.grossProfit}
            strokeWidth={2}
            name="Gross Profit"
            dot={{ r: 4, fill: chartColors.grossProfit }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ebitda"
            stroke={chartColors.ebitda}
            strokeWidth={2}
            name="EBITDA"
            dot={{ r: 4, fill: chartColors.ebitda }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="grossMargin"
            stroke={chartColors.grossMargin}
            strokeWidth={2}
            name="Gross Margin %"
            dot={{ r: 4, fill: chartColors.grossMargin }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default PLAnalysisChartEnhanced

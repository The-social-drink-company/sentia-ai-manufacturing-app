import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import ChartCard from '@/components/charts/ChartCard'
import { chartColors } from '@/utils/chartColors'

// Real Sentia market distribution data
const data = [
  { name: 'UK Market', value: 65 },
  { name: 'USA Market', value: 35 },
]

const COLORS = [chartColors.ukMarket, chartColors.usaMarket]

/**
 * MarketDistributionChart - Pie chart showing revenue distribution by market
 * Visualizes geographic market performance
 */
const MarketDistributionChart = () => {
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <ChartCard
      title="Market Distribution"
      subtitle="Revenue distribution across geographic markets"
      icon="🌍"
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: chartColors.tooltip.background,
              border: `1px solid ${chartColors.tooltip.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value, name) => [`${value}%`, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="square"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default MarketDistributionChart

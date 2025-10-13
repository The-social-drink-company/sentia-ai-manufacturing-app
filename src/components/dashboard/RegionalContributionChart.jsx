import { memo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'

const RegionalContributionChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="region" tickLine={false} axisLine={false} />
      <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
      <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
      <Bar dataKey="ebitda" fill="#16a34a" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
)

export default memo(RegionalContributionChart)

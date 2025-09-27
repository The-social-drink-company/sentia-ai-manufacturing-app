import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui'

const generateMockData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((month, index) => ({
    month,
    cashIn: Math.floor(Math.random() * 50000) + 100000,
    cashOut: Math.floor(Math.random() * 40000) + 80000,
    netCash: Math.floor(Math.random() * 20000) - 10000,
    forecast: index > 8 ? Math.floor(Math.random() * 30000) + 90000 : null
  }))
}

export function CashFlowChart({ data, height = 400, showForecast = true }) {
  const chartData = useMemo(() {
    return data || generateMockData()
  }, [data])

  const formatCurrency = (_value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="cashIn"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorIn)"
              name="Cash In"
            />
            <Area
              type="monotone"
              dataKey="cashOut"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorOut)"
              name="Cash Out"
            />
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#3b82f6"
                strokeDasharray="5 5"
                name="Forecast"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
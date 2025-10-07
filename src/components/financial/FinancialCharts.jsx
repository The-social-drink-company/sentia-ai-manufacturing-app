import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  Area,
  AreaChart
} from 'recharts'
import { useState } from 'react'
import { cn } from '@/utils/cn'

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value)
}

const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-elevated border border-light rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-primary mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-secondary">
              {entry.name}: {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const TimeRangeSelector = ({ selectedRange, onRangeChange, className }) => {
  const ranges = [
    { key: '3m', label: '3 Months' },
    { key: '6m', label: '6 Months' },
    { key: '1y', label: '1 Year' },
    { key: '2y', label: '2 Years' },
    { key: 'all', label: 'All Time' }
  ]

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {ranges.map((range) => (
        <button
          key={range.key}
          onClick={() => onRangeChange(range.key)}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors",
            selectedRange === range.key
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

const RevenueChart = ({ data, height = 320, selectedRange, onRangeChange }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Revenue, Profit & EBITDA Trends
            <TimeRangeSelector 
              selectedRange={selectedRange}
              onRangeChange={onRangeChange}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Revenue, Profit & EBITDA Trends
          <TimeRangeSelector 
            selectedRange={selectedRange}
            onRangeChange={onRangeChange}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="period" 
              tickLine={false} 
              axisLine={false}
              className="text-xs text-muted-foreground"
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tickLine={false}
              axisLine={false}
              className="text-xs text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#2563eb" 
              strokeWidth={2}
              name="Revenue"
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="grossProfit" 
              stroke="#059669" 
              strokeWidth={2}
              name="Gross Profit"
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="ebitda" 
              stroke="#dc2626" 
              strokeWidth={2}
              name="EBITDA"
              dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

const ProfitMarginChart = ({ data, height = 320, selectedRange, onRangeChange }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Profit Margin Over Time
            <TimeRangeSelector 
              selectedRange={selectedRange}
              onRangeChange={onRangeChange}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profit Margin Over Time
          <TimeRangeSelector 
            selectedRange={selectedRange}
            onRangeChange={onRangeChange}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="profitMarginGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="period" 
              tickLine={false} 
              axisLine={false}
              className="text-xs text-muted-foreground"
            />
            <YAxis 
              tickFormatter={formatPercentage}
              tickLine={false}
              axisLine={false}
              className="text-xs text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip formatter={formatPercentage} />} />
            <Area
              type="monotone"
              dataKey="profitMargin"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#profitMarginGradient)"
              strokeWidth={2}
              name="Profit Margin"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

const FinancialCharts = ({ 
  revenueData, 
  profitMarginData, 
  loading = false, 
  error = null,
  className 
}) => {
  const [revenueRange, setRevenueRange] = useState('1y')
  const [marginRange, setMarginRange] = useState('1y')

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-red-600">Error loading financial charts: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <RevenueChart 
        data={revenueData}
        selectedRange={revenueRange}
        onRangeChange={setRevenueRange}
      />
      <ProfitMarginChart 
        data={profitMarginData}
        selectedRange={marginRange}
        onRangeChange={setMarginRange}
      />
    </div>
  )
}

export default FinancialCharts
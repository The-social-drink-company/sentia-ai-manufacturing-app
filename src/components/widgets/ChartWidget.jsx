import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

const ChartWidget = ({ 
  title = 'Trend', 
  data = [], 
  loading = false,
  xDataKey = 'label',
  yDataKey = 'value',
  strokeColor = '#2563eb',
  className = ''
}) => {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <div className="animate-pulse h-full w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No data available</p>
            <p className="text-xs text-muted-foreground mt-1">Check API configuration</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xDataKey} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => value.toString()} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey={yDataKey} 
              stroke={strokeColor} 
              strokeWidth={2} 
              dot 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default ChartWidget

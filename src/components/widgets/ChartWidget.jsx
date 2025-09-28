import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

const SAMPLE_SERIES = [
  { label: 'Jan', value: 820 },
  { label: 'Feb', value: 860 },
  { label: 'Mar', value: 905 },
  { label: 'Apr', value: 948 },
  { label: 'May', value: 972 }
]

const ChartWidget = () => (
  <Card>
    <CardHeader>
      <CardTitle>Trend</CardTitle>
    </CardHeader>
    <CardContent className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={SAMPLE_SERIES}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value) => value.toString()} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

export default ChartWidget

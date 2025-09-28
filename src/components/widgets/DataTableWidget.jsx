import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SAMPLE_ROWS = [
  { name: 'SKU-145', revenue: '$182K', margin: '38%', risk: 'Low' },
  { name: 'SKU-278', revenue: '$156K', margin: '42%', risk: 'Medium' },
  { name: 'SKU-412', revenue: '$211K', margin: '35%', risk: 'Low' }
]

const DataTableWidget = () => (
  <Card>
    <CardHeader>
      <CardTitle>Key customers</CardTitle>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Customer / SKU</th>
            <th className="px-4 py-2 font-medium">Revenue</th>
            <th className="px-4 py-2 font-medium">Margin</th>
            <th className="px-4 py-2 font-medium">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {SAMPLE_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
              <td className="px-4 py-3">{row.revenue}</td>
              <td className="px-4 py-3">{row.margin}</td>
              <td className="px-4 py-3">{row.risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
)

export default DataTableWidget

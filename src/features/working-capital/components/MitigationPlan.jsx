import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const categoryLabels = {
  quickWins: 'Quick wins',
  liquidity: 'Liquidity protection',
  structural: 'Structural improvements',
}

export default function MitigationPlan({ plan }) {
  const recommendations = plan?.recommendations || []
  const categories = plan?.categories || {}

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Mitigation Plan
          </CardTitle>
          <Badge variant="outline">Top {recommendations.length || 0} actions</Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Targeted actions prioritised by working-capital impact. Quick wins deliver immediate relief while structural changes harden the operating model.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {recommendations.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No mitigation actions were generated. Once baseline metrics signal pressure we will surface recommended actions automatically.
          </p>
        )}

        {recommendations.map(item => (
          <div key={item.id} className="rounded-lg border border-border dark:border-gray-700 p-4 bg-muted/40 dark:bg-gray-900/50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
              <Badge variant="secondary">{item.owner || 'Unassigned'}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700 dark:text-gray-300 mt-3">
              <div>
                <span className="font-medium">Impact score:</span> {item.impact?.score?.toFixed?.(2) ?? '--'}
              </div>
              <div>
                <span className="font-medium">Expected delta:</span> {formatDelta(item.impact?.expectedDelta)}
              </div>
              <div>
                <span className="font-medium">Effort:</span> {item.effort || 'n/a'}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Timeframe: {item.timeframe || 'n/a'}</div>
          </div>
        ))}

        <div className="space-y-4">
          {Object.entries(categories).map(([category, items]) => (
            <CategoryCard key={category} title={categoryLabels[category] || category} items={items} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryCard({ title, items }) {
  const list = Array.isArray(items) ? items : []
  if (!list.length) return null

  return (
    <div className="border border-dashed border-border dark:border-gray-700 rounded-lg p-3">
      <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h5>
      <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {list.map(item => (
          <li key={item.id || item.title || item}>{item.title || item.description || item}</li>
        ))}
      </ul>
    </div>
  )
}

const formatDelta = value => {
  if (value === null || value === undefined) return '--'
  const sign = value > 0 ? '+' : ''
  const rounded = Number(value.toFixed ? value.toFixed(2) : value)
  return `${sign}${rounded.toLocaleString()}`
}


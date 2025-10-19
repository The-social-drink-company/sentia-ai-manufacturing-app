import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const MetricRow = ({ label, baseline, scenario }) => {
  if (!baseline && !scenario) {
    return null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className="text-gray-900 dark:text-white">{formatValue(baseline)}</span>
      <span className="text-gray-900 dark:text-white">{formatValue(scenario?.current)}</span>
      <DeltaCell delta={scenario?.delta} percent={scenario?.deltaPercent} />
    </div>
  )
}

const DeltaCell = ({ delta, percent }) => {
  if (delta === null || delta === undefined) {
    return <span className="text-gray-500 dark:text-gray-400">--</span>
  }

  const positive =
    delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
  const sign = delta > 0 ? '+' : ''

  return (
    <span className={`${positive} font-medium`}>
      {`${sign}${delta.toFixed(2)}${percent != null ? ` (${sign}${percent.toFixed(1)}%)` : ''}`}
    </span>
  )
}

const formatValue = value => {
  if (value === null || value === undefined) return '--'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2)
  }
  return value
}

const defaultAdjustments = {
  revenuePct: 0,
  cogsPct: 0,
  dsoDelta: 0,
  burnPct: 0,
}

export default function ScenarioPlanner({ baseline, scenarios = [], onRunScenario, isRunning }) {
  const [adjustments, setAdjustments] = useState(defaultAdjustments)

  const handleInputChange = event => {
    const { name, value } = event.target
    setAdjustments(current => ({
      ...current,
      [name]: Number(value),
    }))
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (!onRunScenario) return

    onRunScenario({
      adjustments: {
        revenuePct: adjustments.revenuePct / 100,
        cogsPct: adjustments.cogsPct / 100,
        dsoDelta: adjustments.dsoDelta,
        burnPct: adjustments.burnPct / 100,
      },
    })
  }

  const supportingScenarios = scenarios.filter(s => s.key !== 'baseline')

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Scenario Planning
          </CardTitle>
          <Badge variant="secondary">Live metrics</Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Compare upside, base, and downside scenarios. Adjust the sliders to test new assumptions
          and see the resulting working-capital profile instantly.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {baseline?.metrics && supportingScenarios.length > 0 && (
          <div className="space-y-4">
            {supportingScenarios.map(scenario => (
              <div
                key={scenario.key}
                className="rounded-lg border border-border dark:border-gray-700 p-4 bg-muted/40 dark:bg-gray-900/60"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                      {scenario.label}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {Object.entries(scenario.assumptions || {})
                        .filter(([, value]) => value)
                        .map(
                          ([key, value]) =>
                            `${key}: ${typeof value === 'number' ? value.toString() : value}`
                        )
                        .join(' • ') || 'No adjustments'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      scenario.metrics?.ccc?.status === 'excellent' ? 'secondary' : 'outline'
                    }
                  >
                    CCC {scenario.metrics?.ccc?.ccc?.toFixed?.(2) ?? '--'} days
                  </Badge>
                </div>

                <div className="space-y-2">
                  <MetricRow
                    label="Cash Conversion Cycle"
                    baseline={baseline.metrics.ccc.ccc}
                    scenario={scenario.impact?.ccc?.ccc}
                  />
                  <MetricRow
                    label="Days Sales Outstanding"
                    baseline={baseline.metrics.ccc.dso}
                    scenario={scenario.impact?.ccc?.dso}
                  />
                  <MetricRow
                    label="Cash Runway (months)"
                    baseline={baseline.metrics.runway.runwayMonths}
                    scenario={scenario.impact?.runway?.runwayMonths}
                  />
                  <MetricRow
                    label="Cash Balance (£)"
                    baseline={baseline.metrics.runway.cashBalance}
                    scenario={scenario.impact?.runway?.cashBalance}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {onRunScenario && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ScenarioInput
                label="Revenue change (%)"
                name="revenuePct"
                value={adjustments.revenuePct}
                onChange={handleInputChange}
                step="1"
              />
              <ScenarioInput
                label="COGS change (%)"
                name="cogsPct"
                value={adjustments.cogsPct}
                onChange={handleInputChange}
                step="1"
              />
              <ScenarioInput
                label="DSO shift (days)"
                name="dsoDelta"
                value={adjustments.dsoDelta}
                onChange={handleInputChange}
                step="1"
              />
              <ScenarioInput
                label="Burn rate change (%)"
                name="burnPct"
                value={adjustments.burnPct}
                onChange={handleInputChange}
                step="1"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isRunning}
              >
                {isRunning ? 'Running scenario…' : 'Run custom scenario'}
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function ScenarioInput({ label, name, value, onChange, step }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        step={step}
        onChange={onChange}
        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  )
}

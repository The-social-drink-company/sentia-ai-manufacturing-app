import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const impactOptions = [
  { label: 'Low impact', value: 'low' },
  { label: 'Medium impact', value: 'medium' },
  { label: 'High impact', value: 'high' },
]

export default function ApprovalInsights({ onEvaluate, evaluation, isLoading }) {
  const [form, setForm] = useState({
    amount: 5000,
    impact: 'medium',
    description: '',
    expectedBenefit: '',
  })

  const handleChange = event => {
    const { name, value } = event.target
    setForm(current => ({
      ...current,
      [name]: name === 'amount' ? Number(value) : value,
    }))
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (!onEvaluate) return

    onEvaluate({
      request: {
        amount: Number(form.amount) || 0,
        impact: form.impact,
        description: form.description,
        expectedBenefit: form.expectedBenefit,
      },
    })
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Approval Insights
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Benchmark requests against the auto-approval matrix. Results highlight approver routing,
          SLA, and required documentation.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Requested amount (£)
            </span>
            <input
              name="amount"
              type="number"
              min={0}
              step={100}
              value={form.amount}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Business impact
            </span>
            <select
              name="impact"
              value={form.impact}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {impactOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</span>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Extend payment terms for critical supplier"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected benefit
            </span>
            <input
              name="expectedBenefit"
              value={form.expectedBenefit}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Improve CCC by 6 days"
            />
          </label>

          <div className="md:col-span-2 flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? 'Evaluating…' : 'Evaluate approval path'}
            </button>
          </div>
        </form>

        {evaluation && (
          <div className="rounded-lg border border-border dark:border-gray-700 bg-muted/30 dark:bg-gray-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Decision</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {evaluation.decision.replace('_', ' ')}
                </p>
              </div>
              <Badge variant={evaluation.risk?.category === 'high' ? 'destructive' : 'outline'}>
                Risk: {evaluation.risk?.category ?? 'unknown'}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{evaluation.rationale}</div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Approver routing
              </h4>
              <ul className="mt-1 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {(evaluation.approvers || []).length ? (
                  evaluation.approvers.map(email => <li key={email}>{email}</li>)
                ) : (
                  <li>Auto-approved</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Checklist</h4>
              <ul className="mt-1 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {(evaluation.checklist || []).map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              SLA: {evaluation.slaHours ?? 'n/a'} hours
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

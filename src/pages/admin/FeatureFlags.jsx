import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getFeatureFlags,
  toggleFeatureFlag,
  getFeatureFlagHistory,
} from '@/services/api/adminApi'
import {
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShieldAlert,
  Database,
  RefreshCw,
  Activity,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const MFA_MESSAGE = 'Enter the MFA code to authorise this change.'
const ENVIRONMENTS = ['development', 'test', 'production']

const normalizeFlags = payload => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.flags)) return payload.flags
  if (Array.isArray(payload.data)) return payload.data
  return []
}

const normalizeHistory = payload => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.history)) return payload.history
  if (Array.isArray(payload.data)) return payload.data
  return []
}

const EnvironmentToggle = ({ flag, environment, onToggle, disabled }) => {
  const state = flag.environments?.[environment] || flag.status?.[environment] || {}
  const enabled = Boolean(state.enabled ?? state)
  const pending = Boolean(state.pending)
  const Icon = enabled ? ToggleRight : ToggleLeft
  const tone = enabled ? 'text-green-600' : 'text-gray-400'

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => onToggle(environment, !enabled)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
        enabled ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      } ${pending ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <Icon className={`h-4 w-4 ${tone}`} />
      <span className="capitalize">{environment}</span>
      {pending && <span className="text-xs text-amber-600">Awaiting approval</span>}
    </button>
  )
}

const HistoryList = ({ entries }) => {
  if (!entries || entries.length === 0) {
    return <p className="text-xs text-gray-500">No recent activity recorded.</p>
  }

  return (
    <ul className="space-y-2 text-xs text-gray-600">
      {entries.slice(0, 4).map(item => (
        <li key={item.id || item.timestamp} className="rounded border border-gray-100 bg-gray-50 p-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>{item.environment || 'unknown env'}</span>
            <span>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'unknown time'}</span>
          </div>
          <p>
            {(item.actor || item.performedBy || 'System')} {(item.action || item.event || 'updated flag')}
          </p>
        </li>
      ))}
    </ul>
  )
}

const FeatureFlagCard = ({ flag, history, onToggle, loading }) => {
  const Icon = flag.impact === 'high' ? ShieldAlert : ShieldCheck
  const tone = flag.impact === 'high' ? 'text-red-600' : 'text-blue-600'

  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${tone}`} />
            <h2 className="text-lg font-semibold text-gray-900">{flag.name || flag.key}</h2>
          </div>
          <p className="text-sm text-gray-500">{flag.description || 'No description provided.'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-0.5">Category: {flag.category || 'general'}</span>
            <span className="rounded bg-gray-100 px-2 py-0.5">Default: {flag.defaultEnabled ? 'On' : 'Off'}</span>
            <span className="rounded bg-gray-100 px-2 py-0.5">Impact: {flag.impact || 'unknown'}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          <p>Last updated</p>
          <p>{flag.updatedAt ? new Date(flag.updatedAt).toLocaleString() : 'unknown'}</p>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr,260px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {ENVIRONMENTS.map(environment => (
              <EnvironmentToggle
                key={environment}
                flag={flag}
                environment={environment}
                onToggle={onToggle}
                disabled={loading}
              />
            ))}
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-700">Operational guidance</p>
            <p className="mt-1">
              {flag.guidance || 'Coordinate with engineering before toggling production flags. Always notify customer success if user experience is affected.'}
            </p>
            {flag.impact === 'high' && (
              <p className="mt-2 text-xs text-red-600">
                High-impact flag. MFA and approval workflow enforced for production changes.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" /> History
              </div>
            </div>
            <div className="p-4">
              <HistoryList entries={history} />
            </div>
          </div>

          {flag.dependencies && flag.dependencies.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
              <p className="font-semibold">Dependencies</p>
              <ul className="mt-2 list-disc pl-4">
                {flag.dependencies.map(dep => (
                  <li key={dep}>{dep}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}

export default function FeatureFlags() {
  const queryClient = useQueryClient()
  const [historyMap, setHistoryMap] = useState({})

  const flagsQuery = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: () => getFeatureFlags({ limit: 50 }),
    staleTime: 60 * 1000,
  })

  const flags = useMemo(() => normalizeFlags(flagsQuery.data), [flagsQuery.data])
  const totalFlags = flags.length
  const enabledProd = flags.filter(flag => flag.environments?.production?.enabled).length
  const pendingApproval = flags.filter(flag => flag.environments?.production?.pending).length

  const loadHistory = async flag => {
    const response = await getFeatureFlagHistory(flag.id || flag.key)
    const history = normalizeHistory(response)
    setHistoryMap(prev => ({ ...prev, [flag.id || flag.key]: history }))
  }

  useEffect(() => {
    if (flags.length > 0) {
      loadHistory(flags[0])
    }
  }, [flags])

  const toggleMutation = useMutation({
    mutationFn: async ({ flag, environment, enabled }) => {
      const needsMfa = environment === 'production' || flag.impact === 'high'
      const mfaCode = needsMfa ? window.prompt(MFA_MESSAGE) : undefined
      if (needsMfa && !mfaCode) throw new Error('MFA code is required')
      return toggleFeatureFlag(flag.id || flag.key, enabled, environment, mfaCode)
    },
    onSuccess: (_, variables) => {
      toast.success(`Flag updated for ${variables.environment}`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] })
      loadHistory(variables.flag)
    },
    onError: error => toast.error(error.message || 'Failed to toggle feature flag'),
  })

  const handleToggle = (environment, enabled, flag) => {
    toggleMutation.mutate({ flag, environment, enabled })
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Feature Flags</h1>
          <p className="text-sm text-gray-500">
            Manage rollout controls per environment. Production toggles require MFA and record audit history.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <Activity className="h-4 w-4 text-blue-600" /> Live audit trail enabled
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Flags</p>
          <p className="text-2xl font-semibold text-gray-900">{totalFlags}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Prod enabled</p>
          <p className="text-2xl font-semibold text-gray-900">{enabledProd}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending approvals</p>
          <p className="text-2xl font-semibold text-amber-600">{pendingApproval}</p>
        </div>
      </section>

      {flagsQuery.isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading feature flags...</div>
      )}

      {!flagsQuery.isLoading && flags.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No feature flags configured.
        </div>
      )}

      <div className="space-y-6">
        {flags.map(flag => (
          <FeatureFlagCard
            key={flag.id || flag.key}
            flag={flag}
            history={historyMap[flag.id || flag.key] || []}
            onToggle={(environment, enabled) => handleToggle(environment, enabled, flag)}
            loading={toggleMutation.isLoading}
          />
        ))}
      </div>
    </div>
  )
}

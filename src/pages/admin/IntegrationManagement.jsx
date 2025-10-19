import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getIntegrations,
  getIntegrationDetails,
  getSyncJobHistory,
  triggerManualSync,
  updateIntegrationConfig,
  rotateAPIKey,
} from '@/services/api/adminApi'
import {
  Server,
  Plug,
  RefreshCw,
  Shield,
  AlertTriangle,
  Key,
  Settings,
  ArrowUpRight,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const MFA_MESSAGE = 'Enter the MFA code to authorise this action.'

const normalizeIntegrations = payload => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.integrations)) return payload.integrations
  if (Array.isArray(payload.data)) return payload.data
  return []
}

const normalizeJobs = payload => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.jobs)) return payload.jobs
  if (Array.isArray(payload.data)) return payload.data
  return []
}

const StatusPill = ({ status }) => {
  const palette =
    status === 'online'
      ? 'bg-green-100 text-green-700'
      : status === 'degraded'
        ? 'bg-amber-100 text-amber-700'
        : status === 'offline'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-600'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${palette}`}>
      {status || 'unknown'}
    </span>
  )
}

const IntegrationCard = ({ integration, active, onSelect }) => {
  const Icon = integration.vendor === 'shopify' ? Plug : Server
  return (
    <button
      type="button"
      onClick={() => onSelect(integration)}
      className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Icon className="h-4 w-4 text-blue-500" />
          {integration.name || integration.id}
        </div>
        <p className="text-xs text-gray-500">
          {integration.vendor || integration.description || 'Unknown vendor'}
        </p>
      </div>
      <StatusPill status={integration.status} />
    </button>
  )
}

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm text-gray-600">
    <span className="text-xs uppercase tracking-wide text-gray-400">{label}</span>
    <span>{value}</span>
  </div>
)

const SyncJobList = ({ jobs }) => {
  if (!jobs || jobs.length === 0) {
    return <p className="text-xs text-gray-500">No recent sync jobs.</p>
  }

  return (
    <ul className="space-y-2 text-xs text-gray-600">
      {jobs.slice(0, 5).map(job => (
        <li key={job.id || job.startedAt} className="rounded border border-gray-100 bg-gray-50 p-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>{job.status || 'unknown'}</span>
            <span>{job.startedAt ? new Date(job.startedAt).toLocaleString() : 'unknown time'}</span>
          </div>
          <p>
            Records: {job.recordsProcessed ?? 'n/a'} · Duration:{' '}
            {job.durationMs ? `${Math.round(job.durationMs / 1000)}s` : 'n/a'}
          </p>
        </li>
      ))}
    </ul>
  )
}

export default function IntegrationManagement() {
  // eslint-disable-next-line no-unused-vars
  const queryClient = useQueryClient() // TODO: Use for query invalidation if needed
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(null)

  const integrationsQuery = useQuery({
    queryKey: ['admin', 'integrations'],
    queryFn: getIntegrations,
    staleTime: 60 * 1000,
  })

  const integrations = useMemo(
    () => normalizeIntegrations(integrationsQuery.data),
    [integrationsQuery.data]
  )
  const selectedIntegration =
    integrations.find(item => (item.id || item.key) === selectedIntegrationId) || integrations[0]

  useEffect(() => {
    if (!selectedIntegrationId && selectedIntegration) {
      setSelectedIntegrationId(selectedIntegration.id || selectedIntegration.key)
    }
  }, [selectedIntegrationId, selectedIntegration])

  const detailsQuery = useQuery({
    queryKey: ['admin', 'integration', selectedIntegration?.id || selectedIntegration?.key],
    queryFn: () => getIntegrationDetails(selectedIntegration.id || selectedIntegration.key),
    enabled: Boolean(selectedIntegration),
  })

  const historyQuery = useQuery({
    queryKey: ['admin', 'integration-history', selectedIntegration?.id || selectedIntegration?.key],
    queryFn: () =>
      getSyncJobHistory(selectedIntegration.id || selectedIntegration.key, { limit: 5 }),
    enabled: Boolean(selectedIntegration),
  })

  const triggerSync = useMutation({
    mutationFn: async () => {
      const mfa = window.prompt(MFA_MESSAGE)
      if (!mfa) throw new Error('MFA code is required')
      return triggerManualSync(selectedIntegration.id || selectedIntegration.key, mfa)
    },
    onSuccess: () => {
      toast.success('Manual sync triggered')
      historyQuery.refetch()
    },
    onError: error => toast.error(error.message || 'Failed to trigger sync'),
  })

  const rotateKey = useMutation({
    mutationFn: async () => {
      const confirmRotate = window.confirm(
        'Rotate integration API key? Existing credentials will stop working.'
      )
      if (!confirmRotate) return null
      const mfa = window.prompt(MFA_MESSAGE)
      if (!mfa) throw new Error('MFA code is required')
      return rotateAPIKey(selectedIntegration.id || selectedIntegration.key, mfa)
    },
    onSuccess: data => {
      toast.success('API key rotated')
      detailsQuery.refetch()
      if (data?.maskedKey) {
        window.alert(`New key issued: ${data.maskedKey}`)
      }
    },
    onError: error => toast.error(error.message || 'Failed to rotate API key'),
  })

  const updateConfig = useMutation({
    mutationFn: async config => {
      const mfa = window.prompt(MFA_MESSAGE)
      if (!mfa) throw new Error('MFA code is required')
      return updateIntegrationConfig(selectedIntegration.id || selectedIntegration.key, config, mfa)
    },
    onSuccess: () => {
      toast.success('Configuration update queued')
      detailsQuery.refetch()
    },
    onError: error => toast.error(error.message || 'Failed to update configuration'),
  })

  const healthyCount = integrations.filter(item => item.status === 'online').length
  const degradedCount = integrations.filter(item => item.status === 'degraded').length
  const jobs = normalizeJobs(historyQuery.data)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Integration Management</h1>
          <p className="text-sm text-gray-500">
            Monitor external services, run manual syncs, and rotate credentials with MFA
            enforcement.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <Shield className="h-4 w-4 text-blue-600" /> Zero-trust policies enforced
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Integrations</p>
          <p className="text-2xl font-semibold text-gray-900">{integrations.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Online</p>
          <p className="text-2xl font-semibold text-green-600">{healthyCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Degraded</p>
          <p className="text-2xl font-semibold text-amber-600">{degradedCount}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
            Integrations
          </div>
          <div className="divide-y divide-gray-100">
            {integrationsQuery.isLoading && (
              <p className="px-4 py-3 text-sm text-gray-500">Loading integrations...</p>
            )}
            {!integrationsQuery.isLoading && integrations.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">No integrations configured.</p>
            )}
            {integrations.map(item => (
              <IntegrationCard
                key={item.id || item.key}
                integration={item}
                active={
                  (item.id || item.key) === (selectedIntegration?.id || selectedIntegration?.key)
                }
                onSelect={integration =>
                  setSelectedIntegrationId(integration.id || integration.key)
                }
              />
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedIntegration?.name || selectedIntegration?.id || 'Select an integration'}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedIntegration?.description ||
                    selectedIntegration?.vendor ||
                    'No description provided.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => detailsQuery.refetch()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                <button
                  type="button"
                  disabled={triggerSync.isLoading}
                  onClick={() => triggerSync.mutate()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  <ArrowUpRight className="h-4 w-4" /> Trigger sync
                </button>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
              <div className="space-y-4 text-sm text-gray-600">
                <DetailRow
                  label="Status"
                  value={
                    <StatusPill status={detailsQuery.data?.status || selectedIntegration?.status} />
                  }
                />
                <DetailRow
                  label="Endpoint"
                  value={detailsQuery.data?.endpoint || selectedIntegration?.endpoint || 'n/a'}
                />
                <DetailRow
                  label="Last sync"
                  value={
                    detailsQuery.data?.lastSync
                      ? new Date(detailsQuery.data.lastSync).toLocaleString()
                      : 'unknown'
                  }
                />
                <DetailRow
                  label="Masked key"
                  value={detailsQuery.data?.maskedKey || selectedIntegration?.maskedKey || 'hidden'}
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={rotateKey.isLoading}
                    onClick={() => rotateKey.mutate()}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    <Key className="h-4 w-4" /> Rotate key
                  </button>
                  <button
                    type="button"
                    disabled={updateConfig.isLoading}
                    onClick={() => updateConfig.mutate({ refreshCache: true })}
                    className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                  >
                    <Settings className="h-4 w-4" /> Push config
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Recent sync jobs</p>
                <div className="mt-3">
                  <SyncJobList jobs={jobs} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-600">
            <p className="font-semibold text-gray-700">Operational guidance</p>
            <p className="mt-2">
              Coordinate rotations with the owning business unit. Manual syncs should be used after
              confirming status with the external provider. All production changes require MFA and
              are captured in the audit log.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

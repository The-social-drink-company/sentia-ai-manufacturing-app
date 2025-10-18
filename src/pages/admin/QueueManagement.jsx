import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getQueues,
  getQueueDetails,
  getQueueJobs,
  retryJob,
  cleanJobs,
} from '@/services/api/adminApi'
import {
  Activity,
  RefreshCw,
  ListTree,
  Trash2,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const MFA_MESSAGE = 'Enter the MFA code to authorise this BullMQ operation.'

const normalizeQueues = payload => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.queues)) return payload.queues
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

const QueueStatus = ({ queue }) => {
  const tone = queue.paused ? 'bg-amber-100 text-amber-700' : queue.failedCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
  const label = queue.paused ? 'Paused' : queue.failedCount > 0 ? 'Attention' : 'Healthy'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${tone}`}>{label}</span>
}

const JobList = ({ jobs, onRetry }) => {
  if (!jobs || jobs.length === 0) {
    return <p className="text-xs text-gray-500">No jobs in this category.</p>
  }

  return (
    <ul className="space-y-2 text-xs text-gray-600">
      {jobs.slice(0, 10).map(job => (
        <li key={job.id} className="rounded border border-gray-100 bg-gray-50 p-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>#{job.id}</span>
            <span>{job.timestamp ? new Date(job.timestamp).toLocaleString() : 'unknown time'}</span>
          </div>
          <p className="mt-1 text-sm text-gray-700">{job.name || 'Unnamed job'}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Attempts: {job.attemptsMade ?? 0}</span>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(job.id)}
                className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-100"
              >
                <RotateCw className="h-3 w-3" /> Retry
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function QueueManagement() {
  const [selectedQueueName, setSelectedQueueName] = useState(null)
  const [jobFilter, setJobFilter] = useState('failed')

  const queuesQuery = useQuery({
    queryKey: ['admin', 'queues'],
    queryFn: getQueues,
    staleTime: 30 * 1000,
  })

  const queues = useMemo(() => normalizeQueues(queuesQuery.data), [queuesQuery.data])
  const selectedQueue = queues.find(item => (item.name || item.queue) === selectedQueueName) || queues[0]

  useEffect(() => {
    if (!selectedQueueName && selectedQueue) {
      setSelectedQueueName(selectedQueue.name || selectedQueue.queue)
    }
  }, [selectedQueueName, selectedQueue])

  const detailsQuery = useQuery({
    queryKey: ['admin', 'queue-details', selectedQueue?.name || selectedQueue?.queue],
    queryFn: () => getQueueDetails(selectedQueue.name || selectedQueue.queue),
    enabled: Boolean(selectedQueue),
  })

  const jobsQuery = useQuery({
    queryKey: ['admin', 'queue-jobs', selectedQueue?.name || selectedQueue?.queue, jobFilter],
    queryFn: () => getQueueJobs(selectedQueue.name || selectedQueue.queue, jobFilter, { limit: 20 }),
    enabled: Boolean(selectedQueue),
  })

  const retryMutation = useMutation({
    mutationFn: async jobId => {
      const mfa = window.prompt(MFA_MESSAGE)
      if (!mfa) throw new Error('MFA code is required')
      return retryJob(selectedQueue.name || selectedQueue.queue, jobFilter, jobId, mfa)
    },
    onSuccess: () => {
      toast.success('Job retry queued')
      jobsQuery.refetch()
    },
    onError: error => toast.error(error.message || 'Failed to retry job'),
  })

  const cleanMutation = useMutation({
    mutationFn: async () => {
      const confirmed = window.confirm('Clean completed jobs? This removes them from the queue history.')
      if (!confirmed) return null
      const mfa = window.prompt(MFA_MESSAGE)
      if (!mfa) throw new Error('MFA code is required')
      return cleanJobs(selectedQueue.name || selectedQueue.queue, { status: jobFilter }, mfa)
    },
    onSuccess: () => {
      toast.success('Queue cleaned')
      jobsQuery.refetch()
    },
    onError: error => toast.error(error.message || 'Failed to clean jobs'),
  })

  const metrics = detailsQuery.data || selectedQueue || {}
  const jobs = normalizeJobs(jobsQuery.data)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Queue Management</h1>
          <p className="text-sm text-gray-500">
            Inspect BullMQ queues, retry failed jobs, and clean completed work. MFA required for destructive actions.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <Activity className="h-4 w-4 text-blue-600" /> Real-time queue metrics
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Queues</p>
          <p className="text-2xl font-semibold text-gray-900">{queues.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Waiting</p>
          <p className="text-2xl font-semibold text-amber-600">{metrics.waiting ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Failed</p>
          <p className="text-2xl font-semibold text-red-600">{metrics.failed ?? 0}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">Queues</div>
          <div className="divide-y divide-gray-100">
            {queuesQuery.isLoading && <p className="px-4 py-3 text-sm text-gray-500">Loading queues...</p>}
            {!queuesQuery.isLoading && queues.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">No queues registered.</p>
            )}
            {queues.map(queue => {
              const name = queue.name || queue.queue
              const active = name === (selectedQueue?.name || selectedQueue?.queue)
              return (
                <button
                  key={name}
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedQueueName(name)}
                >
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-gray-500">{queue.description || 'No description provided.'}</p>
                  </div>
                  <QueueStatus queue={queue} />
                </button>
              )
            })}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedQueue?.name || selectedQueue?.queue || 'Select a queue'}</h2>
                <p className="text-sm text-gray-500">{selectedQueue?.description || 'No description provided.'}</p>
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
                  disabled={cleanMutation.isLoading}
                  onClick={() => cleanMutation.mutate()}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" /> Clean jobs
                </button>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
              <div className="space-y-4 text-sm text-gray-600">
                <DetailRow label="Waiting" value={metrics.waiting ?? 0} />
                <DetailRow label="Active" value={metrics.active ?? 0} />
                <DetailRow label="Completed" value={metrics.completed ?? 0} />
                <DetailRow label="Delayed" value={metrics.delayed ?? 0} />
                <DetailRow label="Failed" value={metrics.failed ?? 0} />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Jobs</p>
                <div className="mt-3 flex items-center gap-2">
                  {['waiting', 'active', 'completed', 'failed'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setJobFilter(status)}
                      className={`rounded border px-2 py-1 text-xs font-semibold capitalize ${
                        jobFilter === status ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <JobList
                    jobs={jobs}
                    onRetry={jobFilter === 'failed' ? jobId => retryMutation.mutate(jobId) : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          {metrics.lastFailedReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" /> Last failure
              </h3>
              <p className="mt-2 text-xs text-red-600">{metrics.lastFailedReason}</p>
            </div>
          )}

          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-700">
            <p className="font-semibold">Operational guidance</p>
            <p className="mt-2">
              Retry failed jobs only after resolving the root cause. Cleaning completed jobs helps maintain queue performance.
              All MFA prompts are logged to the audit trail.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

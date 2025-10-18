import { useMemo } from 'react'
import { useSSE } from '@/hooks/useSSE'

const getStatusMeta = ({ connected, reconnecting, status }) => {
  if (connected) {
    return {
      icon: '🟢',
      label: 'Live',
      className: 'text-emerald-500',
    }
  }

  if (reconnecting || status === 'reconnecting') {
    return {
      icon: '🟡',
      label: 'Reconnecting',
      className: 'text-amber-500',
    }
  }

  return {
    icon: '🔴',
    label: 'Offline',
    className: 'text-destructive',
  }
}

const combineClasses = (...tokens) => tokens.filter(Boolean).join(' ')

const SSEStatusIndicator = ({ channel = 'dashboard', className, showLatency = true }) => {
  const { connected, reconnecting, status, latency, error } = useSSE(channel)

  const meta = useMemo(() => getStatusMeta({ connected, reconnecting, status }), [
    connected,
    reconnecting,
    status,
  ])

  const latencyDisplay =
    showLatency && typeof latency === 'number' ? `${Math.round(latency)}ms` : null

  return (
    <div className={combineClasses('flex items-center gap-2 text-xs font-medium', className)}>
      <span className={combineClasses('flex items-center gap-1', meta.className)}>
        <span aria-hidden="true">{meta.icon}</span>
        <span>{meta.label}</span>
      </span>
      {latencyDisplay ? <span className="text-muted-foreground">{latencyDisplay}</span> : null}
      {!connected && !reconnecting && error ? (
        <span className="text-xs text-destructive">{error.message || 'Connection issue'}</span>
      ) : null}
    </div>
  )
}

export default SSEStatusIndicator

import SSEStatusIndicator from './SSEStatusIndicator'
import SystemStatusBadge from './SystemStatusBadge'
import Breadcrumb from './Breadcrumb'
import UserProfile from '@/components/auth/UserProfile'
import { useQuery } from '@tanstack/react-query'

const Header = ({
  title,
  subtitle,
  showStatus = true,
  statusChannel = 'dashboard',
  showSystemStatus = true,
  showBreadcrumb = true,
}) => {
  // Query system integration status
  const { data: systemStatus } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      try {
        // Check health of each integration
        const [xero, shopify, amazon, unleashed] = await Promise.allSettled([
          fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/xero/status`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/shopify/status`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/amazon/status`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/unleashed/status`).then(r => r.json()),
        ])

        const healthyCount = [xero, shopify, amazon, unleashed].filter(
          result => result.status === 'fulfilled' && result.value?.connected
        ).length

        // Determine overall system status
        if (healthyCount === 4) return 'operational'
        if (healthyCount >= 2) return 'degraded'
        return 'issues'
      } catch (error) {
        console.error('[Header] Failed to fetch system status:', error)
        return 'issues'
      }
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
  })

  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex flex-col gap-3">
        {/* Top row: Title and status indicators */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">{title || 'Dashboard'}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-4">
            {showSystemStatus && systemStatus ? <SystemStatusBadge status={systemStatus} /> : null}
            {showStatus ? <SSEStatusIndicator channel={statusChannel} className="mt-2 sm:mt-0" /> : null}
            <UserProfile />
          </div>
        </div>

        {/* Bottom row: Breadcrumb navigation */}
        {showBreadcrumb && <Breadcrumb />}
      </div>
    </header>
  )
}

export default Header

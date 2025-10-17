import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const fetchSystemAlerts = async () => {
  const response = await fetch('/api/system/alerts', {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.status}`)
  }

  return response.json()
}

const getSeverityVariant = severity => {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'destructive'
    case 'medium':
    case 'warning':
      return 'secondary'
    case 'low':
    case 'info':
    default:
      return 'outline'
  }
}

const AlertWidget = ({ limit = 5 }) => {
  const {
    data: alerts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['system-alerts', limit],
    queryFn: fetchSystemAlerts,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 15 * 1000, // Refresh every 15 seconds for alerts
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                <div className="h-5 w-16 bg-gray-300 rounded"></div>
              </div>
              <div className="h-3 w-1/2 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 w-1/3 bg-gray-300 rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-sm text-muted-foreground">Unable to load system alerts</p>
        </CardContent>
      </Card>
    )
  }

  const activeAlerts =
    alerts?.filter(alert => alert.isActive && !alert.isDismissed)?.slice(0, limit) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {activeAlerts.length > 0 ? (
          activeAlerts.map(alert => (
            <div key={alert.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{alert.title}</p>
                <Badge variant={getSeverityVariant(alert.severity)}>{alert.severity}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>Type: {alert.type}</span>
                <span>•</span>
                <span>Category: {alert.category}</span>
                <span>•</span>
                <span>
                  {new Date(alert.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No active alerts</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertWidget

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const fetchRecentActivity = async () => {
  const response = await fetch('/api/system/activity', {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.status}`)
  }
  
  return response.json()
}

const ActivityWidget = ({ limit = 5 }) => {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['system-activity', limit],
    queryFn: fetchRecentActivity,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse rounded-lg border border-border bg-muted/30 p-3">
              <div className="h-3 w-12 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-full bg-gray-300 rounded"></div>
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
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-sm text-muted-foreground">Unable to load recent activity</p>
        </CardContent>
      </Card>
    )
  }

  const recentActivities = activities?.slice(0, limit) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {recentActivities.length > 0 ? (
          recentActivities.map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                {new Date(event.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              <p className="text-foreground">{event.message}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ActivityWidget

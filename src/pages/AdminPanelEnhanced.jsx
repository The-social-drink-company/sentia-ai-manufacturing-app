import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Real data should be fetched from API endpoints
const ACCESS_REQUESTS = []

const AUDIT_EVENTS = []

const AdminPanelEnhanced = () => (
  <section className="space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin control centre</h1>
        <p className="text-sm text-muted-foreground">
          Manage access, monitor integrations, and review audit activity.
        </p>
      </div>
      <Badge variant="outline">Admin</Badge>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>Platform status</CardTitle>
        <CardDescription>
          Snapshot of core services monitored by the MCP health agent.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="MCP orchestrator" value="Online" helper="Latency 42 ms" tone="success" />
        <Metric label="Xero integration" value="Online" helper="Last sync 10:42" tone="success" />
        <Metric
          label="Shop floor agents"
          value="Partial"
          helper="Line B sensor offline"
          tone="warning"
        />
        <Metric label="Security alerts" value="0" helper="Past 24 hours" tone="default" />
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Access requests</CardTitle>
          <CardDescription>
            Outstanding provisioning tasks from finance and operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ACCESS_REQUESTS.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No pending access requests</p>
                <p className="text-xs text-muted-foreground">
                  All user access is properly configured
                </p>
              </div>
            </div>
          ) : (
            ACCESS_REQUESTS.map(request => (
              <div
                key={request.name}
                className="rounded-lg border border-border bg-muted/30 p-4 text-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{request.name}</p>
                  <Badge variant={request.status.includes('Pending') ? 'secondary' : 'outline'}>
                    {request.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Role: {request.role}</p>
                <p className="text-xs text-muted-foreground">Requested: {request.requested}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent audit events</CardTitle>
          <CardDescription>Rolling log of changes and automated escalations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {AUDIT_EVENTS.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No recent audit events</p>
                <p className="text-xs text-muted-foreground">System is operating normally</p>
              </div>
            </div>
          ) : (
            AUDIT_EVENTS.map(event => (
              <div key={event.time} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{event.time}</span>
                  <span>{event.event}</span>
                </div>
                <p className="text-foreground">{event.detail}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  </section>
)

const Metric = ({ label, value, helper, tone }) => {
  const palette =
    tone === 'success'
      ? 'text-emerald-600'
      : tone === 'warning'
        ? 'text-amber-600'
        : tone === 'destructive'
          ? 'text-red-600'
          : 'text-foreground'

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-semibold ${palette}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

export default AdminPanelEnhanced

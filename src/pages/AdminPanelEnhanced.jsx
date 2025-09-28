import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ACCESS_REQUESTS = [
  { name: 'Alicia Park', role: 'Operations Analyst', requested: '2025-05-03 09:12', status: 'Pending approval' },
  { name: 'Victor Chen', role: 'Treasury Manager', requested: '2025-05-02 14:47', status: 'Approved' },
  { name: 'Lauren Diaz', role: 'Procurement Lead', requested: '2025-05-01 17:05', status: 'Provisioned' }
]

const AUDIT_EVENTS = [
  { time: '11:58', event: 'Role update', detail: 'Working capital editor → approver (MCP) – R. Singh' },
  { time: '10:42', event: 'Integration sync', detail: 'Xero cash-flow data refreshed successfully' },
  { time: '09:15', event: 'Alert escalation', detail: 'Quality variance threshold dispatched to operations' }
]

const AdminPanelEnhanced = () => (
  <section className="space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin control centre</h1>
        <p className="text-sm text-muted-foreground">Manage access, monitor integrations, and review audit activity.</p>
      </div>
      <Badge variant="outline">Admin</Badge>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>Platform status</CardTitle>
        <CardDescription>Snapshot of core services monitored by the MCP health agent.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="MCP orchestrator" value="Online" helper="Latency 42 ms" tone="success" />
        <Metric label="Xero integration" value="Online" helper="Last sync 10:42" tone="success" />
        <Metric label="Shop floor agents" value="Partial" helper="Line B sensor offline" tone="warning" />
        <Metric label="Security alerts" value="0" helper="Past 24 hours" tone="default" />
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Access requests</CardTitle>
          <CardDescription>Outstanding provisioning tasks from finance and operations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ACCESS_REQUESTS.map((request) => (
            <div key={request.name} className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{request.name}</p>
                <Badge variant={request.status.includes('Pending') ? 'secondary' : 'outline'}>{request.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Role: {request.role}</p>
              <p className="text-xs text-muted-foreground">Requested: {request.requested}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent audit events</CardTitle>
          <CardDescription>Rolling log of changes and automated escalations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {AUDIT_EVENTS.map((event) => (
            <div key={event.time} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{event.time}</span>
                <span>{event.event}</span>
              </div>
              <p className="text-foreground">{event.detail}</p>
            </div>
          ))}
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

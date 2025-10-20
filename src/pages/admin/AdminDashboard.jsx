/**
 * Admin Dashboard Component
 *
 * System administration overview:
 * - System health metrics
 * - Active users
 * - Queue depth
 * - Integration status
 * - Recent audit logs
 * - Quick admin actions
 */

import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Users,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
  Zap,
  Shield,
  FileText,
  Settings,
  RefreshCw,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import { useSSE } from '../../hooks/useSSE'

/**
 * System Health Metric Card
 */
// eslint-disable-next-line no-unused-vars
function HealthMetricCard({ label, value, status, icon: Icon, trend, unit = '' }) {
  const statusColors = {
    healthy: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    critical: 'border-red-500 bg-red-50',
  }

  const StatusIcon = status === 'healthy' ? CheckCircle2 : AlertTriangle
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown

  return (
    <div className={`rounded-lg border-2 ${statusColors[status]} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              status === 'healthy'
                ? 'bg-green-600'
                : status === 'warning'
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
            }`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
        </div>
        <StatusIcon
          className={`w-6 h-6 ${
            status === 'healthy'
              ? 'text-green-600'
              : status === 'warning'
                ? 'text-yellow-600'
                : 'text-red-600'
          }`}
        />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-gray-600">{unit}</span>}
      </div>

      {trend !== undefined && (
        <div
          className={`flex items-center gap-1 mt-2 text-sm ${
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <TrendIcon className="w-4 h-4" />
          <span>{Math.abs(trend).toFixed(1)}% vs last hour</span>
        </div>
      )}
    </div>
  )
}

/**
 * Integration Status Card
 */
function IntegrationStatusCard({ integration }) {
  const { name, status, lastSync, nextSync, errorCount, icon: Icon } = integration

  const statusConfig = {
    connected: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Connected' },
    syncing: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Syncing' },
    error: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Error' },
    disabled: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Disabled' },
  }

  const config = statusConfig[status] || statusConfig.disabled

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-gray-400" />}
          <h4 className="font-semibold text-gray-900">{name}</h4>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {lastSync && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Last Sync:</span>
            <span className="text-gray-900">{new Date(lastSync).toLocaleTimeString()}</span>
          </div>
        )}
        {nextSync && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Next Sync:</span>
            <span className="text-gray-900">{new Date(nextSync).toLocaleTimeString()}</span>
          </div>
        )}
        {errorCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Errors:</span>
            <span className="text-red-600 font-medium">{errorCount}</span>
          </div>
        )}
      </div>

      {status === 'error' && (
        <button className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Retry Sync
        </button>
      )}
    </div>
  )
}

/**
 * Queue Status Card
 */
function QueueStatusCard({ queue }) {
  const { name, waiting, active, completed, failed, paused } = queue

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        {paused && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
            Paused
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">{waiting}</div>
          <div className="text-xs text-gray-600">Waiting</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">{active}</div>
          <div className="text-xs text-gray-600">Active</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-gray-600">{completed}</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-600">{failed}</div>
          <div className="text-xs text-gray-600">Failed</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Tenant API Card
 */
function TenantApiCard({ tenant }) {
  const statusStyles = {
    connected: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-blue-100 text-blue-700 border-blue-200',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{tenant.tenantName}</h3>
          <p className="text-sm text-gray-500">Environment: {tenant.environment}</p>
          {tenant.slug && (
            <p className="text-xs text-gray-400">Tenant ID: {tenant.slug}</p>
          )}
        </div>

        <div className="text-right">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            {tenant.plan || 'Enterprise'}
          </span>
          {tenant.lastDeployment && (
            <p className="mt-1 text-xs text-gray-400">
              Last deploy: {new Date(tenant.lastDeployment).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {tenant.apis.map(api => {
          const badgeStyle = statusStyles[api.status] || statusStyles.pending

          return (
            <div
              key={api.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{api.name}</h4>
                  <p className="text-xs text-gray-500 break-all">{api.url}</p>
                  {api.description && <p className="text-xs text-gray-400">{api.description}</p>}
                </div>

                <div className="flex flex-col items-start gap-1 md:items-end">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeStyle}`}>
                    {api.statusLabel || api.status}
                  </span>
                  {api.lastSync && (
                    <p className="text-[11px] text-gray-400">
                      Last sync: {new Date(api.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Recent Audit Log Entry
 */
function AuditLogEntry({ log }) {
  const { user, action, resource, timestamp, status } = log

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{user}</span>
          <span className="text-gray-600 text-sm">{action}</span>
          <span className="font-medium text-gray-700 text-sm">{resource}</span>
        </div>
        <p className="text-xs text-gray-500">{new Date(timestamp).toLocaleString()}</p>
      </div>
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'success'
            ? 'bg-green-100 text-green-700'
            : status === 'failed'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {status}
      </span>
    </div>
  )
}

/**
 * System Metrics Chart
 */
function SystemMetricsChart({ metricsData }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        System Performance (Last 24 Hours)
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={metricsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={ts =>
              new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            }
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            labelFormatter={ts => new Date(ts).toLocaleString()}
            formatter={(value, name) => [
              name === 'responseTime' ? `${value}ms` : value,
              name === 'responseTime'
                ? 'Response Time'
                : name === 'requestCount'
                  ? 'Requests'
                  : name === 'errorRate'
                    ? 'Error Rate'
                    : name,
            ]}
          />
          <Legend />

          <Area
            yAxisId="right"
            type="monotone"
            dataKey="requestCount"
            fill="#93c5fd"
            stroke="#3b82f6"
            fillOpacity={0.3}
            name="Requests"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="responseTime"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Response Time (ms)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="errorRate"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Error Rate (%)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Quick Action Button
 */
// eslint-disable-next-line no-unused-vars
function QuickActionButton({ label, icon: Icon, onClick, variant = 'primary' }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${variants[variant]}`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  )
}

/**
 * Main Admin Dashboard Component
 */
export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/dashboard', {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch admin dashboard data')
      const result = await response.json()
      return result.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // SSE for real-time admin updates
  const { connected } = useSSE('admin', {
    enabled: true,
    onMessage: message => {
      if (message.type === 'system:alert' || message.type === 'admin:update') {
        queryClient.invalidateQueries(['admin', 'dashboard'])
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading dashboard: {error.message}</p>
      </div>
    )
  }

  const {
    systemHealth = {},
    activeUsers = 0,
    queues = [],
    integrations = [],
    auditLogs = [],
    metrics = [],
    tenantApis: tenantApisFromApi = [],
  } = data || {}

  const defaultTenantApis = [
    {
      id: 'sentia-spirits',
      tenantName: 'Sentia Spirits',
      slug: 'sentia-spirits',
      plan: 'Enterprise',
      environment: 'Production',
      lastDeployment: new Date().toISOString(),
      apis: [
        {
          id: 'sentia-core-api',
          name: 'CapLiquify Core API',
          url: 'https://api.capliquify.com/tenants/sentia-spirits',
          status: 'connected',
          statusLabel: 'Healthy',
          lastSync: new Date().toISOString(),
          description: 'Primary REST API for CapLiquify tenant operations',
        },
        {
          id: 'sentia-mcp',
          name: 'MCP Orchestration API',
          url: 'https://mcp.capliquify.com/tenants/sentia-spirits',
          status: 'connected',
          statusLabel: 'Operational',
          lastSync: new Date().toISOString(),
          description: 'Model Context Protocol endpoint powering AI workflows',
        },
        {
          id: 'sentia-shopify',
          name: 'Shopify Commerce API',
          url: 'https://api.capliquify.com/tenants/sentia-spirits/shopify',
          status: 'warning',
          statusLabel: 'Sync Scheduled',
          lastSync: new Date().toISOString(),
          description: 'Shopify multi-region storefront integration',
        },
      ],
    },
  ]

  const tenantApis =
    Array.isArray(tenantApisFromApi) && tenantApisFromApi.length > 0
      ? tenantApisFromApi
      : defaultTenantApis

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            System administration and monitoring
            {connected && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <QuickActionButton
            label="Refresh"
            icon={RefreshCw}
            onClick={() => queryClient.invalidateQueries(['admin', 'dashboard'])}
            variant="secondary"
          />
          <QuickActionButton
            label="View Logs"
            icon={FileText}
            onClick={() => navigate('/admin/audit-logs')}
            variant="primary"
          />
          <QuickActionButton
            label="Settings"
            icon={Settings}
            onClick={() => navigate('/admin/system-health')}
            variant="secondary"
          />
        </div>
      </div>

      {/* Critical Alerts */}
      {systemHealth.alerts && systemHealth.alerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">
              Critical Alerts ({systemHealth.alerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {systemHealth.alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="text-sm text-red-800">
                • {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HealthMetricCard
          label="API Response Time"
          value={systemHealth.apiResponseTime || 0}
          unit="ms"
          status={
            systemHealth.apiResponseTime < 200
              ? 'healthy'
              : systemHealth.apiResponseTime < 500
                ? 'warning'
                : 'critical'
          }
          icon={Zap}
          trend={systemHealth.apiResponseTimeTrend}
        />

        <HealthMetricCard
          label="Active Users"
          value={activeUsers}
          status="healthy"
          icon={Users}
          trend={systemHealth.activeUsersTrend}
        />

        <HealthMetricCard
          label="Database"
          value={systemHealth.dbConnections || 0}
          unit="connections"
          status={systemHealth.dbStatus === 'connected' ? 'healthy' : 'critical'}
          icon={Database}
        />

        <HealthMetricCard
          label="Error Rate"
          value={systemHealth.errorRate || 0}
          unit="%"
          status={
            systemHealth.errorRate < 1
              ? 'healthy'
              : systemHealth.errorRate < 5
                ? 'warning'
                : 'critical'
          }
          icon={AlertTriangle}
          trend={-systemHealth.errorRateTrend}
        />
      </div>

      {/* System Metrics Chart */}
      <SystemMetricsChart metricsData={metrics} />

      {/* Integrations and Queues */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Integration Status */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Integration Status</h2>
            <button
              onClick={() => navigate('/admin/integrations')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {integrations.slice(0, 4).map(integration => (
              <IntegrationStatusCard key={integration.id} integration={integration} />
            ))}
          </div>
        </div>

        {/* Queue Status */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Queue Status</h2>
            <button
              onClick={() => navigate('/admin/queues')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {queues.slice(0, 4).map(queue => (
              <QueueStatusCard key={queue.name} queue={queue} />
            ))}
          </div>
      </div>
    </div>

      {/* Tenant API Catalog */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tenant API Administration</h2>
            <p className="text-sm text-gray-500">
              Manage CapLiquify endpoints provisioned for each tenant environment
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/tenants')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Manage Tenants →
          </button>
        </div>

        <div className="space-y-4 p-6">
          {tenantApis.map(tenant => (
            <TenantApiCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Audit Logs</h2>
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>
        <div className="p-6">
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent audit logs</div>
          ) : (
            <div className="space-y-0">
              {auditLogs.slice(0, 10).map(log => (
                <AuditLogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Admin Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            label="Manage Users"
            icon={Users}
            onClick={() => navigate('/admin/users')}
            variant="primary"
          />
          <QuickActionButton
            label="View Queues"
            icon={Activity}
            onClick={() => navigate('/admin/queues')}
            variant="secondary"
          />
          <QuickActionButton
            label="Feature Flags"
            icon={Shield}
            onClick={() => navigate('/admin/feature-flags')}
            variant="success"
          />
          <QuickActionButton
            label="System Health"
            icon={Server}
            onClick={() => navigate('/admin/system-health')}
            variant="warning"
          />
        </div>
      </div>
    </div>
  )
}

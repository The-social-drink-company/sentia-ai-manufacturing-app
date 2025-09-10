// Operational Dashboard for System Monitoring and Management
import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  DatabaseIcon,
  CloudIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  services: ServiceStatus[];
  metrics: SystemMetrics;
  alerts: Alert[];
  deployments: Deployment[];
}

interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  uptime: number;
  lastCheck: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  database: {
    connections: number;
    queryTime: number;
  };
}

interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface Deployment {
  id: string;
  version: string;
  status: 'pending' | 'deploying' | 'success' | 'failed';
  timestamp: string;
  author: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  percentage: number;
  lastUpdated: string;
}

export default function OperationalDashboard() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health data
  const { data: systemHealth, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const response = await fetch('/api/admin/system-health');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch feature flags
  const { data: featureFlags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlag[]> => {
      const response = await fetch('/api/admin/feature-flags');
      return response.json();
    },
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
      case 'deploying':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'down':
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    await fetch(`/api/admin/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    });
    refetch();
  };

  const toggleFeatureFlag = async (flagId: string) => {
    await fetch(`/api/admin/feature-flags/${flagId}/toggle`, {
      method: 'POST'
    });
    refetch();
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading system health...</span>
      </div>
    );
  }

  return (
    <div className=\"p-6 space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-2xl font-bold text-gray-900\">Operational Dashboard</h1>
          <p className=\"text-gray-600\">System monitoring and management</p>
        </div>
        <div className=\"flex items-center space-x-4\">
          <label className=\"flex items-center\">
            <input
              type=\"checkbox\"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className=\"mr-2\"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => refetch()}
            className=\"flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700\"
          >
            <ArrowPathIcon className=\"w-4 h-4 mr-2\" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm font-medium text-gray-600\">System Status</p>
              <p className={`text-lg font-semibold capitalize ${getStatusColor(systemHealth.status)}`}>
                {systemHealth.status}
              </p>
            </div>
            <CheckCircleIcon className={`w-8 h-8 ${getStatusColor(systemHealth.status)}`} />
          </div>
        </div>

        <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm font-medium text-gray-600\">Active Users</p>
              <p className=\"text-2xl font-bold text-gray-900\">{systemHealth.metrics.activeUsers}</p>
            </div>
            <UsersIcon className=\"w-8 h-8 text-blue-600\" />
          </div>
        </div>

        <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm font-medium text-gray-600\">Requests/Min</p>
              <p className=\"text-2xl font-bold text-gray-900\">{systemHealth.metrics.requestsPerMinute}</p>
            </div>
            <ChartBarIcon className=\"w-8 h-8 text-green-600\" />
          </div>
        </div>

        <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
          <div className=\"flex items-center justify-between\">
            <div>
              <p className=\"text-sm font-medium text-gray-600\">Error Rate</p>
              <p className={`text-2xl font-bold ${systemHealth.metrics.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                {(systemHealth.metrics.errorRate * 100).toFixed(2)}%
              </p>
            </div>
            <ExclamationTriangleIcon className={`w-8 h-8 ${systemHealth.metrics.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`} />
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
        <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">System Metrics</h2>
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
          <div className=\"space-y-2\">
            <div className=\"flex items-center justify-between\">
              <span className=\"text-sm font-medium text-gray-600 flex items-center\">
                <CpuChipIcon className=\"w-4 h-4 mr-2\" />
                CPU Usage
              </span>
              <span className=\"text-sm font-bold\">{systemHealth.metrics.cpu}%</span>
            </div>
            <div className=\"w-full bg-gray-200 rounded-full h-2\">
              <div
                className={`h-2 rounded-full ${systemHealth.metrics.cpu > 80 ? 'bg-red-500' : systemHealth.metrics.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${systemHealth.metrics.cpu}%` }}
              />
            </div>
          </div>

          <div className=\"space-y-2\">
            <div className=\"flex items-center justify-between\">
              <span className=\"text-sm font-medium text-gray-600 flex items-center\">
                <DatabaseIcon className=\"w-4 h-4 mr-2\" />
                Memory Usage
              </span>
              <span className=\"text-sm font-bold\">{systemHealth.metrics.memory}%</span>
            </div>
            <div className=\"w-full bg-gray-200 rounded-full h-2\">
              <div
                className={`h-2 rounded-full ${systemHealth.metrics.memory > 90 ? 'bg-red-500' : systemHealth.metrics.memory > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${systemHealth.metrics.memory}%` }}
              />
            </div>
          </div>

          <div className=\"space-y-2\">
            <div className=\"flex items-center justify-between\">
              <span className=\"text-sm font-medium text-gray-600 flex items-center\">
                <CloudIcon className=\"w-4 h-4 mr-2\" />
                Disk Usage
              </span>
              <span className=\"text-sm font-bold\">{systemHealth.metrics.disk}%</span>
            </div>
            <div className=\"w-full bg-gray-200 rounded-full h-2\">
              <div
                className={`h-2 rounded-full ${systemHealth.metrics.disk > 85 ? 'bg-red-500' : systemHealth.metrics.disk > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${systemHealth.metrics.disk}%` }}
              />
            </div>
          </div>

          <div className=\"space-y-2\">
            <div className=\"flex items-center justify-between\">
              <span className=\"text-sm font-medium text-gray-600\">DB Query Time</span>
              <span className=\"text-sm font-bold\">{systemHealth.metrics.database.queryTime}ms</span>
            </div>
            <div className=\"text-xs text-gray-500\">
              {systemHealth.metrics.database.connections} active connections
            </div>
          </div>
        </div>
      </div>

      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Services Status */}
        <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
          <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">Service Status</h2>
          <div className=\"space-y-3\">
            {systemHealth.services.map((service) => (
              <div
                key={service.name}
                className=\"flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100\"
                onClick={() => setSelectedService(selectedService === service.name ? null : service.name)}
              >
                <div className=\"flex items-center space-x-3\">
                  <div className={`w-3 h-3 rounded-full ${service.status === 'up' ? 'bg-green-500' : service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <div>
                    <p className=\"font-medium text-gray-900\">{service.name}</p>
                    <p className=\"text-sm text-gray-500\">{service.responseTime}ms response</p>
                  </div>
                </div>
                <div className=\"text-right\">
                  <p className={`text-sm font-medium capitalize ${getStatusColor(service.status)}`}>
                    {service.status}
                  </p>
                  <p className=\"text-xs text-gray-500\">{service.uptime}% uptime</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
          <h2 className=\"text-lg font-semibold text-gray-900 mb-4 flex items-center\">
            <BellIcon className=\"w-5 h-5 mr-2\" />
            Active Alerts ({systemHealth.alerts.filter(a => !a.acknowledged).length})
          </h2>
          <div className=\"space-y-3 max-h-64 overflow-y-auto\">
            {systemHealth.alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-md border ${getSeverityColor(alert.severity)} ${alert.acknowledged ? 'opacity-50' : ''}`}
              >
                <div className=\"flex items-start justify-between\">
                  <div className=\"flex-1\">
                    <p className={`font-medium text-sm ${getSeverityColor(alert.severity).split(' ')[0]}`}>
                      {alert.severity.toUpperCase()}
                    </p>
                    <p className=\"text-sm text-gray-900 mt-1\">{alert.message}</p>
                    <p className=\"text-xs text-gray-500 mt-1\">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className=\"ml-3 text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded\"
                    >
                      Ack
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      {featureFlags && (
        <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
          <h2 className=\"text-lg font-semibold text-gray-900 mb-4 flex items-center\">
            <WrenchScrewdriverIcon className=\"w-5 h-5 mr-2\" />
            Feature Flags
          </h2>
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
            {featureFlags.map((flag) => (
              <div key={flag.id} className=\"p-4 border rounded-lg\">
                <div className=\"flex items-center justify-between mb-2\">
                  <h3 className=\"font-medium text-gray-900\">{flag.name}</h3>
                  <button
                    onClick={() => toggleFeatureFlag(flag.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flag.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className=\"text-sm text-gray-600\">
                  <p>Rollout: {flag.percentage}%</p>
                  <p>Updated: {new Date(flag.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Deployments */}
      <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
        <h2 className=\"text-lg font-semibold text-gray-900 mb-4 flex items-center\">
          <ClockIcon className=\"w-5 h-5 mr-2\" />
          Recent Deployments
        </h2>
        <div className=\"space-y-3\">
          {systemHealth.deployments.map((deployment) => (
            <div key={deployment.id} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-md\">
              <div className=\"flex items-center space-x-3\">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(deployment.status)}`} />
                <div>
                  <p className=\"font-medium text-gray-900\">Version {deployment.version}</p>
                  <p className=\"text-sm text-gray-500\">by {deployment.author}</p>
                </div>
              </div>
              <div className=\"text-right\">
                <p className={`text-sm font-medium capitalize ${getStatusColor(deployment.status)}`}>
                  {deployment.status}
                </p>
                <p className=\"text-xs text-gray-500\">
                  {new Date(deployment.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Tools */}
      <div className=\"bg-white p-6 rounded-lg shadow-sm border\">
        <h2 className=\"text-lg font-semibold text-gray-900 mb-4 flex items-center\">
          <EyeIcon className=\"w-5 h-5 mr-2\" />
          Debug Tools
        </h2>
        <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
          <button className=\"p-4 text-left border rounded-lg hover:bg-gray-50\">
            <h3 className=\"font-medium text-gray-900\">User Impersonation</h3>
            <p className=\"text-sm text-gray-600 mt-1\">View application as another user</p>
          </button>
          <button className=\"p-4 text-left border rounded-lg hover:bg-gray-50\">
            <h3 className=\"font-medium text-gray-900\">Performance Profiler</h3>
            <p className=\"text-sm text-gray-600 mt-1\">Analyze application performance</p>
          </button>
          <button className=\"p-4 text-left border rounded-lg hover:bg-gray-50\">
            <h3 className=\"font-medium text-gray-900\">Query Debugger</h3>
            <p className=\"text-sm text-gray-600 mt-1\">Inspect database queries</p>
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import {
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  CloudIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

const SystemMonitoring = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system metrics with real-time updates
  const { data: systemMetrics, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'system-monitoring', timeRange],
    queryFn: async () => {
      // In a real app, this would fetch from your monitoring API
      return mockSystemMetrics;
    },
    refetchInterval: autoRefresh ? 10000 : false,
    staleTime: 5000
  });

  const mockSystemMetrics = {
    current: {
      server: {
        uptime: 2847560, // seconds
        cpu_usage: 23.4,
        memory_usage: 67.8,
        disk_usage: 45.2,
        load_average: [0.8, 0.9, 1.1],
        active_connections: 127,
        network_in: 156.7, // Mbps
        network_out: 89.3   // Mbps
      },
      database: {
        connections: 15,
        max_connections: 100,
        queries_per_second: 45.2,
        slow_queries: 2,
        deadlocks: 0,
        cache_hit_ratio: 94.8,
        storage_used: 2.3, // GB
        storage_total: 10,  // GB
        replication_lag: 0.05 // seconds
      },
      api: {
        total_requests: 12456,
        requests_per_minute: 234,
        error_rate: 0.23,
        avg_response_time: 234, // ms
        p95_response_time: 567, // ms
        active_endpoints: 47,
        rate_limit_hits: 12,
        circuit_breaker_trips: 1
      },
      services: [
        { name: 'Authentication Service', status: 'healthy', response_time: 45, last_check: Date.now() - 30000 },
        { name: 'Database Service', status: 'healthy', response_time: 23, last_check: Date.now() - 30000 },
        { name: 'Redis Cache', status: 'healthy', response_time: 12, last_check: Date.now() - 30000 },
        { name: 'Email Service', status: 'degraded', response_time: 1234, last_check: Date.now() - 30000 },
        { name: 'File Storage', status: 'healthy', response_time: 67, last_check: Date.now() - 30000 },
        { name: 'Analytics Service', status: 'unhealthy', response_time: 0, last_check: Date.now() - 300000 }
      ]
    },
    historical: {
      cpu: [
        { timestamp: Date.now() - 3600000, value: 15.2 },
        { timestamp: Date.now() - 3000000, value: 18.7 },
        { timestamp: Date.now() - 2400000, value: 22.1 },
        { timestamp: Date.now() - 1800000, value: 19.8 },
        { timestamp: Date.now() - 1200000, value: 25.4 },
        { timestamp: Date.now() - 600000, value: 21.3 },
        { timestamp: Date.now(), value: 23.4 }
      ],
      memory: [
        { timestamp: Date.now() - 3600000, value: 62.5 },
        { timestamp: Date.now() - 3000000, value: 64.8 },
        { timestamp: Date.now() - 2400000, value: 66.2 },
        { timestamp: Date.now() - 1800000, value: 65.1 },
        { timestamp: Date.now() - 1200000, value: 68.7 },
        { timestamp: Date.now() - 600000, value: 66.9 },
        { timestamp: Date.now(), value: 67.8 }
      ],
      network: [
        { timestamp: Date.now() - 3600000, in: 120.3, out: 78.9 },
        { timestamp: Date.now() - 3000000, in: 135.7, out: 82.1 },
        { timestamp: Date.now() - 2400000, in: 148.2, out: 86.4 },
        { timestamp: Date.now() - 1800000, in: 142.8, out: 84.7 },
        { timestamp: Date.now() - 1200000, in: 159.1, out: 91.2 },
        { timestamp: Date.now() - 600000, in: 152.4, out: 87.8 },
        { timestamp: Date.now(), in: 156.7, out: 89.3 }
      ],
      response_time: [
        { timestamp: Date.now() - 3600000, avg: 198, p95: 456 },
        { timestamp: Date.now() - 3000000, avg: 212, p95: 478 },
        { timestamp: Date.now() - 2400000, avg: 225, p95: 512 },
        { timestamp: Date.now() - 1800000, avg: 218, p95: 489 },
        { timestamp: Date.now() - 1200000, avg: 241, p95: 534 },
        { timestamp: Date.now() - 600000, avg: 229, p95: 498 },
        { timestamp: Date.now(), avg: 234, p95: 567 }
      ]
    },
    alerts: [
      {
        id: 'alert-1',
        severity: 'warning',
        message: 'Email service response time above threshold',
        timestamp: Date.now() - 120000,
        acknowledged: false
      },
      {
        id: 'alert-2',
        severity: 'critical',
        message: 'Analytics service unresponsive',
        timestamp: Date.now() - 300000,
        acknowledged: false
      }
    ]
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes * 1024 * 1024 * 1024) / Math.log(1024));
    return Math.round(bytes * Math.pow(1024, i - 3) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const data = systemMetrics || mockSystemMetrics;

  if (isLoading && !systemMetrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh</label>
          </div>
        </div>
        
        <button
          onClick={() => refetch()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Active Alerts ({data.alerts.length})
          </h3>
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm opacity-75">
                        {new Date(alert.timestamp).toLocaleString('en-GB')}
                      </p>
                    </div>
                  </div>
                  <button className="text-sm underline">Acknowledge</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Server Uptime</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatUptime(data.current.server.uptime)}
              </p>
            </div>
            <ServerIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.current.server.cpu_usage}%
              </p>
            </div>
            <CpuChipIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${data.current.server.cpu_usage}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.current.server.memory_usage}%
              </p>
            </div>
            <CircleStackIcon className="h-8 w-8 text-purple-600" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${data.current.server.memory_usage}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Connections</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.current.server.active_connections}
              </p>
            </div>
            <SignalIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            CPU & Memory Usage
          </h3>
          <div className="h-64">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()} />
                  <Line 
                    data={data.historical.cpu}
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Line 
                    data={data.historical.memory}
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Memory %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Network Traffic */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Network Traffic
          </h3>
          <div className="h-64">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.historical.network}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()} />
                  <Area
                    type="monotone"
                    dataKey="in"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Inbound (Mbps)"
                  />
                  <Area
                    type="monotone"
                    dataKey="out"
                    stackId="2"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.6}
                    name="Outbound (Mbps)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Service Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.current.services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                  <p className="text-sm text-gray-500">
                    Response: {service.response_time}ms
                  </p>
                </div>
              </div>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Database Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Database Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.current.database.connections}/{data.current.database.max_connections}
            </div>
            <div className="text-sm text-gray-500">Active Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.current.database.queries_per_second.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Queries/Second</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.current.database.cache_hit_ratio}%
            </div>
            <div className="text-sm text-gray-500">Cache Hit Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatBytes(data.current.database.storage_used)}/{formatBytes(data.current.database.storage_total)}
            </div>
            <div className="text-sm text-gray-500">Storage Used</div>
          </div>
        </div>
      </div>

      {/* API Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          API Performance
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Response Time Trends
            </h4>
            <div className="h-48">
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.historical.response_time}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTimestamp}
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()} />
                    <Line 
                      type="monotone" 
                      dataKey="avg" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Avg Response Time (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="p95" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="95th Percentile (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              API Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {data.current.api.requests_per_minute}
                </div>
                <div className="text-sm text-gray-500">Requests/Min</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {data.current.api.error_rate}%
                </div>
                <div className="text-sm text-gray-500">Error Rate</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {data.current.api.avg_response_time}ms
                </div>
                <div className="text-sm text-gray-500">Avg Response</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {data.current.api.rate_limit_hits}
                </div>
                <div className="text-sm text-gray-500">Rate Limit Hits</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;

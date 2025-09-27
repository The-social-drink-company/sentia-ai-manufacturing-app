import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  ServerIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  CloudIcon,
  CpuChipIcon,
  CircleStackIcon,
  WifiIcon,
  BoltIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function SystemAdminPanel() {
  const [systemStatus, setSystemStatus] = useState({
    database: { status: 'healthy', latency: '12ms', connections: 23 },
    apiServer: { status: 'healthy', uptime: '99.97%', requests: 15420 },
    mcpServer: { status: 'healthy', load: '68%', memory: '2.1GB' },
    storage: { status: 'warning', usage: '87%', available: '2.3TB' },
    security: { status: 'healthy', threats: 0, lastScan: '2 hours ago' }
  });

  const [logs, setLogs] = useState([
    { id: 1, level: 'info', message: 'System backup completed successfully', timestamp: '2024-09-26 10:15:32', service: 'backup' },
    { id: 2, level: 'warning', message: 'High memory usage detected on server-02', timestamp: '2024-09-26 10:08:15', service: 'monitoring' },
    { id: 3, level: 'info', message: 'Database optimization completed', timestamp: '2024-09-26 09:45:22', service: 'database' },
    { id: 4, level: 'error', message: 'Failed to connect to external API endpoint', timestamp: '2024-09-26 09:30:11', service: 'api' },
    { id: 5, level: 'info', message: 'Security scan completed - no threats detected', timestamp: '2024-09-26 08:15:43', service: 'security' }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        database: { ...prev.database, connections: Math.max(10, prev.database.connections + Math.floor(Math.random() * 3) - 1) },
        apiServer: { ...prev.apiServer, requests: prev.apiServer.requests + Math.floor(Math.random() * 50) },
        mcpServer: { ...prev.mcpServer, load: `${Math.max(50, Math.min(90, parseInt(prev.mcpServer.load) + Math.floor(Math.random() * 6) - 3))}%` }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const systemServices = [
    {
      name: 'Web Application',
      status: 'running',
      port: '3000',
      uptime: '7d 14h 23m',
      memory: '512MB',
      cpu: '15%'
    },
    {
      name: 'API Server',
      status: 'running',
      port: '5000',
      uptime: '7d 14h 23m',
      memory: '1.2GB',
      cpu: '32%'
    },
    {
      name: 'MCP Server',
      status: 'running',
      port: '3001',
      uptime: '5d 8h 45m',
      memory: '2.1GB',
      cpu: '68%'
    },
    {
      name: 'Database',
      status: 'running',
      port: '5432',
      uptime: '15d 6h 12m',
      memory: '4.8GB',
      cpu: '22%'
    },
    {
      name: 'Redis Cache',
      status: 'running',
      port: '6379',
      uptime: '15d 6h 12m',
      memory: '256MB',
      cpu: '8%'
    },
    {
      name: 'Load Balancer',
      status: 'maintenance',
      port: '80/443',
      uptime: '0m',
      memory: '0MB',
      cpu: '0%'
    }
  ];

  const configurationSettings = [
    { category: 'Security', key: 'SSL Certificate', value: 'Valid until 2025-03-15', status: 'good' },
    { category: 'Security', key: 'API Rate Limiting', value: '1000 req/hour', status: 'good' },
    { category: 'Performance', key: 'Cache Expiration', value: '24 hours', status: 'good' },
    { category: 'Performance', key: 'Connection Pool', value: '50 connections', status: 'warning' },
    { category: 'Monitoring', key: 'Log Retention', value: '30 days', status: 'good' },
    { category: 'Monitoring', key: 'Alert Thresholds', value: 'CPU >80%, Memory >90%', status: 'good' },
    { category: 'Backup', key: 'Backup Schedule', value: 'Daily at 2:00 AM', status: 'good' },
    { category: 'Backup', key: 'Backup Retention', value: '7 days local, 30 days cloud', status: 'good' }
  ];

  const getStatusColor = (_status) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'critical':
      case 'stopped': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (_status) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'good': return <CheckCircleIcon className="w-4 h-4" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'error':
      case 'critical':
      case 'stopped': return <XCircleIcon className="w-4 h-4" />;
      case 'maintenance': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Cog6ToothIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                System Administration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monitor and manage system infrastructure
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* System Health Overview */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Health Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(systemStatus).map(([key, data]) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </h4>
                  <div className={`px-2 py-1 rounded-full flex items-center space-x-1 ${getStatusColor(data.status)}`}>
                    {getStatusIcon(data.status)}
                    <span className="text-xs font-medium capitalize">{data.status}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {Object.entries(data).slice(1).map(([metric, value]) => (
                    <div key={metric} className="flex justify-between text-xs">
                      <span className="text-gray-500 capitalize">{metric.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Services */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Services
            </h3>
            <div className="space-y-3">
              {systemServices.map((service, _index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                        <span className="text-sm font-medium capitalize">{service.status}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
                        <p className="text-sm text-gray-500">Port: {service.port} • Uptime: {service.uptime}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{service.memory}</p>
                        <p className="text-xs text-gray-500">Memory</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{service.cpu}</p>
                        <p className="text-xs text-gray-500">CPU</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                          <ClockIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Logs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent System Logs
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{log.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white mb-1">{log.message}</p>
                  <p className="text-xs text-gray-500">Service: {log.service}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Settings */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuration Settings
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Setting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {configurationSettings.map((setting, _index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {setting.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {setting.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {setting.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(setting.status)}`}>
                        {getStatusIcon(setting.status)}
                        <span className="ml-1 capitalize">{setting.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'System Backup', icon: CircleStackIcon, color: 'blue' },
              { label: 'Performance Monitor', icon: CpuChipIcon, color: 'green' },
              { label: 'Security Scan', icon: ShieldCheckIcon, color: 'red' },
              { label: 'System Logs', icon: DocumentTextIcon, color: 'purple' }
            ].map((action, _index) => (
              <button
                key={index}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 dark:hover:bg-${action.color}-900/20 transition-all duration-200`}
              >
                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
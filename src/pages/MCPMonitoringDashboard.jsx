import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ServerIcon,
  SignalIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CircleStackIcon,
  CpuChipIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const MCPMonitoringDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch MCP status
  const { data: mcpStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['mcp-status'],
    queryFn: async () => {
      const response = await fetch('/api/mcp/status');
      if (!response.ok) throw new Error('Failed to fetch MCP status');
      return response.json();
    },
    refetchInterval: autoRefresh ? 10000 : false,
    retry: 2
  });

  // Fetch WebSocket stats
  const { data: wsStats, refetch: refetchWsStats } = useQuery({
    queryKey: ['websocket-stats'],
    queryFn: async () => {
      const response = await fetch('/api/mcp/websocket/stats');
      if (!response.ok) throw new Error('Failed to fetch WebSocket stats');
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false
  });

  // Fetch sync status
  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const response = await fetch('/api/mcp/sync/status');
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false
  });

  // Handle manual refresh
  const handleManualRefresh = () => {
    refetchStatus();
    refetchWsStats();
    refetchSyncStatus();
    toast.success('Data refreshed');
  };

  // Handle WebSocket reconnect
  const handleReconnect = async () => {
    try {
      const response = await fetch('/api/mcp/websocket/reconnect', {
        method: 'POST'
      });
      if (response.ok) {
        toast.success('WebSocket reconnection initiated');
        setTimeout(() => refetchWsStats(), 2000);
      }
    } catch (error) {
      toast.error('Failed to reconnect WebSocket');
    }
  };

  // Handle sync trigger
  const handleSyncTrigger = async (service) => {
    try {
      const response = await fetch(`/api/mcp/sync/trigger/${service}`, {
        method: 'POST'
      });
      if (response.ok) {
        toast.success(`${service} sync triggered`);
        setTimeout(() => refetchSyncStatus(), 2000);
      }
    } catch (error) {
      toast.error(`Failed to trigger ${service} sync`);
    }
  };

  // Handle auto-sync toggle
  const handleAutoSyncToggle = async (enable) => {
    try {
      const endpoint = enable ? '/api/mcp/sync/enable' : '/api/mcp/sync/disable';
      const response = await fetch(endpoint, { method: 'POST' });
      if (response.ok) {
        toast.success(`Auto-sync ${enable ? 'enabled' : 'disabled'}`);
        setTimeout(() => refetchSyncStatus(), 1000);
      }
    } catch (error) {
      toast.error(`Failed to ${enable ? 'enable' : 'disable'} auto-sync`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'success':
      case 'healthy':
        return 'text-green-500';
      case 'syncing':
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
      case 'failed':
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'success':
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'syncing':
      case 'connecting':
        return <ArrowPathIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'disconnected':
      case 'failed':
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Loading MCP monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MCP Integration Monitor</h1>
            <p className="text-gray-600 mt-1">
              Real-time monitoring of MCP Server, WebSocket connections, and API synchronization
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                autoRefresh
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BoltIcon className="w-4 h-4" />
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* MCP Server Status */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MCP Server</p>
              <p className={`text-lg font-semibold ${getStatusColor(mcpStatus?.mcp?.status)}`}>
                {mcpStatus?.mcp?.status || 'Unknown'}
              </p>
            </div>
            <ServerIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Service ID: {mcpStatus?.mcp?.serviceId?.substring(0, 8)}...
          </div>
        </div>

        {/* WebSocket Status */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">WebSocket</p>
              <p className={`text-lg font-semibold ${getStatusColor(wsStats?.currentStatus)}`}>
                {wsStats?.currentStatus || 'Unknown'}
              </p>
            </div>
            <SignalIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Uptime: {wsStats?.uptimeFormatted || '0s'}
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <p className="text-lg font-semibold text-green-500">
                {mcpStatus?.neonBranch || 'Unknown'}
              </p>
            </div>
            <CircleStackIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Neon PostgreSQL
          </div>
        </div>

        {/* Auto-Sync Status */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Auto-Sync</p>
              <p className={`text-lg font-semibold ${
                syncStatus?.enabled ? 'text-green-500' : 'text-gray-500'
              }`}>
                {syncStatus?.enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <CloudArrowUpIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {syncStatus?.activeJobs?.length || 0} active jobs
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('websocket')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'websocket'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            WebSocket
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sync'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Synchronization
          </button>
          <button
            onClick={() => setActiveTab('apis')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'apis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            API Status
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">System Overview</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">MCP Server Information</h3>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">URL:</dt>
                    <dd className="text-sm font-mono text-gray-900">
                      {mcpStatus?.mcp?.url || 'Not configured'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Environment:</dt>
                    <dd className="text-sm text-gray-900">{mcpStatus?.environment}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Service ID:</dt>
                    <dd className="text-sm font-mono text-gray-900">
                      {mcpStatus?.mcp?.serviceId}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">System Metrics</h3>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Messages Received:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.messagesReceived || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Success Rate:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.successRate || 0}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Errors:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.errors || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'websocket' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">WebSocket Connection</h2>
              <button
                onClick={handleReconnect}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Reconnect
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Connection Stats</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Status:</dt>
                    <dd className="flex items-center gap-2">
                      {getStatusIcon(wsStats?.currentStatus)}
                      <span className={`text-sm font-medium ${getStatusColor(wsStats?.currentStatus)}`}>
                        {wsStats?.currentStatus}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Connection Attempts:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.connectionAttempts || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Successful:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.successfulConnections || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Failed:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.failedConnections || 0}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Message Stats</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Messages Received:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.messagesReceived || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Messages Sent:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.messagesSent || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Avg Messages/Min:</dt>
                    <dd className="text-sm text-gray-900">
                      {wsStats?.averageMessagesPerMinute || 0}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Uptime:</dt>
                    <dd className="text-sm text-gray-900">{wsStats?.uptimeFormatted || '0s'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">API Synchronization</h2>
              <button
                onClick={() => handleAutoSyncToggle(!syncStatus?.enabled)}
                className={`px-3 py-1 rounded text-sm ${
                  syncStatus?.enabled
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {syncStatus?.enabled ? 'Disable' : 'Enable'} Auto-Sync
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(syncStatus?.syncStatus || {}).map(([service, status]) => (
                <div key={service} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.status)}
                      <div>
                        <h3 className="font-medium capitalize">{service}</h3>
                        <p className="text-sm text-gray-500">
                          Last sync: {status.lastSync
                            ? new Date(status.lastSync).toLocaleString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSyncTrigger(service)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Sync Now
                    </button>
                  </div>
                  {status.errors > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      {status.errors} error(s) occurred
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'apis' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">External API Status</h2>
            <div className="grid grid-cols-2 gap-4">
              {['xero', 'shopify', 'amazon', 'unleashed'].map((api) => {
                const status = syncStatus?.syncStatus?.[api];
                return (
                  <div key={api} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium capitalize">{api}</h3>
                        <p className={`text-sm mt-1 ${getStatusColor(status?.status)}`}>
                          {status?.status || 'Not configured'}
                        </p>
                      </div>
                      <CpuChipIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Last Sync:</span>
                        <span className="text-gray-700">
                          {status?.lastSync
                            ? new Date(status.lastSync).toLocaleTimeString()
                            : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Errors:</span>
                        <span className="text-gray-700">{status?.errors || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCPMonitoringDashboard;
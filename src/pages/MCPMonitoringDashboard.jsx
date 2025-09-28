import React, { useState, useEffect } from 'react';
import {
  CpuChipIcon,
  ServerIcon,
  CloudIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BoltIcon,
  ArrowPathIcon,
  ChartBarIcon,
  SignalIcon,
  BeakerIcon,
  EyeIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

export default function MCPMonitoringDashboard() {
  const [isConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [mcpMetrics, setMcpMetrics] = useState({
    uptime: '99.8%',
    requests: 847,
    responses: 835,
    errors: 12,
    avgResponseTime: '245ms',
    activeConnections: 23
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setMcpMetrics(prev => ({
        ...prev,
        requests: prev.requests + Math.floor(Math.random() * 5),
        responses: prev.responses + Math.floor(Math.random() * 5),
        errors: prev.errors + (Math.random() > 0.9 ? 1 : 0),
        avgResponseTime: `${Math.floor(200 + Math.random() * 100)}ms`,
        activeConnections: Math.max(15, prev.activeConnections + Math.floor(Math.random() * 3) - 1)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const mcpServices = [
    {
      name: 'AI Central Nervous System',
      status: 'operational',
      endpoint: 'https://mcp-server-tkyu.onrender.com',
      version: '2024.11.05',
      lastSeen: '2 minutes ago',
      tools: 10,
      load: 78
    },
    {
      name: 'LLM Orchestration',
      status: 'processing',
      endpoint: 'Claude 3.5 Sonnet',
      version: 'v3.5',
      lastSeen: '1 minute ago',
      tools: 3,
      load: 65
    },
    {
      name: 'Unified API Interface',
      status: 'operational',
      endpoint: 'api-gateway',
      version: '1.2.0',
      lastSeen: '30 seconds ago',
      tools: 7,
      load: 42
    },
    {
      name: 'Vector Database',
      status: 'indexing',
      endpoint: 'postgresql+pgvector',
      version: '15.4',
      lastSeen: '1 minute ago',
      tools: 4,
      load: 89
    },
    {
      name: 'Decision Engine',
      status: 'learning',
      endpoint: 'ai-decisions',
      version: '1.0.0',
      lastSeen: '45 seconds ago',
      tools: 5,
      load: 55
    },
    {
      name: 'WebSocket Broadcaster',
      status: 'operational',
      endpoint: 'ws://realtime',
      version: '1.1.0',
      lastSeen: '15 seconds ago',
      tools: 2,
      load: 23
    }
  ];

  const recentRequests = [
    { id: 1, tool: 'ai_manufacturing_request', status: 'success', duration: '234ms', timestamp: '2 min ago' },
    { id: 2, tool: 'system_status_check', status: 'success', duration: '156ms', timestamp: '3 min ago' },
    { id: 3, tool: 'unified_api_call', status: 'success', duration: '387ms', timestamp: '4 min ago' },
    { id: 4, tool: 'inventory_optimization', status: 'processing', duration: '1.2s', timestamp: '5 min ago' },
    { id: 5, tool: 'demand_forecast', status: 'success', duration: '892ms', timestamp: '6 min ago' },
    { id: 6, tool: 'quality_analysis', status: 'error', duration: '45ms', timestamp: '7 min ago' },
    { id: 7, tool: 'production_schedule', status: 'success', duration: '567ms', timestamp: '8 min ago' },
    { id: 8, tool: 'financial_analysis', status: 'success', duration: '334ms', timestamp: '9 min ago' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'processing':
      case 'indexing':
      case 'learning': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircleIcon className="w-4 h-4" />;
      case 'processing':
      case 'indexing':
      case 'learning': return <EyeIcon className="w-4 h-4" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'error':
      case 'critical': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BeakerIcon className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MCP Monitoring Dashboard</h1>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" />
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2">
                <ArrowPathIcon className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                <p className="text-xl font-bold text-green-600">{mcpMetrics.uptime}</p>
              </div>
              <ArrowPathIcon className="w-6 h-6 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Requests</p>
                <p className="text-xl font-bold text-blue-600">{mcpMetrics.requests.toLocaleString()}</p>
              </div>
              <SignalIcon className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Responses</p>
                <p className="text-xl font-bold text-purple-600">{mcpMetrics.responses.toLocaleString()}</p>
              </div>
              <CheckCircleIcon className="w-6 h-6 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</p>
                <p className="text-xl font-bold text-red-600">{mcpMetrics.errors}</p>
              </div>
              <XCircleIcon className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Time</p>
                <p className="text-xl font-bold text-orange-600">{mcpMetrics.avgResponseTime}</p>
              </div>
              <BoltIcon className="w-6 h-6 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Connections</p>
                <p className="text-xl font-bold text-teal-600">{mcpMetrics.activeConnections}</p>
              </div>
              <CloudIcon className="w-6 h-6 text-teal-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MCP Services Status */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ServerIcon className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">MCP Services</h2>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {mcpServices.filter(s => s.status === 'operational').length} / {mcpServices.length} Operational
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mcpServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded-full flex items-center space-x-1 ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                        <span className="text-xs font-medium capitalize">{service.status}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
                        <p className="text-sm text-gray-500">{service.endpoint}</p>
                        <p className="text-xs text-gray-400">v{service.version} • {service.lastSeen}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{service.tools}</p>
                        <p className="text-xs text-gray-500">Tools</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{service.load}%</p>
                        <p className="text-xs text-gray-500">Load</p>
                      </div>
                      <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            service.load > 90 ? 'bg-red-500' :
                            service.load > 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${service.load}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <CommandLineIcon className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Requests</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        request.status === 'success' ? 'bg-green-500' :
                        request.status === 'processing' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {request.tool}
                        </p>
                        <p className="text-xs text-gray-500">{request.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${
                        request.status === 'success' ? 'text-green-600' :
                        request.status === 'processing' ? 'text-blue-600' :
                        'text-red-600'
                      } capitalize`}>
                        {request.status}
                      </p>
                      <p className="text-xs text-gray-400">{request.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Charts Placeholder */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request Volume</h3>
              <ChartBarIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart visualization would go here</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Response Times</h3>
              <BoltIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="h-48 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart visualization would go here</p>
            </div>
          </div>
        </div>

        {/* Health Check Summary */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Health Check Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900 dark:text-green-100">All Systems Operational</h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                6/6 MCP services are running normally
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <EyeIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Active Processing</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                AI systems are learning and processing data
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="w-5 h-5 text-purple-600" />
                <h3 className="font-medium text-purple-900 dark:text-purple-100">Performance Optimal</h3>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Response times within acceptable ranges
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
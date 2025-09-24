import React, { useState, useEffect } from 'react';
import { 
  ServerIcon,
  CloudArrowUpIcon,
  CircleStackIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const DataIntegrationWidget = () => {
  const [realTimeStats, setRealTimeStats] = useState({
    recordsProcessed: 48276,
    apiCalls: 1847,
    dataStreams: 12,
    errorRate: 0.02
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        recordsProcessed: prev.recordsProcessed + Math.floor(0;
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const agentData = {
    id: 'data-integration',
    name: 'Data Integration Agent',
    version: '1.5.0',
    status: 'running',
    completion: 70,
    cycles: 4,
    startTime: '2025-09-05T08:15:00Z',
    lastUpdate: new Date().toISOString(),
    description: 'Enterprise-grade live data pipeline implementation',
    primaryColor: '#06b6d4',
    icon: <ServerIcon className="w-8 h-8" />
  };

  const integrations = [
    {
      name: 'Unleashed ERP',
      status: 'active',
      type: 'REST API',
      frequency: '5 min',
      lastSync: '2 min ago',
      recordsToday: 12456,
      health: 100,
      endpoints: ['products', 'inventory', 'orders', 'customers', 'suppliers']
    },
    {
      name: 'Amazon SP-API',
      status: 'active',
      type: 'OAuth 2.0',
      frequency: '15 min',
      lastSync: '5 min ago',
      recordsToday: 8234,
      health: 98,
      endpoints: ['orders', 'inventory', 'pricing', 'fulfillment', 'reports']
    },
    {
      name: 'Shopify API',
      status: 'active',
      type: 'GraphQL',
      frequency: '10 min',
      lastSync: '3 min ago',
      recordsToday: 6789,
      health: 100,
      endpoints: ['products', 'orders', 'customers', 'analytics', 'inventory']
    },
    {
      name: 'Neon PostgreSQL',
      status: 'active',
      type: 'Direct Connection',
      frequency: 'Real-time',
      lastSync: 'Live',
      recordsToday: 21053,
      health: 100,
      endpoints: ['read', 'write', 'replicate', 'backup', 'monitor']
    }
  ];

  const tasks = [
    { name: 'Enhanced live data service', status: 'completed', duration: '45m' },
    { name: 'Data validation & error handling', status: 'completed', duration: '30m' },
    { name: 'Intelligent caching system', status: 'completed', duration: '1h 15m' },
    { name: 'Data quality monitoring', status: 'running', progress: 75, eta: '15m' },
    { name: 'Fallback systems', status: 'pending', eta: '30m' }
  ];

  const dataFlowMetrics = {
    inbound: {
      rate: '1,247 rec/s',
      volume: '3.4 GB/h',
      sources: 4
    },
    processing: {
      latency: '45ms',
      throughput: '98.7%',
      queued: 234
    },
    outbound: {
      rate: '1,198 rec/s',
      cached: '82%',
      delivered: '99.98%'
    }
  };

  const getHealthColor = (health) => {
    if (health >= 95) return 'text-green-600';
    if (health >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-cyan-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              {agentData.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{agentData.name}</h3>
              <p className="text-sm text-gray-600">{agentData.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs text-gray-500">Version: {agentData.version}</span>
                <span className="text-xs text-gray-500">Cycles: {agentData.cycles}</span>
                <span className="text-xs text-gray-500">Uptime: 99.98%</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-cyan-600">{agentData.completion}%</div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
              <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
              RUNNING
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500" 
                 style={{ width: `${agentData.completion}%` }}></div>
          </div>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-cyan-700">{realTimeStats.recordsProcessed.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Records Processed</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700">{realTimeStats.apiCalls.toLocaleString()}</div>
            <div className="text-xs text-gray-600">API Calls</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700">{realTimeStats.dataStreams}</div>
            <div className="text-xs text-gray-600">Active Streams</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-700">{(realTimeStats.errorRate * 100).toFixed(2)}%</div>
            <div className="text-xs text-gray-600">Error Rate</div>
          </div>
        </div>
      </div>

      {/* Data Integrations */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Live Data Integrations</h4>
        <div className="space-y-4">
          {integrations.map((integration, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <CircleStackIcon className="w-6 h-6 text-cyan-600" />
                  <div>
                    <h5 className="font-semibold text-gray-900">{integration.name}</h5>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                      <span>{integration.type}</span>
                      <span>•</span>
                      <span>Sync: {integration.frequency}</span>
                      <span>•</span>
                      <span>Last: {integration.lastSync}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getHealthColor(integration.health)}`}>
                    {integration.health}%
                  </div>
                  <div className="text-xs text-gray-500">Health</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-sm font-semibold text-gray-700">{integration.recordsToday.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Records Today</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className={`text-sm font-semibold ${getStatusBadge(integration.status)} px-2 py-1 rounded-full inline-block`}>
                    {integration.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {integration.endpoints.map((endpoint, idx) => (
                  <span key={idx} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs">
                    {endpoint}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Flow Metrics */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Data Pipeline Flow</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CloudArrowUpIcon className="w-6 h-6 text-cyan-600" />
              <span className="text-sm font-semibold text-gray-700">Inbound</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rate:</span>
                <span className="font-semibold">{dataFlowMetrics.inbound.rate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Volume:</span>
                <span className="font-semibold">{dataFlowMetrics.inbound.volume}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sources:</span>
                <span className="font-semibold">{dataFlowMetrics.inbound.sources}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <BoltIcon className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Processing</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Latency:</span>
                <span className="font-semibold">{dataFlowMetrics.processing.latency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Throughput:</span>
                <span className="font-semibold">{dataFlowMetrics.processing.throughput}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Queued:</span>
                <span className="font-semibold">{dataFlowMetrics.processing.queued}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <ShieldCheckIcon className="w-6 h-6 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">Outbound</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rate:</span>
                <span className="font-semibold">{dataFlowMetrics.outbound.rate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cached:</span>
                <span className="font-semibold">{dataFlowMetrics.outbound.cached}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivered:</span>
                <span className="font-semibold text-green-600">{dataFlowMetrics.outbound.delivered}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Tasks */}
      <div className="p-6 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Tasks</h4>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {task.status === 'completed' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                {task.status === 'running' && <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />}
                {task.status === 'pending' && <ClockIcon className="w-5 h-5 text-gray-400" />}
                <span className="text-sm text-gray-700">{task.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                {task.progress && (
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${task.progress}%` }}></div>
                  </div>
                )}
                <span className="text-xs text-gray-500">
                  {task.duration || task.eta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">Live data streaming active</span>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date(agentData.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataIntegrationWidget;
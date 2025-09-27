import React, { useState, useEffect } from 'react';
import {
  CpuChipIcon,
  ServerIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  EyeIcon,
  Cog6ToothIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

export default function MissionControl() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // Mock real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(new Date());
      // Simulate alert updates
      setSystemAlerts(prev => {
        const newAlerts = [...prev];
        if (Math.random() > 0.7) {
          newAlerts.unshift({
            id: Date.now(),
            type: Math.random() > 0.5 ? 'warning' : 'info',
            message: `System ${Math.floor(Math.random() * 10)} status update`,
            timestamp: new Date(),
            source: 'Production Line ' + Math.ceil(Math.random() * 5)
          });
        }
        return newAlerts.slice(0, 10);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const systemMetrics = {
    overall: { status: 'healthy', uptime: '99.97%', response: '124ms' },
    production: { status: 'active', efficiency: '94.2%', output: '2,847 units' },
    quality: { status: 'monitoring', defect_rate: '0.8%', passed: '99.2%' },
    inventory: { status: 'optimal', stock_level: '87%', turnover: '12.4x' },
    finance: { status: 'stable', cash_flow: '+$124K', ar_days: '28.5' },
    ai_systems: { status: 'learning', confidence: '96.8%', predictions: '847' }
  };

  const criticalSystems = [
    { name: 'Production Lines', status: 'operational', load: 87, issues: 0 },
    { name: 'Quality Control', status: 'monitoring', load: 65, issues: 1 },
    { name: 'Inventory Systems', status: 'operational', load: 72, issues: 0 },
    { name: 'Financial APIs', status: 'operational', load: 43, issues: 0 },
    { name: 'AI Analytics', status: 'processing', load: 91, issues: 0 },
    { name: 'MCP Server', status: 'operational', load: 78, issues: 0 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
      case 'healthy':
      case 'active':
      case 'optimal':
      case 'stable': return 'text-green-600 bg-green-100';
      case 'monitoring':
      case 'processing':
      case 'learning': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
      case 'healthy':
      case 'active':
      case 'optimal':
      case 'stable': return <CheckCircleIcon className="w-5 h-5" />;
      case 'monitoring':
      case 'processing':
      case 'learning': return <EyeIcon className="w-5 h-5" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'critical':
      case 'error': return <XCircleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
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
                <CommandLineIcon className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mission Control</h1>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" />
                <span>Last updated: {refreshTime.toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* System Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {Object.entries(systemMetrics).map(([key, metrics]) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {key.replace('_', ' ')}
                </h3>
                <div className={`px-2 py-1 rounded-full flex items-center space-x-1 ${getStatusColor(metrics.status)}`}>
                  {getStatusIcon(metrics.status)}
                  <span className="text-xs font-medium capitalize">{metrics.status}</span>
                </div>
              </div>
              <div className="space-y-1">
                {Object.entries(metrics).slice(1).map(([metric, value]) => (
                  <div key={metric} className="flex justify-between text-xs">
                    <span className="text-gray-500 capitalize">{metric.replace('_', ' ')}:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical Systems Monitor */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ServerIcon className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Critical Systems</h2>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Monitoring</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {criticalSystems.map((system, __index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        system.status === 'operational' ? 'bg-green-500' :
                        system.status === 'monitoring' || system.status === 'processing' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{system.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{system.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{system.load}%</p>
                        <p className="text-xs text-gray-500">Load</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${system.issues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {system.issues}
                        </p>
                        <p className="text-xs text-gray-500">Issues</p>
                      </div>
                      <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            system.load > 90 ? 'bg-red-500' :
                            system.load > 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${system.load}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Alerts</h2>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {systemAlerts.length}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {systemAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-500">All systems normal</p>
                  </div>
                ) : (
                  systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === 'warning' ? 'bg-yellow-500' :
                        alert.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500">{alert.source}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {alert.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Uptime</p>
                <p className="text-2xl font-bold text-green-600">99.97%</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
              <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-600">124ms</p>
                <p className="text-xs text-gray-500">-15ms from yesterday</p>
              </div>
              <BoltIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-purple-600">47</p>
                <p className="text-xs text-gray-500">+3 from last hour</p>
              </div>
              <EyeIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Load</p>
                <p className="text-2xl font-bold text-orange-600">73%</p>
                <p className="text-xs text-gray-500">Normal range</p>
              </div>
              <CpuChipIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'System Health', icon: ShieldCheckIcon, color: 'blue' },
              { label: 'Performance Report', icon: ArrowTrendingUpIcon, color: 'green' },
              { label: 'Alert History', icon: ExclamationTriangleIcon, color: 'yellow' },
              { label: 'System Logs', icon: CommandLineIcon, color: 'gray' },
              { label: 'Configuration', icon: Cog6ToothIcon, color: 'purple' },
              { label: 'Maintenance', icon: ServerIcon, color: 'red' }
            ].map((action, __index) => (
              <button
                key={index}
                className={`flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 dark:hover:bg-${action.color}-900/20 transition-all duration-200`}
              >
                <action.icon className={`w-6 h-6 text-${action.color}-600 mb-2`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
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
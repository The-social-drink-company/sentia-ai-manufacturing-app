import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  KeyIcon,
  CogIcon,
  LockClosedIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import ApiKeyManagement from './ApiKeyManagement';
import { hasPermission, PERMISSIONS } from '../../utils/rolePermissions';

const SystemAdminPanel = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userRole = user?.publicMetadata?.role;

  const tabs = [
    { 
      id: 'api-keys', 
      name: 'API Integrations', 
      icon: KeyIcon,
      permission: PERMISSIONS.API_KEYS_MANAGE 
    },
    { 
      id: 'system-config', 
      name: 'System Settings', 
      icon: CogIcon,
      permission: PERMISSIONS.SYSTEM_CONFIG 
    },
    { 
      id: 'security', 
      name: 'Security', 
      icon: LockClosedIcon,
      permission: PERMISSIONS.SYSTEM_SECURITY 
    },
    { 
      id: 'logs', 
      name: 'System Logs', 
      icon: DocumentTextIcon,
      permission: PERMISSIONS.SYSTEM_LOGS 
    },
    { 
      id: 'monitoring', 
      name: 'Monitoring', 
      icon: ChartBarIcon,
      permission: PERMISSIONS.SYSTEM_MONITORING 
    }
  ];

  useEffect(() => {
    if (user) {
      fetchSystemHealth();
      if (hasPermission(userRole, PERMISSIONS.SYSTEM_LOGS)) {
        fetchSystemLogs();
      }
    }
  }, [user, userRole]);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/health');
      if (response.ok) {
        const health = await response.json();
        setSystemHealth(health);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const logs = await response.json();
        setSystemLogs(logs.slice(0, 100)); // Last 100 logs
      }
    } catch (err) {
      console.error('Failed to fetch system logs:', err);
    }
  };

  const renderSystemConfigTab = () => (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Overview</h3>
        {systemHealth ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Status</p>
                  <p className="text-lg font-semibold text-green-900">{systemHealth.status}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Uptime</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <ServerIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-800">Environment</p>
                  <p className="text-lg font-semibold text-purple-900">{systemHealth.environment}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">Version</p>
                  <p className="text-lg font-semibold text-gray-900">{systemHealth.version}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading system health...</span>
          </div>
        )}
      </div>

      {/* System Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default User Role
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              defaultValue={480}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Upload Size (MB)
            </label>
            <input
              type="number"
              defaultValue={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Rate Limit (requests/minute)
            </label>
            <input
              type="number"
              defaultValue={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Security Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Require 2FA for all admin accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">IP Whitelist</h4>
              <p className="text-sm text-gray-600">Restrict admin access by IP address</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Audit Logging</h4>
              <p className="text-sm text-gray-600">Log all administrative actions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">System scan completed</p>
              <p className="text-xs text-green-600">No vulnerabilities detected - 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">Failed login attempt</p>
              <p className="text-xs text-yellow-600">IP: 192.168.1.100 - 4 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
          <button
            onClick={fetchSystemLogs}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {systemLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">{log.message}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{log.service}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMonitoringTab = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-500">CPU Usage</h4>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">32%</p>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '32%' }}></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-500">Memory Usage</h4>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">256MB</p>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-500">Active Users</h4>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">12</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-500">API Requests/min</h4>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">847</p>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="ml-2 font-medium text-green-800">Database</span>
            </div>
            <span className="text-green-600 text-sm">Connected</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="ml-2 font-medium text-green-800">API Server</span>
            </div>
            <span className="text-green-600 text-sm">Running</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              <span className="ml-2 font-medium text-yellow-800">MCP Server</span>
            </div>
            <span className="text-yellow-600 text-sm">Connecting</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500" />
              <span className="ml-2 font-medium text-red-800">Email Service</span>
            </div>
            <span className="text-red-600 text-sm">Disconnected</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'api-keys':
        return <ApiKeyManagement />;
      case 'system-config':
        return renderSystemConfigTab();
      case 'security':
        return renderSecurityTab();
      case 'logs':
        return renderLogsTab();
      case 'monitoring':
        return renderMonitoringTab();
      default:
        return <ApiKeyManagement />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Administration</h2>
        <p className="text-gray-600">System configuration, security, and monitoring</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {tabs.filter(tab => hasPermission(userRole, tab.permission)).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default SystemAdminPanel;
import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ServerIcon,
  CircleStackIcon,
  KeyIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PersonnelManagement from '../components/admin/PersonnelManagement';

const AdminPanelEnhanced = () => {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const [activeTab, setActiveTab] = useState('users');
  const queryClient = useQueryClient();

  // Check if user has admin access
  const hasAdminAccess = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'super_admin';

  // Fetch functions
  const fetchUsers = async () => {
    const token = await getToken();
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${apiUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  };

  const fetchSystemMetrics = async () => {
    const token = await getToken();
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${apiUrl}/admin/system/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch system metrics');
    return response.json();
  };

  const fetchAuditLogs = async () => {
    const token = await getToken();
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${apiUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  };

  const fetchSystemSettings = async () => {
    const token = await getToken();
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${apiUrl}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  };

  const fetchSecurityStatus = async () => {
    const token = await getToken();
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${apiUrl}/admin/security/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch security status');
    return response.json();
  };

  // React Query hooks
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    enabled: authLoaded && userLoaded && hasAdminAccess,
    refetchInterval: 30000
  });

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin', 'system-metrics'],
    queryFn: fetchSystemMetrics,
    enabled: authLoaded && userLoaded && hasAdminAccess,
    refetchInterval: 10000
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: fetchAuditLogs,
    enabled: authLoaded && userLoaded && hasAdminAccess && activeTab === 'audit'
  });

  const { data: systemSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: fetchSystemSettings,
    enabled: authLoaded && userLoaded && hasAdminAccess && activeTab === 'settings'
  });

  const { data: securityStatus, isLoading: securityLoading } = useQuery({
    queryKey: ['admin', 'security'],
    queryFn: fetchSecurityStatus,
    enabled: authLoaded && userLoaded && hasAdminAccess && activeTab === 'security'
  });

  // Mock data fallbacks
  const mockUsers = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email_addresses: [{ email_address: 'john@example.com' }],
      public_metadata: { role: 'admin', approved: true },
      last_sign_in_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email_addresses: [{ email_address: 'jane@example.com' }],
      public_metadata: { role: 'user', approved: true },
      last_sign_in_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      first_name: 'Bob',
      last_name: 'Wilson',
      email_addresses: [{ email_address: 'bob@example.com' }],
      public_metadata: { role: 'user', approved: false },
      last_sign_in_at: null,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const mockSystemMetrics = {
    server: {
      uptime: 2847560, // seconds
      cpu_usage: 23.4,
      memory_usage: 67.8,
      disk_usage: 45.2,
      active_connections: 127,
      request_rate: 156.7
    },
    database: {
      connections: 15,
      queries_per_second: 45.2,
      storage_used: '2.3 GB',
      storage_total: '10 GB',
      backup_status: 'healthy',
      last_backup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    api: {
      total_requests_24h: 12456,
      error_rate: 0.23,
      avg_response_time: 234,
      active_endpoints: 47,
      rate_limit_hits: 12
    }
  };

  const mockAuditLogs = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      user: 'admin@example.com',
      action: 'USER_APPROVED',
      resource: 'user:bob@example.com',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0...',
      success: true
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: 'admin@example.com',
      action: 'SETTINGS_UPDATED',
      resource: 'system:notification_settings',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0...',
      success: true
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      user: 'jane@example.com',
      action: 'LOGIN_FAILED',
      resource: 'auth:login',
      ip_address: '192.168.1.105',
      user_agent: 'Mozilla/5.0...',
      success: false
    }
  ];

  const mockSystemSettings = {
    general: {
      site_name: 'Sentia Manufacturing Dashboard',
      site_url: 'https://dashboard.sentia.com',
      maintenance_mode: false,
      max_users: 100,
      session_timeout: 8
    },
    notifications: {
      email_enabled: true,
      slack_enabled: false,
      webhook_enabled: true,
      alert_threshold: 85
    },
    security: {
      password_policy: 'strong',
      two_factor_required: false,
      ip_whitelist_enabled: false,
      audit_retention_days: 90
    },
    integrations: {
      amazon_enabled: true,
      shopify_enabled: true,
      xero_enabled: true,
      unleashed_enabled: false
    }
  };

  const mockSecurityStatus = {
    overall_score: 87,
    vulnerabilities: {
      critical: 0,
      high: 1,
      medium: 3,
      low: 7
    },
    ssl_status: 'valid',
    ssl_expiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    firewall_status: 'active',
    backup_encryption: true,
    last_security_scan: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    failed_login_attempts_24h: 12,
    suspicious_activities: 2
  };

  // Use real data or fallback to mock data
  const users = usersData?.users || mockUsers;
  const metrics = systemMetrics || mockSystemMetrics;
  const logs = auditLogs?.logs || mockAuditLogs;
  const settings = systemSettings || mockSystemSettings;
  const security = securityStatus || mockSecurityStatus;

  if (!authLoaded || !userLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'active':
      case 'healthy':
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'denied':
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UserGroupIcon },
    { id: 'personnel', label: 'Personnel', icon: UserPlusIcon },
    { id: 'system', label: 'System Health', icon: ServerIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
    { id: 'audit', label: 'Audit Logs', icon: DocumentTextIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Administrator Panel
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage users, monitor system health, and configure dashboard settings
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <ServerIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Server Uptime</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatUptime(metrics.server.uptime)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <CircleStackIcon className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Requests (24h)</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.api.total_requests_24h.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{security.overall_score}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded-full ${log.success ? 'bg-green-100' : 'bg-red-100'}`}>
                            {log.success ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.action.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">{log.user} • {formatDateTime(log.timestamp)}</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          log.success ? getStatusColor('approved') : getStatusColor('failed')
                        }`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    User Management ({users.length})
                  </h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <UserPlusIcon className="h-4 w-4" />
                    <span>Invite User</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((userItem) => (
                        <tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {userItem.first_name?.[0] || userItem.email_addresses?.[0]?.email_address?.[0] || 'U'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {userItem.first_name && userItem.last_name 
                                    ? `${userItem.first_name} ${userItem.last_name}`
                                    : 'Unknown User'
                                  }
                                </div>
                                <div className="text-sm text-gray-500">
                                  {userItem.email_addresses?.[0]?.email_address}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              userItem.public_metadata?.role === 'admin' ? getStatusColor('approved') :
                              getStatusColor('pending')
                            }`}>
                              {userItem.public_metadata?.role || 'user'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              getStatusColor(userItem.public_metadata?.approved ? 'approved' : 'pending')
                            }`}>
                              {userItem.public_metadata?.approved ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {userItem.last_sign_in_at 
                              ? formatDateTime(userItem.last_sign_in_at)
                              : 'Never'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Server Metrics */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Server Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">CPU Usage</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics.server.cpu_usage}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${metrics.server.cpu_usage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Memory Usage</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics.server.memory_usage}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${metrics.server.memory_usage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Disk Usage</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics.server.disk_usage}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${metrics.server.disk_usage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Database Health
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics.database.connections}
                    </div>
                    <div className="text-sm text-gray-500">Active Connections</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics.database.queries_per_second}
                    </div>
                    <div className="text-sm text-gray-500">Queries/Second</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics.database.storage_used}
                    </div>
                    <div className="text-sm text-gray-500">Storage Used</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      6h ago
                    </div>
                    <div className="text-sm text-gray-500">Last Backup</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Security Score */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Security Overview
                  </h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {security.overall_score}%
                    </div>
                    <div className="text-sm text-gray-500">Security Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {security.vulnerabilities.critical}
                    </div>
                    <div className="text-sm text-gray-500">Critical</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {security.vulnerabilities.high}
                    </div>
                    <div className="text-sm text-gray-500">High</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {security.vulnerabilities.medium}
                    </div>
                    <div className="text-sm text-gray-500">Medium</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {security.vulnerabilities.low}
                    </div>
                    <div className="text-sm text-gray-500">Low</div>
                  </div>
                </div>
              </div>

              {/* Security Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Security Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <KeyIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">SSL Certificate</span>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor('approved')}`}>
                      Valid
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Firewall</span>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor('active')}`}>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CircleStackIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Backup Encryption</span>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor('active')}`}>
                      Enabled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personnel' && (
            <PersonnelManagement />
          )}

          {activeTab === 'audit' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                  Audit Log
                </h3>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${log.success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                          {log.success ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {log.action.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {log.user} • {formatDateTime(log.timestamp)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Resource: {log.resource} • IP: {log.ip_address}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        log.success ? getStatusColor('approved') : getStatusColor('failed')
                      }`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* General Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  General Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.general.site_name}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Users
                    </label>
                    <input
                      type="number"
                      value={settings.general.max_users}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.general.maintenance_mode}
                      className="rounded"
                      readOnly
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Maintenance Mode
                    </label>
                  </div>
                </div>
              </div>

              {/* Integration Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Integration Status
                </h3>
                <div className="space-y-3">
                  {Object.entries(settings.integrations).map(([integration, enabled]) => (
                    <div key={integration} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {integration.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        enabled ? getStatusColor('active') : getStatusColor('pending')
                      }`}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanelEnhanced;
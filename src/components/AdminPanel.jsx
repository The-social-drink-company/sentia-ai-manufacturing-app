import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { 
  Users, Settings, Database, Activity, AlertTriangle,
  Plus, Edit, Trash2, Save, X, Search, Filter,
  Shield, Key, Globe, Server, Cpu, HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('users');
  const queryClient = useQueryClient();

  const tabs = [
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'system', label: 'System', icon: <Settings className="w-4 h-4" /> },
    { id: 'database', label: 'Database', icon: <Database className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">
            System administration and user management for {user?.firstName || 'Administrator'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'system' && <SystemTab />}
          {activeTab === 'database' && <DatabaseTab />}
          {activeTab === 'monitoring' && <MonitoringTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
};

const UsersTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Mock users data - in production, this would come from Clerk API
  const mockUsers = [
    { id: '1', name: 'John Smith', email: 'john@sentia.com', role: 'Admin', status: 'Active', lastLogin: '2025-01-06' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@sentia.com', role: 'Manager', status: 'Active', lastLogin: '2025-01-05' },
    { id: '3', name: 'Mike Wilson', email: 'mike@sentia.com', role: 'Operator', status: 'Active', lastLogin: '2025-01-06' },
    { id: '4', name: 'Emily Davis', email: 'emily@sentia.com', role: 'Viewer', status: 'Pending', lastLogin: 'Never' }
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">User Management</h2>
        <button 
          onClick={() => setShowAddUser(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'Operator' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'Active' ? 'bg-green-100 text-green-800' :
                    user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.lastLogin}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SystemTab = () => {
  const systemStats = {
    uptime: '99.9%',
    version: '1.2.0',
    environment: 'Production',
    deployedAt: '2025-01-06 10:30 UTC',
    lastBackup: '2025-01-06 02:00 UTC'
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">System Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Server className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium">System Uptime</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{systemStats.uptime}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Globe className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="font-medium">Environment</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{systemStats.environment}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Settings className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="font-medium">Version</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{systemStats.version}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-medium text-gray-900">Last Deployment</h3>
          <p className="text-gray-600">{systemStats.deployedAt}</p>
        </div>
        
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="font-medium text-gray-900">Last Backup</h3>
          <p className="text-gray-600">{systemStats.lastBackup}</p>
        </div>
      </div>
    </div>
  );
};

const DatabaseTab = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Database Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Database className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="font-medium">Connection Status</h3>
          </div>
          <p className="text-lg font-bold text-green-600">Connected</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <HardDrive className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium">Total Records</h3>
          </div>
          <p className="text-lg font-bold text-gray-900">847,392</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Cpu className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="font-medium">Query Performance</h3>
          </div>
          <p className="text-lg font-bold text-green-600">Optimal</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-4">Recent Database Activity</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Backup completed successfully</span>
            <span className="text-gray-500">2 hours ago</span>
          </div>
          <div className="flex justify-between">
            <span>Index optimization completed</span>
            <span className="text-gray-500">6 hours ago</span>
          </div>
          <div className="flex justify-between">
            <span>Migration applied: add_user_preferences</span>
            <span className="text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MonitoringTab = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">System Monitoring</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-4">API Endpoints Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Authentication</span>
              <span className="text-green-600 font-medium">✓ Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shopify Integration</span>
              <span className="text-green-600 font-medium">✓ Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Database</span>
              <span className="text-green-600 font-medium">✓ Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span>File Storage</span>
              <span className="text-yellow-600 font-medium">⚠ Warning</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-4">Recent Alerts</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">High API Usage</p>
                <p className="text-gray-600">Shopify API: 85% of daily limit</p>
              </div>
            </div>
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">Failed Backup</p>
                <p className="text-gray-600">Automatic backup failed at 02:00 UTC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecurityTab = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Two-Factor Authentication</h3>
            <span className="text-green-600 font-medium">Enabled</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            All admin users are required to use 2FA for enhanced security.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">API Key Rotation</h3>
            <span className="text-yellow-600 font-medium">Due Soon</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            API keys should be rotated every 90 days. Last rotation: 75 days ago.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Rotate Keys Now
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-4">Recent Security Events</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Admin login from new location</span>
              <span className="text-gray-500">2 hours ago</span>
            </div>
            <div className="flex justify-between">
              <span>API key accessed</span>
              <span className="text-gray-500">6 hours ago</span>
            </div>
            <div className="flex justify-between">
              <span>Password policy updated</span>
              <span className="text-gray-500">2 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
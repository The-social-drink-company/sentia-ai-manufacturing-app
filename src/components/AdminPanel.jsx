import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { 
  Users, Settings, Database, Activity, AlertTriangle,
  Plus, Edit, Trash2, Save, X, Search, Filter,
  Shield, Key, Globe, Server, Cpu, HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminUsers from './admin/pages/AdminUsers';

const AdminPanel = () => {
  const { data: session } = useSession();
  const user = session?.user;
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
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'system' && <SystemTab />}
          {activeTab === 'database' && <DatabaseTab />}
          {activeTab === 'monitoring' && <MonitoringTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
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
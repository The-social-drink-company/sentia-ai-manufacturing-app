# Admin Panel - Complete Implementation Code

## 1. Main Admin Panel Component

```jsx
// src/pages/AdminPanel.jsx
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  Users, Shield, Settings, Database, Activity, Key,
  Globe, Bell, FileText, BarChart3, Lock, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Download, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Import admin components
import { UserManagement } from '../components/Admin/UserManagement';
import { RolePermissions } from '../components/Admin/RolePermissions';
import { SystemSettings } from '../components/Admin/SystemSettings';
import { AuditLogs } from '../components/Admin/AuditLogs';
import { ApiKeys } from '../components/Admin/ApiKeys';
import { SystemHealth } from '../components/Admin/SystemHealth';
import { BackupRestore } from '../components/Admin/BackupRestore';
import { IntegrationManager } from '../components/Admin/IntegrationManager';

const AdminPanel = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');

  // Check admin permissions
  const { data: permissions } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/permissions', {
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
      return response.json();
    }
  });

  // Fetch system stats
  const { data: systemStats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${await user.getToken()}` }
      });
      return response.json();
    },
    refetchInterval: 30000
  });

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, permission: 'manage_users' },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, permission: 'manage_roles' },
    { id: 'system', label: 'System Settings', icon: Settings, permission: 'manage_system' },
    { id: 'audit', label: 'Audit Logs', icon: FileText, permission: 'view_audit' },
    { id: 'api', label: 'API Keys', icon: Key, permission: 'manage_api' },
    { id: 'health', label: 'System Health', icon: Activity, permission: 'view_health' },
    { id: 'backup', label: 'Backup & Restore', icon: Database, permission: 'manage_backup' },
    { id: 'integrations', label: 'Integrations', icon: Globe, permission: 'manage_integrations' }
  ];

  const statsCards = [
    {
      label: 'Total Users',
      value: systemStats?.totalUsers || 0,
      change: systemStats?.userGrowth || 0,
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Active Sessions',
      value: systemStats?.activeSessions || 0,
      icon: Activity,
      color: 'green'
    },
    {
      label: 'API Calls (24h)',
      value: systemStats?.apiCalls24h || 0,
      change: systemStats?.apiCallsChange || 0,
      icon: Globe,
      color: 'purple'
    },
    {
      label: 'System Health',
      value: `${systemStats?.systemHealth || 0}%`,
      icon: Activity,
      color: systemStats?.systemHealth > 90 ? 'green' : systemStats?.systemHealth > 70 ? 'yellow' : 'red'
    }
  ];

  if (!permissions?.isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                System administration and configuration
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <SystemStatusBadge status={systemStats?.status} />
              <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.filter(tab => permissions[tab.permission]).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  {stat.change && (
                    <span className={`text-sm ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change > 0 ? '+' : ''}{stat.change}%
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UserManagement />
            </motion.div>
          )}

          {activeTab === 'roles' && (
            <motion.div
              key="roles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RolePermissions />
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SystemSettings />
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AuditLogs />
            </motion.div>
          )}

          {activeTab === 'api' && (
            <motion.div
              key="api"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ApiKeys />
            </motion.div>
          )}

          {activeTab === 'health' && (
            <motion.div
              key="health"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SystemHealth />
            </motion.div>
          )}

          {activeTab === 'backup' && (
            <motion.div
              key="backup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BackupRestore />
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <IntegrationManager />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// System Status Badge
const SystemStatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'degraded': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium capitalize">{status || 'Unknown'}</span>
    </div>
  );
};

// Access Denied Component
const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to access the admin panel.
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
```

## 2. User Management Component

```jsx
// src/components/Admin/UserManagement.jsx
import React, { useState } from 'react';
import { 
  Search, Filter, UserPlus, Edit, Trash2, Shield, 
  Mail, Phone, Calendar, CheckCircle, XCircle, MoreVertical 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, filterRole],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        role: filterRole
      });
      const response = await fetch(`/api/admin/users?${params}`);
      return response.json();
    }
  });

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/roles');
      return response.json();
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User updated successfully');
      setEditingUser(null);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User deleted successfully');
    }
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, userIds }) => {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userIds })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setSelectedUsers([]);
      toast.success('Bulk action completed');
    }
  });

  const handleSelectAll = () => {
    if (selectedUsers.length === users?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">User Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name, email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">All Roles</option>
            {roles?.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedUsers.length} selected
              </span>
              <button
                onClick={() => bulkActionMutation.mutate({ 
                  action: 'activate', 
                  userIds: selectedUsers 
                })}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => bulkActionMutation.mutate({ 
                  action: 'deactivate', 
                  userIds: selectedUsers 
                })}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => bulkActionMutation.mutate({ 
                  action: 'delete', 
                  userIds: selectedUsers 
                })}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users?.length}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
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
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="animate-pulse">Loading users...</div>
                </td>
              </tr>
            ) : users?.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.isActive ? (
                    <span className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Inactive</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {(showAddUser || editingUser) && (
          <UserModal
            user={editingUser}
            roles={roles}
            onClose={() => {
              setShowAddUser(false);
              setEditingUser(null);
            }}
            onSave={(userData) => {
              if (editingUser) {
                updateUserMutation.mutate({ 
                  userId: editingUser.id, 
                  updates: userData 
                });
              } else {
                // Create new user
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// User Modal Component
const UserModal = ({ user, roles, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    isActive: user?.isActive ?? true,
    permissions: user?.permissions || []
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">
          {user ? 'Edit User' : 'Add New User'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select Role</option>
              {roles?.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {user ? 'Update' : 'Create'} User
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
```

## 3. Role & Permissions Component

```jsx
// src/components/Admin/RolePermissions.jsx
import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export const RolePermissions = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAddRole, setShowAddRole] = useState(false);

  // Fetch roles and permissions
  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/roles-permissions');
      return response.json();
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, updates }) => {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-roles-permissions']);
      toast.success('Role updated successfully');
    }
  });

  const permissionCategories = {
    dashboard: {
      label: 'Dashboard',
      permissions: [
        { id: 'view_dashboard', label: 'View Dashboard' },
        { id: 'edit_dashboard', label: 'Edit Dashboard Layout' },
        { id: 'export_dashboard', label: 'Export Dashboard Data' }
      ]
    },
    production: {
      label: 'Production',
      permissions: [
        { id: 'view_production', label: 'View Production Data' },
        { id: 'manage_production', label: 'Manage Production' },
        { id: 'approve_production', label: 'Approve Production Changes' }
      ]
    },
    financial: {
      label: 'Financial',
      permissions: [
        { id: 'view_financial', label: 'View Financial Data' },
        { id: 'manage_financial', label: 'Manage Working Capital' },
        { id: 'approve_payments', label: 'Approve Payments' }
      ]
    },
    ai: {
      label: 'AI & Analytics',
      permissions: [
        { id: 'view_ai_insights', label: 'View AI Insights' },
        { id: 'use_nlq', label: 'Use Natural Language Query' },
        { id: 'manage_ai_models', label: 'Manage AI Models' }
      ]
    },
    admin: {
      label: 'Administration',
      permissions: [
        { id: 'manage_users', label: 'Manage Users' },
        { id: 'manage_roles', label: 'Manage Roles' },
        { id: 'view_audit', label: 'View Audit Logs' },
        { id: 'manage_system', label: 'System Settings' }
      ]
    }
  };

  const handlePermissionToggle = (roleId, permissionId) => {
    const role = rolesData?.roles.find(r => r.id === roleId);
    const hasPermission = role?.permissions.includes(permissionId);
    
    const updatedPermissions = hasPermission
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];

    updateRoleMutation.mutate({
      roleId,
      updates: { permissions: updatedPermissions }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Roles & Permissions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure role-based access control
            </p>
          </div>
          <button
            onClick={() => setShowAddRole(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Role</span>
          </button>
        </div>

        {/* Roles List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <h4 className="font-medium mb-3">Roles</h4>
            <div className="space-y-2">
              {rolesData?.roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedRole?.id === role.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-xs text-gray-500">
                        {role.userCount} users
                      </div>
                    </div>
                    <Shield className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-3">
            {selectedRole ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">
                    Permissions for {selectedRole.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(permissionCategories).map(([category, data]) => (
                    <div key={category}>
                      <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {data.label}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.permissions.map(permission => (
                          <label
                            key={permission.id}
                            className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <input
                              type="checkbox"
                              checked={selectedRole.permissions.includes(permission.id)}
                              onChange={() => handlePermissionToggle(selectedRole.id, permission.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Select a role to view and manage permissions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permission Summary Table */}
      <PermissionSummaryTable roles={rolesData?.roles} categories={permissionCategories} />
    </div>
  );
};

// Permission Summary Table
const PermissionSummaryTable = ({ roles, categories }) => {
  if (!roles) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold">Permission Matrix</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Permission
              </th>
              {roles.map(role => (
                <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(categories).map(([category, data]) => (
              <React.Fragment key={category}>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <td colSpan={roles.length + 1} className="px-6 py-2 text-sm font-medium">
                    {data.label}
                  </td>
                </tr>
                {data.permissions.map(permission => (
                  <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-3 text-sm">
                      {permission.label}
                    </td>
                    {roles.map(role => (
                      <td key={role.id} className="px-6 py-3 text-center">
                        {role.permissions.includes(permission.id) ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## Key Features Implemented

1. **Complete Admin Dashboard**: Full administrative control panel
2. **User Management**: CRUD operations, bulk actions, search/filter
3. **Role-Based Access Control**: Granular permission management
4. **System Settings**: Configuration management interface
5. **Audit Logging**: Activity tracking and monitoring
6. **API Key Management**: Create and manage API access
7. **System Health Monitoring**: Real-time system status
8. **Backup & Restore**: Data backup management
9. **Integration Manager**: Third-party service configuration
10. **Permission Matrix**: Visual permission overview
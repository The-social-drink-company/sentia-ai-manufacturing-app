import React, { useState } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export default function UserAdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);

  const users = [
    {
      id: 'USR-001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@sentia.com',
      phone: '+1 (555) 123-4567',
      role: 'Admin',
      department: 'IT',
      status: 'active',
      lastLogin: '2024-09-26 09:15 AM',
      created: '2024-01-15',
      permissions: ['full_access', 'user_management', 'system_config']
    },
    {
      id: 'USR-002',
      name: 'Mike Chen',
      email: 'mike.chen@sentia.com',
      phone: '+1 (555) 234-5678',
      role: 'Manager',
      department: 'Operations',
      status: 'active',
      lastLogin: '2024-09-26 08:45 AM',
      created: '2024-02-20',
      permissions: ['dashboard_access', 'reports', 'production_view']
    },
    {
      id: 'USR-003',
      name: 'Emma Davis',
      email: 'emma.davis@sentia.com',
      phone: '+1 (555) 345-6789',
      role: 'Operator',
      department: 'Production',
      status: 'active',
      lastLogin: '2024-09-26 07:30 AM',
      created: '2024-03-10',
      permissions: ['dashboard_access', 'production_view', 'quality_control']
    },
    {
      id: 'USR-004',
      name: 'Tom Wilson',
      email: 'tom.wilson@sentia.com',
      phone: '+1 (555) 456-7890',
      role: 'Viewer',
      department: 'Finance',
      status: 'inactive',
      lastLogin: '2024-09-20 04:20 PM',
      created: '2024-04-05',
      permissions: ['dashboard_access']
    },
    {
      id: 'USR-005',
      name: 'Lisa Wang',
      email: 'lisa.wang@sentia.com',
      phone: '+1 (555) 567-8901',
      role: 'Manager',
      department: 'Quality',
      status: 'pending',
      lastLogin: 'Never',
      created: '2024-09-25',
      permissions: ['dashboard_access', 'quality_control', 'reports']
    },
    {
      id: 'USR-006',
      name: 'David Brown',
      email: 'david.brown@sentia.com',
      phone: '+1 (555) 678-9012',
      role: 'Operator',
      department: 'Maintenance',
      status: 'active',
      lastLogin: '2024-09-25 11:30 PM',
      created: '2024-05-15',
      permissions: ['dashboard_access', 'maintenance']
    }
  ];

  const roles = ['Admin', 'Manager', 'Operator', 'Viewer'];
  const departments = ['IT', 'Operations', 'Production', 'Quality', 'Finance', 'Maintenance'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'inactive': return <XCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'text-purple-600 bg-purple-100';
      case 'Manager': return 'text-blue-600 bg-blue-100';
      case 'Operator': return 'text-green-600 bg-green-100';
      case 'Viewer': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Administration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage user accounts, roles, and permissions
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredUsers.length} of {users.length} users
            </span>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role & Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <EnvelopeIcon className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <PhoneIcon className="w-3 h-3" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <p className="text-sm text-gray-500">{user.department}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusIcon(user.status)}
                      <span className="ml-1 capitalize">{user.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
                        <ShieldCheckIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{users.length}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Users</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {users.filter(u => u.status === 'pending').length}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Admins</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {users.filter(u => u.role === 'Admin').length}
                </p>
              </div>
              <ShieldCheckIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Bulk Import', icon: PlusIcon, color: 'blue' },
              { label: 'Export Users', icon: EyeIcon, color: 'green' },
              { label: 'Role Management', icon: ShieldCheckIcon, color: 'purple' },
              { label: 'User Settings', icon: Cog6ToothIcon, color: 'gray' }
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
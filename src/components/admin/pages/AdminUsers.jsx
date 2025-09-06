import { devLog } from '../../../lib/devLog.js';
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logInfo, logError } from '../../../lib/logger'
import {
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../../lib/utils'
import { useAuthRole } from '../../../hooks/useAuthRole.jsx'

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: CheckCircleIcon,
      text: 'Active'
    },
    locked: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: LockClosedIcon,
      text: 'Locked'
    },
    pending: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: ClockIcon,
      text: 'Pending'
    },
    suspended: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      icon: ExclamationTriangleIcon,
      text: 'Suspended'
    }
  }

  const config = statusConfig[status] || statusConfig.active
  const Icon = config.icon

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.color
    )}>
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </span>
  )
}

const RoleBadge = ({ role }) => {
  const roleConfig = {
    admin: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      text: 'Administrator'
    },
    manager: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      text: 'Manager'
    },
    operator: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      text: 'Operator'
    },
    viewer: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      text: 'Viewer'
    }
  }

  const config = roleConfig[role] || roleConfig.viewer

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.color
    )}>
      {config.text}
    </span>
  )
}

const UserModal = ({ user, isOpen, onClose, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState(
    user || {
      email: '',
      firstName: '',
      lastName: '',
      role: 'viewer',
      status: 'active',
      mfaEnabled: false
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={mode === 'edit'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="viewer">Viewer</option>
              <option value="operator">Operator</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="locked">Locked</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="mfaEnabled"
              checked={formData.mfaEnabled}
              onChange={(e) => setFormData({ ...formData, mfaEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="mfaEnabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Require Multi-Factor Authentication
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              {mode === 'create' ? 'Send Invitation' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AdminUsers = () => {
  const { hasPermission } = useAuthRole()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      return [
        {
          id: 1,
          email: 'john.admin@company.com',
          firstName: 'John',
          lastName: 'Administrator',
          role: 'admin',
          status: 'active',
          lastLogin: '2025-01-15T10:30:00Z',
          mfaEnabled: true,
          loginCount: 245,
          createdAt: '2024-06-01T00:00:00Z'
        },
        {
          id: 2,
          email: 'sarah.manager@company.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'manager',
          status: 'active',
          lastLogin: '2025-01-15T08:15:00Z',
          mfaEnabled: true,
          loginCount: 89,
          createdAt: '2024-08-15T00:00:00Z'
        },
        {
          id: 3,
          email: 'mike.operator@company.com',
          firstName: 'Mike',
          lastName: 'Wilson',
          role: 'operator',
          status: 'locked',
          lastLogin: '2025-01-10T16:45:00Z',
          mfaEnabled: false,
          loginCount: 156,
          createdAt: '2024-09-22T00:00:00Z'
        },
        {
          id: 4,
          email: 'emma.viewer@company.com',
          firstName: 'Emma',
          lastName: 'Davis',
          role: 'viewer',
          status: 'active',
          lastLogin: '2025-01-14T14:20:00Z',
          mfaEnabled: false,
          loginCount: 34,
          createdAt: '2024-12-01T00:00:00Z'
        },
        {
          id: 5,
          email: 'robert.pending@company.com',
          firstName: 'Robert',
          lastName: 'Brown',
          role: 'operator',
          status: 'pending',
          lastLogin: null,
          mfaEnabled: false,
          loginCount: 0,
          createdAt: '2025-01-14T00:00:00Z'
        }
      ]
    },
    refetchInterval: 30000
  })

  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  }) || []

  const handleCreateUser = () => {
    setSelectedUser(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSaveUser = async (userData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Refresh users list
      queryClient.invalidateQueries(['admin', 'users'])
      setIsModalOpen(false)
      
      logInfo('User saved', { component: 'AdminUsers', userData })
    } catch (error) {
      logError('Error saving user', error, { component: 'AdminUsers' })
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (!hasPermission('admin.users.edit')) return
    
    const newStatus = currentStatus === 'active' ? 'locked' : 'active'
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      queryClient.invalidateQueries(['admin', 'users'])
      logInfo('User status changed', { component: 'AdminUsers', userId, newStatus })
    } catch (error) {
      logError('Error updating user status', error, { component: 'AdminUsers', userId })
    }
  }

  const handleResetPassword = async (userId) => {
    if (!hasPermission('admin.users.edit')) return
    
    if (!confirm('This will send a password reset email to the user. Continue?')) return
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      logInfo('Password reset sent', { component: 'AdminUsers', userId })
      // Show success notification
    } catch (error) {
      logError('Error sending password reset', error, { component: 'AdminUsers', userId })
    }
  }

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never'
    
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)} days ago`
    
    return date.toLocaleDateString()
  }

  if (!hasPermission('admin.users.view')) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to view user management.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        
        {hasPermission('admin.users.create') && (
          <button
            onClick={handleCreateUser}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create User</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="operator">Operator</option>
            <option value="viewer">Viewer</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
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
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MFA
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatLastLogin(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.mfaEnabled ? (
                      <ShieldCheckIcon className="w-5 h-5 text-green-500" title="MFA Enabled" />
                    ) : (
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" title="MFA Disabled" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {hasPermission('admin.users.view') && (
                        <button
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      {hasPermission('admin.users.edit') && (
                        <>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Edit User"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.status)}
                            className={cn(
                              "hover:opacity-75",
                              user.status === 'active' 
                                ? "text-red-500" 
                                : "text-green-500"
                            )}
                            title={user.status === 'active' ? 'Lock User' : 'Unlock User'}
                          >
                            {user.status === 'active' ? (
                              <LockClosedIcon className="w-4 h-4" />
                            ) : (
                              <LockOpenIcon className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-yellow-500 hover:text-yellow-700"
                            title="Reset Password"
                          >
                            <KeyIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search or filters' : 'Get started by creating your first user'}
            </p>
          </div>
        )}
      </div>

      {/* User creation/edit modal */}
      <UserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        mode={modalMode}
      />
    </div>
  )
}

export default AdminUsers
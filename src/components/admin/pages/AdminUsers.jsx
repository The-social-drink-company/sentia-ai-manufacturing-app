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
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  EnvelopeIcon,
  UserPlusIcon,
  DocumentDuplicateIcon
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
    user: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      text: 'User'
    }
  }

  const config = roleConfig[role] || roleConfig.user

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
              <option value="user">User</option>
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
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
        const response = await fetch(`${apiUrl}/admin/users`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch users')
        }
        
        // Transform API data to match component expectations
        return data.users.map(user => ({
          id: user.id,
          email: user.email_addresses?.[0]?.email_address || '',
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          role: user.public_metadata?.role || 'user',
          status: user.public_metadata?.approved ? 'active' : 'pending',
          department: user.public_metadata?.department || '',
          lastLogin: user.last_sign_in_at,
          mfaEnabled: user.public_metadata?.mfaEnabled || false,
          loginCount: user.public_metadata?.loginCount || 0,
          createdAt: user.created_at,
          phoneNumbers: user.phone_numbers || [],
          permissions: user.public_metadata?.permissions || [],
          profileImage: user.profile_image_url
        }))
      } catch (error) {
        logError('Failed to fetch users from API', error, { component: 'AdminUsers' })
        return []
      }
    },
    refetchInterval: 30000
  })

  // Filter and sort users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  }) || []

  const sortedUsers = sortUsers(filteredUsers, sortConfig)

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

  const handleBulkAction = async (action) => {
    if (!hasPermission('admin.users.edit')) return
    
    const userIds = Array.from(selectedUsers)
    if (userIds.length === 0) return
    
    const actionText = {
      'activate': 'activate',
      'deactivate': 'deactivate',
      'delete': 'delete',
      'reset-password': 'send password reset emails to'
    }[action]
    
    if (!confirm(`This will ${actionText} ${userIds.length} user(s). Continue?`)) return
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      queryClient.invalidateQueries(['admin', 'users'])
      setSelectedUsers(new Set())
      setShowBulkActions(false)
      logInfo('Bulk action completed', { component: 'AdminUsers', action, userCount: userIds.length })
    } catch (error) {
      logError('Error performing bulk action', error, { component: 'AdminUsers', action })
    }
  }

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
    }
  }

  const sortUsers = (users, config) => {
    return [...users].sort((a, b) => {
      let aValue = a[config.key]
      let bValue = b[config.key]
      
      // Handle nested properties
      if (config.key === 'name') {
        aValue = `${a.firstName} ${a.lastName}`
        bValue = `${b.firstName} ${b.lastName}`
      }
      
      // Handle dates
      if (config.key === 'lastLogin') {
        aValue = aValue ? new Date(aValue) : new Date(0)
        bValue = bValue ? new Date(bValue) : new Date(0)
      }
      
      if (aValue < bValue) return config.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return config.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
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

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or username..."
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
            <option value="user">User</option>
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

          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 border rounded-md transition-colors",
              showBulkActions
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            )}
          >
            <Squares2X2Icon className="w-4 h-4" />
            <span>Bulk Actions</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  {selectedUsers.size} user(s) selected
                </span>
              </div>
              
              {selectedUsers.size > 0 && hasPermission('admin.users.edit') && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="px-3 py-1 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => handleBulkAction('reset-password')}
                    className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Reset Passwords
                  </button>
                  {hasPermission('admin.users.delete') && (
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900 dark:text-yellow-200 dark:hover:text-yellow-100"
              >
                {selectedUsers.size === sortedUsers.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900 dark:text-yellow-200 dark:hover:text-yellow-100"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {showBulkActions && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === sortedUsers.length && sortedUsers.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <span>User</span>
                    {sortConfig.key === 'name' && (
                      sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <span>Role</span>
                    {sortConfig.key === 'role' && (
                      sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <span>Status</span>
                    {sortConfig.key === 'status' && (
                      sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('lastLogin')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <span>Last Login</span>
                    {sortConfig.key === 'lastLogin' && (
                      sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                    )}
                  </button>
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
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {showBulkActions && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                  )}
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

        {sortedUsers.length === 0 && (
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
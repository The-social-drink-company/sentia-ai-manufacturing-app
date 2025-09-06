import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logInfo, logError } from '../../../lib/logger'
import {
  FlagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../../lib/utils'
import { useAuthRole } from '../../../hooks/useAuthRole.jsx'

const StatusToggle = ({ enabled, onToggle, disabled = false }) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

const RolloutSlider = ({ percentage, onChange, disabled = false }) => {
  return (
    <div className="flex items-center space-x-3">
      <input
        type="range"
        min="0"
        max="100"
        value={percentage}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
      <span className="text-sm font-medium text-gray-900 dark:text-white w-10">
        {percentage}%
      </span>
    </div>
  )
}

const TargetRoles = ({ roles, onChange, disabled = false }) => {
  const availableRoles = ['admin', 'manager', 'operator', 'viewer']
  
  const toggleRole = (role) => {
    if (disabled) return
    
    const newRoles = roles.includes(role)
      ? roles.filter(r => r !== role)
      : [...roles, role]
    
    onChange(newRoles)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableRoles.map(role => (
        <button
          key={role}
          onClick={() => toggleRole(role)}
          disabled={disabled}
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full border transition-colors',
            roles.includes(role)
              ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {role}
        </button>
      ))}
    </div>
  )
}

const FeatureFlagModal = ({ flag, isOpen, onClose, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState(
    flag || {
      flagKey: '',
      name: '',
      description: '',
      isEnabled: false,
      rolloutPercentage: 100,
      targetRoles: [],
      environment: process.env.NODE_ENV || 'development'
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create Feature Flag' : 'Edit Feature Flag'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Flag Key
            </label>
            <input
              type="text"
              value={formData.flagKey}
              onChange={(e) => setFormData({ ...formData, flagKey: e.target.value })}
              placeholder="e.g., feature_new_dashboard"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={mode === 'edit'}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Unique identifier for this feature flag (cannot be changed after creation)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., New Dashboard Interface"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe what this feature flag controls..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial State
            </label>
            <div className="flex items-center space-x-3">
              <StatusToggle
                enabled={formData.isEnabled}
                onToggle={() => setFormData({ ...formData, isEnabled: !formData.isEnabled })}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formData.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {formData.isEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rollout Percentage
                </label>
                <RolloutSlider
                  percentage={formData.rolloutPercentage}
                  onChange={(percentage) => setFormData({ ...formData, rolloutPercentage: percentage })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  What percentage of users should see this feature
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Roles (optional)
                </label>
                <TargetRoles
                  roles={formData.targetRoles}
                  onChange={(roles) => setFormData({ ...formData, targetRoles: roles })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to target all roles, or select specific roles
                </p>
              </div>
            </>
          )}

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
              {mode === 'create' ? 'Create Flag' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AdminFeatureFlags = () => {
  const { hasPermission } = useAuthRole()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [environmentFilter, setEnvironmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedFlag, setSelectedFlag] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedFlags, setExpandedFlags] = useState(new Set())

  // Fetch feature flags
  const { data: featureFlags, isLoading } = useQuery({
    queryKey: ['admin', 'feature-flags', searchTerm, environmentFilter, statusFilter],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      return [
        {
          id: 1,
          flagKey: 'feature_enhanced_dashboard',
          name: 'Enhanced Dashboard Interface',
          description: 'New dashboard with improved widgets and real-time data visualization',
          isEnabled: true,
          rolloutPercentage: 100,
          targetRoles: ['admin', 'manager'],
          environment: 'production',
          createdBy: 'john.admin@company.com',
          updatedBy: 'sarah.manager@company.com',
          createdAt: '2024-12-01T00:00:00Z',
          updatedAt: '2025-01-15T10:30:00Z',
          usageCount: 245
        },
        {
          id: 2,
          flagKey: 'feature_working_capital_optimizer',
          name: 'Working Capital Optimizer',
          description: 'Advanced working capital optimization algorithms and recommendations',
          isEnabled: false,
          rolloutPercentage: 0,
          targetRoles: [],
          environment: 'development',
          createdBy: 'mike.dev@company.com',
          updatedBy: 'mike.dev@company.com',
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
          usageCount: 0
        },
        {
          id: 3,
          flagKey: 'feature_forecast_beta',
          name: 'Forecasting Beta Features',
          description: 'Beta testing for new forecasting algorithms and UI improvements',
          isEnabled: true,
          rolloutPercentage: 25,
          targetRoles: ['admin'],
          environment: 'test',
          createdBy: 'sarah.manager@company.com',
          updatedBy: 'sarah.manager@company.com',
          createdAt: '2025-01-05T00:00:00Z',
          updatedAt: '2025-01-14T16:20:00Z',
          usageCount: 67
        },
        {
          id: 4,
          flagKey: 'feature_mobile_responsive',
          name: 'Mobile Responsive Layout',
          description: 'Mobile-optimized layouts for all dashboard pages',
          isEnabled: true,
          rolloutPercentage: 50,
          targetRoles: [],
          environment: 'test',
          createdBy: 'emma.designer@company.com',
          updatedBy: 'emma.designer@company.com',
          createdAt: '2024-11-20T00:00:00Z',
          updatedAt: '2025-01-12T14:15:00Z',
          usageCount: 123
        }
      ]
    },
    refetchInterval: 30000
  })

  // Filter feature flags
  const filteredFlags = featureFlags?.filter(flag => {
    const matchesSearch = searchTerm === '' || 
      flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.flagKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEnvironment = environmentFilter === 'all' || flag.environment === environmentFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && flag.isEnabled) ||
      (statusFilter === 'disabled' && !flag.isEnabled)
    
    return matchesSearch && matchesEnvironment && matchesStatus
  }) || []

  const toggleFlag = useMutation({
    mutationFn: async ({ flagId, enabled }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      logInfo('Toggling feature flag', { component: 'AdminFeatureFlags', flagId, enabled })
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'feature-flags'])
    }
  })

  const updateRollout = useMutation({
    mutationFn: async ({ flagId, percentage }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      logInfo('Updating rollout percentage', { component: 'AdminFeatureFlags', flagId, percentage })
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'feature-flags'])
    }
  })

  const handleCreateFlag = () => {
    setSelectedFlag(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditFlag = (flag) => {
    setSelectedFlag(flag)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSaveFlag = async (flagData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      queryClient.invalidateQueries(['admin', 'feature-flags'])
      setIsModalOpen(false)
      
      logInfo('Feature flag saved', { component: 'AdminFeatureFlags', flagData })
    } catch (error) {
      logError('Error saving feature flag', error, { component: 'AdminFeatureFlags' })
    }
  }

  const handleToggleFlag = (flag) => {
    if (!hasPermission('admin.feature_flags.edit')) return
    toggleFlag.mutate({ flagId: flag.id, enabled: !flag.isEnabled })
  }

  const handleRolloutChange = (flag, percentage) => {
    if (!hasPermission('admin.feature_flags.edit')) return
    updateRollout.mutate({ flagId: flag.id, percentage })
  }

  const toggleExpanded = (flagId) => {
    setExpandedFlags(prev => {
      const newSet = new Set(prev)
      if (newSet.has(flagId)) {
        newSet.delete(flagId)
      } else {
        newSet.add(flagId)
      }
      return newSet
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!hasPermission('admin.feature_flags.view')) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to view feature flags.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Flags</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control feature rollouts and experiment with new functionality
          </p>
        </div>
        
        {hasPermission('admin.feature_flags.create') && (
          <button
            onClick={handleCreateFlag}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Flag</span>
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
                placeholder="Search feature flags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          <select
            value={environmentFilter}
            onChange={(e) => setEnvironmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Environments</option>
            <option value="development">Development</option>
            <option value="test">Test</option>
            <option value="production">Production</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Feature flags list */}
      <div className="space-y-4">
        {filteredFlags.map((flag) => {
          const isExpanded = expandedFlags.has(flag.id)
          
          return (
            <div
              key={flag.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <button
                      onClick={() => toggleExpanded(flag.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </button>
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {flag.name}
                    </h3>
                    
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      flag.environment === 'production'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : flag.environment === 'test'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    )}>
                      {flag.environment}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {flag.description}
                  </p>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status:
                      </span>
                      <StatusToggle
                        enabled={flag.isEnabled}
                        onToggle={() => handleToggleFlag(flag)}
                        disabled={!hasPermission('admin.feature_flags.edit')}
                      />
                      <span className={cn(
                        'text-sm font-medium',
                        flag.isEnabled 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {flag.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    
                    {flag.isEnabled && (
                      <div className="flex items-center space-x-2 min-w-48">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Rollout:
                        </span>
                        <RolloutSlider
                          percentage={flag.rolloutPercentage}
                          onChange={(percentage) => handleRolloutChange(flag, percentage)}
                          disabled={!hasPermission('admin.feature_flags.edit')}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {hasPermission('admin.feature_flags.edit') && (
                    <button
                      onClick={() => handleEditFlag(flag)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Edit Flag"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Configuration
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Flag Key:</span>
                          <span className="font-mono text-gray-900 dark:text-white">
                            {flag.flagKey}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Environment:</span>
                          <span className="text-gray-900 dark:text-white">{flag.environment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Usage Count:</span>
                          <span className="text-gray-900 dark:text-white">{flag.usageCount}</span>
                        </div>
                        {flag.targetRoles.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Target Roles:</span>
                            <div className="flex space-x-1">
                              {flag.targetRoles.map(role => (
                                <span
                                  key={role}
                                  className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-900 dark:text-blue-200"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Audit Trail
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Created by:</span>
                          <span className="text-gray-900 dark:text-white">{flag.createdBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Created:</span>
                          <span className="text-gray-900 dark:text-white">
                            {formatDate(flag.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Last updated by:</span>
                          <span className="text-gray-900 dark:text-white">{flag.updatedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Last updated:</span>
                          <span className="text-gray-900 dark:text-white">
                            {formatDate(flag.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredFlags.length === 0 && (
        <div className="text-center py-12">
          <FlagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No feature flags found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search or filters' : 'Get started by creating your first feature flag'}
          </p>
        </div>
      )}

      {/* Feature flag creation/edit modal */}
      <FeatureFlagModal
        flag={selectedFlag}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFlag}
        mode={modalMode}
      />
    </div>
  )
}

export default AdminFeatureFlags
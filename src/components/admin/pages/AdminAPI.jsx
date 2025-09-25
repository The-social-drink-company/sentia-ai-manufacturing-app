import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logInfo, logError } from '../../../lib/logger'
import {
  KeyIcon,
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  XMarkIcon,
  Cog6ToothIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../../lib/utils'
const StatusBadge = ({ status, lastUsed }) => {
  const getStatusConfig = () => {
    if (status === 'revoked') return {
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: XMarkIcon,
      text: 'Revoked'
    }
    
    if (!lastUsed) return {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      icon: ClockIcon,
      text: 'Never Used'
    }
    
    const daysSinceUsed = Math.floor((new Date() - new Date(lastUsed)) / (1000 * 60 * 60 * 24))
    
    if (daysSinceUsed > 90) return {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: ExclamationTriangleIcon,
      text: 'Inactive'
    }
    
    if (daysSinceUsed > 30) return {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: ClockIcon,
      text: 'Low Usage'
    }
    
    return {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: CheckCircleIcon,
      text: 'Active'
    }
  }
  
  const config = getStatusConfig()
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

const APIKeyModal = ({ apiKey, isOpen, onClose, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState(
    apiKey || {
      name: '',
      description: '',
      scopes: [],
      expiresAt: null,
      rateLimitPerHour: 1000,
      environment: 'development'
    }
  )

  const availableScopes = [
    { id: 'read', name: 'Read Access', description: 'View data and reports' },
    { id: 'write', name: 'Write Access', description: 'Create and update resources' },
    { id: 'delete', name: 'Delete Access', description: 'Remove resources' },
    { id: 'admin', name: 'Admin Access', description: 'Full system administration' },
    { id: 'analytics', name: 'Analytics', description: 'Access to analytics and reports' },
    { id: 'integrations', name: 'Integrations', description: 'Manage external integrations' }
  ]

  const handleScopeToggle = (scopeId) => {
    setFormData(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scopeId)
        ? prev.scopes.filter(s => s !== scopeId)
        : [...prev.scopes, scopeId]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create API Key' : 'Edit API Key'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="My API Key"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="development">Development</option>
                <option value="testing">Testing</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rate Limit (per hour)
              </label>
              <input
                type="number"
                value={formData.rateLimitPerHour}
                onChange={(e) => setFormData({ ...formData, rateLimitPerHour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="1"
                max="10000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="What is this API key used for?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiration (optional)
              </label>
              <input
                type="date"
                value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  expiresAt: e.target.value ? `${e.target.value}T23:59:59Z` : null 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableScopes.map(scope => (
                  <label key={scope.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.scopes.includes(scope.id)}
                      onChange={() => handleScopeToggle(scope.id)}
                      className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {scope.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {scope.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
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
              {mode === 'create' ? 'Create API Key' : 'Update API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AdminAPI = () => {
  const { hasPermission } = useAuthRole()
  const queryClient = useQueryClient()
  const [selectedKey, setSelectedKey] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch API keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['admin', 'api-keys', searchTerm],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      return [
        {
          id: 1,
          name: 'Production Analytics API',
          key: 'sentia_prod_ak_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
          description: 'Used by analytics dashboard for real-time data',
          scopes: ['read', 'analytics'],
          environment: 'production',
          rateLimitPerHour: 5000,
          createdAt: '2025-01-01T00:00:00Z',
          lastUsed: '2025-09-08T12:30:00Z',
          usageCount: 45623,
          status: 'active',
          expiresAt: null
        },
        {
          id: 2,
          name: 'Development Testing Key',
          key: 'sentia_dev_ak_9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g',
          description: 'Testing API integration during development',
          scopes: ['read', 'write'],
          environment: 'development',
          rateLimitPerHour: 1000,
          createdAt: '2025-08-15T00:00:00Z',
          lastUsed: '2025-09-07T16:45:00Z',
          usageCount: 1234,
          status: 'active',
          expiresAt: null
        },
        {
          id: 3,
          name: 'Legacy Integration Key',
          key: 'sentia_leg_ak_f9e8d7c6b5a4938271605948372615048372610593',
          description: 'Legacy system integration - scheduled for deprecation',
          scopes: ['read'],
          environment: 'production',
          rateLimitPerHour: 100,
          createdAt: '2024-06-01T00:00:00Z',
          lastUsed: '2024-12-15T10:20:00Z',
          usageCount: 8456,
          status: 'active',
          expiresAt: '2025-12-31T23:59:59Z'
        },
        {
          id: 4,
          name: 'Revoked Admin Key',
          key: 'sentia_rev_ak_0000000000000000000000000000000000000000',
          description: 'Former admin key - revoked for security reasons',
          scopes: ['admin'],
          environment: 'production',
          rateLimitPerHour: 0,
          createdAt: '2024-03-01T00:00:00Z',
          lastUsed: '2024-03-15T09:30:00Z',
          usageCount: 234,
          status: 'revoked',
          expiresAt: null
        }
      ]
    },
    refetchInterval: 30000
  })

  const filteredKeys = apiKeys?.filter(key => 
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.environment.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleCreateKey = () => {
    setSelectedKey(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditKey = (key) => {
    setSelectedKey(key)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSaveKey = async (keyData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      queryClient.invalidateQueries(['admin', 'api-keys'])
      setIsModalOpen(false)
      logInfo('API key saved', { component: 'AdminAPI', keyData })
    } catch (error) {
      logError('Error saving API key', error, { component: 'AdminAPI' })
    }
  }

  const handleRevokeKey = async (keyId) => {
    if (!confirm('This will immediately revoke the API key. This action cannot be undone. Continue?')) return
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      queryClient.invalidateQueries(['admin', 'api-keys'])
      logInfo('API key revoked', { component: 'AdminAPI', keyId })
    } catch (error) {
      logError('Error revoking API key', error, { component: 'AdminAPI', keyId })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // Show success notification
  }

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const formatUsage = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  if (!hasPermission('admin.api.manage')) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to manage API keys.
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
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys & Tokens</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage API keys, authentication tokens, and external service credentials
          </p>
        </div>
        
        {hasPermission('admin.api.create') && (
          <button
            onClick={handleCreateKey}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create API Key</span>
          </button>
        )}
      </div>

      {/* Search and filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          placeholder="Search API keys..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* API Keys list */}
      <div className="space-y-4">
        {filteredKeys.map((apiKey) => {
          const isVisible = visibleKeys.has(apiKey.id)
          const maskedKey = `${apiKey.key.substring(0, 20)}${'•'.repeat(20)}${apiKey.key.substring(apiKey.key.length - 8)}`
          
          return (
            <div
              key={apiKey.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {apiKey.name}
                    </h3>
                    <StatusBadge status={apiKey.status} lastUsed={apiKey.lastUsed} />
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      apiKey.environment === 'production' 
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : apiKey.environment === 'testing'
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    )}>
                      {apiKey.environment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {apiKey.description}
                  </p>
                  
                  {/* API Key display */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                        {isVisible ? apiKey.key : maskedKey}
                      </code>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title={isVisible ? "Hide" : "Show"}
                        >
                          {isVisible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Copy to clipboard"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Scopes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {apiKey.scopes.map(scope => (
                          <span 
                            key={scope}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Rate Limit:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {apiKey.rateLimitPerHour}/hour
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Usage:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatUsage(apiKey.usageCount)} requests
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {hasPermission('admin.api.edit') && apiKey.status !== 'revoked' && (
                    <button
                      onClick={() => handleEditKey(apiKey)}
                      className="p-2 text-blue-500 hover:text-blue-700"
                      title="Edit API Key"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  
                  {hasPermission('admin.api.delete') && apiKey.status !== 'revoked' && (
                    <button
                      onClick={() => handleRevokeKey(apiKey.id)}
                      className="p-2 text-red-500 hover:text-red-700"
                      title="Revoke API Key"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filteredKeys.length === 0 && (
          <div className="text-center py-12">
            <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No API keys found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first API key to get started'}
            </p>
          </div>
        )}
      </div>

      {/* API Key modal */}
      <APIKeyModal
        apiKey={selectedKey}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveKey}
        mode={modalMode}
      />
    </div>
  )
}

export default AdminAPI
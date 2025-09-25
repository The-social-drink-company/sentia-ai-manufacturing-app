import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { logInfo } from '../../../lib/logger'
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  UserIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../../lib/utils'
const LogDetailModal = ({ log, isOpen, onClose }) => {
  if (!isOpen || !log) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Log Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timestamp
              </label>
              <div className="text-sm text-gray-900 dark:text-white">
                {new Intl.DateTimeFormat('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZoneName: 'short'
                }).format(new Date(log.timestamp))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Level
              </label>
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                {
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': log.level === 'error',
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': log.level === 'warning',
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': log.level === 'success',
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': log.level === 'info'
                }
              )}>
                {log.level.toUpperCase()}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User
              </label>
              <div className="text-sm text-gray-900 dark:text-white">
                {log.user} ({log.userRole})
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IP Address
              </label>
              <div className="text-sm font-mono text-gray-900 dark:text-white">
                {log.ipAddress}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <div className="text-sm text-gray-900 dark:text-white">
              {log.description}
            </div>
          </div>

          {log.details && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Details
              </label>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const AdminLogs = () => {
  const { hasPermission } = useAuthRole()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' })
  const [selectedLog, setSelectedLog] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Fetch logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin', 'logs', searchTerm, selectedLevel, selectedCategory],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      return [
        {
          id: 1,
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          level: 'info',
          category: 'authentication',
          action: 'User Login',
          user: 'daniel.kenny@sentiaspirits.com',
          userRole: 'Admin',
          description: 'Successful admin login from Chrome browser',
          ipAddress: '192.168.1.45',
          location: 'London, UK',
          details: { 
            browser: 'Chrome 119.0', 
            device: 'Desktop',
            sessionId: 'sess_1a2b3c4d5e6f'
          }
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 1000 * 60 * 32),
          level: 'warning',
          category: 'data_access',
          action: 'Sensitive Data Access',
          user: 'paul.roberts@sentiaspirits.com',
          userRole: 'Admin',
          description: 'Accessed API key management outside normal hours',
          ipAddress: '192.168.1.78',
          location: 'Manchester, UK',
          details: { 
            resource: 'API Keys Management',
            keysViewed: 4
          }
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          level: 'error',
          category: 'system',
          action: 'Failed API Call',
          user: 'system',
          userRole: 'System',
          description: 'Failed to sync with Railway deployment service',
          ipAddress: '10.0.0.1',
          location: 'Internal',
          details: { 
            endpoint: '/api/railway/sync',
            error: 'Connection timeout after 30s'
          }
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 1000 * 60 * 67),
          level: 'success',
          category: 'user_management',
          action: 'Bulk User Update',
          user: 'daniel.kenny@sentiaspirits.com',
          userRole: 'Admin',
          description: 'Performed bulk password reset for 5 users',
          ipAddress: '192.168.1.45',
          location: 'London, UK',
          details: { 
            operation: 'bulk_password_reset',
            userCount: 5
          }
        }
      ]
    },
    refetchInterval: 30000
  })

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'authentication', name: 'Authentication' },
    { id: 'user_management', name: 'User Management' },
    { id: 'api_management', name: 'API Management' },
    { id: 'data_access', name: 'Data Access' },
    { id: 'security', name: 'Security' },
    { id: 'system', name: 'System' }
  ]

  const levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'info', name: 'Info' },
    { id: 'success', name: 'Success' },
    { id: 'warning', name: 'Warning' },
    { id: 'error', name: 'Error' }
  ]

  // Filter and sort logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory
    
    return matchesSearch && matchesLevel && matchesCategory
  })

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aValue = a[sortConfig.key]
    let bValue = b[sortConfig.key]
    
    if (sortConfig.key === 'timestamp') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setIsDetailModalOpen(true)
  }

  const handleExportLogs = () => {
    logInfo('Logs exported', { component: 'AdminLogs', count: filteredLogs.length })
  }

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return ExclamationTriangleIcon
      case 'warning': return ExclamationTriangleIcon
      case 'success': return CheckCircleIcon
      default: return InformationCircleIcon
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp))
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - new Date(timestamp)
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (!hasPermission('admin.logs.view')) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to view system logs.
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
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs & Audit Trail</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor system activity, security events, and compliance logs
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasPermission('admin.logs.export') && (
            <button
              onClick={handleExportLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Last 24 hours</p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Security Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {logs.filter(l => l.category === 'security' || l.level === 'warning' || l.level === 'error').length}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">Requires attention</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admin Actions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {logs.filter(l => l.user !== 'system').length}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">User activity</p>
            </div>
            <UserIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">System Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {logs.filter(l => l.user === 'system').length}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Automated</p>
            </div>
            <ClockIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {levels.map(level => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('timestamp')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <span>Timestamp</span>
                    {sortConfig.key === 'timestamp' && (
                      sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedLogs.map((log) => {
                const LevelIcon = getLevelIcon(log.level)
                return (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatTimestamp(log.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getTimeAgo(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        {
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': log.level === 'error',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': log.level === 'warning',
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': log.level === 'success',
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': log.level === 'info'
                        }
                      )}>
                        <LevelIcon className="w-3 h-3 mr-1" />
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.action}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {log.category.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {log.user}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {log.userRole}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {log.description}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {log.ipAddress} • {log.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}

              {sortedLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No logs found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Try adjusting your search or filters' : 'No system logs match your current filters'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      <LogDetailModal
        log={selectedLog}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  )
}

export default AdminLogs
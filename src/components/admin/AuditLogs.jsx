import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DocumentTextIcon,
  UserIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateRange, setDateRange] = useState('today')

  // Mock audit log data
  const mockLogs = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      level: 'info',
      category: 'authentication',
      action: 'User Login',
      user: 'john.smith@sentia.com',
      userRole: 'Manager',
      description: 'Successful login from Chrome browser',
      ipAddress: '192.168.1.45',
      location: 'London, UK',
      details: { browser: 'Chrome 119.0', device: 'Desktop' }
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 32),
      level: 'warning',
      category: 'data_access',
      action: 'Sensitive Data Access',
      user: 'sarah.connor@sentia.com',
      userRole: 'Analyst',
      description: 'Accessed financial reports outside normal hours',
      ipAddress: '192.168.1.78',
      location: 'Manchester, UK',
      details: { report: 'Q3 Financial Summary', size: '2.3MB' }
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      level: 'error',
      category: 'system',
      action: 'Failed API Call',
      user: 'system',
      userRole: 'System',
      description: 'Failed to sync data with external ERP system',
      ipAddress: '10.0.0.1',
      location: 'Internal',
      details: { endpoint: '/api/erp/sync', error: 'Connection timeout' }
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1000 * 60 * 67),
      level: 'info',
      category: 'configuration',
      action: 'Settings Updated',
      user: 'admin@sentia.com',
      userRole: 'Administrator',
      description: 'Updated production line settings',
      ipAddress: '192.168.1.10',
      location: 'Birmingham, UK',
      details: { setting: 'Line 3 Speed', oldValue: '85%', newValue: '92%' }
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 1000 * 60 * 89),
      level: 'warning',
      category: 'security',
      action: 'Multiple Failed Logins',
      user: 'unknown',
      userRole: 'Unknown',
      description: '5 consecutive failed login attempts detected',
      ipAddress: '203.0.113.45',
      location: 'Unknown',
      details: { attempts: 5, timespan: '2 minutes', blocked: true }
    },
    {
      id: 6,
      timestamp: new Date(Date.now() - 1000 * 60 * 112),
      level: 'success',
      category: 'data_export',
      action: 'Data Export',
      user: 'mike.johnson@sentia.com',
      userRole: 'Operator',
      description: 'Exported production data for analysis',
      ipAddress: '192.168.1.67',
      location: 'Leeds, UK',
      details: { format: 'CSV', records: 15420, size: '4.7MB' }
    },
    {
      id: 7,
      timestamp: new Date(Date.now() - 1000 * 60 * 134),
      level: 'info',
      category: 'user_management',
      action: 'User Role Changed',
      user: 'admin@sentia.com',
      userRole: 'Administrator',
      description: 'Updated user role for team member',
      ipAddress: '192.168.1.10',
      location: 'Birmingham, UK',
      details: { targetUser: 'lisa.williams@sentia.com', oldRole: 'Viewer', newRole: 'Analyst' }
    },
    {
      id: 8,
      timestamp: new Date(Date.now() - 1000 * 60 * 156),
      level: 'error',
      category: 'data_integrity',
      action: 'Data Validation Failed',
      user: 'system',
      userRole: 'System',
      description: 'Inventory data validation failed during import',
      ipAddress: '10.0.0.1',
      location: 'Internal',
      details: { source: 'Warehouse System', errors: 23, records: 1245 }
    }
  ]

  const categories = [
    { id: 'all', name: 'All Categories', count: mockLogs.length },
    { id: 'authentication', name: 'Authentication', count: mockLogs.filter(l => l.category === 'authentication').length },
    { id: 'data_access', name: 'Data Access', count: mockLogs.filter(l => l.category === 'data_access').length },
    { id: 'security', name: 'Security', count: mockLogs.filter(l => l.category === 'security').length },
    { id: 'system', name: 'System', count: mockLogs.filter(l => l.category === 'system').length },
    { id: 'configuration', name: 'Configuration', count: mockLogs.filter(l => l.category === 'configuration').length },
    { id: 'user_management', name: 'User Management', count: mockLogs.filter(l => l.category === 'user_management').length }
  ]

  const levels = [
    { id: 'all', name: 'All Levels', count: mockLogs.length },
    { id: 'info', name: 'Info', count: mockLogs.filter(l => l.level === 'info').length },
    { id: 'warning', name: 'Warning', count: mockLogs.filter(l => l.level === 'warning').length },
    { id: 'error', name: 'Error', count: mockLogs.filter(l => l.level === 'error').length },
    { id: 'success', name: 'Success', count: mockLogs.filter(l => l.level === 'success').length }
  ]

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setLogs(mockLogs)
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => {
    let filtered = logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel
      const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory
      
      return matchesSearch && matchesLevel && matchesCategory
    })

    setFilteredLogs(filtered)
  }, [logs, searchTerm, selectedLevel, selectedCategory])

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-100 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'success': return 'text-green-600 bg-green-100 border-green-200'
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
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
    }).format(timestamp)
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ShieldCheckIcon className="w-8 h-8 mr-3 text-blue-600" />
            Audit Logs
          </h1>
          <p className="text-gray-600 mt-2">Security and access monitoring for compliance and troubleshooting</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              <p className="text-sm text-blue-600 mt-1">Last 24 hours</p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Security Events</p>
              <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.category === 'security').length}</p>
              <p className="text-sm text-red-600 mt-1">Requires attention</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">User Actions</p>
              <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.user !== 'system').length}</p>
              <p className="text-sm text-green-600 mt-1">Human activity</p>
            </div>
            <UserIcon className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Events</p>
              <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.user === 'system').length}</p>
              <p className="text-sm text-purple-600 mt-1">Automated</p>
            </div>
            <ClockIcon className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {levels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name} ({level.count})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No logs match your current filters
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const LevelIcon = getLevelIcon(log.level)
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTimestamp(log.timestamp)}</div>
                        <div className="text-xs text-gray-500">{getTimeAgo(log.timestamp)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(log.level)}`}>
                          <LevelIcon className="w-3 h-3 mr-1" />
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.action}</div>
                        <div className="text-xs text-gray-500 capitalize">{log.category.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.user}</div>
                        <div className="text-xs text-gray-500">{log.userRole}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{log.description}</div>
                        <div className="text-xs text-gray-500">{log.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {log.ipAddress}
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AuditLogs
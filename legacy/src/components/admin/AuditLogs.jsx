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

  // Fetch real audit logs from API - NO MOCK DATA
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/audit-logs')
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        console.warn('Audit logs API unavailable')
        setLogs([]) // No fallback mock data - empty if API fails
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      setLogs([]) // No fallback mock data - empty if API fails
    } finally {
      setLoading(false)
    }
  }
  // Categories and levels based on real data
  const categories = [
    { id: 'all', name: 'All Categories', count: logs.length },
    { id: 'authentication', name: 'Authentication', count: logs.filter(l => l.category === 'authentication').length },
    { id: 'data_access', name: 'Data Access', count: logs.filter(l => l.category === 'data_access').length },
    { id: 'security', name: 'Security', count: logs.filter(l => l.category === 'security').length },
    { id: 'system', name: 'System', count: logs.filter(l => l.category === 'system').length },
    { id: 'configuration', name: 'Configuration', count: logs.filter(l => l.category === 'configuration').length },
    { id: 'user_management', name: 'User Management', count: logs.filter(l => l.category === 'user_management').length }
  ]

  const levels = [
    { id: 'all', name: 'All Levels', count: logs.length },
    { id: 'info', name: 'Info', count: logs.filter(l => l.level === 'info').length },
    { id: 'warning', name: 'Warning', count: logs.filter(l => l.level === 'warning').length },
    { id: 'error', name: 'Error', count: logs.filter(l => l.level === 'error').length },
    { id: 'success', name: 'Success', count: logs.filter(l => l.level === 'success').length }
  ]

  useEffect(() => {
    fetchAuditLogs()
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

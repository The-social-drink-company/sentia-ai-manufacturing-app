import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BoltIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const SmartAutomation = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [automationRules, setAutomationRules] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock automation data
  const mockAutomationData = {
    workflows: [
      {
        id: 1,
        name: 'Production Line Optimization',
        description: 'Automatically adjusts production speed based on demand forecasts and quality metrics',
        status: 'active',
        trigger: 'Demand forecast update',
        lastRun: '2 hours ago',
        nextRun: 'In 4 hours',
        successRate: 96.5,
        timeSaved: 240,
        costSavings: 15000,
        actions: [
          'Analyze demand forecast',
          'Check quality metrics',
          'Adjust line speed',
          'Update production schedule',
          'Notify supervisors'
        ],
        metrics: {
          executions: 1247,
          avgTime: '45 seconds',
          errors: 12
        }
      },
      {
        id: 2,
        name: 'Inventory Reorder Automation',
        description: 'Monitors stock levels and automatically places orders when thresholds are reached',
        status: 'active',
        trigger: 'Stock level threshold',
        lastRun: '30 minutes ago',
        nextRun: 'Continuous monitoring',
        successRate: 99.2,
        timeSaved: 180,
        costSavings: 8500,
        actions: [
          'Monitor stock levels',
          'Check supplier availability',
          'Calculate reorder quantities',
          'Generate purchase orders',
          'Send to procurement'
        ],
        metrics: {
          executions: 892,
          avgTime: '12 seconds',
          errors: 3
        }
      },
      {
        id: 3,
        name: 'Quality Control Alerts',
        description: 'Automatically detects quality issues and triggers corrective actions',
        status: 'paused',
        trigger: 'Quality metric deviation',
        lastRun: '6 hours ago',
        nextRun: 'Paused',
        successRate: 94.8,
        timeSaved: 320,
        costSavings: 25000,
        actions: [
          'Monitor quality sensors',
          'Detect anomalies',
          'Stop affected production',
          'Alert quality team',
          'Log incident details'
        ],
        metrics: {
          executions: 456,
          avgTime: '8 seconds',
          errors: 24
        }
      },
      {
        id: 4,
        name: 'Maintenance Scheduling',
        description: 'Schedules preventive maintenance based on equipment condition and usage patterns',
        status: 'active',
        trigger: 'Equipment condition analysis',
        lastRun: '1 day ago',
        nextRun: 'Tomorrow 9:00 AM',
        successRate: 91.3,
        timeSaved: 480,
        costSavings: 35000,
        actions: [
          'Analyze equipment data',
          'Predict maintenance needs',
          'Check resource availability',
          'Schedule maintenance window',
          'Notify maintenance team'
        ],
        metrics: {
          executions: 234,
          avgTime: '2 minutes',
          errors: 8
        }
      },
      {
        id: 5,
        name: 'Energy Optimization',
        description: 'Adjusts energy usage based on production schedules and peak pricing',
        status: 'active',
        trigger: 'Energy price changes',
        lastRun: '15 minutes ago',
        nextRun: 'In 1 hour',
        successRate: 88.7,
        timeSaved: 120,
        costSavings: 12000,
        actions: [
          'Monitor energy prices',
          'Analyze production schedule',
          'Optimize equipment timing',
          'Adjust HVAC settings',
          'Generate savings report'
        ],
        metrics: {
          executions: 2156,
          avgTime: '30 seconds',
          errors: 67
        }
      }
    ],
    summary: {
      totalWorkflows: 5,
      activeWorkflows: 4,
      totalExecutions: 4985,
      totalTimeSaved: 1340,
      totalCostSavings: 95500,
      avgSuccessRate: 94.1
    }
  }

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setAutomationRules(mockAutomationData.workflows)
      setLoading(false)
    }, 800)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 border-green-200'
      case 'paused': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-100 border-red-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return PlayIcon
      case 'paused': return PauseIcon
      case 'error': return ExclamationTriangleIcon
      default: return StopIcon
    }
  }

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BoltIcon className="w-8 h-8 mr-3 text-orange-600" />
            Smart Automation
          </h1>
          <p className="text-gray-600 mt-2">Intelligent process automation for manufacturing excellence</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <SparklesIcon className="w-4 h-4 mr-2" />
            Create Workflow
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
              <p className="text-sm text-gray-600">Active Workflows</p>
              <p className="text-2xl font-bold text-gray-900">{mockAutomationData.summary.activeWorkflows}</p>
              <p className="text-sm text-green-600 mt-1">
                of {mockAutomationData.summary.totalWorkflows} total
              </p>
            </div>
            <CogIcon className="w-8 h-8 text-blue-500" />
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
              <p className="text-sm text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900">{mockAutomationData.summary.totalExecutions.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-1">This month</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-green-500" />
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
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(mockAutomationData.summary.totalTimeSaved)}</p>
              <p className="text-sm text-purple-600 mt-1">Manual effort</p>
            </div>
            <ClockIcon className="w-8 h-8 text-purple-500" />
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
              <p className="text-sm text-gray-600">Cost Savings</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockAutomationData.summary.totalCostSavings)}</p>
              <p className="text-sm text-green-600 mt-1">This year</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Workflow List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Automation Workflows</h3>
          <p className="text-sm text-gray-600">Manage and monitor your automated processes</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            automationRules.map((workflow, index) => {
              const StatusIcon = getStatusIcon(workflow.status)
              return (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BoltIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{workflow.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(workflow.status)}`}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {workflow.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 leading-relaxed">{workflow.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Trigger:</span>
                            <div className="font-medium text-gray-900">{workflow.trigger}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Run:</span>
                            <div className="font-medium text-gray-900">{workflow.lastRun}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Success Rate:</span>
                            <div className="font-medium text-green-600">{workflow.successRate}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Time Saved:</span>
                            <div className="font-medium text-purple-600">{formatTime(workflow.timeSaved)}/month</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <AdjustmentsHorizontalIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                        <ArrowPathIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Workflow Detail Modal */}
      <AnimatePresence>
        {selectedWorkflow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedWorkflow(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedWorkflow.name}</h3>
                    <p className="text-gray-600 mt-1">{selectedWorkflow.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedWorkflow(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedWorkflow.metrics.executions}</div>
                    <div className="text-sm text-gray-600">Total Executions</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedWorkflow.metrics.avgTime}</div>
                    <div className="text-sm text-gray-600">Avg Execution Time</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedWorkflow.metrics.errors}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Workflow Actions</h4>
                  <div className="space-y-2">
                    {selectedWorkflow.actions.map((action, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="text-gray-700">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    {selectedWorkflow.status === 'active' ? (
                      <button className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                        <PauseIcon className="w-4 h-4 mr-2" />
                        Pause
                      </button>
                    ) : (
                      <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Start
                      </button>
                    )}
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      Run Now
                    </button>
                  </div>
                  <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                    Configure
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SmartAutomation
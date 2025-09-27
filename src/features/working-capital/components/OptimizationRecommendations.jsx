import React from 'react'
import {
  LightBulbIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function OptimizationRecommendations({ recommendations, onActionClick }) {
  // Mock recommendations if not provided
  const defaultRecommendations = recommendations || [
    {
      id: 1,
      type: 'receivables',
      priority: 'high',
      title: 'Accelerate Invoice Collections',
      description: 'Current DSO is 45 days, target is 35 days. Focus on invoices over 30 days.',
      impact: 'Unlock $85,000 in cash',
      effort: 'medium',
      timeframe: '2-4 weeks',
      actions: [
        'Send follow-up emails to customers with overdue invoices',
        'Offer early payment discounts of 2% for payments within 10 days',
        'Implement automated reminder system'
      ],
      roi: 15.2,
      status: 'pending'
    },
    {
      id: 2,
      type: 'payables',
      priority: 'medium',
      title: 'Optimize Payment Terms',
      description: 'Extend DPO from 25 to 30 days while capturing early payment discounts.',
      impact: 'Improve cash position by $45,000',
      effort: 'low',
      timeframe: '1-2 weeks',
      actions: [
        'Negotiate extended payment terms with top 5 suppliers',
        'Analyze discount opportunities vs. extended terms',
        'Update payment scheduling system'
      ],
      roi: 8.7,
      status: 'pending'
    },
    {
      id: 3,
      type: 'inventory',
      priority: 'high',
      title: 'Reduce Inventory Holding',
      description: 'DIO is 30 days, target is 25 days. Reduce slow-moving stock.',
      impact: 'Free up $120,000 in working capital',
      effort: 'high',
      timeframe: '4-8 weeks',
      actions: [
        'Identify slow-moving inventory items',
        'Implement just-in-time ordering for high-turnover items',
        'Clear excess inventory through promotions'
      ],
      roi: 22.5,
      status: 'in_progress'
    },
    {
      id: 4,
      type: 'cash',
      priority: 'low',
      title: 'Optimize Cash Investment',
      description: 'Excess cash earning 0.5% in checking account. Consider short-term investments.',
      impact: 'Generate additional $8,000 annually',
      effort: 'low',
      timeframe: '1 week',
      actions: [
        'Move excess cash to high-yield money market account',
        'Consider 30-day treasury bills for temporary surplus',
        'Set up automated cash sweeping'
      ],
      roi: 4.2,
      status: 'pending'
    }
  ]

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      default:
        return <LightBulbIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'receivables':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'payables':
        return <ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      case 'inventory':
        return <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'cash':
        return <CurrencyDollarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      default:
        return <LightBulbIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Sort by priority and ROI
  const sortedRecommendations = [...defaultRecommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.roi - a.roi
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <LightBulbIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Optimization Recommendations
          </h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {sortedRecommendations.filter(r => r.status === 'pending').length} pending actions
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Potential Cash Impact</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(sortedRecommendations.reduce((sum, r) => {
              const match = r.impact.match(/\$([0-9,]+)/)
              return match ? sum + parseInt(match[1].replace(/,/g, '')) : sum
            }, 0))}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Average ROI</p>
          <p className="text-lg font-bold text-green-900 dark:text-green-100">
            {(sortedRecommendations.reduce((sum, r) => sum + r.roi, 0) / sortedRecommendations.length).toFixed(1)}%
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-sm text-purple-600 dark:text-purple-400">High Priority Items</p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {sortedRecommendations.filter(r => r.priority === 'high').length}
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {sortedRecommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {getTypeIcon(rec.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mr-2">
                      {rec.title}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                      'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {rec.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(rec.status)}
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {rec.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Impact and Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Impact</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{rec.impact}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ROI</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{rec.roi}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Timeframe</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{rec.timeframe}</p>
              </div>
            </div>

            {/* Action Items */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Action Items:</p>
              <ul className="space-y-1">
                {rec.actions.map((action, __index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  rec.effort === 'high' ? 'bg-red-500' :
                  rec.effort === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></span>
                {rec.effort.charAt(0).toUpperCase() + rec.effort.slice(1)} effort
              </div>
              <div className="flex space-x-2">
                {rec.status === 'pending' && (
                  <button
                    onClick={() => onActionClick && onActionClick(rec)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Start Implementation
                  </button>
                )}
                <button className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

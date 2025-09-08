import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LightBulbIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CpuChipIcon,
  BoltIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const AIInsights = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock AI insights data
  const mockInsights = [
    {
      id: 1,
      category: 'production',
      type: 'opportunity',
      title: 'Production Efficiency Optimization',
      description: 'AI analysis suggests adjusting Line 3 speed by 12% could increase overall throughput by 8.5% while maintaining quality standards.',
      impact: 'high',
      confidence: 94,
      estimatedSavings: 45000,
      timeline: '2-3 weeks',
      actions: ['Adjust conveyor speed', 'Update PLC parameters', 'Monitor quality metrics'],
      timestamp: '2 hours ago',
      icon: CpuChipIcon,
      color: 'blue'
    },
    {
      id: 2,
      category: 'inventory',
      type: 'alert',
      title: 'Raw Material Shortage Prediction',
      description: 'Predictive model indicates potential shortage of aluminum cans in 18 days based on current consumption and supplier lead times.',
      impact: 'critical',
      confidence: 87,
      estimatedSavings: null,
      timeline: 'Immediate action',
      actions: ['Contact backup suppliers', 'Increase order quantity', 'Adjust production schedule'],
      timestamp: '45 minutes ago',
      icon: ExclamationTriangleIcon,
      color: 'red'
    },
    {
      id: 3,
      category: 'quality',
      type: 'insight',
      title: 'Quality Pattern Detection',
      description: 'Machine learning detected subtle quality variations correlating with temperature changes. Implementing thermal control could reduce defects by 23%.',
      impact: 'medium',
      confidence: 91,
      estimatedSavings: 28000,
      timeline: '1-2 weeks',
      actions: ['Install temperature sensors', 'Update control algorithms', 'Train operators'],
      timestamp: '3 hours ago',
      icon: LightBulbIcon,
      color: 'yellow'
    },
    {
      id: 4,
      category: 'maintenance',
      type: 'prediction',
      title: 'Predictive Maintenance Alert',
      description: 'Vibration analysis indicates bearing replacement needed on Mixer Unit 2 within 7-10 days to prevent unplanned downtime.',
      impact: 'high',
      confidence: 96,
      estimatedSavings: 75000,
      timeline: 'Next week',
      actions: ['Schedule maintenance window', 'Order replacement parts', 'Plan production adjustment'],
      timestamp: '1 hour ago',
      icon: BoltIcon,
      color: 'orange'
    },
    {
      id: 5,
      category: 'energy',
      type: 'optimization',
      title: 'Energy Consumption Optimization',
      description: 'AI recommends shifting 15% of production to off-peak hours (11 PM - 6 AM) to reduce energy costs by £12,000 monthly.',
      impact: 'medium',
      confidence: 89,
      estimatedSavings: 144000,
      timeline: '2-4 weeks',
      actions: ['Adjust shift schedules', 'Update production planning', 'Train night shift staff'],
      timestamp: '4 hours ago',
      icon: SparklesIcon,
      color: 'green'
    },
    {
      id: 6,
      category: 'demand',
      type: 'forecast',
      title: 'Seasonal Demand Adjustment',
      description: 'Neural network forecasts 28% increase in citrus flavor demand for Q4. Recommend increasing production capacity by 20% starting October.',
      impact: 'high',
      confidence: 85,
      estimatedSavings: 120000,
      timeline: '6-8 weeks',
      actions: ['Scale citrus production', 'Secure additional raw materials', 'Optimize flavor mixing ratios'],
      timestamp: '6 hours ago',
      icon: ArrowTrendingUpIcon,
      color: 'purple'
    }
  ]

  const categories = [
    { id: 'all', name: 'All Insights', count: mockInsights.length },
    { id: 'production', name: 'Production', count: mockInsights.filter(i => i.category === 'production').length },
    { id: 'quality', name: 'Quality', count: mockInsights.filter(i => i.category === 'quality').length },
    { id: 'maintenance', name: 'Maintenance', count: mockInsights.filter(i => i.category === 'maintenance').length },
    { id: 'inventory', name: 'Inventory', count: mockInsights.filter(i => i.category === 'inventory').length },
    { id: 'energy', name: 'Energy', count: mockInsights.filter(i => i.category === 'energy').length },
    { id: 'demand', name: 'Demand', count: mockInsights.filter(i => i.category === 'demand').length }
  ]

  useEffect(() => {
    setLoading(true)
    // Simulate AI processing time
    setTimeout(() => {
      const filteredInsights = selectedCategory === 'all' 
        ? mockInsights 
        : mockInsights.filter(insight => insight.category === selectedCategory)
      setInsights(filteredInsights)
      setLoading(false)
    }, 1200)
  }, [selectedCategory])

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      default: return 'text-blue-600 bg-blue-100 border-blue-200'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'alert': return 'text-red-700 bg-red-50 border-red-200'
      case 'opportunity': return 'text-green-700 bg-green-50 border-green-200'
      case 'prediction': return 'text-purple-700 bg-purple-50 border-purple-200'
      case 'optimization': return 'text-blue-700 bg-blue-50 border-blue-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return null
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
            <SparklesIcon className="w-8 h-8 mr-3 text-purple-600" />
            AI Insights
          </h1>
          <p className="text-gray-600 mt-2">Intelligent recommendations and predictions powered by machine learning</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.div 
            className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">AI Engine Active</span>
          </motion.div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {category.name}
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                selectedCategory === category.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-gray-600'
              }`}>
                {category.count}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* AI Insights Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {insights.map((insight, index) => {
              const IconComponent = insight.icon
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-${insight.color}-100`}>
                        <IconComponent className={`w-6 h-6 text-${insight.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {insight.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(insight.type)}`}>
                            {insight.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{insight.timestamp}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(insight.impact)}`}>
                            {insight.impact} impact
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 mb-4 leading-relaxed">{insight.description}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Confidence</div>
                      <div className="text-lg font-bold text-gray-900">{insight.confidence}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${insight.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Timeline</div>
                      <div className="text-lg font-bold text-gray-900">{insight.timeline}</div>
                      {insight.estimatedSavings && (
                        <div className="text-sm text-green-600 font-medium">
                          {formatCurrency(insight.estimatedSavings)} potential
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</div>
                    <div className="space-y-2">
                      {insight.actions.slice(0, 2).map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-center text-sm text-gray-600">
                          <ArrowRightIcon className="w-3 h-3 mr-2 text-blue-500" />
                          {action}
                        </div>
                      ))}
                      {insight.actions.length > 2 && (
                        <div className="text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-700">
                          +{insight.actions.length - 2} more actions
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View Details
                    </button>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Implement
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && insights.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-12 text-center"
        >
          <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights available</h3>
          <p className="text-gray-600">
            The AI engine is processing your data. New insights will appear as they become available.
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default AIInsights
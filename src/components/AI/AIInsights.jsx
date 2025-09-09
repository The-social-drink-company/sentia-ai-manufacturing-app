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
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Insights', count: 0 },
    { id: 'production', name: 'Production', count: 0 },
    { id: 'quality', name: 'Quality', count: 0 },
    { id: 'maintenance', name: 'Maintenance', count: 0 },
    { id: 'inventory', name: 'Inventory', count: 0 },
    { id: 'energy', name: 'Energy', count: 0 },
    { id: 'demand', name: 'Demand', count: 0 }
  ])

  // Fetch real AI insights from API
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/ai/insights')
        if (response.ok) {
          const data = await response.json()
          const allInsights = data.insights || []
          
          // Update categories with real counts
          const updatedCategories = categories.map(cat => ({
            ...cat,
            count: cat.id === 'all' ? allInsights.length : allInsights.filter(i => i.category === cat.id).length
          }))
          
          setCategories(updatedCategories)
          
          // Filter insights based on selected category
          const filteredInsights = selectedCategory === 'all' 
            ? allInsights 
            : allInsights.filter(insight => insight.category === selectedCategory)
          setInsights(filteredInsights)
        } else {
          console.error('Failed to fetch AI insights')
          setInsights([])
        }
      } catch (error) {
        console.error('Error fetching AI insights:', error)
        setInsights([])
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [selectedCategory])

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'opportunity': return LightBulbIcon
      case 'alert': return ExclamationTriangleIcon
      case 'insight': return SparklesIcon
      case 'prediction': return ArrowTrendingUpIcon
      case 'optimization': return ChartBarIcon
      case 'forecast': return ArrowTrendingUpIcon
      default: return CpuChipIcon
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'opportunity': return 'text-yellow-600'
      case 'alert': return 'text-red-600'
      case 'insight': return 'text-purple-600'
      case 'prediction': return 'text-blue-600'
      case 'optimization': return 'text-green-600'
      case 'forecast': return 'text-indigo-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <CpuChipIcon className="w-8 h-8 mr-3 text-blue-600" />
          AI Insights Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Real-time artificial intelligence insights and recommendations from your manufacturing data
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.name}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {category.count}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-16">
          <CpuChipIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No AI Insights Available</h3>
          <p className="text-gray-600 mb-4">
            No insights found for the selected category. The AI system may be processing new data.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Insights
          </button>
        </div>
      ) : (
        /* Insights Grid */
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {insights.map((insight) => {
              const IconComponent = getTypeIcon(insight.type)
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-white rounded-lg shadow-sm border-l-4 p-6 hover:shadow-md transition-shadow ${getImpactColor(insight.impact)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-lg ${getTypeColor(insight.type)} bg-opacity-10`}>
                        <IconComponent className={`w-6 h-6 ${getTypeColor(insight.type)}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insight.impact === 'critical' ? 'bg-red-100 text-red-800' :
                            insight.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {insight.impact} impact
                          </span>
                          <span className="text-xs text-gray-500">{insight.timestamp}</span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{insight.title}</h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">{insight.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                            <span className="text-gray-600">Confidence: {insight.confidence}%</span>
                          </div>
                          
                          {insight.estimatedSavings && (
                            <div className="flex items-center">
                              <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-gray-600">
                                Est. Savings: £{insight.estimatedSavings.toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 text-blue-500 mr-1" />
                            <span className="text-gray-600">Timeline: {insight.timeline}</span>
                          </div>
                        </div>
                        
                        {insight.actions && insight.actions.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Actions:</h4>
                            <ul className="space-y-1">
                              {insight.actions.map((action, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-600">
                                  <ArrowRightIcon className="w-3 h-3 mr-2 text-gray-400" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default AIInsights
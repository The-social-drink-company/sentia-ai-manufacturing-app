import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import {
  CurrencyPoundIcon,
  TruckIcon,
  CogIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const CostAnalysis = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [costData, setCostData] = useState(null)

  // Mock cost data
  const mockCostData = {
    totalCosts: 1920000,
    previousTotal: 1785000,
    breakdown: [
      { name: 'Raw Materials', value: 720000, color: '#3B82F6', percentage: 37.5, trend: '+5.2%' },
      { name: 'Labor', value: 480000, color: '#10B981', percentage: 25.0, trend: '+2.1%' },
      { name: 'Manufacturing', value: 360000, color: '#F59E0B', percentage: 18.8, trend: '-1.5%' },
      { name: 'Utilities', value: 192000, color: '#EF4444', percentage: 10.0, trend: '+8.3%' },
      { name: 'Overhead', value: 168000, color: '#8B5CF6', percentage: 8.7, trend: '+1.2%' }
    ],
    monthlyTrends: [
      { month: 'Jan', total: 1650000, materials: 620000, labor: 440000, manufacturing: 340000 },
      { month: 'Feb', total: 1720000, materials: 645000, labor: 450000, manufacturing: 345000 },
      { month: 'Mar', total: 1780000, materials: 670000, labor: 460000, manufacturing: 350000 },
      { month: 'Apr', total: 1820000, materials: 685000, labor: 465000, manufacturing: 355000 },
      { month: 'May', total: 1850000, materials: 695000, labor: 470000, manufacturing: 358000 },
      { month: 'Jun', total: 1920000, materials: 720000, labor: 480000, manufacturing: 360000 }
    ],
    costPerUnit: 24.50,
    previousCostPerUnit: 23.10,
    efficiencyMetrics: {
      materialWaste: 3.2,
      laborEfficiency: 94.5,
      energyEfficiency: 87.3,
      overallScore: 91.7
    },
    alerts: [
      { type: 'warning', message: 'Raw material costs increased 5.2% this month', category: 'materials' },
      { type: 'critical', message: 'Utility costs up 8.3% - investigate energy usage', category: 'utilities' },
      { type: 'success', message: 'Manufacturing costs reduced by 1.5%', category: 'manufacturing' }
    ]
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCostData(mockCostData)
    }, 500)
  }, [selectedPeriod])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateChange = (current, previous) => {
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (!costData) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cost Analysis</h1>
          <p className="text-gray-600 mt-2">Comprehensive cost breakdown and optimization insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="current-quarter">Current Quarter</option>
          </select>
        </div>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Costs</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(costData.totalCosts)}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">
                  +{calculateChange(costData.totalCosts, costData.previousTotal)}%
                </span>
              </div>
            </div>
            <CurrencyPoundIcon className="w-8 h-8 text-blue-500" />
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
              <p className="text-sm text-gray-600">Cost Per Unit</p>
              <p className="text-2xl font-bold text-gray-900">£{costData.costPerUnit}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">
                  +{calculateChange(costData.costPerUnit, costData.previousCostPerUnit)}%
                </span>
              </div>
            </div>
            <ChartPieIcon className="w-8 h-8 text-green-500" />
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
              <p className="text-sm text-gray-600">Efficiency Score</p>
              <p className="text-2xl font-bold text-gray-900">{costData.efficiencyMetrics.overallScore}%</p>
              <p className="text-sm text-green-600 mt-2">Above target</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-purple-500" />
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
              <p className="text-sm text-gray-600">Material Waste</p>
              <p className="text-2xl font-bold text-gray-900">{costData.efficiencyMetrics.materialWaste}%</p>
              <p className="text-sm text-orange-600 mt-2">Monitor closely</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Cost Breakdown and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costData.breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {costData.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-1/2 space-y-3">
              {costData.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(item.value)}</div>
                    <div className="text-xs text-gray-500">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">Monthly Cost Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={costData.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `£${(value / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="materials" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="labor" 
                stroke="#F59E0B" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Cost Category Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 shadow-sm"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Cost Category Analysis</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {costData.breakdown.map((category, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    category.trend.startsWith('+') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {category.trend}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-sm font-medium">{formatCurrency(category.value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Percentage</span>
                    <span className="text-sm font-medium">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${category.percentage}%`, 
                        backgroundColor: category.color 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Alerts and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Alerts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">Cost Alerts</h3>
          <div className="space-y-3">
            {costData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-400' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-green-50 border-green-400'
                }`}
              >
                <div className="flex items-center">
                  {alert.type === 'critical' ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
                  ) : alert.type === 'warning' ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-3" />
                  ) : (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  )}
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Efficiency Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4">Efficiency Metrics</h3>
          <div className="space-y-4">
            {Object.entries(costData.efficiencyMetrics).map(([key, value], index) => {
              if (key === 'overallScore') return null
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        value >= 90 ? 'bg-green-500' :
                        value >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CostAnalysis
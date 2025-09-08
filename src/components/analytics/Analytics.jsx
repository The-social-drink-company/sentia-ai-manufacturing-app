import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyPoundIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  PresentationChartLineIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('monthly')
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api'
        const response = await fetch(`${apiUrl}/analytics/overview?period=${timeRange}`)
        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data)
        } else {
          // Use mock data as fallback
          setAnalyticsData(mockAnalyticsData)
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
        setAnalyticsData(mockAnalyticsData)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
    const interval = setInterval(fetchAnalyticsData, 300000) // Update every 5 minutes
    return () => clearInterval(interval)
  }, [timeRange])

  const mockAnalyticsData = {
    revenue: {
      current: 2800000,
      previous: 2600000,
      change: 7.7
    },
    profit: {
      current: 700000,
      previous: 580000,
      change: 20.7
    },
    margins: {
      current: 25.0,
      previous: 22.3,
      change: 2.7
    },
    efficiency: {
      current: 89.2,
      previous: 85.4,
      change: 3.8
    }
  }
  
  const mockRevenueData = [
    { month: 'Jan', revenue: 2400000, profit: 600000, margin: 25.0 },
    { month: 'Feb', revenue: 2200000, profit: 550000, margin: 25.0 },
    { month: 'Mar', revenue: 2800000, profit: 700000, margin: 25.0 },
    { month: 'Apr', revenue: 3200000, profit: 800000, margin: 25.0 },
    { month: 'May', revenue: 2900000, profit: 725000, margin: 25.0 },
    { month: 'Jun', revenue: 3100000, profit: 775000, margin: 25.0 }
  ]

  const mockProductPerformance = [
    { name: 'Sentia Red Premium', revenue: 1200000, margin: 28, units: 45000 },
    { name: 'Sentia Gold Edition', revenue: 950000, margin: 32, units: 32000 },
    { name: 'Sentia Blue Classic', revenue: 650000, margin: 22, units: 38000 },
    { name: 'Limited Editions', revenue: 400000, margin: 35, units: 8000 }
  ]

  const mockCostBreakdown = [
    { name: 'Raw Materials', value: 45, color: '#EF4444' },
    { name: 'Labor', value: 25, color: '#F59E0B' },
    { name: 'Overhead', value: 18, color: '#3B82F6' },
    { name: 'Marketing', value: 12, color: '#10B981' }
  ]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const data = analyticsData

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const renderMetricCard = (title, icon, current, previous, change, isPercentage = false, isCurrency = false) => {
    const Icon = icon;
    const isPositive = change > 0;
    const formattedCurrent = isCurrency 
      ? formatCurrency(current)
      : isPercentage 
      ? formatPercentage(current)
      : current.toLocaleString();

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formattedCurrent}</p>
            <div className="flex items-center mt-2">
              {isPositive ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`ml-1 text-sm font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="ml-1 text-sm text-gray-500">vs last {timeRange.slice(0, -2)}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comprehensive financial performance analysis and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Total Revenue',
          CurrencyPoundIcon,
          data.revenue.current,
          data.revenue.previous,
          data.revenue.change,
          false,
          true
        )}
        
        {renderMetricCard(
          'Net Profit',
          ArrowTrendingUpIcon,
          data.profit.current,
          data.profit.previous,
          data.profit.change,
          false,
          true
        )}
        
        {renderMetricCard(
          'Profit Margin',
          ChartBarIcon,
          data.margins.current,
          data.margins.previous,
          data.margins.change,
          true,
          false
        )}
        
        {renderMetricCard(
          'Efficiency Rate',
          ClockIcon,
          data.efficiency.current,
          data.efficiency.previous,
          data.efficiency.change,
          true,
          false
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Revenue Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Analysis Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profit Analysis
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'profit' ? formatCurrency(value) : `${value}%`,
                  name === 'profit' ? 'Profit' : 'Margin'
                ]} />
                <Bar dataKey="profit" fill="#10B981" name="profit" />
                <Bar dataKey="margin" fill="#F59E0B" name="margin" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Performance</h3>
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {mockProductPerformance.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{formatCurrency(product.revenue)}</span>
                    <span className="text-xs text-green-600">{product.margin}% margin</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{product.units.toLocaleString()} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cost Breakdown</h3>
            <DocumentChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockCostBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockCostBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Key Insights</h3>
            <PresentationChartLineIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <ArrowUpIcon className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Revenue Growth</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                +7.7% increase this month driven by premium product sales
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Margin Improvement</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Profit margins increased by 2.7 percentage points
              </p>
            </div>
            
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Efficiency Gains</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Operational efficiency up 3.8% through process optimization
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Seasonal Trends</span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Q2 showing 15% higher demand vs historical averages
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
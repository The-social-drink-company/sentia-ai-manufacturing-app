import React, { useState, useEffect, useMemo } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  CurrencyDollarIcon,
  BoltIcon,
  CalendarIcon,
  EyeIcon,
  CogIcon,
  SparklesIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from 'recharts';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

const AdvancedAnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetrics, setSelectedMetrics] = useState(['production', 'quality', 'efficiency']);
  const [viewMode, setViewMode] = useState('comprehensive');
  const [refreshing, setRefreshing] = useState(false);

  // Advanced Analytics Data
  const mockAdvancedData = useMemo(() => ({
    performanceMetrics: {
      overall: {
        efficiency: 94.2,
        quality: 98.1,
        uptime: 96.7,
        throughput: 87.3,
        trend: 'improving'
      },
      trends: [] => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        efficiency: 88 + 0;

  useEffect(() => {
    // Simulate data loading
    setLoading(true);
    setTimeout(() => {
      setData(mockAdvancedData);
      setLoading(false);
    }, 1000);
  }, [timeRange, mockAdvancedData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setData({ ...mockAdvancedData, lastUpdated: new Date().toISOString() });
      setRefreshing(false);
    }, 1500);
  };

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue', suffix = '' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}{suffix}
          </div>
          {change && (
            <div className="flex items-center mt-1">
              {change > 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <SparklesIcon className="h-8 w-8 mr-3 text-blue-600" />
                Advanced Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive manufacturing intelligence and insights
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Real-time Alerts */}
          {data.alerts && data.alerts.length > 0 && (
            <div className="mb-6">
              <div className="flex space-x-4 overflow-x-auto">
                {data.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg text-sm ${
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      alert.type === 'info' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-green-100 text-green-800 border border-green-200'
                    }`}
                  >
                    <span className="font-medium mr-2">{alert.message}</span>
                    <span className="text-xs opacity-75">{alert.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Overall Efficiency"
            value={data.performanceMetrics.overall.efficiency}
            suffix="%"
            change={2.3}
            icon={BoltIcon}
            color="blue"
          />
          <MetricCard
            title="Quality Rate"
            value={data.performanceMetrics.overall.quality}
            suffix="%"
            change={1.2}
            icon={ChartBarIcon}
            color="green"
          />
          <MetricCard
            title="Equipment Uptime"
            value={data.performanceMetrics.overall.uptime}
            suffix="%"
            change={0.8}
            icon={CogIcon}
            color="purple"
          />
          <MetricCard
            title="Throughput"
            value={data.performanceMetrics.overall.throughput}
            suffix="%"
            change={-1.1}
            icon={ArrowTrendingUpIcon}
            color="orange"
          />
        </div>

        {/* Performance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trends</h3>
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data.performanceMetrics.trends.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="efficiency" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Line yAxisId="left" type="monotone" dataKey="quality" stroke="#82ca9d" strokeWidth={2} />
                  <Bar yAxisId="right" dataKey="uptime" fill="#ffc658" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">OEE Analysis</h3>
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.operationalExcellence.oeeData.slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="availability" stroke="#8884d8" name="Availability" />
                  <Line type="monotone" dataKey="performance" stroke="#82ca9d" name="Performance" />
                  <Line type="monotone" dataKey="quality" stroke="#ffc658" name="Quality" />
                  <Line type="monotone" dataKey="oee" stroke="#ff7300" strokeWidth={3} name="OEE" />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Production Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
            <div className="space-y-4">
              {data.productionInsights.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{performer.line}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {performer.output}/{performer.target} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{performer.efficiency}%</div>
                    <div className="text-xs text-gray-500">efficiency</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bottlenecks</h3>
            <div className="space-y-4">
              {data.productionInsights.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{bottleneck.process}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{bottleneck.delay}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    bottleneck.impact === 'high' ? 'bg-red-100 text-red-800' :
                    bottleneck.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {bottleneck.impact.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Overview</h3>
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.financialMetrics.costBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="percentage"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {data.financialMetrics.costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        {/* Quality Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality Trends</h3>
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.qualityAnalytics.qualityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="passRate" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="firstPassYield" stackId="2" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Defect Analysis</h3>
            <div className="space-y-3">
              {data.qualityAnalytics.defectCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                      <span className="text-sm font-bold">{category.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${category.value}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Cost: ${category.cost.toLocaleString()}</span>
                      <span className={category.trend > 0 ? 'text-red-500' : 'text-green-500'}>
                        {category.trend > 0 ? '+' : ''}{category.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Predictive Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center mb-4">
            <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered Predictions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Next Week Forecast</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Efficiency:</span>
                  <span className="font-bold text-green-600">{data.productionInsights.predictions.nextWeek.efficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className="font-bold text-green-600">{data.productionInsights.predictions.nextWeek.quality}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Output:</span>
                  <span className="font-bold text-blue-600">{data.productionInsights.predictions.nextWeek.output.toLocaleString()} units</span>
                </div>
              </div>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Next Month Forecast</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Efficiency:</span>
                  <span className="font-bold text-green-600">{data.productionInsights.predictions.nextMonth.efficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className="font-bold text-green-600">{data.productionInsights.predictions.nextMonth.quality}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Output:</span>
                  <span className="font-bold text-blue-600">{data.productionInsights.predictions.nextMonth.output.toLocaleString()} units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
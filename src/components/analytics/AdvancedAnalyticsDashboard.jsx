import React, { useState } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CpuChipIcon,
  CalendarDaysIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClockIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts';

const performanceData = [
  { month: 'Jan', efficiency: 87, quality: 94, cost: 185000, revenue: 240000, oee: 82, downtime: 4.2 },
  { month: 'Feb', efficiency: 89, quality: 96, cost: 182000, revenue: 268000, oee: 85, downtime: 3.8 },
  { month: 'Mar', efficiency: 91, quality: 92, cost: 175000, revenue: 285000, oee: 88, downtime: 3.1 },
  { month: 'Apr', efficiency: 88, quality: 95, cost: 190000, revenue: 312000, oee: 86, downtime: 4.5 },
  { month: 'May', efficiency: 93, quality: 97, cost: 178000, revenue: 298000, oee: 91, downtime: 2.8 },
  { month: 'Jun', efficiency: 95, quality: 94, cost: 172000, revenue: 325000, oee: 93, downtime: 2.3 }
];

const predictiveData = [
  { week: 'W1', predicted: 2400, actual: 2350, confidence: 95, maintenance: 'Low', demand: 2500 },
  { week: 'W2', predicted: 2650, actual: 2680, confidence: 92, maintenance: 'Medium', demand: 2600 },
  { week: 'W3', predicted: 2800, actual: 2750, confidence: 89, maintenance: 'Low', demand: 2750 },
  { week: 'W4', predicted: 2950, actual: null, confidence: 87, maintenance: 'High', demand: 2900 },
  { week: 'W5', predicted: 3100, actual: null, confidence: 84, maintenance: 'Medium', demand: 3050 },
  { week: 'W6', predicted: 3250, actual: null, confidence: 81, maintenance: 'Low', demand: 3200 }
];

const anomalyData = [
  { id: 1, type: 'Performance Drop', severity: 'High', location: 'Line 3', detected: '2 hours ago', impact: 'Production -12%' },
  { id: 2, type: 'Quality Deviation', severity: 'Medium', location: 'QC Station 2', detected: '4 hours ago', impact: 'Defect Rate +3%' },
  { id: 3, type: 'Energy Spike', severity: 'Low', location: 'Compressor Unit', detected: '6 hours ago', impact: 'Cost +8%' },
  { id: 4, type: 'Temperature Variance', severity: 'Medium', location: 'Furnace A', detected: '8 hours ago', impact: 'Cycle Time +15%' }
];

const kpiData = [
  { name: 'Overall Equipment Effectiveness', value: 89, target: 85, trend: 'up', color: '#10b981' },
  { name: 'First Pass Yield', value: 94, target: 90, trend: 'up', color: '#3b82f6' },
  { name: 'Mean Time Between Failures', value: 168, target: 150, trend: 'up', color: '#8b5cf6' },
  { name: 'Cost per Unit', value: 12.45, target: 13.50, trend: 'down', color: '#f59e0b' }
];

const correlationData = [
  { factor: 'Temperature', impact: 85, correlation: 0.78 },
  { factor: 'Humidity', impact: 62, correlation: 0.45 },
  { factor: 'Pressure', impact: 91, correlation: 0.82 },
  { factor: 'Speed', impact: 73, correlation: 0.67 },
  { factor: 'Vibration', impact: 58, correlation: 0.41 }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdvancedAnalyticsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m');
  const [selectedAnalysis, setSelectedAnalysis] = useState('performance');
  const [selectedKPI] = useState('all');

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'Medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'Low':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'High':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'Medium':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'Low':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">AI-powered insights and predictive analytics for manufacturing optimization</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Generate AI Insights
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Export Report
            </button>

            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedAnalysis('performance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedAnalysis === 'performance'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Performance Analysis
            </button>
            <button
              onClick={() => setSelectedAnalysis('predictive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedAnalysis === 'predictive'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Predictive Analytics
            </button>
            <button
              onClick={() => setSelectedAnalysis('anomaly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedAnalysis === 'anomaly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Anomaly Detection
            </button>
            <button
              onClick={() => setSelectedAnalysis('correlation')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedAnalysis === 'correlation'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Correlation Analysis
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <CpuChipIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">AI Engine Active</span>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <div key={kpi.name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">{kpi.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpi.name.includes('Cost') ? `$${kpi.value}` :
                   kpi.name.includes('Time') ? `${kpi.value}h` : `${kpi.value}%`}
                </p>
                <div className="flex items-center mt-2">
                  {kpi.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${kpi.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    Target: {kpi.name.includes('Cost') ? `$${kpi.target}` :
                            kpi.name.includes('Time') ? `${kpi.target}h` : `${kpi.target}%`}
                  </span>
                </div>
              </div>
              <div className="w-16 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart data={[{ value: (kpi.value / kpi.target) * 100 }]}>
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      fill={kpi.color}
                      startAngle={90}
                      endAngle={-270}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnalysis === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="efficiency"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    stroke="#3b82f6"
                    name="Efficiency %"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="quality"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Quality %"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="oee"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    name="OEE %"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="downtime"
                    fill="#ef4444"
                    fillOpacity={0.7}
                    name="Downtime (hrs)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost vs Revenue Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost vs Revenue Analysis</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.8}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.8}
                    name="Costs"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedAnalysis === 'predictive' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Predictive Forecasting */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Production Forecasting</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={predictiveData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Actual Production"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3b82f6"
                    strokeDasharray="5 5"
                    strokeWidth={3}
                    name="Predicted Production"
                  />
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Expected Demand"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confidence & Maintenance Predictions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prediction Confidence & Maintenance</h3>
            <div className="space-y-6">
              {predictiveData.map((item, index) => (
                <div key={item.week} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{item.week}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Production: {item.predicted.toLocaleString()} units
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Maintenance Risk: {item.maintenance}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.confidence}%</p>
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          item.confidence >= 90 ? 'bg-green-500' :
                          item.confidence >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedAnalysis === 'anomaly' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Anomaly Detection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Real-time Anomaly Detection</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 dark:text-green-400">Monitoring Active</span>
              </div>
            </div>
            <div className="space-y-4">
              {anomalyData.map((anomaly) => (
                <div key={anomaly.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getSeverityIcon(anomaly.severity)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{anomaly.type}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{anomaly.location}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{anomaly.detected}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{anomaly.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Anomaly Frequency Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { day: 'Mon', high: 2, medium: 5, low: 8 },
                  { day: 'Tue', high: 1, medium: 3, low: 6 },
                  { day: 'Wed', high: 3, medium: 4, low: 7 },
                  { day: 'Thu', high: 0, medium: 2, low: 5 },
                  { day: 'Fri', high: 1, medium: 6, low: 9 },
                  { day: 'Sat', high: 2, medium: 3, low: 4 },
                  { day: 'Sun', high: 1, medium: 2, low: 3 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="high" stackId="a" fill="#ef4444" name="High Severity" />
                  <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium Severity" />
                  <Bar dataKey="low" stackId="a" fill="#10b981" name="Low Severity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedAnalysis === 'correlation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Factor Correlation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Environmental Factor Correlation</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    type="number"
                    dataKey="correlation"
                    domain={[0, 1]}
                    tick={{ fontSize: 12 }}
                    name="Correlation"
                  />
                  <YAxis
                    type="number"
                    dataKey="impact"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    name="Impact %"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                            <p className="font-medium">{data.factor}</p>
                            <p className="text-sm">Correlation: {data.correlation}</p>
                            <p className="text-sm">Impact: {data.impact}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={correlationData} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Factor Impact List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Factor Impact Analysis</h3>
            <div className="space-y-4">
              {correlationData.map((factor, index) => (
                <div key={factor.factor} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {factor.factor.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{factor.factor}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Correlation: {factor.correlation.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{factor.impact}%</p>
                    <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${factor.impact}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights & Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <LightBulbIcon className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Generated Insights & Recommendations</h3>
          </div>
          <div className="flex items-center space-x-2">
            <CpuChipIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">Last updated: 5 min ago</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200">Efficiency Opportunity</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Optimizing temperature control on Line 3 could increase efficiency by 7% based on correlation analysis.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2">
                  View Details →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-1" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-200">Predictive Maintenance</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Schedule maintenance for Compressor Unit in next 72 hours to prevent predicted failure.
                </p>
                <button className="text-xs text-green-600 dark:text-green-400 hover:underline mt-2">
                  Schedule Now →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-1" />
              <div>
                <h4 className="font-medium text-yellow-900 dark:text-yellow-200">Quality Alert</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Vibration levels increasing on QC Station 2. Consider recalibration to maintain quality standards.
                </p>
                <button className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline mt-2">
                  Investigate →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

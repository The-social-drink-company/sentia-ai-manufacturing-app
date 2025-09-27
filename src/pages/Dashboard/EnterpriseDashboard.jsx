import React, { useState } from 'react';
import {
  ChartBarIcon,
  CogIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  BanknotesIcon,
  TruckIcon,
  CubeIcon,
  UserGroupIcon,
  ServerIcon
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
  Cell
} from 'recharts';

const performanceData = [
  { month: 'Jan', revenue: 240000, production: 95, efficiency: 87, costs: 180000 },
  { month: 'Feb', revenue: 268000, production: 98, efficiency: 89, costs: 185000 },
  { month: 'Mar', revenue: 285000, production: 92, efficiency: 91, costs: 175000 },
  { month: 'Apr', revenue: 312000, production: 96, efficiency: 88, costs: 190000 },
  { month: 'May', revenue: 298000, production: 94, efficiency: 93, costs: 182000 },
  { month: 'Jun', revenue: 325000, production: 99, efficiency: 95, costs: 178000 }
];

const departmentData = [
  { name: 'Production', performance: 94, budget: 85, status: 'excellent' },
  { name: 'Quality', performance: 89, budget: 92, status: 'good' },
  { name: 'Supply Chain', performance: 87, budget: 78, status: 'warning' },
  { name: 'Finance', performance: 96, budget: 94, status: 'excellent' },
  { name: 'HR', performance: 82, budget: 88, status: 'good' },
  { name: 'IT', performance: 91, budget: 76, status: 'warning' }
];

const alertData = [
  { id: 1, type: 'critical', message: 'Production line 3 efficiency below 80%', time: '10 min ago', department: 'Production' },
  { id: 2, type: 'warning', message: 'Material shortage predicted in 3 days', time: '25 min ago', department: 'Supply Chain' },
  { id: 3, type: 'info', message: 'Monthly quality review scheduled', time: '1 hour ago', department: 'Quality' },
  { id: 4, type: 'warning', message: 'Budget variance detected in IT department', time: '2 hours ago', department: 'Finance' }
];

const resourceData = [
  { name: 'Production Lines', used: 8, total: 10, utilization: 80 },
  { name: 'Warehouse Space', used: 75, total: 100, utilization: 75 },
  { name: 'Workforce', used: 245, total: 280, utilization: 87.5 },
  { name: 'Equipment', used: 42, total: 50, utilization: 84 }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function EnterpriseDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m');
  const [selectedView, setSelectedView] = useState('overview');

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400';
      case 'good':
        return 'text-blue-600 dark:text-blue-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enterprise Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Comprehensive view of organizational performance</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Generate Report
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

            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setSelectedView('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedView === 'overview'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedView('detailed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedView === 'detailed'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$1.92M</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">+12.5%</span>
              </div>
            </div>
            <BanknotesIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Production Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">94.2%</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">+2.1%</span>
              </div>
            </div>
            <CogIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">28</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600 dark:text-blue-400">+3 new</span>
              </div>
            </div>
            <DocumentTextIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Employee Count</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">245</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">+8 hired</span>
              </div>
            </div>
            <UserGroupIcon className="h-12 w-12 text-indigo-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Performance Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' || name === 'costs'
                      ? `$${value.toLocaleString()}`
                      : `${value}%`,
                    name
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="costs"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Costs"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Efficiency %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Real-time Alerts</h3>
            <BellIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {alertData.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {alert.department}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {alert.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
            View All Alerts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Department Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Performance</h3>
          <div className="space-y-4">
            {departmentData.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {dept.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{dept.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Performance: {dept.performance}% | Budget: {dept.budget}%
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(dept.status)}`}>
                  {dept.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Utilization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resource Utilization</h3>
          <div className="space-y-6">
            {resourceData.map((resource) => (
              <div key={resource.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {resource.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {resource.used}/{resource.total} ({resource.utilization}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      resource.utilization >= 90 ? 'bg-red-500' :
                      resource.utilization >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${resource.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Reports</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <CubeIcon className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
            <span className="text-sm font-medium text-green-900 dark:text-green-200">Inventory</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <TruckIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-200">Supply Chain</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
            <UserGroupIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">HR</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
            <BanknotesIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Finance</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <CogIcon className="h-8 w-8 text-gray-600 dark:text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

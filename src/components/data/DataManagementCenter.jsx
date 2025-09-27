import React, { useState } from 'react';
import {
  ServerIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CogIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const dataSources = [
  {
    id: 'src-001',
    name: 'Production Database',
    type: 'PostgreSQL',
    status: 'connected',
    lastSync: '2 min ago',
    records: 2450000,
    size: '12.5 GB',
    quality: 98.5,
    location: 'Primary Server'
  },
  {
    id: 'src-002',
    name: 'Inventory System',
    type: 'MySQL',
    status: 'connected',
    lastSync: '5 min ago',
    records: 850000,
    size: '3.2 GB',
    quality: 94.2,
    location: 'Cloud Instance'
  },
  {
    id: 'src-003',
    name: 'Quality Control',
    type: 'SQLite',
    status: 'syncing',
    lastSync: '15 min ago',
    records: 125000,
    size: '480 MB',
    quality: 96.8,
    location: 'Edge Device'
  },
  {
    id: 'src-004',
    name: 'Financial Data',
    type: 'Oracle',
    status: 'error',
    lastSync: '2 hours ago',
    records: 320000,
    size: '1.8 GB',
    quality: 91.5,
    location: 'External API'
  },
  {
    id: 'src-005',
    name: 'Sensor Data',
    type: 'InfluxDB',
    status: 'connected',
    lastSync: '30 sec ago',
    records: 15000000,
    size: '45.2 GB',
    quality: 99.1,
    location: 'IoT Gateway'
  }
];

const dataFlowData = [
  { hour: '00:00', incoming: 1200, processed: 1150, errors: 50 },
  { hour: '04:00', incoming: 800, processed: 780, errors: 20 },
  { hour: '08:00', incoming: 2500, processed: 2400, errors: 100 },
  { hour: '12:00', incoming: 3200, processed: 3100, errors: 100 },
  { hour: '16:00', incoming: 2800, processed: 2750, errors: 50 },
  { hour: '20:00', incoming: 1800, processed: 1750, errors: 50 }
];

const dataQualityData = [
  { category: 'Completeness', score: 96.5 },
  { category: 'Accuracy', score: 94.2 },
  { category: 'Consistency', score: 92.8 },
  { category: 'Timeliness', score: 98.1 },
  { category: 'Validity', score: 95.3 }
];

const storageData = [
  { name: 'Production Data', value: 35, size: '45.2 GB' },
  { name: 'Historical Data', value: 28, size: '36.1 GB' },
  { name: 'Analytics Cache', value: 15, size: '19.3 GB' },
  { name: 'Backup Data', value: 12, size: '15.5 GB' },
  { name: 'Other', value: 10, size: '12.9 GB' }
];

const recentJobs = [
  { id: 'job-001', name: 'Daily ETL Process', status: 'completed', duration: '45 min', records: 125000 },
  { id: 'job-002', name: 'Sensor Data Sync', status: 'running', duration: '12 min', records: 45000 },
  { id: 'job-003', name: 'Quality Report Gen', status: 'pending', duration: '--', records: 0 },
  { id: 'job-004', name: 'Backup Archive', status: 'failed', duration: '8 min', records: 0 }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DataManagementCenter() {
  const [selectedView, setSelectedView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'syncing':
        return <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'syncing':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getJobStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'running':
        return <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
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
            <ServerIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Management Center</h1>
              <p className="text-gray-600 dark:text-gray-400">Centralized data integration, quality monitoring, and pipeline management</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Connection
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Sync All
            </button>
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
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
            onClick={() => setSelectedView('sources')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'sources'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Data Sources
          </button>
          <button
            onClick={() => setSelectedView('pipelines')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'pipelines'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Data Pipelines
          </button>
          <button
            onClick={() => setSelectedView('quality')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'quality'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Data Quality
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Data Sources</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dataSources.length}</p>
              <div className="flex items-center mt-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  {dataSources.filter(s => s.status === 'connected').length} connected
                </span>
              </div>
            </div>
            <ServerIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(dataSources.reduce((sum, s) => sum + s.records, 0) / 1000000).toFixed(1)}M
              </p>
              <div className="flex items-center mt-2">
                <DocumentTextIcon className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600 dark:text-blue-400">Across all sources</span>
              </div>
            </div>
            <TableCellsIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Quality Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(dataSources.reduce((sum, s) => sum + s.quality, 0) / dataSources.length).toFixed(1)}%
              </p>
              <div className="flex items-center mt-2">
                <ShieldCheckIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">High quality</span>
              </div>
            </div>
            <ChartBarIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recentJobs.filter(j => j.status === 'running').length}
              </p>
              <div className="flex items-center mt-2">
                <ArrowPathIcon className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">In progress</span>
              </div>
            </div>
            <CogIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Data Flow Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Flow (Last 24 Hours)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataFlowData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="incoming"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.8}
                    name="Incoming"
                  />
                  <Area
                    type="monotone"
                    dataKey="processed"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.8}
                    name="Processed"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stackId="3"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.8}
                    name="Errors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Storage Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Storage Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={storageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {storageData.map((entry, __index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {storageData.map((item, __index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'sources' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Sources</h3>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {dataSources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ServerIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {source.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {source.type} • {source.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                        {getStatusIcon(source.status)}
                        <span className="ml-1">{source.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {source.records.toLocaleString()} records
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {source.size}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {source.quality}%
                      </div>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            source.quality >= 95 ? 'bg-green-500' :
                            source.quality >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${source.quality}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {source.lastSync}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mr-3">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 mr-3">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 mr-3">
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedView === 'pipelines' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Data Pipeline Jobs</h3>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getJobStatusIcon(job.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{job.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Duration: {job.duration} • Records: {job.records.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                    job.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                    job.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pipeline Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'ETL Jobs', success: 45, failed: 3 },
                  { name: 'Data Sync', success: 23, failed: 1 },
                  { name: 'Transforms', success: 67, failed: 5 },
                  { name: 'Exports', success: 12, failed: 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success" fill="#10b981" name="Successful" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Quality Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Quality Metrics</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataQualityData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Bar dataKey="score" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quality Issues */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality Issues (Last 7 Days)</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">Missing Data Fields</p>
                    <p className="text-xs text-red-700 dark:text-red-300">Production Database</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-red-900 dark:text-red-200">248 records</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Data Format Issues</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">Inventory System</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">156 records</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Delayed Updates</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Sensor Data</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">89 instances</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-200">Quality Checks Passed</p>
                    <p className="text-xs text-green-700 dark:text-green-300">All Sources</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-900 dark:text-green-200">2.8M records</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

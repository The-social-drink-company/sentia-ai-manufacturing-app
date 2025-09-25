import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BeakerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  CogIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  UserIcon,
  EyeIcon,
  PrinterIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, ComposedChart, Area, AreaChart } from 'recharts';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const QualityManagementSystem = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('daily');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [newTestVisible, setNewTestVisible] = useState(false);
  const [personnelData, setPersonnelData] = useState(null);

  // Fetch quality data with real-time updates
  const { data: qualityData, isLoading, refetch } = useQuery({
    queryKey: ['quality-management', selectedTimeRange, selectedProduct],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/quality/management?range=${selectedTimeRange}&product=${selectedProduct}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        logError('Error fetching quality data:', error);
      }
      return mockQualityData;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30000
  });

  // Fetch personnel data
  const { data: personnel } = useQuery({
    queryKey: ['personnel-quality'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/personnel/for-task/quality_inspector');
        if (response.ok) {
          const result = await response.json();
          return result.data || [];
        }
      } catch (error) {
        logError('Error fetching personnel:', error);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000
  });

  // Helper function to get real personnel name or fallback
  const getAssignedPersonnel = (index = 0) => {
    if (personnel && personnel.length > 0) {
      const person = personnel[index % personnel.length];
      return person.display_name || person.full_name || `${person.first_name} ${person.last_name}`;
    }
    return 'Quality Inspector';
  };

  const mockQualityData = {
    overview: {
      overallQualityScore: 97.8,
      defectRate: 2.2,
      passRate: 97.8,
      totalTests: 1247,
      passedTests: 1219,
      failedTests: 28,
      activeInspections: 15,
      pendingReports: 8,
      criticalIssues: 2,
      trendDirection: 'up'
    },
    qualityMetrics: [
      { date: '2025-09-01', score: 96.2, defects: 3.8, tests: 180, passed: 173 },
      { date: '2025-09-02', score: 97.1, defects: 2.9, tests: 165, passed: 160 },
      { date: '2025-09-03', score: 96.8, defects: 3.2, tests: 192, passed: 186 },
      { date: '2025-09-04', score: 98.2, defects: 1.8, tests: 201, passed: 198 },
      { date: '2025-09-05', score: 97.5, defects: 2.5, tests: 188, passed: 183 },
      { date: '2025-09-06', score: 98.1, defects: 1.9, tests: 156, passed: 153 },
      { date: '2025-09-07', score: 97.9, defects: 2.1, tests: 178, passed: 174 },
      { date: '2025-09-08', score: 97.8, defects: 2.2, tests: 187, passed: 183 }
    ],
    defectCategories: [
      { category: 'Visual Defects', count: 8, percentage: 32, color: '#EF4444', trend: 'down' },
      { category: 'Contamination', count: 6, percentage: 24, color: '#F59E0B', trend: 'stable' },
      { category: 'Packaging Issues', count: 5, percentage: 20, color: '#3B82F6', trend: 'up' },
      { category: 'Weight Variance', count: 4, percentage: 16, color: '#10B981', trend: 'down' },
      { category: 'pH Levels', count: 2, percentage: 8, color: '#8B5CF6', trend: 'stable' }
    ],
    activeTests: [
      {
        id: 'QT-2025-001',
        product: 'GABA Red 500ml',
        batch: 'B2025-089',
        testType: 'Chemical Analysis',
        status: 'in_progress',
        priority: 'high',
        assignedTo: getAssignedPersonnel(0),
        startTime: '2025-09-08T09:30:00Z',
        estimatedCompletion: '2025-09-08T11:30:00Z',
        progress: 65,
        parameters: ['pH Level', 'Alcohol Content', 'Contaminants'],
        location: 'Lab Station A'
      },
      {
        id: 'QT-2025-002',
        product: 'GABA Clear 500ml',
        batch: 'B2025-090',
        testType: 'Microbiological',
        status: 'pending',
        priority: 'medium',
        assignedTo: getAssignedPersonnel(1),
        startTime: '2025-09-08T10:00:00Z',
        estimatedCompletion: '2025-09-08T14:00:00Z',
        progress: 0,
        parameters: ['Bacterial Count', 'Yeast/Mold', 'Pathogen Screen'],
        location: 'Lab Station B'
      },
      {
        id: 'QT-2025-003',
        product: 'GABA Red 500ml',
        batch: 'B2025-091',
        testType: 'Physical Properties',
        status: 'completed',
        priority: 'low',
        assignedTo: getAssignedPersonnel(2),
        startTime: '2025-09-08T08:00:00Z',
        estimatedCompletion: '2025-09-08T09:00:00Z',
        progress: 100,
        parameters: ['Density', 'Viscosity', 'Color'],
        location: 'Lab Station C',
        result: 'pass'
      }
    ],
    qualityAlerts: [
      {
        id: 'QA-001',
        severity: 'critical',
        title: 'pH Level Out of Range',
        description: 'Batch B2025-089 showing pH levels outside acceptable range (3.2 vs target 3.8-4.2)',
        product: 'GABA Red 500ml',
        batch: 'B2025-089',
        timestamp: '2025-09-08T10:15:00Z',
        assignedTo: getAssignedPersonnel(0),
        status: 'investigating',
        actionRequired: 'Immediate batch review and potential recall assessment'
      },
      {
        id: 'QA-002',
        severity: 'warning',
        title: 'Increased Packaging Defects',
        description: 'Label placement accuracy below 95% threshold for last 4 hours',
        product: 'All Products',
        batch: 'Multiple',
        timestamp: '2025-09-08T09:45:00Z',
        assignedTo: 'Quality Team',
        status: 'monitoring',
        actionRequired: 'Calibrate labeling equipment during next maintenance window'
      },
      {
        id: 'QA-003',
        severity: 'info',
        title: 'Routine Calibration Due',
        description: 'pH meter calibration scheduled for completion by end of day',
        product: 'N/A',
        batch: 'N/A',
        timestamp: '2025-09-08T08:00:00Z',
        assignedTo: 'Maintenance Team',
        status: 'scheduled',
        actionRequired: 'Complete calibration before next production run'
      }
    ],
    testingStations: [
      {
        id: 'station-a',
        name: 'Chemical Analysis Lab A',
        status: 'active',
        currentTest: 'QT-2025-001',
        utilization: 78,
        nextAvailable: '2025-09-08T11:30:00Z',
        equipment: ['pH Meter', 'Spectrometer', 'Titrator'],
        lastCalibration: '2025-09-07T18:00:00Z'
      },
      {
        id: 'station-b',
        name: 'Microbiological Lab B',
        status: 'idle',
        currentTest: null,
        utilization: 45,
        nextAvailable: 'Available Now',
        equipment: ['Incubator', 'Microscope', 'Autoclave'],
        lastCalibration: '2025-09-06T16:00:00Z'
      },
      {
        id: 'station-c',
        name: 'Physical Properties Lab C',
        status: 'maintenance',
        currentTest: null,
        utilization: 0,
        nextAvailable: '2025-09-08T16:00:00Z',
        equipment: ['Densitometer', 'Viscometer', 'Colorimeter'],
        lastCalibration: '2025-09-05T14:00:00Z'
      }
    ],
    complianceStatus: {
      fda: { status: 'compliant', lastAudit: '2025-08-15', nextAudit: '2025-11-15', score: 98 },
      iso9001: { status: 'compliant', lastAudit: '2025-07-20', nextAudit: '2025-10-20', score: 96 },
      haccp: { status: 'compliant', lastAudit: '2025-08-01', nextAudit: '2025-11-01', score: 99 },
      organic: { status: 'pending', lastAudit: '2025-08-25', nextAudit: '2025-09-15', score: 94 }
    },
    productQuality: [
      {
        product: 'GABA Red 500ml',
        qualityScore: 98.2,
        defectRate: 1.8,
        testsToday: 45,
        passedToday: 44,
        trendDirection: 'up',
        lastIssue: '2025-09-06',
        criticalParameters: ['pH', 'Alcohol Content', 'Color Consistency']
      },
      {
        product: 'GABA Clear 500ml',
        qualityScore: 97.1,
        defectRate: 2.9,
        testsToday: 38,
        passedToday: 37,
        trendDirection: 'stable',
        lastIssue: '2025-09-07',
        criticalParameters: ['Clarity', 'pH', 'Microbiological']
      },
      {
        product: 'Limited Edition',
        qualityScore: 96.8,
        defectRate: 3.2,
        testsToday: 12,
        passedToday: 11,
        trendDirection: 'down',
        lastIssue: '2025-09-08',
        criticalParameters: ['Premium Ingredients', 'Packaging Quality', 'Labeling']
      }
    ]
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress':
      case 'active':
        return <CogIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
      case 'compliant':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'maintenance':
        return <CogIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !qualityData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = qualityData || mockQualityData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quality Management System
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comprehensive quality control with real-time testing, compliance tracking, and defect analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setNewTestVisible(!newTestVisible)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Test</span>
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <DocumentCheckIcon className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Filter
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Products</option>
              <option value="gaba-red">GABA Red 500ml</option>
              <option value="gaba-clear">GABA Clear 500ml</option>
              <option value="limited">Limited Edition</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Tests
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by batch, test ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quality Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.overallQualityScore}%
              </p>
              <div className="flex items-center mt-2">
                {data.overview.trendDirection === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className="ml-1 text-sm text-green-600">Improving</span>
              </div>
            </div>
            <ShieldCheckIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.activeInspections}
              </p>
              <p className="text-sm text-blue-600">In progress</p>
            </div>
            <BeakerIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defect Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.defectRate}%
              </p>
              <p className="text-sm text-yellow-600">Target: &lt;2%</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Issues</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.criticalIssues}
              </p>
              <p className="text-sm text-red-600">Require attention</p>
            </div>
            <BellAlertIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Quality Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quality Metrics Trend
        </h3>
        <div className="h-80">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.qualityMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'score' ? `${value}%` :
                    name === 'defects' ? `${value}%` :
                    `${value} tests`,
                    name === 'score' ? 'Quality Score' :
                    name === 'defects' ? 'Defect Rate' :
                    name === 'tests' ? 'Total Tests' : 'Passed Tests'
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB')}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="score"
                  fill="#10B981"
                  fillOpacity={0.1}
                  stroke="none"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="defects"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="tests"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Defect Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Defect Category Analysis
          </h3>
          <div className="h-64">
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.defectCategories}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                  >
                    {data.defectCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} defects`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Defect Trends by Category
          </h3>
          <div className="space-y-4">
            {data.defectCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {category.category}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.count} occurrences ({category.percentage}%)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center space-x-1 text-sm ${
                    category.trend === 'up' ? 'text-red-600' :
                    category.trend === 'down' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {category.trend === 'up' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : category.trend === 'down' ? (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    ) : (
                      <div className="w-4 h-0.5 bg-current" />
                    )}
                    <span className="text-xs">{category.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Active Quality Tests
          </h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All Tests
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Test Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.activeTests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {test.id} - {test.testType}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {test.product} (Batch: {test.batch})
                      </div>
                      <div className="text-xs text-gray-400">
                        {test.location} â€¢ {test.parameters.join(', ')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(test.status)}
                      <span className={`text-sm font-medium ${
                        test.status === 'completed' ? 'text-green-600' :
                        test.status === 'in_progress' ? 'text-blue-600' :
                        test.status === 'failed' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {test.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    {test.priority && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        test.priority === 'high' ? 'bg-red-100 text-red-800' :
                        test.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {test.priority} priority
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {test.assignedTo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            test.progress === 100 ? 'bg-green-600' :
                            test.progress > 50 ? 'bg-blue-600' :
                            'bg-yellow-600'
                          }`}
                          style={{ width: `${test.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {test.progress}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ETC: {formatDateTime(test.estimatedCompletion)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <PrinterIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quality Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Quality Alerts & Issues
          </h3>
          <BellAlertIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {data.qualityAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-sm">
                      {alert.title}
                    </h4>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2 opacity-90">
                    {alert.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="font-medium">Product:</span> {alert.product}
                    </div>
                    <div>
                      <span className="font-medium">Batch:</span> {alert.batch}
                    </div>
                    <div>
                      <span className="font-medium">Assigned:</span> {alert.assignedTo}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {alert.status}
                    </div>
                  </div>
                  
                  <div className="text-xs opacity-75">
                    <span className="font-medium">Action Required:</span> {alert.actionRequired}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 ml-4">
                  {formatDateTime(alert.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QualityManagementSystem;

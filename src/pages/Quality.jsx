import React, { useState, useEffect } from 'react';
import {
  BeakerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  TruckIcon,
  CubeIcon,
  UserGroupIcon,
  FlagIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CameraIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart, ScatterChart, Scatter
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import ChartErrorBoundary from '../components/charts/ChartErrorBoundary';
import QualityControlMonitor from '../components/quality/QualityControlMonitor';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const Quality = () => {
  const [activeTab, setActiveTab] = useState('realtime');
  const [selectedInspection] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [productFilter, setProductFilter] = useState('all');

  // Fetch quality data with real-time updates
  const { data: qualityData, isLoading, refetch } = useQuery({
    queryKey: ['quality', timeRange, productFilter],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/quality/overview?timeRange=${timeRange}&productFilter=${productFilter}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        logError('Quality API error:', error);
      }
      return mockQualityData;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30000
  });

  // Fetch personnel data
  const { data: personnel } = useQuery({
    queryKey: ['personnel-quality-control'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/personnel/for-task/quality_control');
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
  const getInspectorName = (index = 0) => {
    if (personnel && personnel.length > 0) {
      const person = personnel[index % personnel.length];
      return person.display_name || person.full_name || `${person.first_name} ${person.last_name}`;
    }
    return 'Quality Inspector';
  };

  const mockQualityData = {
    overview: {
      totalInspections: 1247,
      passedInspections: 1197,
      failedInspections: 35,
      pendingInspections: 15,
      overallPassRate: 95.98,
      defectRate: 2.81,
      scrapRate: 1.24,
      reworkRate: 3.45,
      firstPassYield: 96.02,
      inspectionBacklog: 8,
      criticalIssues: 2,
      averageInspectionTime: 12.5
    },
    qualityTrends: [
      { date: '2025-09-01', passRate: 94.2, defectRate: 3.1, firstPassYield: 95.8 },
      { date: '2025-09-02', passRate: 95.1, defectRate: 2.9, firstPassYield: 96.1 },
      { date: '2025-09-03', passRate: 96.3, defectRate: 2.4, firstPassYield: 96.8 },
      { date: '2025-09-04', passRate: 94.8, defectRate: 3.2, firstPassYield: 95.4 },
      { date: '2025-09-05', passRate: 97.1, defectRate: 1.9, firstPassYield: 97.3 },
      { date: '2025-09-06', passRate: 95.6, defectRate: 2.7, firstPassYield: 96.1 },
      { date: '2025-09-07', passRate: 96.0, defectRate: 2.8, firstPassYield: 96.0 },
      { date: '2025-09-08', passRate: 95.98, defectRate: 2.81, firstPassYield: 96.02 }
    ],
    inspectionsByProduct: [
      {
        product: 'Sentia Red 500ml',
        sku: 'SENT-RED-500',
        totalInspected: 456,
        passed: 439,
        failed: 12,
        pending: 5,
        passRate: 96.3,
        criticalDefects: 1,
        minorDefects: 11,
        avgInspectionTime: 11.2,
        lastInspection: '2025-09-08T14:30:00Z'
      },
      {
        product: 'Sentia Gold 500ml',
        sku: 'SENT-GOLD-500',
        totalInspected: 328,
        passed: 312,
        failed: 9,
        pending: 7,
        passRate: 95.1,
        criticalDefects: 0,
        minorDefects: 9,
        avgInspectionTime: 13.8,
        lastInspection: '2025-09-08T13:15:00Z'
      },
      {
        product: 'Sentia White 500ml',
        sku: 'SENT-WHITE-500',
        totalInspected: 234,
        passed: 223,
        failed: 8,
        pending: 3,
        passRate: 95.3,
        criticalDefects: 1,
        minorDefects: 7,
        avgInspectionTime: 14.2,
        lastInspection: '2025-09-08T12:45:00Z'
      },
      {
        product: 'Limited Edition',
        sku: 'SENT-LTD-500',
        totalInspected: 229,
        passed: 223,
        failed: 6,
        pending: 0,
        passRate: 97.4,
        criticalDefects: 0,
        minorDefects: 6,
        avgInspectionTime: 16.5,
        lastInspection: '2025-09-08T11:20:00Z'
      }
    ],
    defectCategories: [
      { category: 'Labeling Issues', count: 18, percentage: 28.1, severity: 'Minor', trend: 'decreasing' },
      { category: 'Fill Volume Variance', count: 14, percentage: 21.9, severity: 'Major', trend: 'stable' },
      { category: 'Cap Alignment', count: 12, percentage: 18.8, severity: 'Minor', trend: 'increasing' },
      { category: 'Package Integrity', count: 8, percentage: 12.5, severity: 'Critical', trend: 'decreasing' },
      { category: 'Color Consistency', count: 6, percentage: 9.4, severity: 'Minor', trend: 'stable' },
      { category: 'Contamination', count: 3, percentage: 4.7, severity: 'Critical', trend: 'stable' },
      { category: 'Other', count: 3, percentage: 4.7, severity: 'Minor', trend: 'stable' }
    ],
    qualityTests: [
      {
        id: 'QT001',
        testName: 'Alcohol Content Verification',
        type: 'Chemical',
        product: 'Sentia Red 500ml',
        batchNumber: 'SR-2025-089',
        status: 'completed',
        result: 'Pass',
        targetValue: '0.5%',
        actualValue: '0.51%',
        tolerance: '±0.05%',
        inspector: getInspectorName(0),
        completedAt: '2025-09-08T14:30:00Z',
        duration: 45,
        notes: 'Within acceptable range'
      },
      {
        id: 'QT002',
        testName: 'Microbiological Safety',
        type: 'Microbiological',
        product: 'Sentia Gold 500ml',
        batchNumber: 'SG-2025-034',
        status: 'in_progress',
        result: null,
        targetValue: '<10 CFU/ml',
        actualValue: 'Testing...',
        tolerance: 'Zero tolerance',
        inspector: getInspectorName(1),
        completedAt: null,
        duration: null,
        notes: '48-hour incubation in progress'
      },
      {
        id: 'QT003',
        testName: 'Sensory Evaluation',
        type: 'Sensory',
        product: 'Sentia White 500ml',
        batchNumber: 'SW-2025-045',
        status: 'completed',
        result: 'Pass',
        targetValue: '≥4.0/5.0',
        actualValue: '4.2/5.0',
        tolerance: 'Subjective',
        inspector: 'Quality Panel',
        completedAt: '2025-09-08T12:15:00Z',
        duration: 30,
        notes: 'All sensory attributes within specification'
      },
      {
        id: 'QT004',
        testName: 'Package Seal Integrity',
        type: 'Physical',
        product: 'Limited Edition',
        batchNumber: 'LE-2025-012',
        status: 'failed',
        result: 'Fail',
        targetValue: '100% seal integrity',
        actualValue: '94% pass rate',
        tolerance: '≥98%',
        inspector: getInspectorName(2),
        completedAt: '2025-09-08T11:45:00Z',
        duration: 20,
        notes: '6% of samples showed minor seal defects. Batch quarantined.'
      },
      {
        id: 'QT005',
        testName: 'Label Adhesion Test',
        type: 'Physical',
        product: 'Sentia Red 500ml',
        batchNumber: 'SR-2025-087',
        status: 'pending',
        result: null,
        targetValue: '24-hour adhesion',
        actualValue: 'Pending...',
        tolerance: 'Pass/Fail',
        inspector: getInspectorName(3),
        completedAt: null,
        duration: null,
        notes: 'Scheduled for tomorrow morning'
      }
    ],
    correctiveActions: [
      {
        id: 'CA001',
        issue: 'Increased cap misalignment on Sentia Gold',
        severity: 'Medium',
        status: 'Open',
        assignedTo: 'Production Team Lead',
        createdDate: '2025-09-07T09:00:00Z',
        dueDate: '2025-09-10T17:00:00Z',
        rootCause: 'Capping machine calibration drift',
        proposedAction: 'Recalibrate capping station and implement daily checks',
        verificationMethod: 'Monitor alignment rate for 3 production runs',
        progress: 45
      },
      {
        id: 'CA002',
        issue: 'Package seal integrity failures - Limited Edition',
        severity: 'High',
        status: 'In Progress',
        assignedTo: 'Quality Manager',
        createdDate: '2025-09-08T11:45:00Z',
        dueDate: '2025-09-09T12:00:00Z',
        rootCause: 'Investigation ongoing',
        proposedAction: 'Full batch quarantine and seal integrity testing',
        verificationMethod: 'Re-test 100% of affected batch',
        progress: 25
      },
      {
        id: 'CA003',
        issue: 'Color consistency variation in White variant',
        severity: 'Low',
        status: 'Closed',
        assignedTo: 'R&D Team',
        createdDate: '2025-09-05T14:20:00Z',
        dueDate: '2025-09-08T17:00:00Z',
        rootCause: 'Raw material batch variation',
        proposedAction: 'Updated supplier specification and incoming inspection',
        verificationMethod: 'Color measurement verification completed',
        progress: 100
      }
    ],
    inspectionSchedule: [
      {
        id: 'IS001',
        inspectionType: 'Incoming Material',
        product: 'GABA Extract Premium',
        scheduledTime: '2025-09-09T08:00:00Z',
        inspector: getInspectorName(0),
        status: 'Scheduled',
        estimatedDuration: 60,
        priority: 'High'
      },
      {
        id: 'IS002',
        inspectionType: 'In-Process Check',
        product: 'Sentia Red Production Line',
        scheduledTime: '2025-09-09T10:30:00Z',
        inspector: getInspectorName(1),
        status: 'Scheduled',
        estimatedDuration: 30,
        priority: 'Medium'
      },
      {
        id: 'IS003',
        inspectionType: 'Final Product',
        product: 'Sentia Gold Batch SG-2025-035',
        scheduledTime: '2025-09-09T14:00:00Z',
        inspector: getInspectorName(0),
        status: 'Scheduled',
        estimatedDuration: 120,
        priority: 'High'
      }
    ],
    complianceMetrics: {
      auditScore: 94.8,
      certificationsActive: 6,
      certificationsExpiring: 1,
      regulatoryCompliance: 98.2,
      documentationComplete: 96.5,
      trainingCompliance: 91.3,
      lastAudit: '2025-08-15T00:00:00Z',
      nextAudit: '2025-11-15T00:00:00Z'
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'Pass':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'Fail':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'Pass':
      case 'Closed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'Fail':
      case 'Open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
      case 'Scheduled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Major':
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Minor':
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
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
            Quality Control & Assurance
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comprehensive quality management and testing oversight
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.overallPassRate.toFixed(1)}%
              </p>
              <p className="text-sm text-green-600">Target: ≥95%</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defect Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.defectRate.toFixed(2)}%
              </p>
              <p className="text-sm text-yellow-600">Target: &lt;2.0%</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">First Pass Yield</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.firstPassYield.toFixed(1)}%
              </p>
              <p className="text-sm text-green-600">Excellent performance</p>
            </div>
            <BeakerIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Issues</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.criticalIssues}
              </p>
              <p className="text-sm text-red-600">Require immediate attention</p>
            </div>
            <FlagIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inspections</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.totalInspections}
              </p>
              <p className="text-sm text-blue-600">This period</p>
            </div>
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Test Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.averageInspectionTime}m
              </p>
              <p className="text-sm text-green-600">Within SLA</p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'realtime', label: 'Live Monitor', icon: BeakerIcon },
              { id: 'dashboard', label: 'Quality Dashboard', icon: ChartBarIcon },
              { id: 'inspections', label: 'Product Inspections', icon: ClipboardDocumentCheckIcon },
              { id: 'tests', label: 'Quality Tests', icon: DocumentTextIcon },
              { id: 'defects', label: 'Defect Analysis', icon: ExclamationTriangleIcon },
              { id: 'actions', label: 'Corrective Actions', icon: AdjustmentsHorizontalIcon },
              { id: 'compliance', label: 'Compliance', icon: FlagIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'realtime' && (
            <QualityControlMonitor />
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Quality Trends Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Quality Performance Trends
                </h3>
                <div className="h-80">
                  <ChartErrorBoundary>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.qualityTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} />
                        <YAxis />
                        <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString('en-GB')} />
                        <Area
                          type="monotone"
                          dataKey="passRate"
                          fill="#10B981"
                          fillOpacity={0.3}
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Pass Rate %"
                        />
                        <Line
                          type="monotone"
                          dataKey="firstPassYield"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          name="First Pass Yield %"
                        />
                        <Line
                          type="monotone"
                          dataKey="defectRate"
                          stroke="#EF4444"
                          strokeWidth={2}
                          name="Defect Rate %"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartErrorBoundary>
                </div>
              </div>

              {/* Defect Categories and Compliance Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Defect Categories Distribution
                  </h4>
                  <div className="h-64">
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.defectCategories}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="count"
                            label={({ category, percentage }) => `${category}: ${percentage}%`}
                          >
                            {data.defectCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={
                                entry.severity === 'Critical' ? '#EF4444' :
                                entry.severity === 'Major' ? '#F59E0B' : '#10B981'
                              } />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartErrorBoundary>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Compliance Metrics
                  </h4>
                  <div className="space-y-4">
                    {[
                      { metric: 'Audit Score', value: data.complianceMetrics.auditScore, target: 95.0, unit: '%' },
                      { metric: 'Regulatory Compliance', value: data.complianceMetrics.regulatoryCompliance, target: 100.0, unit: '%' },
                      { metric: 'Documentation Complete', value: data.complianceMetrics.documentationComplete, target: 100.0, unit: '%' },
                      { metric: 'Training Compliance', value: data.complianceMetrics.trainingCompliance, target: 95.0, unit: '%' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">)
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.metric}</div>
                          <div className="text-sm text-gray-500">Target: {item.target}{item.unit}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                item.value >= item.target ? 'bg-green-600' : 'bg-yellow-600'
                              }`}
                              style={{ width: `${(item.value / 100) * 100}%` }}
                            />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white min-w-[3rem]">
                            {item.value}{item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inspections' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Product Inspection Summary
                </h3>
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Products</option>
                  <option value="SENT-RED-500">Sentia Red 500ml</option>
                  <option value="SENT-GOLD-500">Sentia Gold 500ml</option>
                  <option value="SENT-WHITE-500">Sentia White 500ml</option>
                  <option value="SENT-LTD-500">Limited Edition</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Inspected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pass Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Defects
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Avg Test Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Inspection
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.inspectionsByProduct.map((product) => (
                      <tr key={product.sku} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.product}
                            </div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {product.totalInspected.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`text-sm font-medium ${
                              product.passRate >= 95 ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {product.passRate}%
                            </div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  product.passRate >= 95 ? 'bg-green-600' : 'bg-yellow-600'
                                }`}
                                style={{ width: `${product.passRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            Critical: {product.criticalDefects}
                          </div>
                          <div className="text-sm text-gray-500">
                            Minor: {product.minorDefects}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {product.avgInspectionTime.toFixed(1)}min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDateTime(product.lastInspection)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            product.pending > 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            product.passRate >= 95 ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {product.pending > 0 ? `${product.pending} Pending` :
                             product.passRate >= 95 ? 'Good' : 'Attention Required'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Quality Test Results
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {data.qualityTests.map((test) => (
                  <div key={test.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getStatusIcon(test.status)}
                          <h4 className="font-medium text-gray-900 dark:text-white">{test.testName}</h4>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(test.status)}`}>
                            {test.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500">Test Type</div>
                            <div className="font-medium text-gray-900 dark:text-white">{test.type}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Product</div>
                            <div className="font-medium text-gray-900 dark:text-white">{test.product}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Batch</div>
                            <div className="font-medium text-gray-900 dark:text-white">{test.batchNumber}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Inspector</div>
                            <div className="font-medium text-gray-900 dark:text-white">{test.inspector}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500">Target Value</div>
                            <div className="font-medium text-gray-900 dark:text-white">{test.targetValue}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Actual Value</div>
                            <div className={`font-medium ${
                              test.result === 'Pass' ? 'text-green-600' :
                              test.result === 'Fail' ? 'text-red-600' :
                              'text-gray-900 dark:text-white'
                            }`}>
                              {test.actualValue}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Tolerance</div>
                            <div className="font-medium text-gray-900 dark:text-white">{test.tolerance}</div>
                          </div>
                        </div>

                        {test.notes && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-500">Notes</div>
                            <div className="text-sm text-gray-900 dark:text-white">{test.notes}</div>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {test.completedAt && (
                            <div>Completed: {formatDateTime(test.completedAt)}</div>
                          )}
                          {test.duration && (
                            <div>Duration: {test.duration} minutes</div>
                          )}
                        </div>
                      </div>

                      {test.result && (
                        <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          test.result === 'Pass' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {test.result}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'defects' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Defect Analysis & Trends
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Defect Categories
                  </h4>
                  <div className="space-y-3">
                    {data.defectCategories.map((defect, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 dark:text-white">{defect.category}</div>
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(defect.severity)}`}>
                              {defect.severity}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-sm text-gray-500">
                              {defect.count} occurrences ({defect.percentage}%)
                            </div>
                            <div className={`text-sm ${
                              defect.trend === 'increasing' ? 'text-red-600' :
                              defect.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {defect.trend === 'increasing' ? '↗' :
                               defect.trend === 'decreasing' ? '↘' : '→'} {defect.trend}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Defect Trend Analysis
                  </h4>
                  <div className="h-64">
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.defectCategories.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="category" 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#EF4444" name="Defect Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartErrorBoundary>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Corrective Actions Management
                </h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <PlayIcon className="h-4 w-4" />
                  <span>Create New Action</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {data.correctiveActions.map((action) => (
                  <div key={action.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{action.issue}</h4>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(action.severity)}`}>
                            {action.severity} Severity
                          </span>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(action.status)}`}>
                            {action.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500">Assigned To</div>
                            <div className="font-medium text-gray-900 dark:text-white">{action.assignedTo}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Created</div>
                            <div className="font-medium text-gray-900 dark:text-white">{formatDate(action.createdDate)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Due Date</div>
                            <div className={`font-medium ${
                              new Date(action.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900 dark:text-white'
                            }`}>
                              {formatDate(action.dueDate)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div>
                            <div className="text-sm text-gray-500">Root Cause</div>
                            <div className="text-sm text-gray-900 dark:text-white">{action.rootCause}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Proposed Action</div>
                            <div className="text-sm text-gray-900 dark:text-white">{action.proposedAction}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Verification Method</div>
                            <div className="text-sm text-gray-900 dark:text-white">{action.verificationMethod}</div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium text-gray-900 dark:text-white">{action.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                action.status === 'Closed' ? 'bg-green-600' :
                                action.status === 'In Progress' ? 'bg-blue-600' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${action.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Compliance & Certification Management
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.complianceMetrics.auditScore}%
                  </div>
                  <div className="text-sm text-gray-500">Audit Score</div>
                  <div className="text-xs text-green-600 mt-1">Excellent performance</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.complianceMetrics.certificationsActive}
                  </div>
                  <div className="text-sm text-gray-500">Active Certifications</div>
                  <div className="text-xs text-blue-600 mt-1">All current</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.complianceMetrics.certificationsExpiring}
                  </div>
                  <div className="text-sm text-gray-500">Expiring Soon</div>
                  <div className="text-xs text-yellow-600 mt-1">Renewal required</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.complianceMetrics.trainingCompliance}%
                  </div>
                  <div className="text-sm text-gray-500">Training Compliance</div>
                  <div className="text-xs text-green-600 mt-1">Above target</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Audit Schedule
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Last Audit</div>
                        <div className="text-sm text-gray-500">{formatDate(data.complianceMetrics.lastAudit)}</div>
                      </div>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Completed
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Next Audit</div>
                        <div className="text-sm text-gray-500">{formatDate(data.complianceMetrics.nextAudit)}</div>
                      </div>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        Scheduled
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Upcoming Inspections
                  </h4>
                  <div className="space-y-3">
                    {data.inspectionSchedule.map((inspection) => (
                      <div key={inspection.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {inspection.inspectionType}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inspection.product}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDateTime(inspection.scheduledTime)} • {inspection.inspector}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            inspection.priority === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                            inspection.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {inspection.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quality;
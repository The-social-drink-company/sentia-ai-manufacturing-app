import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import ChartErrorBoundary from '../components/charts/ChartErrorBoundary';
import RealTimeProductionMonitor from '../components/production/RealTimeProductionMonitor';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const Production = () => {
  const [activeTab, setActiveTab] = useState('realtime');
  const [selectedLine, setSelectedLine] = useState('all');
  const [timeRange, setTimeRange] = useState('today');

  // Fetch production data with real-time updates
  const { data: productionData, isLoading, refetch } = useQuery({
    queryKey: ['production', selectedLine, timeRange],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/production/overview?line=${selectedLine}&range=${timeRange}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        logError('Production API error:', error);
      }
      return mockProductionData;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10000 // Real-time updates every 10 seconds
  });

  // Fetch personnel data for production
  const { data: personnel } = useQuery({
    queryKey: ['personnel-production'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/personnel/for-task/production_operator');
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
  const getOperatorName = (index = 0) => {
    if (personnel && personnel.length > 0) {
      const person = personnel[index % personnel.length];
      return person.display_name || person.full_name || `${person.first_name} ${person.last_name}`;
    }
    return 'Production Operator';
  };

  // Helper for maintenance/supervisor roles
  const getSupervisorName = (index = 0) => {
    if (personnel && personnel.length > 0) {
      const supervisors = personnel.filter(p => p.role === 'manager' || p.role === 'admin');
      if (supervisors.length > 0) {
        const person = supervisors[index % supervisors.length];
        return person.display_name || person.full_name || `${person.first_name} ${person.last_name}`;
      }
    }
    return 'Production Supervisor';
  };

  const mockProductionData = {
    overview: {
      totalProduced: 2847,
      targetProduction: 3200,
      efficiency: 89.0,
      oee: 76.4,
      activeLines: 4,
      totalLines: 5,
      downtime: 2.3,
      defectRate: 1.2,
      currentShift: 'Day Shift',
      shiftProgress: 67.5
    },
    productionLines: [
      {
        id: 'LINE_01',
        name: 'Sentia Red Production',
        status: 'running',
        currentProduct: 'Sentia Red 500ml',
        batchNumber: 'SR-2025-089',
        produced: 1250,
        target: 1500,
        efficiency: 91.2,
        oee: 82.1,
        startTime: '2025-09-08T06:00:00Z',
        estimatedCompletion: '2025-09-08T18:30:00Z',
        operator: getOperatorName(0),
        lastMaintenance: '2025-09-07T22:00:00Z'
      },
      {
        id: 'LINE_02',
        name: 'Sentia Gold Production',
        status: 'running',
        currentProduct: 'Sentia Gold 500ml',
        batchNumber: 'SG-2025-034',
        produced: 890,
        target: 1000,
        efficiency: 89.0,
        oee: 79.3,
        startTime: '2025-09-08T07:15:00Z',
        estimatedCompletion: '2025-09-08T17:45:00Z',
        operator: getOperatorName(1),
        lastMaintenance: '2025-09-06T20:00:00Z'
      },
      {
        id: 'LINE_03',
        name: 'Packaging Line A',
        status: 'maintenance',
        currentProduct: null,
        batchNumber: null,
        produced: 0,
        target: 800,
        efficiency: 0,
        oee: 0,
        startTime: '2025-09-08T08:00:00Z',
        estimatedCompletion: '2025-09-08T10:00:00Z',
        operator: getSupervisorName(0),
        lastMaintenance: '2025-09-08T08:00:00Z'
      },
      {
        id: 'LINE_04',
        name: 'Quality Control Station',
        status: 'running',
        currentProduct: 'Mixed Products',
        batchNumber: 'QC-2025-BATCH',
        produced: 657,
        target: 900,
        efficiency: 73.0,
        oee: 65.8,
        startTime: '2025-09-08T06:30:00Z',
        estimatedCompletion: '2025-09-08T19:00:00Z',
        operator: getOperatorName(2),
        lastMaintenance: '2025-09-05T18:00:00Z'
      },
      {
        id: 'LINE_05',
        name: 'Secondary Packaging',
        status: 'idle',
        currentProduct: null,
        batchNumber: null,
        produced: 50,
        target: 400,
        efficiency: 12.5,
        oee: 8.2,
        startTime: '2025-09-08T14:00:00Z',
        estimatedCompletion: null,
        operator: 'Unassigned',
        lastMaintenance: '2025-09-04T16:00:00Z'
      }
    ],
    hourlyProduction: [
      { hour: '06:00', produced: 145, target: 200, efficiency: 72.5 },
      { hour: '07:00', produced: 189, target: 200, efficiency: 94.5 },
      { hour: '08:00', produced: 156, target: 200, efficiency: 78.0 },
      { hour: '09:00', produced: 198, target: 200, efficiency: 99.0 },
      { hour: '10:00', produced: 203, target: 200, efficiency: 101.5 },
      { hour: '11:00', produced: 195, target: 200, efficiency: 97.5 },
      { hour: '12:00', produced: 178, target: 200, efficiency: 89.0 },
      { hour: '13:00', produced: 201, target: 200, efficiency: 100.5 },
      { hour: '14:00', produced: 187, target: 200, efficiency: 93.5 },
      { hour: '15:00', produced: 199, target: 200, efficiency: 99.5 },
      { hour: '16:00', produced: 202, target: 200, efficiency: 101.0 },
      { hour: '17:00', produced: 194, target: 200, efficiency: 97.0 }
    ],
    productionByProduct: [
      { product: 'Sentia Red', produced: 1250, target: 1500, percentage: 83.3 },
      { product: 'Sentia Gold', produced: 890, target: 1000, percentage: 89.0 },
      { product: 'Sentia White', produced: 457, target: 500, percentage: 91.4 },
      { product: 'Limited Edition', produced: 250, target: 200, percentage: 125.0 }
    ],
    oeeBreakdown: [
      { metric: 'Availability', value: 94.2, target: 95.0, color: '#10B981' },
      { metric: 'Performance', value: 87.5, target: 90.0, color: '#F59E0B' },
      { metric: 'Quality', value: 92.8, target: 95.0, color: '#3B82F6' }
    ],
    downtimeEvents: [
      {
        id: 'DT001',
        line: 'LINE_03',
        reason: 'Scheduled Maintenance',
        startTime: '2025-09-08T08:00:00Z',
        duration: 120,
        category: 'Planned',
        impact: 'Medium',
        resolvedBy: 'Maintenance Team'
      },
      {
        id: 'DT002',
        line: 'LINE_01',
        reason: 'Material Shortage',
        startTime: '2025-09-08T10:30:00Z',
        duration: 15,
        category: 'Unplanned',
        impact: 'Low',
        resolvedBy: 'Production Team'
      },
      {
        id: 'DT003',
        line: 'LINE_04',
        reason: 'Equipment Calibration',
        startTime: '2025-09-08T14:15:00Z',
        duration: 45,
        category: 'Quality',
        impact: 'Medium',
        resolvedBy: 'Quality Team'
      }
    ],
    qualityMetrics: {
      defectRate: 1.2,
      scrapRate: 0.8,
      reworkRate: 2.1,
      firstPassYield: 96.8,
      customerReturns: 0.04
    },
    shifts: [
      {
        shift: 'Night Shift',
        time: '22:00 - 06:00',
        produced: 1456,
        target: 1600,
        efficiency: 91.0,
        crew: 8,
        status: 'completed'
      },
      {
        shift: 'Day Shift',
        time: '06:00 - 14:00',
        produced: 2847,
        target: 3200,
        efficiency: 89.0,
        crew: 12,
        status: 'active'
      },
      {
        shift: 'Evening Shift',
        time: '14:00 - 22:00',
        produced: 0,
        target: 3200,
        efficiency: 0,
        crew: 10,
        status: 'upcoming'
      }
    ]
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-5 w-5 text-green-500" />;
      case 'maintenance':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-500" />;
      case 'idle':
        return <PauseIcon className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'idle':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading && !productionData) {
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

  const data = productionData || mockProductionData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Production Tracking & Control
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time production monitoring and optimization
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
          </select>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Produced</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.totalProduced.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600">
                {((data.overview.totalProduced / data.overview.targetProduction) * 100).toFixed(1)}% of target
              </p>
            </div>
            <TruckIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.efficiency}%
              </p>
              <p className="text-sm text-green-600">Above target (85%)</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">OEE Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.oee}%
              </p>
              <p className="text-sm text-yellow-600">World-class: &gt;85%</p>
            </div>
            <CogIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Lines</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.activeLines}/{data.overview.totalLines}
              </p>
              <p className="text-sm text-green-600">
                {((data.overview.activeLines / data.overview.totalLines) * 100).toFixed(0)}% operational
              </p>
            </div>
            <BoltIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defect Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.defectRate}%
              </p>
              <p className="text-sm text-red-600">Target: &lt;1.0%</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'realtime', label: 'Real-Time Monitor', icon: BoltIcon },
              { id: 'overview', label: 'Production Overview', icon: ChartBarIcon },
              { id: 'lines', label: 'Production Lines', icon: TruckIcon },
              { id: 'quality', label: 'Quality Metrics', icon: BeakerIcon },
              { id: 'downtime', label: 'Downtime Analysis', icon: ExclamationTriangleIcon },
              { id: 'shifts', label: 'Shift Management', icon: UserGroupIcon }
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
            <div className="space-y-6">
              <RealTimeProductionMonitor />
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Hourly Production Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Hourly Production Performance
                </h3>
                <div className="h-80">
                  <ChartErrorBoundary>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.hourlyProduction}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="produced" fill="#3B82F6" name="Produced" />
                        <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={2} name="Target" />
                        <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} name="Efficiency %" yAxisId="right" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartErrorBoundary>
                </div>
              </div>

              {/* Production by Product and OEE Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Production by Product
                  </h4>
                  <div className="h-64">
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.productionByProduct}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="product" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="produced" fill="#3B82F6" name="Produced" />
                          <Bar dataKey="target" fill="#F59E0B" name="Target" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartErrorBoundary>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    OEE Breakdown
                  </h4>
                  <div className="space-y-4">
                    {data.oeeBreakdown.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{metric.metric}</div>
                          <div className="text-sm text-gray-500">Target: {metric.target}%</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{ 
                                width: `${(metric.value / 100) * 100}%`,
                                backgroundColor: metric.color
                              }}
                            />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white min-w-[3rem]">
                            {metric.value}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lines' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Production Line Status
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.productionLines.map((line) => (
                  <div key={line.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(line.status)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{line.name}</h4>
                          <p className="text-sm text-gray-500">{line.id}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(line.status)}`}>
                        {line.status}
                      </span>
                    </div>

                    {line.currentProduct && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-500">Current Product</div>
                          <div className="font-medium text-gray-900 dark:text-white">{line.currentProduct}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Batch Number</div>
                            <div className="font-medium text-gray-900 dark:text-white">{line.batchNumber}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Operator</div>
                            <div className="font-medium text-gray-900 dark:text-white">{line.operator}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{line.produced.toLocaleString()} / {line.target.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                line.status === 'running' ? 'bg-green-600' : 'bg-gray-400'
                              }`}
                              style={{ width: `${Math.min((line.produced / line.target) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Efficiency</div>
                            <div className="font-medium text-gray-900 dark:text-white">{line.efficiency}%</div>
                          </div>
                          <div>
                            <div className="text-gray-500">OEE</div>
                            <div className="font-medium text-gray-900 dark:text-white">{line.oee}%</div>
                          </div>
                        </div>

                        <div className="text-sm">
                          <div className="text-gray-500">Estimated Completion</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {line.estimatedCompletion ? formatTime(line.estimatedCompletion) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}

                    {!line.currentProduct && line.status === 'maintenance' && (
                      <div className="text-center py-4">
                        <WrenchScrewdriverIcon className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Scheduled maintenance in progress</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Last maintenance: {formatTime(line.lastMaintenance)}
                        </p>
                      </div>
                    )}

                    {!line.currentProduct && line.status === 'idle' && (
                      <div className="text-center py-4">
                        <PauseIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Production line idle</p>
                        <p className="text-xs text-gray-400 mt-1">Awaiting assignment</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Quality Control Metrics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {Object.entries(data.qualityMetrics).map(([metric, value]) => (
                  <div key={metric} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}%
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className={`text-xs mt-1 ${
                        metric === 'firstPassYield' && value > 95 ? 'text-green-600' :
                        (metric === 'defectRate' || metric === 'scrapRate' || metric === 'reworkRate') && value < 2 ? 'text-green-600' :
                        'text-yellow-600'
                      }`}>
                        {metric === 'firstPassYield' ? (value > 95 ? 'Excellent' : 'Needs improvement') :
                         value < 2 ? 'Within target' : 'Above target'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Quality Trend (7 Days)
                  </h4>
                  <div className="h-64">
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { day: 'Mon', defectRate: 0.9, firstPassYield: 97.2 },
                          { day: 'Tue', defectRate: 1.1, firstPassYield: 96.8 },
                          { day: 'Wed', defectRate: 0.8, firstPassYield: 97.5 },
                          { day: 'Thu', defectRate: 1.3, firstPassYield: 96.1 },
                          { day: 'Fri', defectRate: 1.0, firstPassYield: 97.0 },
                          { day: 'Sat', defectRate: 1.2, firstPassYield: 96.8 },
                          { day: 'Sun', defectRate: 0.7, firstPassYield: 97.8 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="defectRate" stroke="#EF4444" name="Defect Rate %" />
                          <Line type="monotone" dataKey="firstPassYield" stroke="#10B981" name="First Pass Yield %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartErrorBoundary>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Quality Improvement Actions
                  </h4>
                  <div className="space-y-3">
                    {[
                      { action: 'Calibrate Line 4 sensors', priority: 'High', due: 'Today', status: 'In Progress' },
                      { action: 'Train operators on new QC procedures', priority: 'Medium', due: 'This Week', status: 'Pending' },
                      { action: 'Review supplier quality specs', priority: 'Low', due: 'Next Week', status: 'Scheduled' }
                    ].map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {item.action}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {item.due}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              item.priority === 'High' ? 'bg-red-100 text-red-800' :
                              item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.priority}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{item.status}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'downtime' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Downtime Analysis & Events
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.overview.downtime}%
                  </div>
                  <div className="text-sm text-gray-500">Total Downtime</div>
                  <div className="text-xs text-green-600 mt-1">Below target (5%)</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.downtimeEvents.filter(e => e.category === 'Planned').length}
                  </div>
                  <div className="text-sm text-gray-500">Planned Events</div>
                  <div className="text-xs text-blue-600 mt-1">Scheduled maintenance</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.downtimeEvents.filter(e => e.category === 'Unplanned').length}
                  </div>
                  <div className="text-sm text-gray-500">Unplanned Events</div>
                  <div className="text-xs text-red-600 mt-1">Requires attention</div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Recent Downtime Events
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Line
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Impact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Resolved By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.downtimeEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {event.line}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {event.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatTime(event.startTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDuration(event.duration)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.category === 'Planned' ? 'bg-blue-100 text-blue-800' :
                              event.category === 'Unplanned' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.impact === 'High' ? 'bg-red-100 text-red-800' :
                              event.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {event.impact}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {event.resolvedBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Shift Management & Performance
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {data.shifts.map((shift, index) => (
                  <div key={index} className={`rounded-lg p-6 border-2 ${
                    shift.status === 'active' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' :
                    shift.status === 'completed' ? 'bg-green-50 border-green-200 dark:bg-green-900/20' :
                    'bg-gray-50 border-gray-200 dark:bg-gray-700'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{shift.shift}</h4>
                        <p className="text-sm text-gray-500">{shift.time}</p>
                      </div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shift.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        shift.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {shift.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Production Progress</span>
                          <span>{shift.produced.toLocaleString()} / {shift.target.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              shift.status === 'active' ? 'bg-blue-600' :
                              shift.status === 'completed' ? 'bg-green-600' : 'bg-gray-400'
                            }`}
                            style={{ 
                              width: `${Math.min((shift.produced / shift.target) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Efficiency</div>
                          <div className="font-medium text-gray-900 dark:text-white">{shift.efficiency}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Crew Size</div>
                          <div className="font-medium text-gray-900 dark:text-white">{shift.crew} people</div>
                        </div>
                      </div>

                      {shift.status === 'active' && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-sm text-gray-500">Shift Progress</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {data.overview.shiftProgress}% complete
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Shift Performance Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.shifts.reduce((sum, shift) => sum + (shift.status === 'completed' ? shift.produced : 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Units Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(data.shifts.reduce((sum, shift) => sum + (shift.status === 'completed' ? shift.efficiency : 0), 0) / 
                        data.shifts.filter(shift => shift.status === 'completed').length || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Avg Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.shifts.reduce((sum, shift) => sum + shift.crew, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Workforce</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.shifts.filter(shift => shift.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-500">Active Shifts</div>
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

export default Production;
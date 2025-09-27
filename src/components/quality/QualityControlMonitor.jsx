import React, { useState, useEffect } from 'react';
import {
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ChartBarIcon,
  CameraIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

export default function QualityControlMonitor() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [qualityMetrics, setQualityMetrics] = useState({
    passRate: 99.2,
    defectRate: 0.8,
    inspectedUnits: 2847,
    failedUnits: 23,
    reworkUnits: 15,
    scrapUnits: 8
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setQualityMetrics(prev => ({
        ...prev,
        inspectedUnits: prev.inspectedUnits + Math.floor(Math.random() * 5),
        failedUnits: prev.failedUnits + (Math.random() > 0.85 ? 1 : 0),
        reworkUnits: prev.reworkUnits + (Math.random() > 0.9 ? 1 : 0),
        scrapUnits: prev.scrapUnits + (Math.random() > 0.95 ? 1 : 0),
        defectRate: Math.max(0, Math.min(5, prev.defectRate + (Math.random() - 0.5) * 0.1)),
        passRate: Math.max(95, Math.min(100, 100 - (prev.defectRate + (Math.random() - 0.5) * 0.1)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const qualityStations = [
    {
      id: 'QC-01',
      name: 'Incoming Inspection',
      status: 'active',
      inspector: 'Sarah Chen',
      testsPerformed: 234,
      passRate: 98.7,
      defectsFound: 3,
      currentBatch: 'B-2024-0856',
      location: 'Station A1'
    },
    {
      id: 'QC-02',
      name: 'In-Process Testing',
      status: 'active',
      inspector: 'Mike Rodriguez',
      testsPerformed: 456,
      passRate: 99.8,
      defectsFound: 1,
      currentBatch: 'B-2024-0857',
      location: 'Line 2'
    },
    {
      id: 'QC-03',
      name: 'Final Inspection',
      status: 'maintenance',
      inspector: 'Lisa Wang',
      testsPerformed: 0,
      passRate: 0,
      defectsFound: 0,
      currentBatch: 'Maintenance',
      location: 'Station C3'
    },
    {
      id: 'QC-04',
      name: 'Packaging QC',
      status: 'active',
      inspector: 'Tom Johnson',
      testsPerformed: 678,
      passRate: 99.1,
      defectsFound: 6,
      currentBatch: 'B-2024-0858',
      location: 'Pack Line'
    },
    {
      id: 'QC-05',
      name: 'Environmental Testing',
      status: 'idle',
      inspector: 'Emma Davis',
      testsPerformed: 45,
      passRate: 100,
      defectsFound: 0,
      currentBatch: 'B-2024-0859',
      location: 'Lab 1'
    }
  ];

  const recentDefects = [
    {
      id: 'DEF-001',
      type: 'Dimensional',
      severity: 'Minor',
      station: 'QC-01',
      batch: 'B-2024-0856',
      description: 'Slight deviation in length measurement',
      timestamp: '10:34 AM',
      status: 'Under Review'
    },
    {
      id: 'DEF-002',
      type: 'Visual',
      severity: 'Major',
      station: 'QC-04',
      batch: 'B-2024-0858',
      description: 'Surface scratch detected on component',
      timestamp: '10:15 AM',
      status: 'Investigating'
    },
    {
      id: 'DEF-003',
      type: 'Functional',
      severity: 'Critical',
      station: 'QC-02',
      batch: 'B-2024-0857',
      description: 'Component failed electrical continuity test',
      timestamp: '9:47 AM',
      status: 'Root Cause Analysis'
    },
    {
      id: 'DEF-004',
      type: 'Cosmetic',
      severity: 'Minor',
      station: 'QC-04',
      batch: 'B-2024-0858',
      description: 'Minor color variation in finish',
      timestamp: '9:22 AM',
      status: 'Resolved'
    }
  ];

  const getStatusColor = (_status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'idle': return 'text-yellow-600 bg-yellow-100';
      case 'maintenance': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (_severity) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'Major': return 'text-orange-600 bg-orange-100';
      case 'Minor': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (_status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'idle': return <ClockIcon className="w-4 h-4" />;
      case 'maintenance': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'error': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BeakerIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quality Control Monitor
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time quality metrics and inspection status
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Quality Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Pass Rate</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {qualityMetrics.passRate.toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 text-xs">
                  <ArrowTrendingUpIcon className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Target: 99.5%</span>
                </div>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Defect Rate</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {qualityMetrics.defectRate.toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 text-xs">
                  <ArrowTrendingDownIcon className="w-3 h-3 text-green-500" />
                  <span className="text-red-600">Target: &lt;1.0%</span>
                </div>
              </div>
              <XCircleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Inspected</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {qualityMetrics.inspectedUnits.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">Units today</p>
              </div>
              <EyeIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Failed Units</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {qualityMetrics.failedUnits}
                </p>
                <p className="text-xs text-orange-600">
                  Rework: {qualityMetrics.reworkUnits} | Scrap: {qualityMetrics.scrapUnits}
                </p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quality Stations Status */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quality Control Stations
            </h3>
            <div className="space-y-3">
              {qualityStations.map((station) => (
                <div key={station.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getStatusColor(station.status)}`}>
                        {getStatusIcon(station.status)}
                        <span className="text-sm font-medium capitalize">{station.status}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{station.name}</h4>
                        <p className="text-sm text-gray-500">{station.id} • {station.location}</p>
                        <p className="text-xs text-gray-400">Inspector: {station.inspector}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {station.testsPerformed}
                        </p>
                        <p className="text-xs text-gray-500">Tests</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${
                          station.passRate > 99 ? 'text-green-600' :
                          station.passRate > 95 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {station.passRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Pass Rate</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${
                          station.defectsFound === 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {station.defectsFound}
                        </p>
                        <p className="text-xs text-gray-500">Defects</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {station.currentBatch}
                        </p>
                        <p className="text-xs text-gray-500">Current Batch</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Defects */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Defects
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentDefects.map((defect) => (
                <div key={defect.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {defect.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(defect.severity)}`}>
                          {defect.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        {defect.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{defect.type}</span>
                        <span>{defect.station}</span>
                        <span>{defect.batch}</span>
                        <span>{defect.timestamp}</span>
                      </div>
                      <p className="text-xs font-medium text-blue-600 mt-1">{defect.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Trends Chart */}
        <div className="mt-6">
          <ChartErrorBoundary title="Quality Trends Chart Error">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quality Trends (Last 7 Days)
                </h3>
                <ChartBarIcon className="w-5 h-5 text-gray-500" />
              </div>
              <div className="h-64 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-600 dark:to-gray-500 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Quality trends chart would be displayed here</p>
                  <p className="text-sm text-gray-400 mt-1">Pass rate, defect rate, and volume trends</p>
                </div>
              </div>
            </div>
          </ChartErrorBoundary>
        </div>

        {/* Quality Control Actions */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quality Control Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Start Inspection', icon: EyeIcon, color: 'green' },
              { label: 'Photo Capture', icon: CameraIcon, color: 'blue' },
              { label: 'Detailed Analysis', icon: MagnifyingGlassIcon, color: 'purple' },
              { label: 'Adjust Parameters', icon: AdjustmentsHorizontalIcon, color: 'yellow' }
            ].map((action, index) => (
              <button
                key={index}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50 dark:hover:bg-${action.color}-900/20 transition-all duration-200`}
              >
                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * Quality Control Dashboard
 * Comprehensive quality management and control interface
 */

import React, { useState, useEffect } from 'react';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import usePerformanceMonitoring from '../../hooks/usePerformanceMonitoring';

const QualityControlDashboard = () => {
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Performance monitoring for quality control components
  usePerformanceMonitoring('QualityControlDashboard', {
    thresholdMs: 300
  });

  useEffect(() => {
    // Simulate loading quality control data
    const timer = setTimeout(() => {
      setQualityMetrics({
        overallQuality: 96.8,
        defectRate: 0.032,
        inspectionsPassed: 1847,
        inspectionsFailed: 59,
        activeInspectors: 12,
        avgInspectionTime: 3.2,
        qualityTrends: [
          { date: '2025-09-20', quality: 95.2, defects: 48 },
          { date: '2025-09-21', quality: 96.1, defects: 41 },
          { date: '2025-09-22', quality: 97.3, defects: 27 },
          { date: '2025-09-23', quality: 96.8, defects: 32 },
          { date: '2025-09-24', quality: 98.1, defects: 19 },
          { date: '2025-09-25', quality: 96.8, defects: 32 },
          { date: '2025-09-26', quality: 96.8, defects: 32 }
        ],
        recentIssues: [
          { id: 1, product: 'SKU-001', issue: 'Surface finish quality', severity: 'Medium', status: 'Investigating' },
          { id: 2, product: 'SKU-003', issue: 'Dimensional tolerance', severity: 'High', status: 'Resolved' },
          { id: 3, product: 'SKU-002', issue: 'Color consistency', severity: 'Low', status: 'Monitoring' }
        ]
      });
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const MetricCard = ({ title, value, unit, trend, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  const QualityIssueCard = ({ issue }) => {
    const severityColors = {
      High: 'border-red-500 bg-red-50',
      Medium: 'border-yellow-500 bg-yellow-50',
      Low: 'border-green-500 bg-green-50'
    };

    const statusColors = {
      Investigating: 'bg-yellow-100 text-yellow-800',
      Resolved: 'bg-green-100 text-green-800',
      Monitoring: 'bg-blue-100 text-blue-800'
    };

    return (
      <div className={`p-4 border-l-4 ${severityColors[issue.severity]} mb-3 rounded-r-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{issue.product}</h4>
            <p className="text-sm text-gray-700">{issue.issue}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[issue.status]}`}>
              {issue.status}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full border ${
              issue.severity === 'High' ? 'border-red-300 text-red-700' :
              issue.severity === 'Medium' ? 'border-yellow-300 text-yellow-700' :
              'border-green-300 text-green-700'
            }`}>
              {issue.severity}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'inspections', name: 'Inspections', icon: BeakerIcon },
    { id: 'issues', name: 'Quality Issues', icon: ExclamationTriangleIcon },
    { id: 'reports', name: 'Reports', icon: DocumentChartBarIcon }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BeakerIcon className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">Loading Quality Control Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BeakerIcon className="h-8 w-8 text-blue-600 mr-3" />
            Quality Control Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage quality metrics across all production lines
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Overall Quality Score"
            value={qualityMetrics.overallQuality}
            unit="%"
            icon={CheckCircleIcon}
            color="#10B981"
            trend={1.2}
          />
          <MetricCard
            title="Defect Rate"
            value={qualityMetrics.defectRate}
            unit="%"
            icon={ExclamationTriangleIcon}
            color="#F59E0B"
            trend={-0.5}
          />
          <MetricCard
            title="Inspections Passed"
            value={qualityMetrics.inspectionsPassed.toLocaleString()}
            icon={BeakerIcon}
            color="#3B82F6"
            subtitle="vs 59 failed"
          />
          <MetricCard
            title="Avg Inspection Time"
            value={qualityMetrics.avgInspectionTime}
            unit="min"
            icon={ClockIcon}
            color="#8B5CF6"
            trend={-8}
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quality Trend Chart */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Trend (7 Days)</h3>
                    <div className="space-y-2">
                      {qualityMetrics.qualityTrends.slice(-5).map((trend, __index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{trend.date}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-green-600">{trend.quality}%</span>
                            <span className="text-sm text-red-600">{trend.defects} defects</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Inspectors */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Team Status</h3>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <UserGroupIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{qualityMetrics.activeInspectors}</p>
                        <p className="text-sm text-gray-600">Active Inspectors</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Production Line A:</span>
                        <span className="text-green-600">4 inspectors</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Production Line B:</span>
                        <span className="text-green-600">5 inspectors</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Final Assembly:</span>
                        <span className="text-green-600">3 inspectors</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inspections' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Inspection Management</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600">Real-time inspection monitoring and scheduling interface.</p>
                  <p className="text-sm text-gray-500 mt-2">Integration with inspection equipment and quality sensors.</p>
                </div>
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Quality Issues</h3>
                  <span className="text-sm text-gray-500">{qualityMetrics.recentIssues.length} active issues</span>
                </div>
                <div className="space-y-3">
                  {qualityMetrics.recentIssues.map((issue) => (
                    <QualityIssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Quality Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <DocumentChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 mb-2">Daily Quality Report</h4>
                    <button className="text-sm text-blue-600 hover:text-blue-800">Generate Report</button>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <ChartBarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 mb-2">Weekly Trend Analysis</h4>
                    <button className="text-sm text-blue-600 hover:text-blue-800">View Analysis</button>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <CogIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 mb-2">Process Improvement</h4>
                    <button className="text-sm text-blue-600 hover:text-blue-800">View Suggestions</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityControlDashboard;
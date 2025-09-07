import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import {
  CheckCircle, XCircle, AlertTriangle, Clock,
  TrendingUp, TrendingDown, Target, TestTube,
  Microscope, Shield, FileCheck, BarChart3
} from 'lucide-react';

const QualityControl = () => {
  const { user } = useUser();
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [testType, setTestType] = useState('all');

  const { data: qualityData, isLoading, refetch } = useQuery({
    queryKey: ['quality-data', selectedBatch, testType],
    queryFn: async () => {
      const response = await fetch(`/api/quality/dashboard?batch=${selectedBatch}&test=${testType}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`
        }
      });
      if (!response.ok) {
        return mockQualityData;
      }
      return response.json();
    },
    refetchInterval: 15000,
  });

  const data = qualityData || mockQualityData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
              <p className="mt-2 text-gray-600">Real-time quality monitoring and test management</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Batches</option>
                <option value="2024-001">Batch 2024-001</option>
                <option value="2024-002">Batch 2024-002</option>
                <option value="2024-003">Batch 2024-003</option>
              </select>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tests</option>
                <option value="chemical">Chemical Analysis</option>
                <option value="microbiological">Microbiological</option>
                <option value="physical">Physical Properties</option>
              </select>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Quality Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QualityMetric
            title="Overall Pass Rate"
            value={`${data.overallPassRate}%`}
            change={`+${data.passRateChange}%`}
            trend="up"
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          <QualityMetric
            title="Tests Completed"
            value={data.testsCompleted}
            change={`+${data.testsCompletedChange}`}
            trend="up"
            icon={<TestTube className="w-6 h-6" />}
            color="blue"
          />
          <QualityMetric
            title="Pending Tests"
            value={data.pendingTests}
            change={`-${data.pendingTestsChange}`}
            trend="up"
            icon={<Clock className="w-6 h-6" />}
            color="yellow"
          />
          <QualityMetric
            title="Failed Tests"
            value={data.failedTests}
            change={`-${data.failedTestsChange}`}
            trend="up"
            icon={<XCircle className="w-6 h-6" />}
            color="red"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TestResults results={data.recentTests} />
          <QualityTrends trends={data.trends} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ActiveBatches batches={data.activeBatches} />
          <QualityAlerts alerts={data.alerts} />
          <TestSchedule schedule={data.testSchedule} />
        </div>
      </div>
    </div>
  );
};

const QualityMetric = ({ title, value, change, trend, icon, color }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="flex items-center mt-1">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm ml-1 ${trendColor}`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last week</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TestResults = ({ results }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Recent Test Results</h3>
      <div className="space-y-4">
        {results.map((test) => (
          <div key={test.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  test.status === 'passed' ? 'bg-green-500' :
                  test.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">{test.testName}</h4>
                  <p className="text-sm text-gray-500">Batch {test.batchId}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                test.status === 'passed' ? 'bg-green-100 text-green-800' :
                test.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {test.status.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Result</div>
                <div className="font-semibold text-gray-900">{test.result}</div>
              </div>
              <div>
                <div className="text-gray-500">Specification</div>
                <div className="font-semibold text-gray-900">{test.specification}</div>
              </div>
              <div>
                <div className="text-gray-500">Tested By</div>
                <div className="font-semibold text-gray-900">{test.technician}</div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              Completed: {test.completedAt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QualityTrends = ({ trends }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Quality Trends</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2" />
          <p>Quality trends visualization</p>
          <p className="text-sm">(Chart.js implementation)</p>
        </div>
      </div>
    </div>
  );
};

const ActiveBatches = ({ batches }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Active Batches</h3>
      <div className="space-y-3">
        {batches.map((batch) => (
          <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Microscope className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Batch {batch.id}</div>
                <div className="text-sm text-gray-500">{batch.product}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                batch.qcStatus === 'testing' ? 'bg-blue-100 text-blue-800' :
                batch.qcStatus === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {batch.qcStatus.toUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">{batch.testsCompleted}/{batch.totalTests} tests</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QualityAlerts = ({ alerts }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Quality Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className={`flex items-start p-3 rounded-lg border ${
            alert.severity === 'high' ? 'bg-red-50 border-red-200' :
            alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${
              alert.severity === 'high' ? 'text-red-600' :
              alert.severity === 'medium' ? 'text-yellow-600' :
              'text-blue-600'
            }`} />
            <div className="flex-1">
              <div className={`font-medium ${
                alert.severity === 'high' ? 'text-red-900' :
                alert.severity === 'medium' ? 'text-yellow-900' :
                'text-blue-900'
              }`}>{alert.title}</div>
              <div className={`text-sm mt-1 ${
                alert.severity === 'high' ? 'text-red-700' :
                alert.severity === 'medium' ? 'text-yellow-700' :
                'text-blue-700'
              }`}>{alert.description}</div>
              <div className={`text-xs mt-2 ${
                alert.severity === 'high' ? 'text-red-600' :
                alert.severity === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TestSchedule = ({ schedule }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Test Schedule</h3>
      <div className="space-y-3">
        {schedule.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <FileCheck className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900">{item.testName}</div>
                <div className="text-sm text-gray-500">Batch {item.batchId}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                item.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {item.priority.toUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">{item.scheduledTime}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock data for development
const mockQualityData = {
  overallPassRate: 98.7,
  passRateChange: 0.5,
  testsCompleted: 147,
  testsCompletedChange: 12,
  pendingTests: 8,
  pendingTestsChange: 3,
  failedTests: 2,
  failedTestsChange: 1,
  recentTests: [
    {
      id: 'QC-001',
      testName: 'pH Analysis',
      batchId: '2024-001',
      status: 'passed',
      result: '6.8',
      specification: '6.5-7.2',
      technician: 'Sarah Johnson',
      completedAt: '2 hours ago'
    },
    {
      id: 'QC-002',
      testName: 'Microbiological Count',
      batchId: '2024-002',
      status: 'passed',
      result: '<10 CFU/ml',
      specification: '<100 CFU/ml',
      technician: 'Mike Brown',
      completedAt: '4 hours ago'
    },
    {
      id: 'QC-003',
      testName: 'Alcohol Content',
      batchId: '2024-001',
      status: 'failed',
      result: '12.8%',
      specification: '12.0-12.5%',
      technician: 'Lisa Davis',
      completedAt: '6 hours ago'
    }
  ],
  activeBatches: [
    {
      id: '2024-001',
      product: 'GABA Red 500ml',
      qcStatus: 'testing',
      testsCompleted: 3,
      totalTests: 5
    },
    {
      id: '2024-002',
      product: 'GABA Clear 500ml',
      qcStatus: 'approved',
      testsCompleted: 4,
      totalTests: 4
    },
    {
      id: '2024-003',
      product: 'GABA Red 250ml',
      qcStatus: 'pending',
      testsCompleted: 1,
      totalTests: 5
    }
  ],
  alerts: [
    {
      title: 'Alcohol Content Out of Spec',
      description: 'Batch 2024-001 alcohol content exceeds upper specification limit',
      severity: 'high',
      time: '15 minutes ago'
    },
    {
      title: 'pH Test Delayed',
      description: 'pH testing for Batch 2024-003 is 2 hours behind schedule',
      severity: 'medium',
      time: '1 hour ago'
    }
  ],
  testSchedule: [
    {
      testName: 'Microbiological Analysis',
      batchId: '2024-003',
      priority: 'urgent',
      scheduledTime: 'Today 3:00 PM'
    },
    {
      testName: 'Chemical Stability',
      batchId: '2024-004',
      priority: 'high',
      scheduledTime: 'Tomorrow 9:00 AM'
    },
    {
      testName: 'Sensory Evaluation',
      batchId: '2024-002',
      priority: 'normal',
      scheduledTime: 'Tomorrow 2:00 PM'
    }
  ]
};

export default QualityControl;
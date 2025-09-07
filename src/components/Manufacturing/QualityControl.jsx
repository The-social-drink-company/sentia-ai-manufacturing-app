import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSSE, useSSEEvent } from '../../hooks/useSSE';
import { CardSkeleton } from '../LoadingStates';
import { LineChart, DoughnutChart, qualityColors } from '../charts';
import {
  CheckCircle, XCircle, AlertTriangle, Clock,
  TrendingUp, TrendingDown, TestTube,
  Microscope, FileCheck, BarChart3,
  RefreshCw, Zap
} from 'lucide-react';

const QualityControl = () => {
  const { data: session } = ();
  const user = session?.user;
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [testType, setTestType] = useState('all');
  const [liveUpdates, setLiveUpdates] = useState(true);

  // Setup SSE connection for real-time quality updates
  const sseConnection = useSSE({
    endpoint: '/api/events/quality',
    enabled: liveUpdates
  });

  // Listen for test result updates
  useSSEEvent('quality.test.result', (data) => {
    queryClient.setQueryData(['quality-data', selectedBatch, testType], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        activeTests: oldData.activeTests.map(test =>
          test.id === data.testId
            ? { ...test, ...data.result }
            : test
        ),
        passRate: data.newPassRate || oldData.passRate,
        totalTests: data.totalTests || oldData.totalTests
      };
    });
  }, [selectedBatch, testType]);

  // Listen for new quality alerts
  useSSEEvent('quality.alert.new', (data) => {
    queryClient.setQueryData(['quality-data', selectedBatch, testType], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        alerts: [data, ...oldData.alerts.slice(0, 9)]
      };
    });
  }, [selectedBatch, testType]);

  // Listen for batch status changes
  useSSEEvent('quality.batch.status', (data) => {
    queryClient.setQueryData(['quality-data', selectedBatch, testType], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        batchStatus: oldData.batchStatus.map(batch =>
          batch.id === data.batchId
            ? { ...batch, ...data.updates }
            : batch
        )
      };
    });
  }, [selectedBatch, testType]);

  const { data: qualityData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['quality-data', selectedBatch, testType],
    queryFn: async () => {
      const response = await fetch(`/api/quality/dashboard?batch=${selectedBatch}&test=${testType}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch quality data');
      }
      return response.json();
    },
    refetchInterval: liveUpdates ? 60000 : 15000,
    staleTime: liveUpdates ? 50000 : 10000,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const data = qualityData;

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
              
              {/* Real-time status indicator */}
              <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  sseConnection.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {sseConnection.isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Live updates toggle */}
              <button
                onClick={() => setLiveUpdates(!liveUpdates)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                  liveUpdates 
                    ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Zap className="w-4 h-4 mr-2" />
                {liveUpdates ? 'Live Updates On' : 'Live Updates Off'}
              </button>

              <button
                onClick={() => refetch()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : isError || !data ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isError ? 'Unable to Load Quality Data' : 'No Quality Control Data Available'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {isError 
                ? `Error: ${error?.message || 'Failed to fetch quality control data from server'}`
                : 'No quality control data has been imported yet. Please import your QC test data to get started.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/data-import'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import Quality Data
              </button>
              <button
                onClick={() => refetch()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
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
        </>
        )}
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
  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Pass Rate %',
        data: [96.5, 97.2, 98.1, 97.8, 98.7, 98.5],
        borderColor: qualityColors.passed,
        backgroundColor: qualityColors.passed.replace('0.8', '0.1'),
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Tests Completed',
        data: [142, 156, 134, 167, 147, 152],
        borderColor: qualityColors.inProgress,
        backgroundColor: qualityColors.inProgress,
        tension: 0.4,
        fill: false,
        yAxisID: 'y1',
      }
    ]
  };

  const chartOptions = {
    plugins: {
      title: {
        display: true,
        text: 'Quality Performance Over Time'
      },
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Pass Rate (%)'
        },
        min: 95,
        max: 100,
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Tests Completed'
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 120,
        max: 180,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Quality Trends</h3>
      <LineChart data={chartData} options={chartOptions} height={300} />
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


export default QualityControl;
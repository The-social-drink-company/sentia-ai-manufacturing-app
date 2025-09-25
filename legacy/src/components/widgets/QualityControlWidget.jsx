import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  WidgetContainer,
  WidgetSkeleton,
  WidgetError,
  MetricCard
} from './WidgetComponents';

const QualityControlWidget = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Fetch quality control data from API
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['quality-control'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/quality/metrics`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback to mock data if API fails
        
        throw new Error(`Failed to fetch quality metrics: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 45000, // Refresh every 45 seconds
    retry: 2,
    retryDelay: 1000
  });

    if (isLoading) return <WidgetSkeleton title="Quality Control" height="400px" />;
  if (error) return <WidgetError error={error} onRetry={refetch} title={title} />;
  if (!data) return <WidgetError error={{ message: 'No data available. Please connect to real data source.' }} onRetry={refetch} title={title} />;

  const widgetData = data;

  // Doughnut chart configuration
  const doughnutData = {
    labels: ['Passed', 'Failed', 'Rework'],
    datasets: [
      {
        data: [
          quality.distribution?.passed || 0,
          quality.distribution?.failed || 0,
          quality.distribution?.rework || 0
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)'
        ],
        borderWidth: 1
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  // Line chart configuration
  const lineData = {
    labels: quality.trend?.labels || [],
    datasets: [
      {
        label: 'Pass Rate (%)',
        data: quality.trend?.passRates || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Inspections',
        data: quality.trend?.inspections || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 95,
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        }
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <WidgetContainer
      title="Quality Control"
      onRefresh={() => {
        queryClient.invalidateQueries(['quality-control']);
        refetch();
      }}
      isRefreshing={isRefetching}
      className="col-span-2"
    >
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Pass Rate"
          value={quality.summary?.passRate || 0}
          unit="%"
          trend={{ direction: quality.summary?.passRate > 98 ? 'up' : 'down', value: 0.3 }}
          icon={CheckCircleIcon}
        />
        <MetricCard
          label="Defect Rate"
          value={quality.summary?.defectRate || 0}
          unit="%"
          trend={{ direction: 'down', value: 0.2 }}
          icon={XCircleIcon}
        />
        <MetricCard
          label="Inspections"
          value={quality.summary?.totalInspections || 0}
          icon={BeakerIcon}
        />
        <MetricCard
          label="Total Defects"
          value={quality.summary?.totalDefects || 0}
          trend={{ direction: 'down', value: 5 }}
          icon={ExclamationCircleIcon}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Quality Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quality Distribution</h4>
          <div style={{ height: '200px' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Quality Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Six Sigma Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-400">Process Capability (Cpk)</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {quality.qualityMetrics?.cpk || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-400">DPMO</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {quality.qualityMetrics?.dpmo || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sigma Level</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {quality.qualityMetrics?.sigmaLevel || 0}Ïƒ
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-400">First Pass Yield</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {quality.qualityMetrics?.firstPassYield || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pass Rate Trend */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Pass Rate Trend</h4>
        <div style={{ height: '200px' }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Defect Types */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Defect Types</h4>
        <div className="space-y-2">
          {quality.defectTypes?.map((defect) => (
            <div key={defect.type} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{defect.type}</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${defect.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                  {defect.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Issues */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Issues</h4>
        <div className="space-y-2">
          {quality.recentIssues?.map((issue) => (
            <div key={issue.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">{issue.time}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{issue.product}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{issue.issue}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(issue.severity)}`}>
                {issue.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </WidgetContainer>
  );
};

export default QualityControlWidget;

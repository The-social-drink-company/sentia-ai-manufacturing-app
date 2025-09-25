import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CogIcon,
  ChartBarIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  WidgetContainer,
  WidgetSkeleton,
  WidgetError,
  MetricCard
} from './WidgetComponents';

const ProductionMetricsWidget = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Fetch production metrics from API
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['production-metrics'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/production/metrics`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback to mock data if API fails
        
        throw new Error(`Failed to fetch production metrics: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
    retryDelay: 1000
  });

    if (isLoading) return <WidgetSkeleton title="Production Metrics" height="400px" />;
  if (error) return <WidgetError error={error} onRetry={refetch} title={title} />;
  if (!data) return <WidgetError error={{ message: 'No data available. Please connect to real data source.' }} onRetry={refetch} title={title} />;

  const widgetData = data;

  // Chart configuration
  const chartData = {
    labels: metrics.trend?.labels || [],
    datasets: [
      {
        label: 'Actual Production',
        data: metrics.trend?.production || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Target',
        data: metrics.trend?.target || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        }
      }
    }
  };

  const progressPercentage = ((metrics.current?.unitsProduced || 0) / (metrics.current?.targetUnits || 1)) * 100;

  return (
    <WidgetContainer
      title="Production Metrics"
      onRefresh={() => {
        queryClient.invalidateQueries(['production-metrics']);
        refetch();
      }}
      isRefreshing={isRefetching}
      className="col-span-2"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Units Produced"
          value={metrics.current?.unitsProduced?.toLocaleString() || '0'}
          unit="units"
          trend={{ direction: 'up', value: 5.2 }}
          icon={CogIcon}
        />
        <MetricCard
          label="Efficiency"
          value={metrics.current?.efficiency || 0}
          unit="%"
          trend={{ direction: metrics.current?.efficiency > 85 ? 'up' : 'down', value: 2.1 }}
          icon={ChartBarIcon}
        />
        <MetricCard
          label="OEE"
          value={metrics.current?.oee || 0}
          unit="%"
          trend={{ direction: 'neutral', value: 0.5 }}
          icon={TruckIcon}
        />
        <MetricCard
          label="Quality Rate"
          value={metrics.current?.quality || 0}
          unit="%"
          trend={{ direction: 'up', value: 1.2 }}
          icon={CheckCircleIcon}
        />
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Daily Target Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progressPercentage >= 100 ? 'bg-green-500' : progressPercentage >= 75 ? 'bg-blue-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Production Trend Chart */}
      <div className="mb-6" style={{ height: '200px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Shift Performance */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {metrics.shifts?.map((shift) => (
          <div key={shift.name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">{shift.name}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {shift.units} units
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {shift.efficiency}% efficient
            </p>
          </div>
        ))}
      </div>

      {/* Product Mix */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Product Mix</h4>
        <div className="space-y-2">
          {metrics.products?.map((product) => (
            <div key={product.name} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{product.name}</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${product.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {product.units}
                </span>
              </div>
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

export default ProductionMetricsWidget;
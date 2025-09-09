import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { useSSE, useSSEEvent } from '../../hooks/useSSE';
import { 
  showErrorToast, 
  handleAsyncError, 
  withRetry, 
  getErrorType, 
  ERROR_TYPES 
} from '../../utils/errorHandling';
import {
  ChartBarIcon,
  Cog8ToothIcon,
  CubeIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { LineChart, BarChart, DoughnutChart, productionColors, qualityColors, inventoryColors } from '../charts';
import { cn } from '../../lib/utils';

// Widget Types
const WIDGET_TYPES = {
  KPI_STRIP: 'kpi_strip',
  PRODUCTION_STATUS: 'production_status', 
  QUALITY_METRICS: 'quality_metrics',
  INVENTORY_ALERTS: 'inventory_alerts',
  REAL_TIME_CHART: 'real_time_chart',
  SYSTEM_STATUS: 'system_status',
  FORECAST_SUMMARY: 'forecast_summary',
  ALERT_MONITOR: 'alert_monitor'
};

// Base Widget Component
const BaseWidget = ({ 
  title, 
  subtitle, 
  children, 
  className = '', 
  actions = null,
  loading = false,
  error = null,
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1', 
    large: 'col-span-3 row-span-2',
    wide: 'col-span-4 row-span-1'
  };

  if (error) {
    return (
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4",
        sizeClasses[size],
        className
      )}>
        <div className="flex flex-col items-center justify-center h-full">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {error.message || 'Widget failed to load'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
      sizeClasses[size],
      className
    )}>
      {/* Widget Header */}
      {(title || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Widget Content */}
      <div className="p-4 h-full">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

// KPI Strip Widget
const KPIStripWidget = ({ metrics = [] }) => {
  return (
    <BaseWidget 
      title="Key Performance Indicators" 
      size="wide"
      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
    >
      <div className="grid grid-cols-4 gap-4 h-full">
        {metrics.map((metric, index) => (
          <div key={index} className="flex flex-col items-center justify-center text-center">
            <div className={cn(
              "p-3 rounded-full mb-2",
              metric.trend === 'up' 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : metric.trend === 'down'
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
            )}>
              {metric.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metric.value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {metric.label}
            </div>
            <div className={cn(
              "flex items-center text-xs",
              metric.trend === 'up' ? 'text-green-600' : 
              metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
            )}>
              {metric.trend === 'up' && <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />}
              {metric.trend === 'down' && <TrendingDownIcon className="h-3 w-3 mr-1" />}
              {metric.change}
            </div>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
};

// Production Status Widget
const ProductionStatusWidget = () => {
  const { user } = useUser();
  
  // Setup SSE for real-time production updates
  const sseConnection = useSSE({
    endpoint: '/api/events/production',
    enabled: true
  });

  const [productionLines, setProductionLines] = useState([]);

  // Listen for production line updates
  useSSEEvent('production.line.status', (data) => {
    setProductionLines(prev => 
      prev.map(line => 
        line.id === data.lineId 
          ? { ...line, ...data.updates, lastUpdated: new Date() }
          : line
      )
    );
  }, []);

  // Fetch initial production data
  const { data, isLoading, error } = useQuery({
    queryKey: ['production-status'],
    queryFn: async () => {
      const response = await withRetry(async () => {
        const token = await user?.getToken();
        const res = await fetch('/api/production/lines/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch production status');
        return res.json();
      });
      return response;
    },
    refetchInterval: 30000,
    onSuccess: (data) => {
      setProductionLines(data.lines || []);
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'stopped': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <PlayIcon className="h-4 w-4" />;
      case 'paused': return <PauseIcon className="h-4 w-4" />;
      case 'stopped': return <StopIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  return (
    <BaseWidget
      title="Production Lines"
      subtitle={`${productionLines.length} lines monitored • ${sseConnection.isConnected ? 'Live' : 'Offline'}`}
      size="large"
      loading={isLoading}
      error={error}
      actions={
        <div className={cn(
          "flex items-center space-x-2 text-xs",
          sseConnection.isConnected ? 'text-green-600' : 'text-red-600'
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            sseConnection.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          )} />
          <span>{sseConnection.isConnected ? 'Live' : 'Offline'}</span>
        </div>
      }
    >
      <div className="space-y-3 h-full overflow-y-auto">
        {productionLines.map((line) => (
          <div 
            key={line.id} 
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-lg",
                getStatusColor(line.status)
              )}>
                {getStatusIcon(line.status)}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {line.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {line.product || 'No product assigned'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {line.efficiency || 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {line.outputRate || 0}/{line.target || 0} units/hr
              </div>
            </div>
          </div>
        ))}
        
        {productionLines.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <Cog8ToothIcon className="h-8 w-8 mb-2" />
            <p className="text-sm">No production lines configured</p>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

// Quality Metrics Widget
const QualityMetricsWidget = () => {
  const { user } = useUser();

  const { data, isLoading, error } = useQuery({
    queryKey: ['quality-metrics'],
    queryFn: async () => {
      const response = await withRetry(async () => {
        const token = await user?.getToken();
        const res = await fetch('/api/quality/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch quality metrics');
        return res.json();
      });
      return response;
    },
    refetchInterval: 60000
  });

  const chartData = useMemo(() => {
    if (!data?.trends) return null;
    
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Pass Rate %',
          data: data.trends.passRate || [95, 97, 96, 98],
          borderColor: qualityColors.passed,
          backgroundColor: qualityColors.passed.replace('0.8)', '0.1)'),
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [data]);

  return (
    <BaseWidget
      title="Quality Control"
      subtitle="Current batch quality metrics"
      size="medium"
      loading={isLoading}
      error={error}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data?.overallPassRate || 98}%
            </div>
            <div className="text-xs text-gray-500">Pass Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data?.testsCompleted || 147}
            </div>
            <div className="text-xs text-gray-500">Tests Today</div>
          </div>
        </div>
        
        {chartData && (
          <div className="h-32">
            <LineChart 
              data={chartData} 
              options={{
                plugins: { legend: { display: false } },
                scales: {
                  x: { display: false },
                  y: { display: false }
                }
              }}
              height={128}
            />
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

// Inventory Alerts Widget  
const InventoryAlertsWidget = () => {
  const { user } = useUser();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const response = await withRetry(async () => {
        const token = await user?.getToken();
        const res = await fetch('/api/inventory/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch inventory alerts');
        return res.json();
      });
      return response;
    },
    refetchInterval: 30000
  });

  const alerts = data?.alerts || [];

  return (
    <BaseWidget
      title="Inventory Alerts"
      subtitle={`${alerts.length} active alerts`}
      size="medium"
      loading={isLoading}
      error={error}
    >
      <div className="space-y-3 h-full overflow-y-auto">
        {alerts.map((alert, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              alert.severity === 'high' ? 'bg-red-50 border-red-200' :
              alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            )}
          >
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className={cn(
                "h-5 w-5",
                alert.severity === 'high' ? 'text-red-500' :
                alert.severity === 'medium' ? 'text-yellow-500' :
                'text-blue-500'
              )} />
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {alert.item}
                </div>
                <div className="text-xs text-gray-500">
                  {alert.message}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-sm font-semibold",
                alert.severity === 'high' ? 'text-red-600' :
                alert.severity === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              )}>
                {alert.currentStock}
              </div>
              <div className="text-xs text-gray-500">
                Min: {alert.minimumStock}
              </div>
            </div>
          </div>
        ))}
        
        {alerts.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <CheckCircleIcon className="h-8 w-8 mb-2 text-green-500" />
            <p className="text-sm">All inventory levels normal</p>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

// Real-time Chart Widget
const RealTimeChartWidget = ({ title, dataEndpoint, chartType = 'line' }) => {
  const { user } = useUser();
  const [chartData, setChartData] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['realtime-chart', dataEndpoint],
    queryFn: async () => {
      const response = await withRetry(async () => {
        const token = await user?.getToken();
        const res = await fetch(dataEndpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch chart data');
        return res.json();
      });
      return response;
    },
    refetchInterval: 15000,
    onSuccess: (data) => {
      setChartData(data);
    }
  });

  const ChartComponent = chartType === 'bar' ? BarChart : 
                        chartType === 'doughnut' ? DoughnutChart : LineChart;

  return (
    <BaseWidget
      title={title}
      subtitle="Real-time data"
      size="medium"
      loading={isLoading}
      error={error}
    >
      {chartData && (
        <div className="h-48">
          <ChartComponent
            data={chartData}
            options={{
              plugins: {
                legend: { position: 'bottom' }
              },
              maintainAspectRatio: false
            }}
          />
        </div>
      )}
    </BaseWidget>
  );
};

// Main Widget System Container
const WidgetSystem = ({ layout = 'default' }) => {
  const defaultKPIMetrics = [
    {
      label: 'Overall Efficiency',
      value: '94%',
      change: '+2.1%',
      trend: 'up',
      icon: <ChartBarIcon className="h-6 w-6 text-green-600" />
    },
    {
      label: 'Quality Rate',
      value: '98.5%', 
      change: '+0.8%',
      trend: 'up',
      icon: <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
    },
    {
      label: 'Active Lines',
      value: '8/10',
      change: '+1',
      trend: 'up',
      icon: <Cog8ToothIcon className="h-6 w-6 text-purple-600" />
    },
    {
      label: 'Inventory Status',
      value: '95%',
      change: '-1.2%',
      trend: 'down',
      icon: <CubeIcon className="h-6 w-6 text-orange-600" />
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Widget Grid */}
      <div className="grid grid-cols-6 gap-4 auto-rows-fr">
        {/* KPI Strip - Full Width */}
        <div className="col-span-6">
          <KPIStripWidget metrics={defaultKPIMetrics} />
        </div>
        
        {/* Production Status - Large */}
        <div className="col-span-3">
          <ProductionStatusWidget />
        </div>
        
        {/* Quality Metrics - Medium */}
        <div className="col-span-2">
          <QualityMetricsWidget />
        </div>
        
        {/* Inventory Alerts - Medium */} 
        <div className="col-span-1">
          <InventoryAlertsWidget />
        </div>
        
        {/* Real-time Charts */}
        <div className="col-span-2">
          <RealTimeChartWidget
            title="Production Trends"
            dataEndpoint="/api/charts/production-trends"
            chartType="line"
          />
        </div>
        
        <div className="col-span-2">
          <RealTimeChartWidget
            title="Quality Distribution"
            dataEndpoint="/api/charts/quality-distribution"
            chartType="doughnut"
          />
        </div>
        
        <div className="col-span-2">
          <RealTimeChartWidget
            title="Inventory Levels"
            dataEndpoint="/api/charts/inventory-levels"
            chartType="bar"
          />
        </div>
      </div>
    </div>
  );
};

export default WidgetSystem;
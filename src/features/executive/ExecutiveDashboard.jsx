import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SignalIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';
import { useExecutiveStore } from './stores/executiveStore';
import KPIWidget from './components/KPIWidget';
import TrendChart from './components/TrendChart';
import AlertPanel from './components/AlertPanel';
import { useSSE } from '../../hooks/useSSE';
import { formatCurrency, formatPercentage } from './utils/formatters';
import { logInfo, logError, devLog } from '../../utils/structuredLogger';

const ExecutiveDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const {
    metrics,
    alerts,
    trends,
    fetchExecutiveMetrics,
    updateMetric,
    addAlert
  } = useExecutiveStore();

  // Real-time SSE updates for executive metrics
  const {
    data: sseData,
    isConnected: sseConnected,
    lastUpdate: sseLastUpdate
  } = useSSE(['executive-metrics', 'executive-alerts', 'system-status'], {
    onEvent: (eventType, eventData) => {
      switch (eventType) {
        case 'executive-metrics':
          if (eventData.metrics) {
            // Update specific metrics in the store
            Object.entries(eventData.metrics).forEach(([key, value]) => {
              updateMetric({ name: key, data: value });
            });
          }
          break;
        case 'executive-alerts':
          if (eventData.alert) {
            // Add new alert to the store
            addAlert(eventData.alert);
          }
          break;
        case 'system-status':
          // Handle system status updates
          devLog.log('System status update:', eventData);
          break;
        default:
          devLog.log('Unhandled SSE event:', eventType, eventData);
      }
    }
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        await fetchExecutiveMetrics();
      } catch (error) {
        logError('Failed to load executive metrics', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // Refresh every 30 seconds as per FR-003
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchExecutiveMetrics]);

  // Key Performance Indicators as per FR-001 and FR-008
  const kpiData = [
    {
      id: 'revenue',
      title: 'Revenue',
      value: metrics?.revenue?.value || 0,
      target: metrics?.revenue?.target || 0,
      trend: metrics?.revenue?.trend || 0,
      icon: CurrencyDollarIcon,
      formatter: formatCurrency,
      color: 'blue'
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow',
      value: metrics?.cashFlow?.value || 0,
      target: metrics?.cashFlow?.target || 0,
      trend: metrics?.cashFlow?.trend || 0,
      icon: CurrencyDollarIcon,
      formatter: formatCurrency,
      color: 'green'
    },
    {
      id: 'current-ratio',
      title: 'Current Ratio',
      value: metrics?.currentRatio?.value || 0,
      target: metrics?.currentRatio?.target || 2.0,
      trend: metrics?.currentRatio?.trend || 0,
      icon: ChartBarIcon,
      formatter: (val) => val.toFixed(2),
      color: 'purple'
    },
    {
      id: 'quick-ratio',
      title: 'Quick Ratio',
      value: metrics?.quickRatio?.value || 0,
      target: metrics?.quickRatio?.target || 1.0,
      trend: metrics?.quickRatio?.trend || 0,
      icon: ChartBarIcon,
      formatter: (val) => val.toFixed(2),
      color: 'indigo'
    },
    {
      id: 'oee',
      title: 'OEE',
      value: metrics?.oee?.value || 0,
      target: metrics?.oee?.target || 85,
      trend: metrics?.oee?.trend || 0,
      icon: ArrowTrendingUpIcon,
      formatter: formatPercentage,
      color: 'yellow'
    },
    {
      id: 'throughput',
      title: 'Throughput',
      value: metrics?.throughput?.value || 0,
      target: metrics?.throughput?.target || 0,
      trend: metrics?.throughput?.trend || 0,
      icon: ChartBarIcon,
      formatter: (val) => `${val.toLocaleString()} units`,
      color: 'teal'
    },
    {
      id: 'market-share',
      title: 'Market Share',
      value: metrics?.marketShare?.value || 0,
      target: metrics?.marketShare?.target || 0,
      trend: metrics?.marketShare?.trend || 0,
      icon: ArrowTrendingUpIcon,
      formatter: formatPercentage,
      color: 'pink'
    },
    {
      id: 'customer-satisfaction',
      title: 'Customer Satisfaction',
      value: metrics?.customerSatisfaction?.value || 0,
      target: metrics?.customerSatisfaction?.target || 90,
      trend: metrics?.customerSatisfaction?.trend || 0,
      icon: ArrowTrendingUpIcon,
      formatter: formatPercentage,
      color: 'orange'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading executive metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Executive Dashboard
            </h1>
            <p className="text-blue-100">
              Welcome back, {user?.firstName || 'Executive'}.
              Here&apos;s your strategic overview.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* SSE Connection Status */}
            <div className="flex items-center space-x-2">
              {sseConnected ? (
                <>
                  <SignalIcon className="h-5 w-5 text-green-300" />
                  <span className="text-xs text-blue-100">Live</span>
                </>
              ) : (
                <>
                  <SignalSlashIcon className="h-5 w-5 text-red-300" />
                  <span className="text-xs text-blue-100">Offline</span>
                </>
              )}
            </div>
            {/* Last Update Timestamp */}
            {sseLastUpdate && (
              <div className="text-xs text-blue-200">
                Updated: {new Date(sseLastUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alerts Panel - FR-005 */}
      {alerts?.filter(a => a.severity === 'critical').length > 0 && (
        <AlertPanel
          alerts={alerts.filter(a => a.severity === 'critical')}
          className="border-red-500 bg-red-50"
        />
      )}

      {/* KPI Grid - FR-001, FR-002 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map(kpi => (
          <KPIWidget
            key={kpi.id}
            {...kpi}
            onClick={() => {
              // FR-006: One-click navigation to detailed reports
              window.location.href = `/reports/${kpi.id}`;
            }}
          />
        ))}
      </div>

      {/* Trend Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Financial Trends</h3>
          <TrendChart
            data={trends?.financial || []}
            categories={['Revenue', 'Cash Flow', 'Profit Margin']}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Operational Trends</h3>
          <TrendChart
            data={trends?.operational || []}
            categories={['OEE', 'Throughput', 'Quality Rate']}
          />
        </div>
      </div>

      {/* Strategic Opportunities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Strategic Opportunities</h3>
        <div className="space-y-3">
          {alerts?.filter(a => a.type === 'opportunity').map(alert => (
            <div key={alert.id} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{alert.title}</p>
                <p className="text-sm text-gray-600">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button - FR-007 */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;

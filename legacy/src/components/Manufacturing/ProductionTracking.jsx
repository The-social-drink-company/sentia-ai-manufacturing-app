import { devLog } from '../../lib/devLog.js';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSSE, useSSEEvent } from '../../hooks/useSSE';
import { CardSkeleton } from '../LoadingStates';
import { showErrorToast } from '../../utils/errorHandling';
import { LineChart, BarChart, productionColors } from '../charts';
import {
  Play, Pause, StopCircle, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Clock, Settings, RefreshCw,
  BarChart3, Activity, Target, Zap
} from 'lucide-react';

const ProductionTracking = () => {
  const { data: session } = ();
  const user = session?.user;
  const queryClient = useQueryClient();
  const [selectedLine, setSelectedLine] = useState('all');
  const [timeRange, setTimeRange] = useState('today');
  const [liveUpdates, setLiveUpdates] = useState(true);

  // Setup SSE connection for real-time updates
  const sseConnection = useSSE({
    endpoint: '/api/events/production',
    enabled: liveUpdates,
    onConnect: () => {
      devLog.log('Production SSE connected');
    },
    onError: (error) => {
      devLog.error('Production SSE error:', error);
    }
  });

  // Listen for production line status updates
  useSSEEvent('production.line.status', (data) => {
    queryClient.setQueryData(['production-data', selectedLine, timeRange], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        lines: oldData.lines.map(line => 
          line.id === data.lineId 
            ? { ...line, ...data.updates }
            : line
        )
      };
    });
  }, [selectedLine, timeRange]);

  // Listen for quality alerts
  useSSEEvent('production.quality.alert', (data) => {
    queryClient.setQueryData(['production-data', selectedLine, timeRange], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        qualityAlerts: [data, ...oldData.qualityAlerts.slice(0, 4)]
      };
    });
  }, [selectedLine, timeRange]);

  // Listen for batch status updates
  useSSEEvent('production.batch.status', (data) => {
    queryClient.setQueryData(['production-data', selectedLine, timeRange], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        currentBatches: oldData.currentBatches.map(batch =>
          batch.id === data.batchId
            ? { ...batch, ...data.updates }
            : batch
        )
      };
    });
  }, [selectedLine, timeRange]);

  // Listen for overall metrics updates
  useSSEEvent('production.metrics.updated', (data) => {
    queryClient.setQueryData(['production-data', selectedLine, timeRange], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        ...data.metrics
      };
    });
  }, [selectedLine, timeRange]);

  // Fetch production data from API with error handling
  const { data: productionData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['production-data', selectedLine, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/production/status?line=${selectedLine}&range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch production data');
      }
      return response.json();
    },
    refetchInterval: liveUpdates ? 30000 : 10000,
    staleTime: liveUpdates ? 25000 : 5000,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle production line control
  const handleLineControl = async (lineId, action) => {
    try {
      const response = await fetch('/api/production/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getToken()}`
        },
        body: JSON.stringify({ lineId, action })
      });

      if (!response.ok) {
        throw new Error('Control action failed');
      }

      const result = await response.json();
      
      // Update will come through SSE, but we can show immediate feedback
      devLog.log(`${action} action successful for ${lineId}:`, result);
      
      // Optionally trigger a manual refetch for immediate update
      refetch();
    } catch (error) {
      devLog.error('Production line control error:', error);
      showErrorToast(`Failed to ${action} production line`);
    }
  };

  // Handle batch status updates  
  const handleBatchUpdate = async (batchId, updates) => {
    try {
      const response = await fetch('/api/production/batch/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getToken()}`
        },
        body: JSON.stringify({ batchId, updates })
      });

      if (!response.ok) {
        throw new Error('Batch update failed');
      }

      const result = await response.json();
      devLog.log(`Batch ${batchId} updated:`, result);
      
      refetch();
    } catch (error) {
      devLog.error('Batch update error:', error);
      showErrorToast('Failed to update batch status');
    }
  };

  const data = productionData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Production Tracking</h1>
              <p className="mt-2 text-gray-600">Real-time manufacturing line monitoring and control</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Lines</option>
                <option value="line-a">Line A - GABA Red</option>
                <option value="line-b">Line B - GABA Clear</option>
                <option value="line-c">Line C - Packaging</option>
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
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

        {/* Production Overview Cards */}
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
              {isError ? 'Unable to Load Production Data' : 'No Production Data Available'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {isError 
                ? `Error: ${error?.message || 'Failed to fetch production data from server'}`
                : 'No production data has been imported yet. Please import your production data to get started.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/data-import'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import Production Data
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ProductionCard
              title="Overall Efficiency"
              value={`${data.overallEfficiency}%`}
              change={`+${data.efficiencyChange}%`}
              trend="up"
              icon={<Target className="w-6 h-6" />}
              color="blue"
            />
            <ProductionCard
              title="Units Produced"
              value={data.unitsProduced.toLocaleString()}
              change={`+${data.unitsChange}`}
              trend="up"
              icon={<BarChart3 className="w-6 h-6" />}
              color="green"
            />
            <ProductionCard
              title="Quality Rate"
              value={`${data.qualityRate}%`}
              change={`+${data.qualityChange}%`}
              trend="up"
              icon={<CheckCircle className="w-6 h-6" />}
              color="emerald"
            />
            <ProductionCard
              title="Downtime"
              value={`${data.downtimeMinutes}min`}
              change={`-${data.downtimeChange}min`}
              trend="up"
              icon={<Clock className="w-6 h-6" />}
              color="red"
            />
          </div>
        )}

        {/* Production Lines Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ProductionLineStatus data={data.lines} />
          <ProductionTrends data={data.trends} />
        </div>

        {/* Real-time Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CurrentBatches batches={data.currentBatches} onBatchUpdate={handleBatchUpdate} />
          <QualityAlerts alerts={data.qualityAlerts} />
          <MaintenanceSchedule schedule={data.maintenanceSchedule} />
        </div>
      </div>
    </div>
  );
};

const ProductionCard = ({ title, value, change, trend, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
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
            <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductionLineStatus = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Production Lines Status</h3>
      <div className="space-y-4">
        {data.map((line) => (
          <div key={line.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  line.status === 'running' ? 'bg-green-500' :
                  line.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <h4 className="font-medium text-gray-900">{line.name}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleLineControl(line.id, 'start')}
                  disabled={line.status === 'running'}
                  className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleLineControl(line.id, 'pause')}
                  disabled={line.status === 'paused'}
                  className="p-1 text-yellow-600 hover:bg-yellow-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleLineControl(line.id, 'stop')}
                  disabled={line.status === 'stopped'}
                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Efficiency</div>
                <div className="font-semibold text-gray-900">{line.efficiency}%</div>
              </div>
              <div>
                <div className="text-gray-500">Output Rate</div>
                <div className="font-semibold text-gray-900">{line.outputRate}/hr</div>
              </div>
              <div>
                <div className="text-gray-500">Target</div>
                <div className="font-semibold text-gray-900">{line.target}/hr</div>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Progress to Target</span>
                <span>{Math.round((line.outputRate / line.target) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((line.outputRate / line.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductionTrends = ({ data }) => {
  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Efficiency %',
        data: [88, 92, 94, 96, 95, 93, 94],
        borderColor: productionColors.efficiency,
        backgroundColor: productionColors.efficiency,
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Output Rate',
        data: [2200, 2350, 2450, 2500, 2480, 2420, 2450],
        borderColor: productionColors.output,
        backgroundColor: productionColors.output,
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
        text: 'Production Efficiency & Output Trends'
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
          text: 'Efficiency (%)'
        },
        min: 80,
        max: 100,
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Output (units/hr)'
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 2000,
        max: 2600,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Production Trends</h3>
      <LineChart data={chartData} options={chartOptions} height={300} />
    </div>
  );
};

const CurrentBatches = ({ batches, onBatchUpdate }) => {

  const handleStatusChange = (batchId, newStatus) => {
    if (onBatchUpdate) {
      onBatchUpdate(batchId, { status: newStatus });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'quality-check': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Current Batches</h3>
        <span className="text-sm text-gray-500">{batches.length} active</span>
      </div>
      <div className="space-y-3">
        {batches.map((batch) => (
          <div key={batch.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900">Batch #{batch.id}</div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                    {batch.status.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">{batch.product}</div>
              </div>
              
              {/* Batch Controls */}
              <div className="flex items-center space-x-1 ml-2">
                {batch.status === 'processing' && (
                  <button
                    onClick={() => handleStatusChange(batch.id, 'quality-check')}
                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded text-xs"
                    title="Move to Quality Check"
                  >
                    <CheckCircle className="w-3 h-3" />
                  </button>
                )}
                {batch.status === 'quality-check' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(batch.id, 'completed')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded text-xs"
                      title="Mark as Completed"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(batch.id, 'failed')}
                      className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                      title="Mark as Failed"
                    >
                      <AlertTriangle className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{batch.completion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    batch.status === 'completed' ? 'bg-green-500' :
                    batch.status === 'failed' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${batch.completion}%` }}
                ></div>
              </div>
            </div>
            
            {/* Timing Information */}
            {batch.startTime && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Started: {formatTime(batch.startTime)}</span>
                {batch.estimatedCompletion && batch.status !== 'completed' && (
                  <span>ETA: {formatTime(batch.estimatedCompletion)}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {batches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No active batches</div>
        </div>
      )}
    </div>
  );
};

const QualityAlerts = ({ alerts }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Quality Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-red-900">{alert.title}</div>
              <div className="text-sm text-red-700 mt-1">{alert.description}</div>
              <div className="text-xs text-red-600 mt-2">{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MaintenanceSchedule = ({ schedule }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Maintenance Schedule</h3>
      <div className="space-y-3">
        {schedule.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900">{item.equipment}</div>
                <div className="text-sm text-gray-500">{item.type}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.priority === 'high' ? 'bg-red-100 text-red-800' :
                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {item.priority.toUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">{item.scheduled}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default ProductionTracking;

import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

export default function RealTimeProductionMonitor() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [productionData, setProductionData] = useState({
    totalUnits: 2847,
    targetUnits: 3000,
    efficiency: 94.2,
    oeeScore: 87.5,
    downtime: 45, // minutes
    defectRate: 0.8
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setProductionData(prev => ({
        ...prev,
        totalUnits: prev.totalUnits + Math.floor(Math.random() * 3),
        efficiency: Math.min(100, Math.max(85, prev.efficiency + (Math.random() - 0.5) * 2)),
        oeeScore: Math.min(100, Math.max(75, prev.oeeScore + (Math.random() - 0.5) * 1.5)),
        downtime: Math.max(0, prev.downtime + (Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0)),
        defectRate: Math.max(0, Math.min(5, prev.defectRate + (Math.random() - 0.5) * 0.2))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const productionLines = [
    {
      id: 'LINE-01',
      name: 'Assembly Line A',
      status: 'running',
      output: 847,
      target: 900,
      efficiency: 94.1,
      operators: 8,
      shift: 'Day Shift',
      lastMaintenance: '2 days ago'
    },
    {
      id: 'LINE-02',
      name: 'Assembly Line B',
      status: 'running',
      output: 823,
      target: 850,
      efficiency: 96.8,
      operators: 6,
      shift: 'Day Shift',
      lastMaintenance: '1 week ago'
    },
    {
      id: 'LINE-03',
      name: 'Quality Control',
      status: 'maintenance',
      output: 0,
      target: 500,
      efficiency: 0,
      operators: 3,
      shift: 'Day Shift',
      lastMaintenance: 'In progress'
    },
    {
      id: 'LINE-04',
      name: 'Packaging Line',
      status: 'running',
      output: 1177,
      target: 1250,
      efficiency: 94.2,
      operators: 4,
      shift: 'Day Shift',
      lastMaintenance: '5 days ago'
    },
    {
      id: 'LINE-05',
      name: 'Testing Station',
      status: 'idle',
      output: 0,
      target: 200,
      efficiency: 0,
      operators: 2,
      shift: 'Day Shift',
      lastMaintenance: '3 days ago'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'idle': return 'text-yellow-600 bg-yellow-100';
      case 'maintenance': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <PlayIcon className="w-4 h-4" />;
      case 'idle': return <PauseIcon className="w-4 h-4" />;
      case 'maintenance': return <WrenchScrewdriverIcon className="w-4 h-4" />;
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <StopIcon className="w-4 h-4" />;
    }
  };

  const progressPercentage = (productionData.totalUnits / productionData.targetUnits) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CogIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Real-Time Production Monitor
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Live production data and line status
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
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Output</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productionData.totalUnits.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Target: {productionData.targetUnits.toLocaleString()}
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{progressPercentage.toFixed(1)}% of target</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Efficiency</p>
                <p className="text-2xl font-bold text-green-600">
                  {productionData.efficiency.toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 text-xs">
                  {productionData.efficiency > 90 ? (
                    <ArrowTrendingUpIcon className="w-3 h-3 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-gray-500">vs target 95%</span>
                </div>
              </div>
              <BoltIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">OEE Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {productionData.oeeScore.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">Overall Equipment Effectiveness</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Downtime</p>
                <p className="text-2xl font-bold text-red-600">
                  {productionData.downtime}m
                </p>
                <p className="text-xs text-gray-500">Today total</p>
              </div>
              <ClockIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Production Lines Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Production Lines Status
          </h3>
          <div className="space-y-3">
            {productionLines.map((line) => (
              <div key={line.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getStatusColor(line.status)}`}>
                      {getStatusIcon(line.status)}
                      <span className="text-sm font-medium capitalize">{line.status}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{line.name}</h4>
                      <p className="text-sm text-gray-500">{line.id} • {line.shift}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {line.output.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Output</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {line.target.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Target</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${
                        line.efficiency > 90 ? 'text-green-600' :
                        line.efficiency > 75 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {line.efficiency.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">Efficiency</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {line.operators}
                      </p>
                      <p className="text-xs text-gray-500">Operators</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {line.lastMaintenance}
                      </p>
                      <p className="text-xs text-gray-500">Last Maintenance</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar for each line */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress to Target</span>
                    <span>{((line.output / line.target) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        line.status === 'running' ? 'bg-green-500' :
                        line.status === 'idle' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, (line.output / line.target) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Production Chart Placeholder */}
        <ChartErrorBoundary title="Production Chart Error">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Production Trend (Last 24 Hours)
              </h3>
              <EyeIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-600 dark:to-gray-500 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Production trend chart would be displayed here</p>
                <p className="text-sm text-gray-400 mt-1">Showing hourly output data</p>
              </div>
            </div>
          </div>
        </ChartErrorBoundary>

        {/* Quick Actions */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Start Line', icon: PlayIcon, color: 'green' },
              { label: 'Emergency Stop', icon: StopIcon, color: 'red' },
              { label: 'Schedule Maintenance', icon: WrenchScrewdriverIcon, color: 'yellow' },
              { label: 'View Reports', icon: ChartBarIcon, color: 'blue' }
            ].map((action, __index) => (
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
import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  ArrowPathIcon,
  SignalIcon,
  UserGroupIcon,
  BeakerIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';

const MobileFloorDashboard = () => {
  const [selectedLine, setSelectedLine] = useState(null);
  const [alertsVisible, setAlertsVisible] = useState(false);

  // Fetch real-time production data optimized for mobile
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-production'],
    queryFn: async () => {
      const response = await fetch('/api/production/overview');
      return response.json();
    },
    refetchInterval: 5000, // More frequent updates for floor operations
    staleTime: 0
  });

  // Use ONLY real data from API - NO MOCK DATA
  const floorData = data?.overview ? {
    lines: data.overview.lines || [],
    shift: data.overview.currentShift || {
      name: 'No shift data',
      progress: 0,
      efficiency: 0,
      output: { current: 0, target: 0 }
    },
    alerts: data.overview.alerts || []
  } : {
    lines: [],
    shift: {
      name: 'Loading...',
      progress: 0,
      efficiency: 0,
      output: { current: 0, target: 0 }
    },
    alerts: [],
    error: 'Waiting for real production data...'
  };

  const getStatusIcon = (status) => {
    const iconClass = "h-8 w-8";
    switch (status) {
      case 'running':
        return <PlayIcon className={`${iconClass} text-green-500`} />;
      case 'maintenance':
        return <WrenchScrewdriverIcon className={`${iconClass} text-yellow-500`} />;
      case 'idle':
        return <PauseIcon className={`${iconClass} text-gray-400`} />;
      case 'error':
        return <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-400`} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'maintenance':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'idle':
        return 'border-l-4 border-gray-400 bg-gray-50';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50';
      default:
        return 'border-l-4 border-gray-300 bg-white';
    }
  };

  if (isLoading && !floorData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading floor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      {/* Mobile Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manufacturing Floor</h1>
            <p className="text-sm text-gray-500">{floorData.shift.name} - {floorData.shift.progress}% Complete</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setAlertsVisible(!alertsVisible)}
              className={`relative p-3 rounded-full ${floorData.alerts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}
            >
              <ExclamationTriangleIcon className="h-6 w-6" />
              {floorData.alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {floorData.alerts.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => refetch()}
              className="p-3 bg-blue-100 text-blue-600 rounded-full"
            >
              <ArrowPathIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Shift Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Shift Progress</span>
            <span>{floorData.shift.output.current} / {floorData.shift.output.target}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(floorData.shift.progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alert Panel */}
      {alertsVisible && floorData.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border-l-4 border-red-500">
          <h2 className="font-semibold text-gray-900 mb-3">Active Alerts</h2>
          <div className="space-y-2">
            {floorData.alerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.line}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Lines Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {floorData.lines.map((line) => (
          <div 
            key={line.id}
            className={`${getStatusColor(line.status)} rounded-lg shadow-sm p-4 cursor-pointer transition-all duration-200 ${
              selectedLine === line.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedLine(selectedLine === line.id ? null : line.id)}
          >
            {/* Line Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(line.status)}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{line.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{line.status}</p>
                </div>
              </div>
              {line.alerts && line.alerts.length > 0 && (
                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  {line.alerts.length} Alert{line.alerts.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Current Product */}
            {line.product && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Current Product</p>
                <p className="text-lg font-semibold text-gray-900">{line.product}</p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Output</span>
                <span className="font-medium">
                  {line.output.current.toLocaleString()} / {line.output.target.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    line.status === 'running' ? 'bg-green-500' : 
                    line.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min((line.output.current / line.output.target) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Efficiency</p>
                <p className={`text-xl font-bold ${
                  line.efficiency >= 90 ? 'text-green-600' :
                  line.efficiency >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {line.efficiency}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Operator</p>
                <p className="text-lg font-semibold text-gray-900">{line.operator}</p>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedLine === line.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium text-gray-900 capitalize">{line.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Update</p>
                    <p className="font-medium text-gray-900">Just now</p>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium">
                    View Details
                  </button>
                  <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium">
                    Log Issue
                  </button>
                </div>

                {/* Alerts for this line */}
                {line.alerts && line.alerts.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Active Alerts:</p>
                    {line.alerts.map((alert, index) => (
                      <div key={index} className="p-2 bg-yellow-50 rounded text-sm">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          alert.type === 'warning' ? 'bg-yellow-500' : 
                          alert.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        {alert.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Stats Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:hidden">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Lines Active</p>
            <p className="text-lg font-bold text-green-600">
              {floorData.lines.filter(l => l.status === 'running').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Efficiency</p>
            <p className="text-lg font-bold text-blue-600">{floorData.shift.efficiency}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Alerts</p>
            <p className={`text-lg font-bold ${floorData.alerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {floorData.alerts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for fixed bottom bar on mobile */}
      <div className="h-20 sm:h-0" />
    </div>
  );
};

export default MobileFloorDashboard;
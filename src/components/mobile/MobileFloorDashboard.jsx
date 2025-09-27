import React, { useState } from 'react';
import {
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon,
  QrCodeIcon,
  CameraIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  UserIcon,
  ChatBubbleOvalLeftIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

const productionLines = [
  {
    id: 'line-001',
    name: 'Assembly Line 1',
    status: 'running',
    efficiency: 94,
    currentJob: 'Product X - Batch 45',
    target: 500,
    completed: 420,
    operator: 'John Smith',
    lastUpdate: '2 min ago',
    location: 'Floor A'
  },
  {
    id: 'line-002',
    name: 'Assembly Line 2',
    status: 'maintenance',
    efficiency: 0,
    currentJob: 'Scheduled Maintenance',
    target: 0,
    completed: 0,
    operator: 'Maintenance Team',
    lastUpdate: '15 min ago',
    location: 'Floor A'
  },
  {
    id: 'line-003',
    name: 'Packaging Line 1',
    status: 'running',
    efficiency: 87,
    currentJob: 'Product Y - Batch 23',
    target: 300,
    completed: 260,
    operator: 'Sarah Johnson',
    lastUpdate: '1 min ago',
    location: 'Floor B'
  },
  {
    id: 'line-004',
    name: 'Quality Control',
    status: 'alert',
    efficiency: 72,
    currentJob: 'QC Inspection',
    target: 150,
    completed: 108,
    operator: 'Mike Davis',
    lastUpdate: '5 min ago',
    location: 'Floor B'
  }
];

const quickActions = [
  { id: 'start', label: 'Start Line', icon: PlayIcon, color: 'green' },
  { id: 'pause', label: 'Pause Line', icon: PauseIcon, color: 'yellow' },
  { id: 'stop', label: 'Stop Line', icon: StopIcon, color: 'red' },
  { id: 'maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon, color: 'blue' },
  { id: 'scan', label: 'Scan QR', icon: QrCodeIcon, color: 'purple' },
  { id: 'photo', label: 'Take Photo', icon: CameraIcon, color: 'gray' }
];

const alerts = [
  { id: 1, type: 'warning', message: 'Line 4 efficiency below target', time: '5 min ago', priority: 'high' },
  { id: 2, type: 'info', message: 'Material delivery scheduled', time: '10 min ago', priority: 'low' },
  { id: 3, type: 'error', message: 'Temperature sensor offline', time: '15 min ago', priority: 'critical' },
  { id: 4, type: 'success', message: 'Batch 45 completed successfully', time: '20 min ago', priority: 'low' }
];

const realtimeData = [
  { time: '10:00', efficiency: 89, quality: 95 },
  { time: '10:15', efficiency: 92, quality: 94 },
  { time: '10:30', efficiency: 87, quality: 96 },
  { time: '10:45', efficiency: 94, quality: 93 },
  { time: '11:00', efficiency: 91, quality: 97 }
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function MobileFloorDashboard() {
  const [selectedLine, setSelectedLine] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'maintenance':
        return <WrenchScrewdriverIcon className="w-5 h-5 text-blue-500" />;
      case 'alert':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'stopped':
        return <StopIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'alert':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'stopped':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const totalTarget = productionLines.reduce((sum, line) => sum + line.target, 0);
  const totalCompleted = productionLines.reduce((sum, line) => sum + line.completed, 0);
  const avgEfficiency = productionLines.reduce((sum, line) => sum + line.efficiency, 0) / productionLines.length;

  const statusData = [
    { name: 'Running', value: productionLines.filter(l => l.status === 'running').length },
    { name: 'Maintenance', value: productionLines.filter(l => l.status === 'maintenance').length },
    { name: 'Alert', value: productionLines.filter(l => l.status === 'alert').length },
    { name: 'Stopped', value: productionLines.filter(l => l.status === 'stopped').length }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Floor Dashboard</h1>
              <p className="text-sm text-gray-600">Real-time production monitoring</p>
            </div>
          </div>
          <div className="relative">
            <BellIcon className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              {alerts.filter(a => a.priority === 'high' || a.priority === 'critical').length}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-1 mb-4">
        <div className="flex bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('lines')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'lines'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Lines
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Alerts
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Production</p>
                  <p className="text-xl font-bold text-gray-900">{totalCompleted}</p>
                  <p className="text-xs text-gray-500">Target: {totalTarget}</p>
                </div>
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Efficiency</p>
                  <p className="text-xl font-bold text-gray-900">{avgEfficiency.toFixed(1)}%</p>
                  <p className="text-xs text-green-600">+2.3% vs yesterday</p>
                </div>
                <CogIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Line Status Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Line Status</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {statusData.filter(d => d.value > 0).map((status, index) => (
                <div key={status.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600">{status.name}: {status.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Performance */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Real-time Performance</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
                    action.color === 'green' ? 'border-green-200 bg-green-50 text-green-700' :
                    action.color === 'yellow' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                    action.color === 'red' ? 'border-red-200 bg-red-50 text-red-700' :
                    action.color === 'blue' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                    action.color === 'purple' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                    'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                >
                  <action.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lines' && (
        <div className="space-y-4">
          {productionLines.map((line) => (
            <div key={line.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(line.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{line.name}</h3>
                    <p className="text-xs text-gray-500">{line.location}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(line.status)}`}>
                  {line.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Job:</span>
                  <span className="text-sm font-medium text-gray-900">{line.currentJob}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progress:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {line.completed}/{line.target}
                  </span>
                </div>

                {line.target > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(line.completed / line.target) * 100}%` }}
                    />
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Efficiency:</span>
                  <span className={`text-sm font-medium ${
                    line.efficiency >= 90 ? 'text-green-600' :
                    line.efficiency >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {line.efficiency}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="flex items-center">
                    <UserIcon className="w-3 h-3 mr-1" />
                    {line.operator}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {line.lastUpdate}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 mt-3">
                <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium">
                  Details
                </button>
                <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium">
                  <ChatBubbleOvalLeftIcon className="w-4 h-4" />
                </button>
                <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium">
                  <MapPinIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{alert.time}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
            View All Alerts
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-md mx-auto flex justify-around">
          <button className="flex flex-col items-center py-2">
            <DevicePhoneMobileIcon className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Dashboard</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <QrCodeIcon className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Scan</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <CameraIcon className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Photo</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <BellIcon className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Alerts</span>
          </button>
        </div>
      </div>
    </div>
  );
}

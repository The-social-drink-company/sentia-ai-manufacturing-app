import React, { useState } from 'react';
import {
  DevicePhoneMobileIcon,
  QrCodeIcon,
  BellIcon,
  ClipboardDocumentCheckIcon,
  TruckIcon,
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MobileFloorDashboard from '@/components/mobile/MobileFloorDashboard';

const Mobile = () => {
  const [activeTab] = useState('dashboard');
  const [scanMode, setScanMode] = useState(false);
  const [notifications] = useState([
    { id: 1, type: 'alert', message: 'Machine M-102 requires maintenance', time: '5 min ago' },
    { id: 2, type: 'warning', message: 'Low inventory for Part #A234', time: '15 min ago' },
    { id: 3, type: 'info', message: 'Shift change in 30 minutes', time: '30 min ago' }
  ]);

  const quickActions = [
    { icon: QrCodeIcon, label: 'Scan QR', action: 'scan' },
    { icon: ClipboardDocumentCheckIcon, label: 'Quality Check', action: 'quality' },
    { icon: TruckIcon, label: 'Shipment', action: 'shipment' },
    { icon: CubeIcon, label: 'Inventory', action: 'inventory' }
  ];

  const productionLines = [
    { id: 'LINE-01', name: 'Assembly A', status: 'running', efficiency: 92, units: 450 },
    { id: 'LINE-02', name: 'Packaging B', status: 'running', efficiency: 88, units: 823 },
    { id: 'LINE-03', name: 'Processing C', status: 'maintenance', efficiency: 0, units: 0 },
    { id: 'LINE-04', name: 'Assembly D', status: 'running', efficiency: 95, units: 612 }
  ];

  const recentTasks = [
    { id: 1, title: 'Complete quality inspection Batch #2345', status: 'completed', time: '10:30 AM' },
    { id: 2, title: 'Update inventory count for Zone A', status: 'in-progress', time: '11:00 AM' },
    { id: 3, title: 'Perform safety check on Line 2', status: 'pending', time: '11:30 AM' },
    { id: 4, title: 'Document defects found in QC', status: 'pending', time: '12:00 PM' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'maintenance': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'stopped': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTaskStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'in-progress': return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending': return <ClockIcon className="w-5 h-5 text-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Mobile Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="relative">
                <BellIcon className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScanMode(!scanMode)}
                className={scanMode ? 'bg-blue-50 border-blue-500' : ''}
              >
                <QrCodeIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Mode Alert */}
      {scanMode && (
        <Alert className="m-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <QrCodeIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle>QR Scanner Active</AlertTitle>
          <AlertDescription>
            Point your camera at a QR code to scan. Tap the scan button again to exit.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.action}
                className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-1" />
                <span className="text-xs text-gray-700 dark:text-gray-300">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="floor">Floor</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Today's Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,345</div>
                <p className="text-xs text-muted-foreground">Units produced</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">91.5%</div>
                <p className="text-xs text-muted-foreground">Average OEE</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quality Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.2%</div>
                <p className="text-xs text-muted-foreground">Pass rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Lines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3/4</div>
                <p className="text-xs text-muted-foreground">Running</p>
              </CardContent>
            </Card>
          </div>

          {/* Production Lines Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Production Lines</span>
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {productionLines.map((line) => (
                <div key={line.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{line.name}</span>
                      <Badge className={getStatusColor(line.status)}>
                        {line.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Efficiency: {line.efficiency}%</span>
                      <span>Units: {line.units}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  {getTaskStatusIcon(task.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Scheduled: {task.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="floor" className="space-y-4">
          <MobileFloorDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  {notif.type === 'alert' && <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />}
                  {notif.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />}
                  {notif.type === 'info' && <BellIcon className="w-5 h-5 text-blue-500" />}
                  <div className="flex-1">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Mobile;

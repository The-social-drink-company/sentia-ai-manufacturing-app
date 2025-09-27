import React, { useState } from 'react';
import {
  CogIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BoltIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MobileFloor = () => {
  const [selectedMachine, setSelectedMachine] = useState('MCH-001');
  const [activeTab, setActiveTab] = useState('status');

  // Machine data
  const machines = [
    {
      id: 'MCH-001',
      name: 'CNC Machine A',
      status: 'running',
      currentJob: 'JOB-2345',
      product: 'Part #A234',
      progress: 67,
      efficiency: 92,
      temperature: 68,
      vibration: 'normal',
      runtime: '4h 23m',
      unitsProduced: 234,
      targetUnits: 350,
      nextMaintenance: '48 hours'
    },
    {
      id: 'MCH-002',
      name: 'Assembly Robot 1',
      status: 'running',
      currentJob: 'JOB-2346',
      product: 'Assembly B12',
      progress: 45,
      efficiency: 88,
      temperature: 72,
      vibration: 'normal',
      runtime: '3h 15m',
      unitsProduced: 156,
      targetUnits: 350,
      nextMaintenance: '72 hours'
    },
    {
      id: 'MCH-003',
      name: 'Packaging Line',
      status: 'maintenance',
      currentJob: 'N/A',
      product: 'N/A',
      progress: 0,
      efficiency: 0,
      temperature: 25,
      vibration: 'N/A',
      runtime: '0h 0m',
      unitsProduced: 0,
      targetUnits: 0,
      nextMaintenance: 'In Progress'
    },
    {
      id: 'MCH-004',
      name: 'Quality Scanner',
      status: 'idle',
      currentJob: 'N/A',
      product: 'N/A',
      progress: 0,
      efficiency: 95,
      temperature: 30,
      vibration: 'normal',
      runtime: '0h 0m',
      unitsProduced: 0,
      targetUnits: 0,
      nextMaintenance: '120 hours'
    }
  ];

  const currentMachine = machines.find(m => m.id === selectedMachine) || machines[0];

  // Production batches
  const batches = [
    { id: 'BAT-001', product: 'Part #A234', quantity: 500, completed: 234, status: 'in-progress' },
    { id: 'BAT-002', product: 'Part #A235', quantity: 300, completed: 0, status: 'queued' },
    { id: 'BAT-003', product: 'Part #A236', quantity: 200, completed: 0, status: 'queued' }
  ];

  // Quality checks
  const qualityChecks = [
    { time: '10:30 AM', batch: 'BAT-001', result: 'pass', defects: 0 },
    { time: '10:00 AM', batch: 'BAT-001', result: 'pass', defects: 1 },
    { time: '09:30 AM', batch: 'BAT-001', result: 'warning', defects: 3 },
    { time: '09:00 AM', batch: 'BAT-001', result: 'pass', defects: 0 }
  ];

  // Maintenance tasks
  const maintenanceTasks = [
    { id: 1, task: 'Oil change', due: '2 days', priority: 'medium' },
    { id: 2, task: 'Belt inspection', due: '5 days', priority: 'low' },
    { id: 3, task: 'Calibration check', due: 'Tomorrow', priority: 'high' },
    { id: 4, task: 'Clean filters', due: '1 week', priority: 'low' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'idle': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'maintenance': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getQualityColor = (_result) => {
    switch(result) {
      case 'pass': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'fail': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (_priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CogIcon className="w-6 h-6 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Shop Floor Control</h1>
            </div>
            <Badge className={getStatusColor(currentMachine.status)}>
              {currentMachine.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Machine Selector */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {machines.map((machine) => (
            <button
              key={machine.id}
              onClick={() => setSelectedMachine(machine.id)}
              className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedMachine === machine.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {machine.name}
            </button>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="flex flex-col items-center py-4"
            disabled={currentMachine.status !== 'idle'}
          >
            <PlayIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">Start</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center py-4"
            disabled={currentMachine.status !== 'running'}
          >
            <PauseIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">Pause</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center py-4"
            disabled={currentMachine.status === 'idle' || currentMachine.status === 'maintenance'}
          >
            <StopIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">Stop</span>
          </Button>
        </div>
      </div>

      {/* Machine Stats */}
      <div className="px-4 mb-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{currentMachine.name} - Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Job Progress */}
            {currentMachine.status === 'running' && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Job: {currentMachine.currentJob}</span>
                  <span>{currentMachine.progress}%</span>
                </div>
                <Progress value={currentMachine.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{currentMachine.unitsProduced} units</span>
                  <span>Target: {currentMachine.targetUnits}</span>
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ChartBarIcon className="w-4 h-4" />
                  Efficiency
                </div>
                <div className="text-xl font-bold">{currentMachine.efficiency}%</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ClockIcon className="w-4 h-4" />
                  Runtime
                </div>
                <div className="text-xl font-bold">{currentMachine.runtime}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <BoltIcon className="w-4 h-4" />
                  Temperature
                </div>
                <div className="text-xl font-bold">{currentMachine.temperature}°C</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <WrenchScrewdriverIcon className="w-4 h-4" />
                  Next Service
                </div>
                <div className="text-sm font-bold">{currentMachine.nextMaintenance}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Additional Information */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="maintenance">Maint.</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          {currentMachine.status === 'maintenance' ? (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <WrenchScrewdriverIcon className="h-4 w-4 text-amber-600" />
              <AlertTitle>Maintenance Mode</AlertTitle>
              <AlertDescription>
                This machine is currently undergoing scheduled maintenance. Estimated completion in 2 hours.
              </AlertDescription>
            </Alert>
          ) : currentMachine.status === 'idle' ? (
            <Alert>
              <ClockIcon className="h-4 w-4" />
              <AlertTitle>Machine Idle</AlertTitle>
              <AlertDescription>
                Machine is ready for operation. Load a new job to begin production.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <AlertTitle>Operating Normally</AlertTitle>
              <AlertDescription>
                All systems functioning within normal parameters. No issues detected.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Production Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {batches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{batch.id}</div>
                    <div className="text-xs text-muted-foreground">{batch.product}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{batch.completed}/{batch.quantity}</div>
                    <Badge variant="outline" className="text-xs">
                      {batch.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BeakerIcon className="w-5 h-5" />
                Recent Quality Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {qualityChecks.map((check, _index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className={`w-5 h-5 ${getQualityColor(check.result)}`} />
                    <div>
                      <div className="text-sm font-medium">{check.batch}</div>
                      <div className="text-xs text-muted-foreground">{check.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={check.defects === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                      {check.defects} defects
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {maintenanceTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{task.task}</div>
                    <div className="text-xs text-muted-foreground">Due: {task.due}</div>
                  </div>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <Button variant="ghost" size="sm" className="flex flex-col items-center py-2">
            <CogIcon className="w-5 h-5 mb-1" />
            <span className="text-xs">Machines</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center py-2">
            <ChartBarIcon className="w-5 h-5 mb-1" />
            <span className="text-xs">Analytics</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center py-2">
            <BeakerIcon className="w-5 h-5 mb-1" />
            <span className="text-xs">Quality</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center py-2">
            <WrenchScrewdriverIcon className="w-5 h-5 mb-1" />
            <span className="text-xs">Service</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileFloor;
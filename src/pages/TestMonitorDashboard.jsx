/**
 * Test Monitor Dashboard - Real-time Autonomous Testing & Healing Monitoring
 * Comprehensive monitoring interface for the autonomous testing system
 * with live metrics, deployment tracking, and system health indicators
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ActivityIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ServerIcon,
  CodeIcon,
  RocketIcon,
  ShieldCheckIcon
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TestMonitorDashboard = () => {
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [currentRun, setCurrentRun] = useState(null);
  const [runHistory, setRunHistory] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [deployments, setDeployments] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  // Colors for charts
  const chartColors = {
    success: '#10B981',
    warning: '#F59E0B', 
    error: '#EF4444',
    info: '#3B82F6',
    neutral: '#6B7280'
  };

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAllData, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch scheduler status
      const statusResponse = await fetch('/api/autonomous/scheduler/status');
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setSchedulerStatus(status);
      }

      // Fetch current run
      const runResponse = await fetch('/api/autonomous/scheduler/current-run');
      if (runResponse.ok) {
        const run = await runResponse.json();
        setCurrentRun(run);
      }

      // Fetch run history
      const historyResponse = await fetch('/api/autonomous/scheduler/history?limit=20');
      if (historyResponse.ok) {
        const history = await historyResponse.json();
        setRunHistory(history);
      }

      // Fetch metrics
      const metricsResponse = await fetch('/api/autonomous/scheduler/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Fetch deployments
      const deploymentsResponse = await fetch('/api/autonomous/deployments/history?limit=10');
      if (deploymentsResponse.ok) {
        const deploymentsData = await deploymentsResponse.json();
        setDeployments(deploymentsData);
      }

      // Fetch system health
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setSystemHealth(healthData);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: `Failed to fetch data: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedulerAction = async (action) => {
    try {
      const response = await fetch(`/api/autonomous/scheduler/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        setAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'success',
          message: `Scheduler ${action} successful`,
          timestamp: new Date()
        }]);
        fetchAllData(); // Refresh data
      } else {
        throw new Error(`Scheduler ${action} failed`);
      }
    } catch (error) {
      setAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: error.message,
        timestamp: new Date()
      }]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': case 'completed': case 'healthy': return 'success';
      case 'failed': case 'unhealthy': case 'error': return 'destructive';
      case 'paused': case 'warning': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <ActivityIcon className="w-4 h-4" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'failed': return <XCircleIcon className="w-4 h-4" />;
      case 'paused': return <PauseIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Prepare chart data
  const prepareRunHistoryChart = () => {
    return runHistory.slice(0, 10).reverse().map((run, index) => ({
      run: `Run ${index + 1}`,
      duration: run.duration ? run.duration / 1000 : 0, // Convert to seconds
      status: run.status === 'completed' ? 1 : 0,
      timestamp: run.startTime
    }));
  };

  const prepareSuccessRateChart = () => {
    const totalRuns = runHistory.length;
    const successfulRuns = runHistory.filter(run => run.status === 'completed').length;
    const failedRuns = totalRuns - successfulRuns;

    return [
      { name: 'Successful', value: successfulRuns, color: chartColors.success },
      { name: 'Failed', value: failedRuns, color: chartColors.error }
    ];
  };

  if (isLoading && !schedulerStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCwIcon className="w-6 h-6 animate-spin" />
          <span>Loading autonomous test monitor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 Autonomous Test Monitor</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of self-healing test & deployment system
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={isLoading}
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(-3).map((alert) => (
            <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                {alert.message}
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduler Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(schedulerStatus?.isRunning ? 'running' : 'paused')}>
                {getStatusIcon(schedulerStatus?.isRunning ? 'running' : 'paused')}
                {schedulerStatus?.isRunning ? 'Running' : 'Paused'}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Next run: {schedulerStatus?.nextRun ? 
                formatTimestamp(schedulerStatus.nextRun) : 
                'Not scheduled'
              }
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {schedulerStatus?.successRate ? `${schedulerStatus.successRate.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">
              {schedulerStatus?.successfulRuns || 0}/{schedulerStatus?.totalRuns || 0} runs successful
            </div>
          </CardContent>
        </Card>

        {/* Current Run */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Run</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {currentRun ? (
              <>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(currentRun.status)}>
                    {getStatusIcon(currentRun.status)}
                    {currentRun.status}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Phase: {currentRun.currentStage || currentRun.phases?.slice(-1)[0]?.name || 'Unknown'}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No active run</div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(systemHealth?.status || 'unknown')}>
                {getStatusIcon(systemHealth?.status || 'unknown')}
                {systemHealth?.status || 'Unknown'}
              </Badge>
            </div>
            {metrics?.lastResourceCheck && (
              <div className="mt-2 text-xs text-muted-foreground">
                Memory: {metrics.lastResourceCheck.memoryUsagePercent?.toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ServerIcon className="w-5 h-5" />
            <span>Scheduler Control</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleSchedulerAction('start')}
              disabled={schedulerStatus?.isRunning}
              className="flex items-center space-x-2"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Start</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleSchedulerAction('pause')}
              disabled={!schedulerStatus?.isRunning}
              className="flex items-center space-x-2"
            >
              <PauseIcon className="w-4 h-4" />
              <span>Pause</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleSchedulerAction('stop')}
              disabled={!schedulerStatus?.isRunning}
              className="flex items-center space-x-2"
            >
              <StopIcon className="w-4 h-4" />
              <span>Stop</span>
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => handleSchedulerAction('trigger-manual')}
              disabled={!!currentRun}
              className="flex items-center space-x-2"
            >
              <RefreshCwIcon className="w-4 h-4" />
              <span>Manual Run</span>
            </Button>
          </div>
          
          {schedulerStatus?.consecutiveFailures > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Consecutive Failures: {schedulerStatus.consecutiveFailures}
                </span>
              </div>
              {schedulerStatus.backoffTime > Date.now() && (
                <div className="text-xs text-yellow-600 mt-1">
                  In backoff period until {formatTimestamp(schedulerStatus.backoffTime)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="runs">Test Runs</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Run History Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Run Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareRunHistoryChart()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="run" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="duration" 
                      stroke={chartColors.info}
                      strokeWidth={2}
                      name="Duration (seconds)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Success Rate Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Test Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareSuccessRateChart()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareSuccessRateChart().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Current Run Details */}
          {currentRun && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ActivityIcon className="w-5 h-5" />
                  <span>Current Run: {currentRun.id}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <Badge variant={getStatusColor(currentRun.status)}>
                      {getStatusIcon(currentRun.status)}
                      {currentRun.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Started</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimestamp(currentRun.startTime)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(Date.now() - new Date(currentRun.startTime).getTime())}
                    </div>
                  </div>
                </div>

                {/* Phases Progress */}
                {currentRun.phases && currentRun.phases.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Phases</div>
                    <div className="space-y-2">
                      {currentRun.phases.map((phase, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant={getStatusColor(phase.status)} size="sm">
                              {getStatusIcon(phase.status)}
                              {phase.name}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {phase.duration ? formatDuration(phase.duration) : 'Running...'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Runs Tab */}
        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Test Run History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {runHistory.length > 0 ? runHistory.map((run, index) => (
                  <div key={run.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusColor(run.status)}>
                          {getStatusIcon(run.status)}
                          {run.status}
                        </Badge>
                        <div>
                          <div className="font-medium">{run.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTimestamp(run.startTime)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatDuration(run.duration)}
                        </div>
                        {run.phases && (
                          <div className="text-sm text-muted-foreground">
                            {run.phases.length} phases
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Run Details */}
                    {run.analysis && (
                      <div className="mt-3 text-sm">
                        <div className="flex items-center space-x-4">
                          <span>Tests: {run.analysis.passedTests}/{run.analysis.totalTests}</span>
                          <span>Risk: {run.analysis.riskAssessment?.level}</span>
                          {run.fixes && (
                            <span>Fixes: {run.fixes.applied?.length || 0}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No test runs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RocketIcon className="w-5 h-5" />
                <span>Deployment History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployments.length > 0 ? deployments.map((deployment) => (
                  <div key={deployment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusColor(deployment.status)}>
                          {getStatusIcon(deployment.status)}
                          {deployment.status}
                        </Badge>
                        <div>
                          <div className="font-medium">{deployment.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTimestamp(deployment.startTime)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatDuration(deployment.duration)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Object.keys(deployment.environments || {}).length} environments
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No deployments found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Run Duration</span>
                    <span className="font-medium">
                      {formatDuration(metrics.averageRunDuration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-medium">
                      {metrics.lastResourceCheck?.memoryUsagePercent?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>System Uptime</span>
                    <span className="font-medium">
                      {formatDuration((schedulerStatus?.uptime || 0) * 1000)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metrics.runDurations?.slice(-10).map((duration, index) => ({
                    run: `Run ${index + 1}`,
                    duration: duration / 1000
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="run" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="duration" 
                      stroke={chartColors.info}
                      fill={chartColors.info}
                      fillOpacity={0.3}
                      name="Duration (seconds)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestMonitorDashboard;
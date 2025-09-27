import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  TestTube,
  Microscope,
  FileCheck,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Activity
} from 'lucide-react';

const QualityControl = () => {
  const [selectedLine, setSelectedLine] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for quality control metrics
  const [qualityData, setQualityData] = useState({
    overallQuality: 98.7,
    defectRate: 1.3,
    firstPassYield: 96.4,
    customerComplaints: 2,
    inspectionsPending: 15,
    inspectionsCompleted: 847,
    qualityTrend: 'up',
    lastUpdated: new Date().toLocaleTimeString()
  });

  const [productionLines] = useState([
    { id: 'line-1', name: 'Production Line 1', status: 'operational', quality: 99.2 },
    { id: 'line-2', name: 'Production Line 2', status: 'operational', quality: 98.1 },
    { id: 'line-3', name: 'Production Line 3', status: 'maintenance', quality: 97.8 },
    { id: 'line-4', name: 'Production Line 4', status: 'operational', quality: 99.5 }
  ]);

  const [qualityTests] = useState([
    {
      id: 'test-001',
      product: 'Widget A-100',
      batch: 'B2024-0927-001',
      testType: 'Dimensional',
      status: 'passed',
      inspector: 'Sarah Chen',
      timestamp: '09:15 AM',
      result: 'Within tolerance'
    },
    {
      id: 'test-002',
      product: 'Component X-50',
      batch: 'B2024-0927-002',
      testType: 'Material',
      status: 'failed',
      inspector: 'Mike Johnson',
      timestamp: '09:32 AM',
      result: 'Hardness below spec'
    },
    {
      id: 'test-003',
      product: 'Assembly Z-200',
      batch: 'B2024-0927-003',
      testType: 'Functional',
      status: 'pending',
      inspector: 'Lisa Wang',
      timestamp: '09:45 AM',
      result: 'In progress'
    },
    {
      id: 'test-004',
      product: 'Widget B-150',
      batch: 'B2024-0927-004',
      testType: 'Visual',
      status: 'passed',
      inspector: 'David Kim',
      timestamp: '10:12 AM',
      result: 'No defects found'
    }
  ]);

  const [defectCategories] = useState([
    { category: 'Dimensional', count: 8, percentage: 32, trend: 'down' },
    { category: 'Surface Finish', count: 6, percentage: 24, trend: 'up' },
    { category: 'Material', count: 5, percentage: 20, trend: 'stable' },
    { category: 'Assembly', count: 4, percentage: 16, trend: 'down' },
    { category: 'Other', count: 2, percentage: 8, trend: 'stable' }
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setQualityData(prev => ({
        ...prev,
        lastUpdated: new Date().toLocaleTimeString(),
        overallQuality: Math.round((98 + Math.random() * 2) * 10) / 10,
        defectRate: Math.round((1 + Math.random() * 1) * 10) / 10
      }));
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Control Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time quality monitoring and inspection management</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedLine} onValueChange={setSelectedLine}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select production line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Production Lines</SelectItem>
              {productionLines.map(line => (
                <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Quality</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{qualityData.overallQuality}%</div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              {qualityData.qualityTrend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              +0.3% from yesterday
            </div>
            <Progress value={qualityData.overallQuality} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{qualityData.defectRate}%</div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              -0.2% improvement
            </div>
            <Progress value={qualityData.defectRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Pass Yield</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{qualityData.firstPassYield}%</div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +1.2% vs target
            </div>
            <Progress value={qualityData.firstPassYield} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspections Today</CardTitle>
            <TestTube className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{qualityData.inspectionsCompleted}</div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <Clock className="h-3 w-3 text-orange-500 mr-1" />
              {qualityData.inspectionsPending} pending
            </div>
            <Progress value={(qualityData.inspectionsCompleted / (qualityData.inspectionsCompleted + qualityData.inspectionsPending)) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="defects">Defect Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production Line Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Production Line Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productionLines.map(line => (
                    <div key={line.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          line.status === 'operational' ? 'bg-green-500' : 
                          line.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{line.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{line.quality}%</span>
                        <Badge variant={line.status === 'operational' ? 'default' : 'secondary'}>
                          {line.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Quality Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Recent Quality Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium text-red-900">Material Test Failed</p>
                        <p className="text-sm text-red-700">Component X-50, Batch B2024-0927-002</p>
                      </div>
                    </div>
                    <span className="text-xs text-red-600">09:32 AM</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="font-medium text-yellow-900">Inspection Overdue</p>
                        <p className="text-sm text-yellow-700">Assembly Z-200, Batch B2024-0926-015</p>
                      </div>
                    </div>
                    <span className="text-xs text-yellow-600">08:45 AM</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-blue-900">Quality Target Achieved</p>
                        <p className="text-sm text-blue-700">Production Line 4 - 99.5% quality</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600">08:15 AM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Microscope className="h-5 w-5 mr-2" />
                Recent Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityTests.map(test => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(test.status)}`}>
                        {getStatusIcon(test.status)}
                        <span className="text-sm font-medium capitalize">{test.status}</span>
                      </div>
                      <div>
                        <p className="font-medium">{test.product}</p>
                        <p className="text-sm text-gray-600">{test.batch} • {test.testType} Test</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{test.inspector}</p>
                      <p className="text-xs text-gray-600">{test.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Defect Categories Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {defectCategories.map(category => (
                  <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">{category.count}</span>
                      </div>
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-gray-600">{category.percentage}% of total defects</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(category.trend)}
                      <Progress value={category.percentage} className="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Quality Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Quality trend charts and analytics coming soon...</p>
                <p className="text-sm text-gray-500 mt-2">Integration with real-time data sources in progress</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {qualityData.lastUpdated} • Data refreshes every 30 seconds
      </div>
    </div>
  );
};

export default QualityControl;

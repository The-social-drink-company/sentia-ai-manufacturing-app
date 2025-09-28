import { useState,  } from 'react';
import {
  BeakerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const QualityControl = () => {
  const [selectedPeriod] = useState('7d');
  const [selectedProduct] = useState('all');
  const [selectedMetric] = useState('defect-rate');
  const [activeTab] = useState('overview');

  // Quality metrics data
  const qualityMetrics = {
    defectRate: {
      value: 2.3,
      target: 2.0,
      trend: 'up',
      change: 0.3,
      unit: '%'
    },
    firstPassYield: {
      value: 94.5,
      target: 95.0,
      trend: 'down',
      change: -0.5,
      unit: '%'
    },
    customerComplaints: {
      value: 12,
      target: 10,
      trend: 'up',
      change: 2,
      unit: 'count'
    },
    inspectionPassRate: {
      value: 97.2,
      target: 98.0,
      trend: 'up',
      change: 0.8,
      unit: '%'
    }
  };

  // Recent inspections data
  const recentInspections = [
    {
      id: 'INS-2024-001',
      product: 'Product A',
      batch: 'BAT-2024-105',
      date: '2025-09-26',
      inspector: 'John Smith',
      result: 'passed',
      score: 98,
      issues: 0
    },
    {
      id: 'INS-2024-002',
      product: 'Product B',
      batch: 'BAT-2024-106',
      date: '2025-09-26',
      inspector: 'Jane Doe',
      result: 'warning',
      score: 85,
      issues: 3
    },
    {
      id: 'INS-2024-003',
      product: 'Product C',
      batch: 'BAT-2024-107',
      date: '2025-09-26',
      inspector: 'Mike Johnson',
      result: 'failed',
      score: 68,
      issues: 7
    },
    {
      id: 'INS-2024-004',
      product: 'Product A',
      batch: 'BAT-2024-108',
      date: '2025-09-25',
      inspector: 'Sarah Wilson',
      result: 'passed',
      score: 95,
      issues: 1
    },
    {
      id: 'INS-2024-005',
      product: 'Product D',
      batch: 'BAT-2024-109',
      date: '2025-09-25',
      inspector: 'Tom Brown',
      result: 'passed',
      score: 99,
      issues: 0
    }
  ];

  // Quality issues by category
  const issueCategories = [
    { category: 'Dimensional', count: 23, percentage: 35, severity: 'medium' },
    { category: 'Surface Finish', count: 18, percentage: 27, severity: 'low' },
    { category: 'Material Defect', count: 12, percentage: 18, severity: 'high' },
    { category: 'Assembly', count: 8, percentage: 12, severity: 'medium' },
    { category: 'Packaging', count: 5, percentage: 8, severity: 'low' }
  ];

  // Control chart data points
  const controlChartData = [
    { date: '09/20', value: 2.1, ucl: 3.0, lcl: 1.0, target: 2.0 },
    { date: '09/21', value: 2.3, ucl: 3.0, lcl: 1.0, target: 2.0 },
    { date: '09/22', value: 1.9, ucl: 3.0, lcl: 1.0, target: 2.0 },
    { date: '09/23', value: 2.4, ucl: 3.0, lcl: 1.0, target: 2.0 },
    { date: '09/24', value: 2.2, ucl: 3.0, lcl: 1.0, target: 2.0 },
    { date: '09/25', value: 2.5, ucl: 3.0, lcl: 1.0, target: 2.0 },
    { date: '09/26', value: 2.3, ucl: 3.0, lcl: 1.0, target: 2.0 }
  ];

  // Products for filtering
  const products = [
    { value: 'all', label: 'All Products' },
    { value: 'product-a', label: 'Product A' },
    { value: 'product-b', label: 'Product B' },
    { value: 'product-c', label: 'Product C' },
    { value: 'product-d', label: 'Product D' }
  ];

  const getStatusColor = (result) => {
    switch(result) {
      case 'passed': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'warning': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Quality Control</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor product quality, inspections, and compliance metrics
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.value} value={product.value}>
                  {product.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <DocumentChartBarIcon className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Alert for quality issues */}
      {qualityMetrics.defectRate.value > qualityMetrics.defectRate.target && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
          <AlertTitle>Quality Target Alert</AlertTitle>
          <AlertDescription>
            Defect rate is currently {qualityMetrics.defectRate.value}%, exceeding the target of {qualityMetrics.defectRate.target}%.
            Review recent inspections and implement corrective actions.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
            <BeakerIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.defectRate.value}%</div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">Target: {qualityMetrics.defectRate.target}%</span>
              <div className="flex items-center ml-auto">
                {qualityMetrics.defectRate.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-green-500 mr-1" />
                )}
                <span className={`text-xs ${qualityMetrics.defectRate.trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                  {qualityMetrics.defectRate.change}%
                </span>
              </div>
            </div>
            <Progress
              value={(qualityMetrics.defectRate.target / qualityMetrics.defectRate.value) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Pass Yield</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.firstPassYield.value}%</div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">Target: {qualityMetrics.firstPassYield.target}%</span>
              <div className="flex items-center ml-auto">
                {qualityMetrics.firstPassYield.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${qualityMetrics.firstPassYield.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(qualityMetrics.firstPassYield.change)}%
                </span>
              </div>
            </div>
            <Progress
              value={qualityMetrics.firstPassYield.value}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Complaints</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.customerComplaints.value}</div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">Target: ≤{qualityMetrics.customerComplaints.target}</span>
              <div className="flex items-center ml-auto">
                <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xs text-red-500">+{qualityMetrics.customerComplaints.change}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              This period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspection Pass Rate</CardTitle>
            <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.inspectionPassRate.value}%</div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">Target: {qualityMetrics.inspectionPassRate.target}%</span>
              <div className="flex items-center ml-auto">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+{qualityMetrics.inspectionPassRate.change}%</span>
              </div>
            </div>
            <Progress
              value={qualityMetrics.inspectionPassRate.value}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="control-charts">Control Charts</TabsTrigger>
          <TabsTrigger value="issues">Issues Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Inspections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" />
                  Recent Inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInspections.slice(0, 3).map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{inspection.id}</span>
                          <Badge className={getStatusColor(inspection.result)}>
                            {inspection.result}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {inspection.product} - Batch {inspection.batch}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score: {inspection.score}% | Issues: {inspection.issues}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>{inspection.date}</div>
                        <div>{inspection.inspector}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-3">
                  View All Inspections
                </Button>
              </CardContent>
            </Card>

            {/* Issue Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  Issue Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {issueCategories.map((issue) => (
                    <div key={issue.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{issue.category}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{issue.count}</span>
                        </div>
                      </div>
                      <Progress value={issue.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspection History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium">Inspection ID</th>
                      <th className="text-left p-2 text-sm font-medium">Product</th>
                      <th className="text-left p-2 text-sm font-medium">Batch</th>
                      <th className="text-left p-2 text-sm font-medium">Date</th>
                      <th className="text-left p-2 text-sm font-medium">Inspector</th>
                      <th className="text-left p-2 text-sm font-medium">Score</th>
                      <th className="text-left p-2 text-sm font-medium">Issues</th>
                      <th className="text-left p-2 text-sm font-medium">Status</th>
                      <th className="text-left p-2 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInspections.map((inspection) => (
                      <tr key={inspection.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-2 text-sm font-medium">{inspection.id}</td>
                        <td className="p-2 text-sm">{inspection.product}</td>
                        <td className="p-2 text-sm">{inspection.batch}</td>
                        <td className="p-2 text-sm">{inspection.date}</td>
                        <td className="p-2 text-sm">{inspection.inspector}</td>
                        <td className="p-2 text-sm">{inspection.score}%</td>
                        <td className="p-2 text-sm">{inspection.issues}</td>
                        <td className="p-2">
                          <Badge className={getStatusColor(inspection.result)}>
                            {inspection.result}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="control-charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistical Process Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defect-rate">Defect Rate</SelectItem>
                      <SelectItem value="first-pass-yield">First Pass Yield</SelectItem>
                      <SelectItem value="cycle-time">Cycle Time</SelectItem>
                      <SelectItem value="rework-rate">Rework Rate</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Target</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Control Limits</span>
                    </div>
                  </div>
                </div>

                {/* Control Chart Visualization */}
                <div className="h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>Control chart visualization</p>
                    <p className="text-xs mt-1">Connect to data source for live charts</p>
                  </div>
                </div>

                {/* Control Chart Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Value</th>
                        <th className="text-right p-2">Target</th>
                        <th className="text-right p-2">UCL</th>
                        <th className="text-right p-2">LCL</th>
                        <th className="text-right p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controlChartData.map((point, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{point.date}</td>
                          <td className="text-right p-2">{point.value}</td>
                          <td className="text-right p-2">{point.target}</td>
                          <td className="text-right p-2">{point.ucl}</td>
                          <td className="text-right p-2">{point.lcl}</td>
                          <td className="text-right p-2">
                            {point.value > point.ucl || point.value < point.lcl ? (
                              <Badge variant="destructive">Out of Control</Badge>
                            ) : (
                              <Badge variant="success">In Control</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Issues Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Issue Distribution */}
                <div className="space-y-4">
                  <h3 className="font-medium">Issue Distribution by Severity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-center gap-2">
                        <XCircleIcon className="w-5 h-5 text-red-600" />
                        <span className="font-medium">High Severity</span>
                      </div>
                      <span className="text-lg font-bold">12</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                        <span className="font-medium">Medium Severity</span>
                      </div>
                      <span className="text-lg font-bold">31</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Low Severity</span>
                      </div>
                      <span className="text-lg font-bold">23</span>
                    </div>
                  </div>
                </div>

                {/* Root Cause Analysis */}
                <div className="space-y-4">
                  <h3 className="font-medium">Root Cause Analysis</h3>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Machine Calibration</span>
                        <span className="text-sm text-muted-foreground">28%</span>
                      </div>
                      <Progress value={28} className="h-2" />
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Operator Error</span>
                        <span className="text-sm text-muted-foreground">22%</span>
                      </div>
                      <Progress value={22} className="h-2" />
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Raw Material</span>
                        <span className="text-sm text-muted-foreground">18%</span>
                      </div>
                      <Progress value={18} className="h-2" />
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Process Variation</span>
                        <span className="text-sm text-muted-foreground">15%</span>
                      </div>
                      <Progress value={15} className="h-2" />
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Other</span>
                        <span className="text-sm text-muted-foreground">17%</span>
                      </div>
                      <Progress value={17} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Corrective Actions */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Recommended Corrective Actions</h3>
                <div className="space-y-2">
                  <Alert>
                    <ShieldCheckIcon className="h-4 w-4" />
                    <AlertTitle>Machine Calibration Required</AlertTitle>
                    <AlertDescription>
                      Schedule calibration for Production Line 2 and Line 4 based on defect pattern analysis.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <ShieldCheckIcon className="h-4 w-4" />
                    <AlertTitle>Operator Training</AlertTitle>
                    <AlertDescription>
                      Implement refresher training for assembly procedures to reduce operator-related defects.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityControl;
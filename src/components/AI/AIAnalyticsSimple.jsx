import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Brain, Zap, TrendingUp, Target, AlertCircle, CheckCircle,
  Activity, Cpu, Database, BarChart3, PieChart, Settings,
  RefreshCw, Download, Eye, Play, Pause
} from 'lucide-react';

const AIAnalyticsSimple = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const [aiMetrics] = useState({
    modelAccuracy: 94.7,
    predictionConfidence: 87.3,
    dataQuality: 92.1,
    processingSpeed: 156,
    activeModels: 8,
    totalPredictions: 15420
  });

  const [modelPerformance] = useState([
    { model: 'Demand Forecast', accuracy: 94.7, predictions: 5420, status: 'active' },
    { model: 'Quality Control', accuracy: 96.2, predictions: 3280, status: 'active' },
    { model: 'Inventory Optimization', accuracy: 89.5, predictions: 2840, status: 'active' },
    { model: 'Production Planning', accuracy: 91.8, predictions: 2150, status: 'training' },
    { model: 'Maintenance Prediction', accuracy: 88.3, predictions: 1730, status: 'active' }
  ]);

  const [predictionData] = useState([
    { month: 'Jan', actual: 2100, predicted: 2050, accuracy: 97.6 },
    { month: 'Feb', actual: 2250, predicted: 2280, accuracy: 98.7 },
    { month: 'Mar', actual: 2400, predicted: 2350, accuracy: 97.9 },
    { month: 'Apr', actual: 2350, predicted: 2400, accuracy: 97.9 },
    { month: 'May', actual: 2500, predicted: 2480, accuracy: 99.2 },
    { month: 'Jun', actual: 2650, predicted: 2620, accuracy: 98.9 }
  ]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: { variant: 'success', icon: CheckCircle, text: 'Active' },
      training: { variant: 'warning', icon: Activity, text: 'Training' },
      inactive: { variant: 'secondary', icon: AlertCircle, text: 'Inactive' }
    };

    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const runAnalysis = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Advanced machine learning insights for manufacturing optimization
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={runAnalysis} disabled={isProcessing}>
              {isProcessing ? <Activity className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
              {isProcessing ? 'Processing...' : 'Run Analysis'}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Model Accuracy</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiMetrics.modelAccuracy}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={aiMetrics.modelAccuracy} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prediction Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiMetrics.predictionConfidence}%</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={aiMetrics.predictionConfidence} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Data Quality</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiMetrics.dataQuality}%</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={aiMetrics.dataQuality} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing Speed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiMetrics.processingSpeed}ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Models</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiMetrics.activeModels}</p>
              </div>
              <Cpu className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Predictions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiMetrics.totalPredictions.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          {/* Model Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Machine Learning Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Model Name</th>
                      <th className="text-right py-3">Accuracy</th>
                      <th className="text-right py-3">Predictions</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-right py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelPerformance.map((model, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-blue-500" />
                            {model.model}
                          </div>
                        </td>
                        <td className="text-right py-3">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-medium">{model.accuracy}%</span>
                            <div className="w-16">
                              <Progress value={model.accuracy} className="h-2" />
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 font-medium">
                          {model.predictions.toLocaleString()}
                        </td>
                        <td className="py-3">
                          {getStatusBadge(model.status)}
                        </td>
                        <td className="text-right py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Prediction Accuracy Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Prediction vs Actual Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value * 1000)} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#82ca9d" strokeWidth={2} name="Predicted" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Accuracy Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Prediction Accuracy Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[85, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="accuracy" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Demand forecast accuracy improved by 12%
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      New seasonal adjustment algorithm shows significant improvement
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Inventory optimization reducing waste by 8%
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ML model identifies optimal reorder points more accurately
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      Quality control model needs retraining
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Recent production changes affecting model accuracy
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Zap className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900 dark:text-orange-100">
                      Processing speed optimized by 23%
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      New GPU infrastructure significantly faster inference
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                    High Priority
                  </h4>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Retrain quality control model with recent data</li>
                    <li>• Update demand forecasting with seasonal data</li>
                  </ul>
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Medium Priority
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Expand maintenance prediction dataset</li>
                    <li>• Optimize inventory model parameters</li>
                  </ul>
                </div>

                <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Low Priority
                  </h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>• Archive unused model versions</li>
                    <li>• Update documentation for new algorithms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Real-time Processing */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Processing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="w-full h-full border-8 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">87%</span>
                    </div>
                  </div>
                  <p className="font-medium">Demand Forecasting</p>
                  <p className="text-sm text-gray-500">Processing live data</p>
                </div>

                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="w-full h-full border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">92%</span>
                    </div>
                  </div>
                  <p className="font-medium">Quality Analysis</p>
                  <p className="text-sm text-gray-500">Analyzing production data</p>
                </div>

                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="w-full h-full border-8 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">74%</span>
                    </div>
                  </div>
                  <p className="font-medium">Inventory Optimization</p>
                  <p className="text-sm text-gray-500">Calculating optimal levels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>Daily forecast calculation</span>
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-4 w-4 text-green-500" />
                    <span>Quality model retraining</span>
                  </div>
                  <Badge>Queued</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-purple-500" />
                    <span>Data preprocessing</span>
                  </div>
                  <Badge>Queued</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalyticsSimple;
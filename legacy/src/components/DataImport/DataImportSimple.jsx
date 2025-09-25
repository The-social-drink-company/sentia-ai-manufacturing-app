import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  Upload, FileText, Database, Download, RefreshCw, 
  CheckCircle, AlertCircle, Clock, FileSpreadsheet,
  Users, Package, TrendingUp, Settings, Eye, Trash2,
  Filter, Search, Calendar, ChevronDown, Play
} from 'lucide-react';

const DataImportSimple = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      name: 'inventory_data_2024.csv',
      type: 'inventory',
      size: '2.3 MB',
      status: 'completed',
      uploadedAt: '2024-09-08 14:30',
      records: 2847,
      errors: 0
    },
    {
      id: 2,
      name: 'sales_report_august.xlsx',
      type: 'sales',
      size: '4.1 MB',
      status: 'completed',
      uploadedAt: '2024-09-07 16:15',
      records: 5642,
      errors: 3
    },
    {
      id: 3,
      name: 'customer_list.csv',
      type: 'customers',
      size: '890 KB',
      status: 'processing',
      uploadedAt: '2024-09-08 15:45',
      records: 1205,
      errors: 0
    }
  ]);

  const [importTemplates] = useState([
    {
      id: 1,
      name: 'Inventory Data',
      description: 'Import product inventory, stock levels, and locations',
      fields: ['SKU', 'Product Name', 'Quantity', 'Location', 'Reorder Level'],
      format: 'CSV, Excel',
      icon: Package,
      color: 'blue'
    },
    {
      id: 2,
      name: 'Sales Data',
      description: 'Import sales transactions, orders, and revenue data',
      fields: ['Order ID', 'Date', 'Customer', 'Amount', 'Status'],
      format: 'CSV, Excel, JSON',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 3,
      name: 'Customer Data',
      description: 'Import customer information and contact details',
      fields: ['Customer ID', 'Name', 'Email', 'Phone', 'Address'],
      format: 'CSV, Excel',
      icon: Users,
      color: 'purple'
    },
    {
      id: 4,
      name: 'Production Data',
      description: 'Import production schedules, capacity, and quality metrics',
      fields: ['Job ID', 'Product', 'Quantity', 'Start Date', 'Status'],
      format: 'CSV, Excel',
      icon: Settings,
      color: 'orange'
    }
  ]);

  const [importHistory] = useState([
    {
      id: 1,
      date: '2024-09-08',
      type: 'Inventory',
      records: 2847,
      status: 'success',
      duration: '2m 14s'
    },
    {
      id: 2,
      date: '2024-09-07',
      type: 'Sales',
      records: 5642,
      status: 'warning',
      duration: '4m 32s'
    },
    {
      id: 3,
      date: '2024-09-06',
      type: 'Customers',
      records: 1205,
      status: 'success',
      duration: '1m 45s'
    },
    {
      id: 4,
      date: '2024-09-05',
      type: 'Production',
      records: 892,
      status: 'success',
      duration: '3m 18s'
    }
  ]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  const handleFileUpload = (files) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // Add uploaded files to list
          const newFiles = files.map((file, index) => ({
            id: Date.now() + index,
            name: file.name,
            type: 'unknown',
            size: formatFileSize(file.size),
            status: 'completed',
            uploadedAt: new Date().toLocaleString(),
            records: Math.floor(0;
          
          setUploadedFiles(prev => [...newFiles, ...prev]);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: { variant: 'success', icon: CheckCircle, text: 'Completed' },
      processing: { variant: 'warning', icon: Clock, text: 'Processing' },
      error: { variant: 'destructive', icon: AlertCircle, text: 'Error' },
      success: { variant: 'success', icon: CheckCircle, text: 'Success' },
      warning: { variant: 'warning', icon: AlertCircle, text: 'Warning' }
    };

    const config = variants[status] || variants.completed;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      inventory: 'bg-blue-100 text-blue-800',
      sales: 'bg-green-100 text-green-800',
      customers: 'bg-purple-100 text-purple-800',
      production: 'bg-orange-100 text-orange-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.unknown;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Import</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Import and manage your manufacturing data from various sources
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Templates
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="templates">Import Templates</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
          <TabsTrigger value="monitor">Real-time Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Data Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${dragOver 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Drag and drop files here
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Or click to select files. Supports CSV, Excel, and JSON formats.
                </p>
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </label>
              </div>

              {isUploading && (
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Uploaded Files */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Uploads</CardTitle>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.slice(0, 3).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileSpreadsheet className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.size} â€¢ {file.records} records â€¢ {file.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getTypeColor(file.type)}>
                        {file.type}
                      </Badge>
                      {getStatusBadge(file.status)}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {importTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${template.color}-100`}>
                        <Icon className={`h-6 w-6 text-${template.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {template.description}
                        </p>
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Required Fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.fields.slice(0, 3).map((field, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                            {template.fields.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.fields.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                          Formats: {template.format}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm">
                            <Play className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Import History</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Date</th>
                      <th className="text-left py-3">Import Type</th>
                      <th className="text-right py-3">Records</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-right py-3">Duration</th>
                      <th className="text-right py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {item.date}
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary">{item.type}</Badge>
                        </td>
                        <td className="text-right py-3 font-medium">
                          {item.records.toLocaleString()}
                        </td>
                        <td className="py-3">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="text-right py-3 text-gray-600">
                          {item.duration}
                        </td>
                        <td className="text-right py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
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

        <TabsContent value="monitor" className="space-y-6">
          {/* Real-time Import Monitor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Imports</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Records Processed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12,847</p>
                  </div>
                  <Database className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">98.7%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Processing Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.filter(f => f.status === 'processing').map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileSpreadsheet className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          Processing {file.records} records...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={65} className="w-32" />
                      <span className="text-sm text-gray-500">65%</span>
                    </div>
                  </div>
                ))}
                {uploadedFiles.filter(f => f.status === 'processing').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active imports in the queue</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImportSimple;

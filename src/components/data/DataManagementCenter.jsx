import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Upload, 
  Download, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Trash2,
  RefreshCw,
  Settings,
  FileSpreadsheet,
  FileImage,
  Link,
  Cloud,
  Shield,
  Zap
} from 'lucide-react'

const DataManagement = () => {
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      name: 'financial_data_q3.xlsx',
      type: 'Excel',
      size: '2.4 MB',
      status: 'processed',
      uploadDate: '2024-09-20',
      records: 1247
    },
    {
      id: 2,
      name: 'inventory_levels.csv',
      type: 'CSV',
      size: '856 KB',
      status: 'processing',
      uploadDate: '2024-09-22',
      records: 892
    }
  ])

  const [integrations, setIntegrations] = useState([
    {
      id: 1,
      name: 'Xero Accounting',
      type: 'Financial',
      status: 'connected',
      lastSync: '2 hours ago',
      records: 15420,
      icon: '💰'
    },
    {
      id: 2,
      name: 'Unleashed Inventory',
      type: 'Inventory',
      status: 'connected',
      lastSync: '1 hour ago',
      records: 8934,
      icon: '📦'
    },
    {
      id: 3,
      name: 'Shopify Store',
      type: 'E-commerce',
      status: 'connected',
      lastSync: '30 minutes ago',
      records: 3421,
      icon: '🛒'
    },
    {
      id: 4,
      name: 'Microsoft Dynamics',
      type: 'ERP',
      status: 'pending',
      lastSync: 'Never',
      records: 0,
      icon: '🏢'
    }
  ])

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const templates = [
    {
      name: 'Financial Data Template',
      description: 'Standard format for importing financial data including P&L, balance sheet, and cash flow',
      format: 'Excel (.xlsx)',
      size: '45 KB',
      icon: <FileSpreadsheet className="h-6 w-6 text-green-600" />,
      category: 'Financial'
    },
    {
      name: 'Inventory Management Template',
      description: 'Template for inventory levels, stock movements, and supplier information',
      format: 'CSV (.csv)',
      size: '12 KB',
      icon: <Database className="h-6 w-6 text-blue-600" />,
      category: 'Inventory'
    },
    {
      name: 'Production Data Template',
      description: 'Manufacturing metrics including efficiency, downtime, and quality data',
      format: 'Excel (.xlsx)',
      size: '38 KB',
      icon: <Settings className="h-6 w-6 text-purple-600" />,
      category: 'Production'
    },
    {
      name: 'Supplier Information Template',
      description: 'Supplier details, payment terms, and performance metrics',
      format: 'CSV (.csv)',
      size: '8 KB',
      icon: <Link className="h-6 w-6 text-orange-600" />,
      category: 'Suppliers'
    }
  ]

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          
          // Add uploaded files to the list
          const newFiles = files.map((file, index) => ({
            id: uploadedFiles.length + index + 1,
            name: file.name,
            type: file.name.split('.').pop().toUpperCase(),
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            status: 'processing',
            uploadDate: new Date().toISOString().split('T')[0],
            records: Math.floor(Math.random() * 1000) + 100
          }))
          
          setUploadedFiles(prev => [...prev, ...newFiles])
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  const downloadTemplate = (templateName) => {
    // Simulate template download
    const link = document.createElement('a')
    link.href = '#'
    link.download = templateName.toLowerCase().replace(/\s+/g, '_') + '.xlsx'
    link.click()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200'
      case 'processing': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'processed': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'processing': return <Clock className="h-4 w-4" />
      case 'processed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <AlertTriangle className="h-4 w-4" />
      case 'error': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Data Management Center
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Upload data, manage integrations, and download templates
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-600">28,914</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Across all data sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Integrations</p>
                <p className="text-2xl font-bold text-green-600">3</p>
              </div>
              <Link className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Real-time data sync</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Files Uploaded</p>
                <p className="text-2xl font-bold text-purple-600">{uploadedFiles.length}</p>
              </div>
              <Upload className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Data Quality</p>
                <p className="text-2xl font-bold text-orange-600">96%</p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Validation score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="history">Data History</TabsTrigger>
        </TabsList>

        {/* File Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Data Files</CardTitle>
              <CardDescription>
                Upload Excel, CSV, or JSON files for analysis. Maximum file size: 50MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Upload Area */}
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Supports Excel (.xlsx), CSV (.csv), and JSON (.json) files
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading files...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Upload Guidelines */}
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Upload Guidelines:</strong> Ensure your data includes headers in the first row. 
                    For best results, use our templates available in the Templates tab.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>Files uploaded in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-sm text-slate-600">
                          {file.size} • {file.records} records • {file.uploadDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(file.status)}>
                        {getStatusIcon(file.status)}
                        <span className="ml-1">{file.status}</span>
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Templates</CardTitle>
              <CardDescription>
                Download standardized templates for consistent data formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 mb-1">
                            {template.name}
                          </h3>
                          <p className="text-sm text-slate-600 mb-3">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                              {template.format} • {template.size}
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => downloadTemplate(template.name)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Integrations</CardTitle>
              <CardDescription>
                Manage connections to external systems and data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{integration.icon}</div>
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-slate-600">
                          {integration.type} • {integration.records.toLocaleString()} records
                        </p>
                        <p className="text-xs text-slate-500">
                          Last sync: {integration.lastSync}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(integration.status)}>
                        {getStatusIcon(integration.status)}
                        <span className="ml-1">{integration.status}</span>
                      </Badge>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add New Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Integration</CardTitle>
              <CardDescription>Connect additional data sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <Cloud className="h-6 w-6 mb-2" />
                  <span>Cloud Storage</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Database className="h-6 w-6 mb-2" />
                  <span>Database</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Zap className="h-6 w-6 mb-2" />
                  <span>API Connection</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Processing History</CardTitle>
              <CardDescription>Track all data operations and transformations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <h4 className="font-medium">Financial data processed</h4>
                    <p className="text-sm text-slate-600">1,247 records imported from financial_data_q3.xlsx</p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <div className="flex-1">
                    <h4 className="font-medium">Inventory sync in progress</h4>
                    <p className="text-sm text-slate-600">Syncing 892 inventory records from Unleashed</p>
                    <p className="text-xs text-slate-500">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <h4 className="font-medium">Xero integration updated</h4>
                    <p className="text-sm text-slate-600">15,420 financial records synchronized successfully</p>
                    <p className="text-xs text-slate-500">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All Data
        </Button>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Data Settings
        </Button>
      </div>
    </div>
  )
}

export default DataManagement

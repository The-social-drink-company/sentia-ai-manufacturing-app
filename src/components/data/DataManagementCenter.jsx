import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/BulletproofClerkProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  FileText, 
  Database,
  TrendingUp,
  Users,
  Package,
  CreditCard,
  Calendar,
  Target,
  BarChart3,
  Brain,
  Zap
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import CSVDataImportService from '../../services/data/CSVDataImportService';
import MCPIntegratedAIService from '../../services/ai/MCPIntegratedAIService';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const DataManagementCenter = ({ onDataUpdate, currentAnalysisType = 'comprehensive' }) => {
  const { user, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dataCompleteness, setDataCompleteness] = useState(null);
  const [availableData, setAvailableData] = useState({});
  const [uploadResults, setUploadResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [userPrompts, setUserPrompts] = useState([]);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(null);

  // Initialize services
  const csvService = new CSVDataImportService();
  const mcpService = new MCPIntegratedAIService();

  // Data type icons mapping
  const dataTypeIcons = {
    financial_metrics: TrendingUp,
    cash_flow_transactions: CreditCard,
    receivables_aging: Users,
    payables_schedule: Calendar,
    inventory_data: Package,
    sales_forecast: Target,
    expense_budget: BarChart3,
    customer_data: Users,
    supplier_data: Database,
    seasonal_patterns: Calendar,
    industry_benchmarks: BarChart3,
    growth_scenarios: Brain
  };

  // Load initial data and assess completeness
  useEffect(() => {
    if (isLoaded && user) {
      loadDataCompleteness();
    }
  }, [isLoaded, user, currentAnalysisType]);

  const loadDataCompleteness = async () => {
    try {
      setLoading(true);
      
      // Check what data is currently available
      const response = await fetch('/api/data/availability');
      const availableDataTypes = await response.json();
      
      setAvailableData(availableDataTypes);
      
      // Assess data completeness for current analysis type
      const completeness = csvService.validateDataCompleteness(
        availableDataTypes, 
        currentAnalysisType
      );
      
      setDataCompleteness(completeness);
      
      // Generate user prompts for missing critical data
      if (completeness.completenessScore < 90) {
        const prompts = csvService.generateUserPrompts(completeness.requirements);
        setUserPrompts(prompts);
        
        // Show prompt dialog if there are critical missing data types
        const criticalPrompts = prompts.filter(p => p.priority === 'critical');
        if (criticalPrompts.length > 0 && !showPromptDialog) {
          setCurrentPrompt(criticalPrompts[0]);
          setShowPromptDialog(true);
        }
      }
      
    } catch (error) {
      logError('Error loading data completeness:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles, dataType) => {
    if (rejectedFiles.length > 0) {
      alert('Please upload only CSV files');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setLoading(true);
      
      // Validate and parse CSV
      const result = await csvService.validateAndParseCSV(file, dataType);
      
      if (result.success) {
        // Upload data to backend
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dataType', dataType);
        formData.append('validatedData', JSON.stringify(result.data));

        const uploadResponse = await fetch('/api/data/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          
          setUploadResults(prev => ({
            ...prev,
            [dataType]: {
              success: true,
              rowCount: result.rowCount,
              warnings: result.warnings,
              uploadedAt: new Date().toISOString()
            }
          }));

          // Update available data
          setAvailableData(prev => ({
            ...prev,
            [dataType]: true
          }));

          // Refresh data completeness
          await loadDataCompleteness();
          
          // Notify parent component
          if (onDataUpdate) {
            onDataUpdate(dataType, result.data);
          }

          // Close current prompt if this data type was requested
          if (currentPrompt && currentPrompt.title.toLowerCase().includes(dataType.replace(/_/g, ' '))) {
            setShowPromptDialog(false);
            setCurrentPrompt(null);
          }

        } else {
          throw new Error('Upload failed');
        }
      } else {
        setUploadResults(prev => ({
          ...prev,
          [dataType]: {
            success: false,
            errors: result.errors,
            rowCount: result.rowCount
          }
        }));
      }
    } catch (error) {
      logError('Upload error:', error);
      setUploadResults(prev => ({
        ...prev,
        [dataType]: {
          success: false,
          errors: [{ message: error.message }]
        }
      }));
    } finally {
      setLoading(false);
    }
  }, [currentPrompt, onDataUpdate]);

  // Download CSV template
  const downloadTemplate = (dataType) => {
    try {
      const template = csvService.generateCSVTemplate(dataType);
      
      const blob = new Blob([template.content], { type: template.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = template.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logError('Template download error:', error);
      alert('Error downloading template');
    }
  };

  // Handle prompt actions
  const handlePromptAction = (action, dataType) => {
    switch (action.type) {
      case 'download_template':
        downloadTemplate(dataType || currentPrompt?.title.toLowerCase().replace(/\s+/g, '_').replace('_data_required', ''));
        break;
      case 'upload_data':
        // This will be handled by the dropzone
        break;
      case 'skip':
        setShowPromptDialog(false);
        setCurrentPrompt(null);
        // Show next prompt if available
        const remainingPrompts = userPrompts.filter(p => p !== currentPrompt);
        if (remainingPrompts.length > 0) {
          setTimeout(() => {
            setCurrentPrompt(remainingPrompts[0]);
            setShowPromptDialog(true);
          }, 1000);
        }
        break;
    }
  };

  // Create dropzone for specific data type
  const createDropzone = (dataType) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (accepted, rejected) => onDrop(accepted, rejected, dataType),
      accept: {
        'text/csv': ['.csv']
      },
      multiple: false
    });

    return { getRootProps, getInputProps, isDragActive };
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data management center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Management Center</h1>
          <p className="text-gray-600 mt-1">Manage your financial data for comprehensive analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          {dataCompleteness && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Data Completeness</p>
              <div className="flex items-center space-x-2">
                <Progress value={dataCompleteness.completenessScore} className="w-24" />
                <span className="text-sm font-medium">{Math.round(dataCompleteness.completenessScore)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Completeness Alert */}
      {dataCompleteness && dataCompleteness.completenessScore < 75 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Incomplete Data Detected</AlertTitle>
          <AlertDescription>
            Your current data completeness is {Math.round(dataCompleteness.completenessScore)}%. 
            For optimal analysis quality, we recommend uploading the missing data types highlighted below.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Completeness Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analysis Readiness
                </CardTitle>
                <CardDescription>
                  Current data completeness for {currentAnalysisType.replace(/_/g, ' ')} analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dataCompleteness && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Completeness</span>
                      <Badge variant={
                        dataCompleteness.analysisQuality === 'excellent' ? 'success' :
                        dataCompleteness.analysisQuality === 'good' ? 'default' :
                        dataCompleteness.analysisQuality === 'fair' ? 'warning' : 'destructive'
                      }>
                        {dataCompleteness.analysisQuality.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <Progress value={dataCompleteness.completenessScore} className="h-3" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Available Data Types</p>
                        <p className="font-bold text-green-600">
                          {dataCompleteness.requirements.available.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Missing Data Types</p>
                        <p className="font-bold text-red-600">
                          {dataCompleteness.requirements.missing.length}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-gray-600 mb-2">Can Proceed with Analysis:</p>
                      <div className="flex items-center space-x-2">
                        {dataCompleteness.canProceed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          dataCompleteness.canProceed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {dataCompleteness.canProceed ? 'Yes' : 'No - More data required'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Missing Data Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Priority Data Needs
                </CardTitle>
                <CardDescription>
                  Critical and high-priority data for better analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dataCompleteness?.recommendations?.slice(0, 5).map((rec, index) => {
                    const IconComponent = dataTypeIcons[rec.dataType] || FileText;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="font-medium text-sm capitalize">
                              {rec.dataType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-600">{rec.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            rec.priority === 'critical' ? 'destructive' :
                            rec.priority === 'high' ? 'warning' : 'default'
                          } className="text-xs">
                            {rec.priority}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadTemplate(rec.dataType)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!dataCompleteness?.recommendations || dataCompleteness.recommendations.length === 0) && (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">All critical data requirements met!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common data management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('templates')}
                >
                  <Download className="h-6 w-6" />
                  <span>Download All Templates</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="h-6 w-6" />
                  <span>Upload Data Files</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('status')}
                >
                  <BarChart3 className="h-6 w-6" />
                  <span>View Data Status</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Data Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {csvService.getAllTemplates().map((template) => {
              const IconComponent = dataTypeIcons[template.dataType] || FileText;
              const dropzone = createDropzone(template.dataType);
              const uploadResult = uploadResults[template.dataType];
              const isAvailable = availableData[template.dataType];

              return (
                <Card key={template.dataType} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <IconComponent className="h-5 w-5 mr-2" />
                      {template.dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Upload Area */}
                    <div
                      {...dropzone.getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        dropzone.isDragActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...dropzone.getInputProps()} />
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {dropzone.isDragActive
                          ? 'Drop CSV file here'
                          : 'Drag & drop CSV file or click to browse'
                        }
                      </p>
                    </div>

                    {/* Upload Result */}
                    {uploadResult && (
                      <div className={`p-3 rounded-lg ${
                        uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        {uploadResult.success ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-800">
                              Successfully uploaded {uploadResult.rowCount} rows
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-800 font-medium">Upload failed</span>
                            </div>
                            {uploadResult.errors?.slice(0, 3).map((error, idx) => (
                              <p key={idx} className="text-xs text-red-700">
                                Row {error.row}: {error.message}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadTemplate(template.dataType)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Template
                      </Button>
                      
                      {isAvailable && (
                        <Badge variant="success" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Templates</CardTitle>
              <CardDescription>
                Download templates for all supported data types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {csvService.getAllTemplates().map((template) => {
                  const IconComponent = dataTypeIcons[template.dataType] || FileText;
                  
                  return (
                    <div key={template.dataType} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium capitalize">
                            {template.dataType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-gray-600">{template.description}</p>
                          <p className="text-xs text-gray-500">
                            {template.headers.length} columns • {template.sampleRowCount} sample rows
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => downloadTemplate(template.dataType)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Availability Status */}
            <Card>
              <CardHeader>
                <CardTitle>Data Availability</CardTitle>
                <CardDescription>Current status of all data types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {csvService.getAllTemplates().map((template) => {
                    const IconComponent = dataTypeIcons[template.dataType] || FileText;
                    const isAvailable = availableData[template.dataType];
                    const uploadResult = uploadResults[template.dataType];
                    
                    return (
                      <div key={template.dataType} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="font-medium text-sm capitalize">
                              {template.dataType.replace(/_/g, ' ')}
                            </p>
                            {uploadResult?.uploadedAt && (
                              <p className="text-xs text-gray-500">
                                Last updated: {new Date(uploadResult.uploadedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isAvailable ? (
                            <Badge variant="success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Missing
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Impact</CardTitle>
                <CardDescription>How missing data affects analysis quality</CardDescription>
              </CardHeader>
              <CardContent>
                {dataCompleteness?.requirements.missing.length > 0 ? (
                  <div className="space-y-4">
                    {dataCompleteness.requirements.missing.map((dataType) => {
                      const rec = dataCompleteness.requirements.recommendations.find(r => r.dataType === dataType);
                      const IconComponent = dataTypeIcons[dataType] || FileText;
                      
                      return (
                        <div key={dataType} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <IconComponent className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-sm text-yellow-800 capitalize">
                                {dataType.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                {rec?.impact || 'Missing data may reduce analysis accuracy'}
                              </p>
                            </div>
                            <Badge variant="warning" className="text-xs">
                              {rec?.priority || 'medium'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-green-800">All Data Available!</p>
                    <p className="text-sm text-green-600">
                      You have all the data needed for comprehensive analysis.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Prompt Dialog */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              {currentPrompt?.title}
            </DialogTitle>
            <DialogDescription>
              {currentPrompt?.message}
            </DialogDescription>
          </DialogHeader>
          
          {currentPrompt && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Why this data is important:</p>
                <p className="text-sm text-blue-700">{currentPrompt.impact}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Potential data sources:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {currentPrompt.sources?.map((source, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{source}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3">
                {currentPrompt.actions?.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.type === 'skip' ? 'outline' : 'default'}
                    onClick={() => handlePromptAction(action)}
                    className={action.type === 'skip' ? 'text-gray-600' : ''}
                  >
                    {action.type === 'download_template' && <Download className="h-4 w-4 mr-2" />}
                    {action.type === 'upload_data' && <Upload className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                ))}
              </div>

              {currentPrompt.actions?.find(a => a.type === 'skip')?.warning && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {currentPrompt.actions.find(a => a.type === 'skip').warning}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataManagementCenter;

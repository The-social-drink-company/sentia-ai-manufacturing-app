import { devLog } from '../lib/devLog.js';\nimport React, { useState, useEffect } from 'react';
import { Upload, BarChart3, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

const DataImportDashboard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentImportJob, setCurrentImportJob] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mappingConfig, setMappingConfig] = useState(null);
  const [validationConfig, setValidationConfig] = useState(null);

  useEffect(() => {
    fetchImportHistory();
    fetchQueueStats();
    
    const interval = setInterval(fetchQueueStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchImportHistory = async () => {
    try {
      const response = await fetch('/api/import/jobs?pageSize=20');
      const data = await response.json();
      if (data.success) {
        setImportHistory(data.jobs);
      }
    } catch (error) {
      devLog.error('Failed to fetch import history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await fetch('/api/queue/stats');
      const data = await response.json();
      if (data.success) {
        setQueueStats(data.stats);
      }
    } catch (error) {
      devLog.error('Failed to fetch queue stats:', error);
    }
  };

  const handleUploadComplete = (result) => {
    setCurrentImportJob({
      id: result.importJobId,
      filename: result.filename,
      status: 'uploaded'
    });
    setCurrentStep(2);
    fetchImportHistory();
  };

  const handleMappingComplete = (config) => {
    setMappingConfig(config);
    setCurrentStep(3);
  };

  const handleValidationStart = async (config) => {
    setValidationConfig(config);
    
    try {
      const processResponse = await fetch(`/api/import/process/${config.importJobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappingConfig: mappingConfig?.mapping,
          validationRules: config.validationConfig
        })
      });
      
      const processData = await processResponse.json();
      
      if (processData.success) {
        const validateResponse = await fetch(`/api/import/validate/${config.importJobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            validationConfig: config.validationConfig
          })
        });
        
        const validateData = await validateResponse.json();
        
        if (validateData.success) {
          setCurrentStep(4);
          setCurrentImportJob(prev => ({ ...prev, status: 'processing' }));
        }
      }
    } catch (error) {
      devLog.error('Failed to start validation:', error);
    }
  };

  const handleNewImport = () => {
    setCurrentStep(1);
    setCurrentImportJob(null);
    setMappingConfig(null);
    setValidationConfig(null);
    fetchImportHistory();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed_with_errors':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'validating':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'completed_with_errors':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
      case 'validating':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Import Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Upload, validate, and import data into the manufacturing system
          </p>
        </div>
        <button 
          onClick={handleNewImport}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          New Import
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {currentImportJob && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Import Progress</h3>
              <div className="space-y-2">
                <div className={`p-2 rounded ${currentStep >= 1 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  Step 1: Upload
                </div>
                <div className={`p-2 rounded ${currentStep >= 2 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  Step 2: Preview & Map
                </div>
                <div className={`p-2 rounded ${currentStep >= 3 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  Step 3: Validate
                </div>
                <div className={`p-2 rounded ${currentStep >= 4 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  Step 4: Process
                </div>
                <div className={`p-2 rounded ${currentStep >= 5 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  Step 5: Results
                </div>
              </div>
            </div>
          )}

          {queueStats && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Queue Status
              </h3>
              <div className="space-y-3">
                {queueStats.available ? (
                  <>
                    {Object.entries(queueStats.queues || {}).map(([queueName, stats]) => (
                      <div key={queueName} className="space-y-2">
                        <div className="text-sm font-medium capitalize">
                          {queueName.replace('-', ' ')}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-yellow-50 p-2 rounded text-center">
                            <div className="font-semibold">{stats.waiting}</div>
                            <div className="text-yellow-600">Waiting</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="font-semibold">{stats.active}</div>
                            <div className="text-blue-600">Active</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    Queue service unavailable - processing synchronously
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {currentStep === 1 && (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Upload Data File</h3>
                <p className="text-gray-600 mb-4">
                  Select a CSV or Excel file to import
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUploadComplete({
                        importJobId: Date.now().toString(),
                        filename: e.target.files[0].name
                      });
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white px-6 py-3 rounded cursor-pointer hover:bg-blue-700"
                >
                  Choose File
                </label>
              </div>
            )}

            {currentStep > 1 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-2">
                  {currentStep === 5 ? 'Import Complete' : 'Processing...'}
                </h3>
                <p className="text-gray-600">
                  {currentImportJob?.filename || 'Processing your import'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Imports
          </h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading import history...</p>
            </div>
          ) : importHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No imports yet</p>
              <p className="text-sm">Upload your first data file to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">File</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Rows</th>
                    <th className="px-4 py-2 text-left">Uploaded</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((job) => (
                    <tr key={job.id} className="border-b">
                      <td className="px-4 py-2 font-medium">{job.filename}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 text-xs border rounded">
                          {job.dataType?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {job.totalRows > 0 && (
                          <span className="text-sm">
                            {job.processedRows || 0} / {job.totalRows}
                            {job.errorRows > 0 && (
                              <span className="text-red-600 ml-1">({job.errorRows} errors)</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(job.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            setCurrentImportJob(job);
                            setCurrentStep(job.status === 'completed' || job.status === 'failed' ? 5 : 4);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataImportDashboard;
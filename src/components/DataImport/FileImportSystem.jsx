import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Upload, File, X, CheckCircle, AlertTriangle,
  Download, RefreshCw, Database, FileSpreadsheet,
  FileText, BarChart3, Users, Package, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const FileImportSystem = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const [selectedDataType, setSelectedDataType] = useState('production');
  const [uploadProgress, setUploadProgress] = useState({});
  const [importResults, setImportResults] = useState({});
  const queryClient = useQueryClient();

  const dataTypes = [
    {
      id: 'production',
      name: 'Production Data',
      description: 'Manufacturing output, efficiency metrics, line performance',
      icon: <BarChart3 className="w-5 h-5" />,
      acceptedFormats: ['.csv', '.xlsx', '.json'],
      requiredColumns: ['date', 'line', 'product', 'quantity', 'efficiency']
    },
    {
      id: 'quality',
      name: 'Quality Control Data',
      description: 'Test results, batch quality metrics, compliance data',
      icon: <CheckCircle className="w-5 h-5" />,
      acceptedFormats: ['.csv', '.xlsx'],
      requiredColumns: ['batch_id', 'test_type', 'result', 'specification', 'status']
    },
    {
      id: 'inventory',
      name: 'Inventory Data',
      description: 'Stock levels, movements, supplier information',
      icon: <Package className="w-5 h-5" />,
      acceptedFormats: ['.csv', '.xlsx'],
      requiredColumns: ['sku', 'item_name', 'quantity', 'unit_price', 'category']
    },
    {
      id: 'financial',
      name: 'Financial Data',
      description: 'Working capital, cash flow, accounting records',
      icon: <Database className="w-5 h-5" />,
      acceptedFormats: ['.csv', '.xlsx', '.json'],
      requiredColumns: ['date', 'account', 'amount', 'type', 'category']
    },
    {
      id: 'employees',
      name: 'Employee Data',
      description: 'Staff records, training, performance metrics',
      icon: <Users className="w-5 h-5" />,
      acceptedFormats: ['.csv', '.xlsx'],
      requiredColumns: ['employee_id', 'name', 'department', 'role', 'status']
    }
  ];

  const uploadMutation = useMutation({
    mutationFn: async ({ file, dataType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', dataType);

      const response = await fetch('/api/data/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setImportResults(prev => ({
        ...prev,
        [variables.file.name]: data
      }));
      toast.success(`Successfully imported ${variables.file.name}`);
      queryClient.invalidateQueries([selectedDataType]);
    },
    onError: (error, variables) => {
      toast.error(`Failed to import ${variables.file.name}: ${error.message}`);
    }
  });

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach(file => {
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { status: 'uploading', progress: 0 }
      }));

      uploadMutation.mutate({ file, dataType: selectedDataType });
    });
  }, [selectedDataType, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json']
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const selectedType = dataTypes.find(type => type.id === selectedDataType);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Import System</h1>
          <p className="mt-2 text-gray-600">
            Upload and process manufacturing, financial, and operational data files
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data Type Selection */}
          <div className="lg:col-span-1">
            <DataTypeSelector
              dataTypes={dataTypes}
              selectedDataType={selectedDataType}
              setSelectedDataType={setSelectedDataType}
            />
          </div>

          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-8">
            <UploadZone
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              selectedType={selectedType}
            />

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <UploadProgress
                uploadProgress={uploadProgress}
                importResults={importResults}
              />
            )}

            {/* Import Results */}
            {Object.keys(importResults).length > 0 && (
              <ImportResults importResults={importResults} />
            )}

            {/* Template Downloads */}
            <TemplateDownloads selectedType={selectedType} />
          </div>
        </div>
      </div>
    </div>
  );
};

const DataTypeSelector = ({ dataTypes, selectedDataType, setSelectedDataType }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Select Data Type</h3>
      <div className="space-y-3">
        {dataTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedDataType(type.id)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              selectedDataType === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                selectedDataType === type.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {type.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{type.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {type.acceptedFormats.map((format) => (
                    <span
                      key={format}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const UploadZone = ({ getRootProps, getInputProps, isDragActive, selectedType }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Upload {selectedType?.name}</h3>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isDragActive ? (
          <p className="text-lg text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-600 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Accepted formats: {selectedType?.acceptedFormats.join(', ')}
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Choose Files
          </button>
        </div>
      </div>

      {/* Required Columns */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Required Columns:</h4>
        <div className="flex flex-wrap gap-2">
          {selectedType?.requiredColumns.map((column) => (
            <span
              key={column}
              className="px-3 py-1 text-xs bg-white text-gray-700 border border-gray-200 rounded-full"
            >
              {column}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const UploadProgress = ({ uploadProgress, importResults }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Upload Progress</h3>
      <div className="space-y-4">
        {Object.entries(uploadProgress).map(([fileName, progress]) => (
          <div key={fileName} className="flex items-center space-x-4">
            <File className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{fileName}</span>
                <span className="text-sm text-gray-500">
                  {importResults[fileName] ? 'Complete' : 'Processing...'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    importResults[fileName] ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: importResults[fileName] ? '100%' : '75%' }}
                ></div>
              </div>
            </div>
            {importResults[fileName] && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ImportResults = ({ importResults }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Import Results</h3>
      <div className="space-y-4">
        {Object.entries(importResults).map(([fileName, result]) => (
          <div key={fileName} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">{fileName}</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(result.importedAt).toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Records Processed:</span>
                <div className="font-medium text-gray-900">{result.recordsProcessed}</div>
              </div>
              <div>
                <span className="text-gray-500">Successfully Imported:</span>
                <div className="font-medium text-green-600">{result.recordsImported}</div>
              </div>
              <div>
                <span className="text-gray-500">Errors:</span>
                <div className="font-medium text-red-600">{result.errors || 0}</div>
              </div>
            </div>
            
            {result.warnings && result.warnings.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center text-yellow-800 mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="font-medium">Warnings</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TemplateDownloads = ({ selectedType }) => {
  const downloadTemplate = (dataType) => {
    // Create CSV template based on required columns
    const columns = selectedType?.requiredColumns || [];
    const csvContent = columns.join(',') + '\\n' + 
      columns.map(() => 'sample_data').join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Download Templates</h3>
      <p className="text-gray-600 mb-4">
        Download CSV templates with the correct column structure for your data imports.
      </p>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={() => downloadTemplate(selectedType?.id)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download {selectedType?.name} Template
        </button>
        
        <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <FileText className="w-4 h-4 mr-2" />
          View Documentation
        </button>
      </div>
    </div>
  );
};

export default FileImportSystem;
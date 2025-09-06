<<<<<<< HEAD
import { devLog } from '../lib/devLog.js';\nimport React, { useState, useCallback } from 'react';
=======
import { devLog } from '../../lib/devLog.js';
import React, { useState, useCallback } from 'react';
>>>>>>> 320fc348c3f5d778596ec72fe2dbced535701ad7
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DataImportUploader = ({ onUploadComplete, onError }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dataType, setDataType] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const dataTypes = [
    { value: 'products', label: 'Products' },
    { value: 'historical_sales', label: 'Historical Sales' },
    { value: 'inventory_levels', label: 'Inventory Levels' },
    { value: 'manufacturing_data', label: 'Manufacturing Data' },
    { value: 'financial_data', label: 'Financial Data' },
    { value: 'forecasts', label: 'Forecasts' }
  ];

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      setError(`File rejected: ${rejection.errors[0].message}`);
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setError(null);
      setUploadStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const uploadFile = async () => {
    if (!selectedFile || !dataType) {
      setError('Please select a file and data type');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('dataType', dataType);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setUploadResult(result);
          setUploadStatus('success');
          onUploadComplete && onUploadComplete(result);
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setError(errorData.error || 'Upload failed');
          setUploadStatus('error');
          onError && onError(errorData);
        }
      };

      xhr.onerror = () => {
        setError('Network error during upload');
        setUploadStatus('error');
        onError && onError({ error: 'Network error' });
      };

      xhr.open('POST', '/api/import/upload');
      xhr.send(formData);

    } catch (error) {
      devLog.error('Upload error:', error);
      setError(error.message || 'Upload failed');
      setUploadStatus('error');
      onError && onError(error);
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setDataType('');
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadResult(null);
    setError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Data Import Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="h-12 w-12 mx-auto text-green-600" />
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              <Badge variant="secondary" className="mt-2">
                {selectedFile.type || 'Unknown type'}
              </Badge>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              {isDragActive ? (
                <p className="text-sm font-medium">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Drag and drop a file here, or click to select
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports CSV, XLSX, and JSON files up to 10MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Data Type Selection */}
        {selectedFile && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Type</label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger>
                <SelectValue placeholder="Select the type of data you're importing" />
              </SelectTrigger>
              <SelectContent>
                {dataTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Upload Progress */}
        {uploadStatus === 'uploading' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {uploadStatus === 'success' && uploadResult && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              File uploaded successfully! Import Job ID: {uploadResult.importJobId}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {uploadStatus === 'idle' || uploadStatus === 'error' ? (
            <>
              <Button
                onClick={uploadFile}
                disabled={!selectedFile || !dataType}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              {selectedFile && (
                <Button variant="outline" onClick={resetUploader}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </>
          ) : uploadStatus === 'success' ? (
            <Button onClick={resetUploader} variant="outline" className="flex-1">
              Upload Another File
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataImportUploader;